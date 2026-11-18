import {
  ComplianceRateVersion,
  EmployeeAdvance,
  EmployeeRecord,
  EmployeeReimbursement,
  EmployeeSalaryStructure,
  IncentiveRecord,
  LabourWorkerRecord,
  OvertimeRecord,
  PayrollDeductionItem,
  PayrollEarningItem,
  PayrollException,
  PayrollRun,
  PayrollRunEmployee,
  SiteTransferAllocation,
} from '../types/finance';
import { multiplyPaise, percentOfPaise, sumPaise } from '../utils/currency';

export interface WorkerWageBreakdown {
  baseWagePaise: number;
  overtimePaise: number;
  grossWagePaise: number;
  formulaText: string;
  siteAllocations: {
    siteId: string;
    siteName: string;
    projectId: string;
    projectName: string;
    sharePercent: number;
    allocatedAmountPaise: number;
    attendanceSummary: string;
  }[];
}

/**
 * Computes decimal-safe labour wages for Daily, Hourly, Weekly, Monthly,
 * Piece-Rate, and Task-Based workers, including proportional Site Transfer allocations.
 */
export function calculateWorkerWage(worker: LabourWorkerRecord): WorkerWageBreakdown {
  let baseWagePaise = 0;
  let formulaText = '';

  const effectiveDays = worker.approvedDays + worker.halfDays * 0.5;

  switch (worker.wageType) {
    case 'Daily': {
      baseWagePaise = multiplyPaise(worker.agreedRatePaise, effectiveDays);
      formulaText = `${effectiveDays} payable days × ₹${(worker.agreedRatePaise / 100).toLocaleString('en-IN')}/day`;
      break;
    }
    case 'Hourly': {
      baseWagePaise = multiplyPaise(worker.agreedRatePaise, worker.approvedHours);
      formulaText = `${worker.approvedHours} payable hrs × ₹${(worker.agreedRatePaise / 100).toLocaleString('en-IN')}/hr`;
      break;
    }
    case 'Weekly': {
      const weeks = Number((effectiveDays / 6).toFixed(2));
      baseWagePaise = multiplyPaise(worker.agreedRatePaise, weeks);
      formulaText = `${weeks} weeks (${effectiveDays}d) × ₹${(worker.agreedRatePaise / 100).toLocaleString('en-IN')}/wk`;
      break;
    }
    case 'Piece-Rate':
    case 'Task-Based': {
      baseWagePaise = multiplyPaise(worker.agreedRatePaise, worker.approvedUnits);
      formulaText = `${worker.approvedUnits} ${worker.unitLabel || 'units'} × ₹${(worker.agreedRatePaise / 100).toLocaleString('en-IN')}/${worker.unitLabel || 'unit'}`;
      break;
    }
    case 'Monthly': {
      const ratio = effectiveDays / 26;
      baseWagePaise = multiplyPaise(worker.agreedRatePaise, ratio);
      formulaText = `(${effectiveDays}/26 days) × ₹${(worker.agreedRatePaise / 100).toLocaleString('en-IN')}/mo`;
      break;
    }
  }

  const overtimePaise = multiplyPaise(
    worker.overtimeHourlyRatePaise,
    worker.approvedOvertimeHours
  );
  const grossWagePaise = sumPaise([baseWagePaise, overtimePaise]);

  // Site Transfer Allocation: allocate wage cost proportionally using approved assignment history
  const transfers: SiteTransferAllocation[] =
    worker.siteTransfers.length > 0
      ? worker.siteTransfers
      : [
          {
            siteId: worker.assignedSiteId,
            siteName: 'Primary Assigned Site',
            projectId: worker.assignedProjectId,
            projectName: 'Primary Project',
            fromDate: '2026-11-01',
            toDate: '2026-11-30',
            approvedDays: worker.approvedDays,
            approvedHours: worker.approvedHours,
            approvedHalfDays: worker.halfDays,
            approvedUnits: worker.approvedUnits,
          },
        ];

  const getMetricWeight = (t: SiteTransferAllocation) => {
    if (worker.wageType === 'Hourly') return t.approvedHours;
    if (worker.wageType === 'Piece-Rate' || worker.wageType === 'Task-Based') return t.approvedUnits;
    return t.approvedDays + t.approvedHalfDays * 0.5;
  };

  const totalWeight = transfers.reduce((acc, t) => acc + getMetricWeight(t), 0) || 1;
  let runningAllocated = 0;

  const siteAllocations = transfers.map((t, idx) => {
    const w = getMetricWeight(t);
    const sharePercent = Number(((w / totalWeight) * 100).toFixed(1));
    // Last segment absorbs any 1-paisa rounding remainder so total === grossWagePaise
    const allocatedAmountPaise =
      idx === transfers.length - 1
        ? grossWagePaise - runningAllocated
        : Math.round((grossWagePaise * w) / totalWeight);
    runningAllocated += allocatedAmountPaise;

    const attendanceSummary =
      worker.wageType === 'Hourly'
        ? `${t.approvedHours} hrs`
        : worker.wageType === 'Piece-Rate' || worker.wageType === 'Task-Based'
        ? `${t.approvedUnits} ${worker.unitLabel || 'units'}`
        : `${t.approvedDays}d + ${t.approvedHalfDays} half`;

    return {
      siteId: t.siteId,
      siteName: t.siteName,
      projectId: t.projectId,
      projectName: t.projectName,
      sharePercent,
      allocatedAmountPaise,
      attendanceSummary,
    };
  });

  return {
    baseWagePaise,
    overtimePaise,
    grossWagePaise,
    formulaText,
    siteAllocations,
  };
}

export interface GeneratePayrollRunInput {
  runId: string;
  companyId: string;
  periodId: string;
  periodLabel: string;
  workingDays: number;
  branchId: string | 'ALL';
  projectId: string | 'ALL';
  scopeLabel: string;
  createdBy: string;
  createdByUserId: string;
  employees: EmployeeRecord[];
  salaryStructures: EmployeeSalaryStructure[];
  workers: LabourWorkerRecord[];
  overtimeRecords: OvertimeRecord[];
  incentiveRecords: IncentiveRecord[];
  advances: EmployeeAdvance[];
  reimbursements: EmployeeReimbursement[];
  complianceRates: ComplianceRateVersion;
  attendanceByEmployeeId: Record<string, { payableDays: number; verified: boolean }>;
}

/**
 * Full decimal-safe Payroll Processing Engine.
 * Produces line-by-line calculation transparency and flags exceptions without silent omissions.
 */
export function buildPayrollRun(input: GeneratePayrollRunInput): PayrollRun {
  const items: PayrollRunEmployee[] = [];
  const exceptions: PayrollException[] = [];

  const filteredEmployees = input.employees.filter(
    (e) =>
      (input.branchId === 'ALL' || e.branchId === input.branchId) &&
      (input.projectId === 'ALL' || e.projectId === input.projectId)
  );

  const filteredWorkers = input.workers.filter(
    (w) =>
      (input.branchId === 'ALL' || w.branchId === input.branchId) &&
      (input.projectId === 'ALL' || w.assignedProjectId === input.projectId)
  );

  // 1. Process Monthly Salaried / Contractual / Project-based Employees
  for (const emp of filteredEmployees) {
    const structure = input.salaryStructures.find((s) => s.id === emp.currentSalaryStructureId);
    const attendance = input.attendanceByEmployeeId[emp.id] ?? { payableDays: input.workingDays, verified: true };

    if (!structure) {
      exceptions.push({
        id: `exc_${input.runId}_${emp.id}_struct`,
        payrollRunId: input.runId,
        personId: emp.id,
        personName: emp.name,
        personType: 'Employee',
        category: 'Missing Salary Structure',
        severity: 'High',
        description: `No active salary structure assigned to ${emp.name} (${emp.employeeCode}).`,
        resolved: false,
      });
      continue;
    }

    if (!attendance.verified || attendance.payableDays === 0) {
      exceptions.push({
        id: `exc_${input.runId}_${emp.id}_att`,
        payrollRunId: input.runId,
        personId: emp.id,
        personName: emp.name,
        personType: 'Employee',
        category: attendance.payableDays === 0 ? 'Missing Attendance' : 'Unverified Attendance',
        severity: 'High',
        description: `Attendance record for ${emp.name} requires verification (${attendance.payableDays}/${input.workingDays} days).`,
        resolved: false,
      });
    }

    if (!emp.bankVerified) {
      exceptions.push({
        id: `exc_${input.runId}_${emp.id}_bank`,
        payrollRunId: input.runId,
        personId: emp.id,
        personName: emp.name,
        personType: 'Employee',
        category: 'Missing Bank Info',
        severity: 'Medium',
        description: `Bank IFSC/account verification pending for ${emp.name} (${emp.bankAccountMasked}).`,
        resolved: false,
      });
    }

    const prorationRatio = Math.min(1, Math.max(0, attendance.payableDays / input.workingDays));
    const basicPaise = multiplyPaise(structure.basicPaise, prorationRatio);
    const hraPaise = multiplyPaise(structure.hraPaise, prorationRatio);
    const convPaise = multiplyPaise(structure.conveyanceAllowancePaise, prorationRatio);
    const siteAllowPaise = multiplyPaise(structure.siteAllowancePaise, prorationRatio);
    const specialAllowPaise = multiplyPaise(structure.specialAllowancePaise, prorationRatio);

    // Approved Overtime only
    const empApprovedOT = input.overtimeRecords.filter(
      (ot) => ot.personId === emp.id && ot.approvalStatus === 'Approved'
    );
    const empUnapprovedOT = input.overtimeRecords.filter(
      (ot) => ot.personId === emp.id && (ot.approvalStatus === 'Submitted' || ot.approvalStatus === 'Site Verified')
    );

    if (empUnapprovedOT.length > 0) {
      exceptions.push({
        id: `exc_${input.runId}_${emp.id}_ot`,
        payrollRunId: input.runId,
        personId: emp.id,
        personName: emp.name,
        personType: 'Employee',
        category: 'Unapproved Overtime',
        severity: 'Low',
        description: `${empUnapprovedOT.length} overtime log(s) awaiting manager approval; excluded from calculation until approved.`,
        resolved: false,
      });
    }

    const overtimePaise = sumPaise(empApprovedOT.map((o) => o.calculatedAmountPaise));

    const empIncentives = input.incentiveRecords.filter(
      (inc) => inc.personId === emp.id && inc.status === 'Approved'
    );
    const incentivePaise = sumPaise(empIncentives.map((i) => i.amountPaise));

    const empReimb = input.reimbursements.filter(
      (r) => r.employeeId === emp.id && r.status === 'Approved' && r.paymentMethod === 'Payroll Addition'
    );
    const reimbPaise = sumPaise(empReimb.map((r) => r.amountPaise));

    const earnings: PayrollEarningItem[] = [
      { label: 'Basic Salary', category: 'Basic', amountPaise: basicPaise },
      { label: 'House Rent Allowance (HRA)', category: 'HRA', amountPaise: hraPaise },
      { label: 'Conveyance & Site Allowances', category: 'Allowance', amountPaise: sumPaise([convPaise, siteAllowPaise, specialAllowPaise]) },
    ];
    if (overtimePaise > 0) earnings.push({ label: 'Approved Overtime', category: 'Overtime', amountPaise: overtimePaise });
    if (incentivePaise > 0) earnings.push({ label: 'Approved Incentives', category: 'Incentive', amountPaise: incentivePaise });
    if (reimbPaise > 0) earnings.push({ label: 'Approved Reimbursements', category: 'Reimbursement', amountPaise: reimbPaise });

    const grossEarningsPaise = sumPaise(earnings.map((e) => e.amountPaise));

    // Statutory deductions using versioned compliance config
    const deductions: PayrollDeductionItem[] = [];
    if (structure.pfApplicable) {
      const pfBase = Math.min(basicPaise, input.complianceRates.epfWageCeilingPaise);
      const pfAmount = percentOfPaise(pfBase, input.complianceRates.epfEmployeePct);
      deductions.push({ label: `EPF (${input.complianceRates.epfEmployeePct}%)`, category: 'PF', amountPaise: pfAmount });
    }
    if (structure.esiApplicable && grossEarningsPaise <= input.complianceRates.esiWageCeilingPaise) {
      const esiAmount = percentOfPaise(grossEarningsPaise, input.complianceRates.esiEmployeePct);
      deductions.push({ label: `ESI (${input.complianceRates.esiEmployeePct}%)`, category: 'ESI', amountPaise: esiAmount });
    }
    if (structure.ptApplicable) {
      deductions.push({ label: 'Professional Tax', category: 'PT', amountPaise: input.complianceRates.ptStandardMonthlyPaise });
    }
    if (structure.tdsMonthlyPaise > 0) {
      deductions.push({ label: 'TDS (Sec 192)', category: 'TDS', amountPaise: structure.tdsMonthlyPaise });
    }

    const statutoryDeductionsPaise = sumPaise(deductions.map((d) => d.amountPaise));

    // Only apply authorized, disbursed advances with remaining balance
    const activeAdvances = input.advances.filter(
      (a) =>
        a.personId === emp.id &&
        (a.status === 'Disbursed' || a.status === 'Partially Repaid') &&
        a.outstandingAmountPaise > 0
    );
    for (const adv of activeAdvances) {
      const deductAmt = Math.min(adv.monthlyDeductionPaise, adv.outstandingAmountPaise);
      deductions.push({
        label: `Advance Recovery (${adv.advanceCode})`,
        category: 'Advance',
        amountPaise: deductAmt,
      });
    }

    const totalDeductionsPaise = sumPaise(deductions.map((d) => d.amountPaise));
    const netPayablePaise = grossEarningsPaise - totalDeductionsPaise;

    if (netPayablePaise < 0) {
      exceptions.push({
        id: `exc_${input.runId}_${emp.id}_neg`,
        payrollRunId: input.runId,
        personId: emp.id,
        personName: emp.name,
        personType: 'Employee',
        category: 'Negative Net Pay',
        severity: 'High',
        description: `Deductions exceed gross earnings for ${emp.name} resulting in negative net pay.`,
        resolved: false,
      });
    }

    items.push({
      id: `pre_${input.runId}_${emp.id}`,
      payrollRunId: input.runId,
      personId: emp.id,
      personCode: emp.employeeCode,
      personName: emp.name,
      personType: 'Employee',
      departmentOrTrade: `${emp.department} · ${emp.designation}`,
      projectId: emp.projectId,
      siteId: emp.siteId,
      payableDays: attendance.payableDays,
      payableHours: attendance.payableDays * 8,
      earnings,
      deductions,
      grossEarningsPaise,
      totalDeductionsPaise,
      statutoryDeductionsPaise,
      netPayablePaise,
      salaryStructureVersionId: structure.id,
      attendanceRef: `ATT-${input.periodLabel.slice(0, 3).toUpperCase()}-${emp.employeeCode}`,
      excludedFromRun: emp.status === 'On Hold',
      holdReason: emp.status === 'On Hold' ? 'Employee marked On Hold in directory' : undefined,
    });
  }

  // 2. Process Construction Labour Workforce (Daily, Hourly, Weekly, Piece-Rate)
  for (const worker of filteredWorkers) {
    if (!worker.attendanceVerified) {
      exceptions.push({
        id: `exc_${input.runId}_${worker.id}_uatt`,
        payrollRunId: input.runId,
        personId: worker.id,
        personName: worker.name,
        personType: 'Worker',
        category: 'Unverified Attendance',
        severity: 'High',
        description: `Site muster roll attendance for ${worker.name} (${worker.workerCode}) is not yet verified by Site Manager.`,
        resolved: false,
      });
    }

    if (!worker.bankVerified) {
      exceptions.push({
        id: `exc_${input.runId}_${worker.id}_wbank`,
        payrollRunId: input.runId,
        personId: worker.id,
        personName: worker.name,
        personType: 'Worker',
        category: 'Missing Bank Info',
        severity: 'Medium',
        description: `Worker ${worker.name} (${worker.workerCode}) has unverified bank/UPI payout details.`,
        resolved: false,
      });
    }

    if (worker.siteTransfers.length > 1) {
      // Info note or check if site allocation matches
      const sumDays = worker.siteTransfers.reduce((a, b) => a + b.approvedDays, 0);
      if (worker.wageType === 'Daily' && sumDays !== worker.approvedDays) {
        exceptions.push({
          id: `exc_${input.runId}_${worker.id}_site`,
          payrollRunId: input.runId,
          personId: worker.id,
          personName: worker.name,
          personType: 'Worker',
          category: 'Site Assignment Conflict',
          severity: 'Medium',
          description: `Site transfer days (${sumDays}d) do not match total approved days (${worker.approvedDays}d).`,
          resolved: false,
        });
      }
    }

    const breakdown = calculateWorkerWage(worker);
    const earnings: PayrollEarningItem[] = [
      {
        label: `${worker.wageType} Wage (${breakdown.formulaText})`,
        category: 'Base Wage',
        amountPaise: breakdown.baseWagePaise,
      },
    ];
    if (breakdown.overtimePaise > 0) {
      earnings.push({
        label: `Approved Overtime (${worker.approvedOvertimeHours} hrs)`,
        category: 'Overtime',
        amountPaise: breakdown.overtimePaise,
      });
    }

    const deductions: PayrollDeductionItem[] = [];
    const activeWorkerAdvances = input.advances.filter(
      (a) =>
        a.personId === worker.id &&
        (a.status === 'Disbursed' || a.status === 'Partially Repaid') &&
        a.outstandingAmountPaise > 0
    );
    for (const adv of activeWorkerAdvances) {
      const deductAmt = Math.min(adv.monthlyDeductionPaise, adv.outstandingAmountPaise);
      deductions.push({
        label: `Advance Recovery (${adv.advanceCode})`,
        category: 'Advance',
        amountPaise: deductAmt,
      });
    }

    const totalDeductionsPaise = sumPaise(deductions.map((d) => d.amountPaise));
    const netPayablePaise = breakdown.grossWagePaise - totalDeductionsPaise;

    items.push({
      id: `pre_${input.runId}_${worker.id}`,
      payrollRunId: input.runId,
      personId: worker.id,
      personCode: worker.workerCode,
      personName: worker.name,
      personType: 'Worker',
      departmentOrTrade: `${worker.trade} · ${worker.wageType}`,
      projectId: worker.assignedProjectId,
      siteId: worker.assignedSiteId,
      payableDays: worker.approvedDays + worker.halfDays * 0.5,
      payableHours: worker.approvedHours,
      earnings,
      deductions,
      grossEarningsPaise: breakdown.grossWagePaise,
      totalDeductionsPaise,
      statutoryDeductionsPaise: 0,
      netPayablePaise,
      attendanceRef: `MUSTER-${worker.workerCode}`,
      excludedFromRun: !worker.attendanceVerified,
      holdReason: !worker.attendanceVerified ? 'Awaiting Site Manager attendance verification' : undefined,
    });
  }

  const activeItems = items.filter((i) => !i.excludedFromRun);
  const totalGrossPaise = sumPaise(activeItems.map((i) => i.grossEarningsPaise));
  const totalDeductionsPaise = sumPaise(activeItems.map((i) => i.totalDeductionsPaise));
  const totalNetPayablePaise = sumPaise(activeItems.map((i) => i.netPayablePaise));
  const unresolvedExceptionsCount = exceptions.filter((e) => !e.resolved).length;

  return {
    id: input.runId,
    companyId: input.companyId,
    periodId: input.periodId,
    periodLabel: input.periodLabel,
    branchId: input.branchId,
    projectId: input.projectId,
    scopeLabel: input.scopeLabel,
    status: unresolvedExceptionsCount > 0 ? 'Exceptions Found' : 'Calculation Completed',
    createdBy: input.createdBy,
    createdByUserId: input.createdByUserId,
    createdAt: new Date().toISOString(),
    totalHeadcount: activeItems.length,
    totalGrossPaise,
    totalDeductionsPaise,
    totalNetPayablePaise,
    exceptionsCount: exceptions.length,
    unresolvedExceptionsCount,
    items,
    exceptions,
  };
}
