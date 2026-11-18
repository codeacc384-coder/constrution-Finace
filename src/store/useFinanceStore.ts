import { create } from 'zustand';
import {
  ApprovalCategory,
  ApprovalItem,
  ApprovalWorkflowRule,
  BankReconciliationSession,
  Branch,
  CashFlowEntry,
  CompanySize,
  ComplianceRateVersion,
  ContractorInvoice,
  ContractorRecord,
  EmployeeAdvance,
  EmployeeRecord,
  EmployeeReimbursement,
  EmployeeSalaryHistory,
  EmployeeSalaryStructure,
  FinancialAuditLog,
  FinancialDocument,
  FinancialTransaction,
  FinanceRoleId,
  FinanceUserAccount,
  IncentiveRecord,
  LabourWorkerRecord,
  MaterialReceiptReference,
  OvertimeRecord,
  PayrollPeriod,
  PayrollRun,
  Payslip,
  Project,
  ProjectBudget,
  PurchaseOrderReference,
  RolePermissionConfig,
  SalaryPaymentBatch,
  Site,
  SiteExpense,
  SiteExpenseCategory,
  Supplier,
  SupplierInvoice,
  TaxComplianceRecord,
  TenantCompany,
} from '../types/finance';
import {
  INITIAL_ADVANCES,
  INITIAL_APPROVALS,
  INITIAL_AUDIT_LOGS,
  INITIAL_BRANCHES,
  INITIAL_CASH_FLOW,
  INITIAL_COMPANY,
  INITIAL_COMPLIANCE_RECORDS,
  INITIAL_COMPLIANCE_RATES,
  INITIAL_CONTRACTOR_INVOICES,
  INITIAL_CONTRACTORS,
  INITIAL_EMPLOYEES,
  INITIAL_FINANCIAL_DOCS,
  INITIAL_GRNS,
  INITIAL_INCENTIVES,
  INITIAL_OVERTIME,
  INITIAL_PAYROLL_PERIODS,
  INITIAL_PAYROLL_RUNS,
  INITIAL_PAYSLIPS,
  INITIAL_POS,
  INITIAL_PROJECT_BUDGETS,
  INITIAL_PROJECTS,
  INITIAL_RECONCILIATIONS,
  INITIAL_REIMBURSEMENTS,
  INITIAL_SALARY_BATCHES,
  INITIAL_SALARY_HISTORY,
  INITIAL_SALARY_STRUCTURES,
  INITIAL_SITE_EXPENSES,
  INITIAL_SITES,
  INITIAL_SUPPLIER_INVOICES,
  INITIAL_SUPPLIERS,
  INITIAL_TRANSACTIONS,
  INITIAL_USERS,
  INITIAL_WORKERS,
  INITIAL_WORKFLOW_RULES,
} from '../data/mockFinanceData';
import { DEFAULT_ROLE_CONFIGS, checkMakerChecker } from '../services/rbacService';
import { buildPayrollRun } from '../services/payrollEngine';
import { performThreeWayMatch, calculateContractorNetPayable } from '../services/invoiceMatchingService';
import { formatINR, toPaise } from '../utils/currency';

export interface ToastNotice {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

export interface GlobalFilters {
  branchId: string | 'ALL';
  projectId: string | 'ALL';
  siteId: string | 'ALL';
  financialYear: string;
  periodLabel: string;
}

interface FinanceStoreState {
  company: TenantCompany;
  users: FinanceUserAccount[];
  currentUserId: string;
  roleConfigs: Record<FinanceRoleId, RolePermissionConfig>;
  makerCheckerEnabled: boolean;
  filters: GlobalFilters;

  branches: Branch[];
  projects: Project[];
  sites: Site[];
  employees: EmployeeRecord[];
  salaryStructures: EmployeeSalaryStructure[];
  salaryHistory: EmployeeSalaryHistory[];
  workers: LabourWorkerRecord[];
  payrollPeriods: PayrollPeriod[];
  payrollRuns: PayrollRun[];
  overtimeRecords: OvertimeRecord[];
  incentiveRecords: IncentiveRecord[];
  advances: EmployeeAdvance[];
  payslips: Payslip[];
  salaryBatches: SalaryPaymentBatch[];

  suppliers: Supplier[];
  purchaseOrders: PurchaseOrderReference[];
  materialReceipts: MaterialReceiptReference[];
  supplierInvoices: SupplierInvoice[];
  contractors: ContractorRecord[];
  contractorInvoices: ContractorInvoice[];
  reimbursements: EmployeeReimbursement[];
  siteExpenses: SiteExpense[];

  projectBudgets: ProjectBudget[];
  cashFlowEntries: CashFlowEntry[];
  transactions: FinancialTransaction[];
  reconciliations: BankReconciliationSession[];

  complianceRates: ComplianceRateVersion;
  complianceRecords: TaxComplianceRecord[];
  financialDocuments: FinancialDocument[];

  workflowRules: ApprovalWorkflowRule[];
  approvals: ApprovalItem[];
  auditLogs: FinancialAuditLog[];
  toasts: ToastNotice[];

  // Toast helpers
  pushToast: (toast: Omit<ToastNotice, 'id'>) => void;
  dismissToast: (id: string) => void;

  // Global context & RBAC actions
  setFilters: (patch: Partial<GlobalFilters>) => void;
  switchCompanySize: (size: CompanySize) => void;
  switchCurrentUser: (userId: string) => void;
  updateRoleConfig: (roleId: FinanceRoleId, patch: Partial<RolePermissionConfig>) => void;
  toggleMakerChecker: (enabled: boolean) => void;
  updateCompanySettings: (patch: Partial<TenantCompany>) => void;

  // Employee & Labour Actions
  reviseEmployeeSalary: (
    employeeId: string,
    newValues: {
      basicPaise: number;
      hraPaise: number;
      conveyanceAllowancePaise: number;
      siteAllowancePaise: number;
      specialAllowancePaise: number;
      tdsMonthlyPaise: number;
      effectiveFrom: string;
      reason: string;
    }
  ) => void;
  verifyWorkerAttendance: (workerId: string) => void;
  verifyWorkerBank: (workerId: string) => void;

  // Payroll Processing Engine Actions
  createPayrollRun: (params: {
    periodId: string;
    branchId: string | 'ALL';
    projectId: string | 'ALL';
  }) => PayrollRun;
  resolvePayrollException: (runId: string, exceptionId: string, resolutionAction: string) => void;
  submitPayrollRunForApproval: (runId: string) => void;
  approveAndLockPayrollRun: (runId: string) => { ok: boolean; error?: string };
  generatePayslipsForRun: (runId: string) => void;
  issuePayslipCorrection: (payslipId: string, note: string) => void;

  // Overtime, Incentives, Advances
  submitOvertimeRecord: (record: Omit<OvertimeRecord, 'id' | 'companyId' | 'calculatedAmountPaise' | 'approvalStatus' | 'approvedOvertimeHours'>) => void;
  advanceOvertimeStatus: (id: string, nextStatus: 'Site Verified' | 'Approved' | 'Rejected') => void;
  approveIncentive: (id: string) => void;
  requestAdvance: (payload: {
    personId: string;
    personName: string;
    personType: 'Employee' | 'Worker';
    projectId: string;
    amountPaise: number;
    installmentsTotal: number;
    reason: string;
  }) => void;
  processAdvanceStatus: (id: string, nextStatus: 'Approved' | 'Rejected' | 'Disbursed') => void;

  // Salary Payment Batch Actions
  createSalaryPaymentBatch: (runId: string, method: SalaryPaymentBatch['paymentMethod']) => { ok: boolean; error?: string };
  authorizeAndReleaseSalaryBatch: (batchId: string) => { ok: boolean; error?: string };
  retryFailedSalaryTransaction: (batchId: string, txId: string) => void;

  // Accounts Payable Actions
  uploadSupplierInvoice: (payload: {
    supplierId: string;
    invoiceNumber: string;
    poNumber: string;
    grnNumber: string;
    projectId: string;
    siteId: string;
    invoiceDate: string;
    dueDate: string;
    description: string;
    hsnCode: string;
    quantity: number;
    unit: string;
    unitPricePaise: number;
    taxRatePercent: number;
    uploadedFileName: string;
  }) => void;
  updateSupplierInvoiceStatus: (invoiceId: string, nextStatus: SupplierInvoice['status'], note?: string) => { ok: boolean; error?: string };
  paySupplierInvoice: (invoiceId: string) => { ok: boolean; error?: string };

  submitContractorInvoice: (payload: {
    contractorId: string;
    billNumber: string;
    workCompletedSummary: string;
    claimedQuantity: string;
    verifiedQuantity: string;
    grossBillAmountPaise: number;
    advanceRecoveryPaise: number;
    otherDeductionsPaise: number;
  }) => void;
  advanceContractorInvoice: (billId: string, action: 'Site Verified' | 'PM Verified' | 'Approved' | 'Paid' | 'Rejected') => { ok: boolean; error?: string };

  submitReimbursement: (payload: {
    employeeId: string;
    category: EmployeeReimbursement['category'];
    projectId: string;
    siteId: string;
    expenseDate: string;
    amountPaise: number;
    paymentMethod: EmployeeReimbursement['paymentMethod'];
    businessPurpose: string;
    receiptFileName: string;
    remarks: string;
  }) => void;
  updateReimbursementStatus: (id: string, nextStatus: EmployeeReimbursement['status']) => void;

  createSiteExpense: (payload: {
    projectId: string;
    siteId: string;
    category: SiteExpenseCategory;
    description: string;
    requestedBy: string;
    amountPaise: number;
    date: string;
    receiptRef: string;
  }) => void;
  approveAndPaySiteExpense: (id: string, mode: 'Approve' | 'Pay' | 'Reject') => void;

  // Budgets, Reconciliation, Compliance, Approvals
  updateProjectBudgetThresholds: (budgetId: string, warningPct: number, criticalPct: number) => void;
  importBankStatementCSV: (sessionId: string, csvText: string) => number;
  resolveReconciliationRecord: (sessionId: string, recordId: string, resolutionNote: string) => void;
  lockReconciliationSession: (sessionId: string) => void;
  updateComplianceRates: (patch: Partial<ComplianceRateVersion>) => void;
  updateComplianceFilingStatus: (id: string, filingStatus: TaxComplianceRecord['filingStatus'], paymentStatus: TaxComplianceRecord['paymentStatus']) => void;
  processApprovalItem: (
    approvalId: string,
    decision: 'Approved' | 'Rejected' | 'Clarification Requested' | 'Escalated',
    reason: string
  ) => { ok: boolean; error?: string };
  addWorkflowRule: (rule: Omit<ApprovalWorkflowRule, 'id' | 'companyId'>) => void;
}

export const useFinanceStore = create<FinanceStoreState>((set, get) => {
  const appendAudit = (
    state: FinanceStoreState,
    entry: {
      recordReference: string;
      module: string;
      action: string;
      oldValue: string;
      newValue: string;
      reason: string;
      approvalReference?: string;
    }
  ): FinancialAuditLog[] => {
    const user = state.users.find((u) => u.id === state.currentUserId) || state.users[0];
    const role = state.roleConfigs[user.roleId];
    const newLog: FinancialAuditLog = {
      id: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      companyId: state.company.id,
      eventCode: `AUD-2026-${1200 + state.auditLogs.length}`,
      userId: user.id,
      userName: user.name,
      userRole: role.roleName,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    return [newLog, ...state.auditLogs];
  };

  return {
    company: INITIAL_COMPANY,
    users: INITIAL_USERS,
    currentUserId: 'usr_fin_head',
    roleConfigs: DEFAULT_ROLE_CONFIGS,
    makerCheckerEnabled: true,
    filters: {
      branchId: 'ALL',
      projectId: 'ALL',
      siteId: 'ALL',
      financialYear: '2026–2027',
      periodLabel: 'November 2026',
    },

    branches: INITIAL_BRANCHES,
    projects: INITIAL_PROJECTS,
    sites: INITIAL_SITES,
    employees: INITIAL_EMPLOYEES,
    salaryStructures: INITIAL_SALARY_STRUCTURES,
    salaryHistory: INITIAL_SALARY_HISTORY,
    workers: INITIAL_WORKERS,
    payrollPeriods: INITIAL_PAYROLL_PERIODS,
    payrollRuns: INITIAL_PAYROLL_RUNS,
    overtimeRecords: INITIAL_OVERTIME,
    incentiveRecords: INITIAL_INCENTIVES,
    advances: INITIAL_ADVANCES,
    payslips: INITIAL_PAYSLIPS,
    salaryBatches: INITIAL_SALARY_BATCHES,

    suppliers: INITIAL_SUPPLIERS,
    purchaseOrders: INITIAL_POS,
    materialReceipts: INITIAL_GRNS,
    supplierInvoices: INITIAL_SUPPLIER_INVOICES,
    contractors: INITIAL_CONTRACTORS,
    contractorInvoices: INITIAL_CONTRACTOR_INVOICES,
    reimbursements: INITIAL_REIMBURSEMENTS,
    siteExpenses: INITIAL_SITE_EXPENSES,

    projectBudgets: INITIAL_PROJECT_BUDGETS,
    cashFlowEntries: INITIAL_CASH_FLOW,
    transactions: INITIAL_TRANSACTIONS,
    reconciliations: INITIAL_RECONCILIATIONS,

    complianceRates: INITIAL_COMPLIANCE_RATES,
    complianceRecords: INITIAL_COMPLIANCE_RECORDS,
    financialDocuments: INITIAL_FINANCIAL_DOCS,

    workflowRules: INITIAL_WORKFLOW_RULES,
    approvals: INITIAL_APPROVALS,
    auditLogs: INITIAL_AUDIT_LOGS,
    toasts: [],

    pushToast: (toast) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      set((s) => ({ toasts: [...s.toasts.slice(-3), { ...toast, id }] }));
      setTimeout(() => {
        get().dismissToast(id);
      }, 4500);
    },

    dismissToast: (id) =>
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

    setFilters: (patch) =>
      set((s) => ({ filters: { ...s.filters, ...patch } })),

    switchCompanySize: (size) => {
      set((s) => {
        const currentUser = s.users.find((u) => u.id === s.currentUserId)!;
        const allowedRolesForSize = Object.values(s.roleConfigs).filter((r) =>
          r.supportedCompanySizes.includes(size)
        );
        const roleStillValid = allowedRolesForSize.some((r) => r.roleId === currentUser.roleId);
        let nextUserId = s.currentUserId;
        if (!roleStillValid) {
          const fallbackUser = s.users.find((u) =>
            allowedRolesForSize.some((r) => r.roleId === u.roleId)
          );
          if (fallbackUser) nextUserId = fallbackUser.id;
        }
        return {
          company: { ...s.company, size },
          currentUserId: nextUserId,
          auditLogs: appendAudit(s, {
            recordReference: s.company.id,
            module: 'Administration',
            action: 'Company Tier Mode Updated',
            oldValue: s.company.size.toUpperCase(),
            newValue: size.toUpperCase(),
            reason: 'Adapted organizational structure & active finance roles',
          }),
        };
      });
      get().pushToast({
        type: 'info',
        title: `Company Profile: ${size.toUpperCase()}`,
        message: 'Roles, approval hierarchy, and module access adapted dynamically.',
      });
    },

    switchCurrentUser: (userId) => {
      set({ currentUserId: userId });
      const user = get().users.find((u) => u.id === userId);
      if (user) {
        get().pushToast({
          type: 'info',
          title: `Switched Persona: ${user.name}`,
          message: `Active role is now ${get().roleConfigs[user.roleId].roleName}.`,
        });
      }
    },

    updateRoleConfig: (roleId, patch) => {
      set((s) => ({
        roleConfigs: {
          ...s.roleConfigs,
          [roleId]: { ...s.roleConfigs[roleId], ...patch },
        },
        auditLogs: appendAudit(s, {
          recordReference: roleId,
          module: 'Roles & Permissions',
          action: 'Role Permission Matrix Updated',
          oldValue: s.roleConfigs[roleId].roleName,
          newValue: Object.keys(patch).join(', '),
          reason: 'Company Admin permission configuration change',
        }),
      }));
    },

    toggleMakerChecker: (enabled) => {
      set((s) => ({
        makerCheckerEnabled: enabled,
        auditLogs: appendAudit(s, {
          recordReference: 'GLOBAL-MC',
          module: 'Approval Workflows',
          action: 'Maker-Checker Enforcement Changed',
          oldValue: String(s.makerCheckerEnabled),
          newValue: String(enabled),
          reason: 'Security policy toggle by administrator',
        }),
      }));
    },

    updateCompanySettings: (patch) => {
      set((s) => ({
        company: { ...s.company, ...patch },
        auditLogs: appendAudit(s, {
          recordReference: s.company.id,
          module: 'Finance Settings',
          action: 'Company Finance Settings Updated',
          oldValue: s.company.name,
          newValue: patch.name || s.company.name,
          reason: 'Updated organization tax/bank settings',
        }),
      }));
      get().pushToast({ type: 'success', title: 'Settings Saved', message: 'Finance configuration updated.' });
    },

    reviseEmployeeSalary: (employeeId, newValues) => {
      set((s) => {
        const emp = s.employees.find((e) => e.id === employeeId);
        const oldStruct = s.salaryStructures.find((st) => st.id === emp?.currentSalaryStructureId);
        if (!emp || !oldStruct) return s;

        const user = s.users.find((u) => u.id === s.currentUserId)!;
        const oldGross =
          oldStruct.basicPaise +
          oldStruct.hraPaise +
          oldStruct.conveyanceAllowancePaise +
          oldStruct.siteAllowancePaise +
          oldStruct.specialAllowancePaise;

        const historyEntry: EmployeeSalaryHistory = {
          id: `sh_${Date.now()}`,
          employeeId,
          structureId: oldStruct.id,
          effectiveFrom: oldStruct.effectiveFrom,
          effectiveTo: newValues.effectiveFrom,
          grossMonthlyPaise: oldGross,
          basicPaise: oldStruct.basicPaise,
          hraPaise: oldStruct.hraPaise,
          allowancesPaise:
            oldStruct.conveyanceAllowancePaise +
            oldStruct.siteAllowancePaise +
            oldStruct.specialAllowancePaise,
          changedBy: user.name,
          changeReason: oldStruct.revisionReason,
        };

        const newStructId = `str_${employeeId}_${Date.now()}`;
        const newStruct: EmployeeSalaryStructure = {
          ...oldStruct,
          id: newStructId,
          effectiveFrom: newValues.effectiveFrom,
          basicPaise: newValues.basicPaise,
          hraPaise: newValues.hraPaise,
          conveyanceAllowancePaise: newValues.conveyanceAllowancePaise,
          siteAllowancePaise: newValues.siteAllowancePaise,
          specialAllowancePaise: newValues.specialAllowancePaise,
          tdsMonthlyPaise: newValues.tdsMonthlyPaise,
          approvedBy: user.name,
          approvedAt: new Date().toISOString(),
          revisionReason: newValues.reason,
        };

        const newGross =
          newValues.basicPaise +
          newValues.hraPaise +
          newValues.conveyanceAllowancePaise +
          newValues.siteAllowancePaise +
          newValues.specialAllowancePaise;

        return {
          salaryHistory: [historyEntry, ...s.salaryHistory],
          salaryStructures: [newStruct, ...s.salaryStructures],
          employees: s.employees.map((e) =>
            e.id === employeeId ? { ...e, currentSalaryStructureId: newStructId } : e
          ),
          auditLogs: appendAudit(s, {
            recordReference: emp.employeeCode,
            module: 'Employee Payroll',
            action: 'Salary Structure Revised (History Preserved)',
            oldValue: formatINR(oldGross),
            newValue: `${formatINR(newGross)} (Eff. ${newValues.effectiveFrom})`,
            reason: newValues.reason,
          }),
        };
      });
      get().pushToast({
        type: 'success',
        title: 'Salary Structure Updated',
        message: 'Previous salary version preserved in historical audit trail.',
      });
    },

    verifyWorkerAttendance: (workerId) => {
      set((s) => {
        const worker = s.workers.find((w) => w.id === workerId);
        if (!worker) return s;
        return {
          workers: s.workers.map((w) =>
            w.id === workerId ? { ...w, attendanceVerified: true } : w
          ),
          auditLogs: appendAudit(s, {
            recordReference: worker.workerCode,
            module: 'Labour Wages',
            action: 'Site Attendance Verified',
            oldValue: 'Unverified',
            newValue: `Verified (${worker.approvedDays} days)`,
            reason: 'Muster roll confirmed for payroll inclusion',
          }),
        };
      });
      get().pushToast({ type: 'success', title: 'Attendance Verified', message: 'Worker is now eligible for payroll.' });
    },

    verifyWorkerBank: (workerId) => {
      set((s) => {
        const worker = s.workers.find((w) => w.id === workerId);
        if (!worker) return s;
        return {
          workers: s.workers.map((w) =>
            w.id === workerId
              ? { ...w, bankVerified: true, bankAccountMasked: w.bankAccountMasked === 'Missing' ? 'SBI •••• 6120' : w.bankAccountMasked }
              : w
          ),
          auditLogs: appendAudit(s, {
            recordReference: worker.workerCode,
            module: 'Labour Wages',
            action: 'Worker Bank Account Verified',
            oldValue: 'Pending / Missing',
            newValue: 'Verified via Penny-Drop',
            reason: 'Cleared for NEFT/IMPS wage disbursement',
          }),
        };
      });
      get().pushToast({ type: 'success', title: 'Bank Details Verified', message: 'Worker bank account validated.' });
    },

    createPayrollRun: ({ periodId, branchId, projectId }) => {
      const s = get();
      const period = s.payrollPeriods.find((p) => p.id === periodId) || s.payrollPeriods[1];
      const user = s.users.find((u) => u.id === s.currentUserId)!;
      const branchLabel = branchId === 'ALL' ? 'All Branches' : s.branches.find((b) => b.id === branchId)?.name || branchId;
      const projLabel = projectId === 'ALL' ? 'All Projects' : s.projects.find((p) => p.id === projectId)?.name || projectId;
      const runId = `PR-${period.year}-${String(period.month).padStart(2, '0')}-${String(s.payrollRuns.length + 1).padStart(2, '0')}`;

      const newRun = buildPayrollRun({
        runId,
        companyId: s.company.id,
        periodId: period.id,
        periodLabel: period.label,
        workingDays: period.workingDays,
        branchId,
        projectId,
        scopeLabel: `${branchLabel} · ${projLabel}`,
        createdBy: user.name,
        createdByUserId: user.id,
        employees: s.employees,
        salaryStructures: s.salaryStructures,
        workers: s.workers,
        overtimeRecords: s.overtimeRecords,
        incentiveRecords: s.incentiveRecords,
        advances: s.advances,
        reimbursements: s.reimbursements,
        complianceRates: s.complianceRates,
        attendanceByEmployeeId: {},
      });

      set((prev) => ({
        payrollRuns: [newRun, ...prev.payrollRuns],
        auditLogs: appendAudit(prev, {
          recordReference: runId,
          module: 'Payroll Processing',
          action: 'New Payroll Run Generated',
          oldValue: 'N/A',
          newValue: `${newRun.totalHeadcount} headcount · Net ${formatINR(newRun.totalNetPayablePaise)}`,
          reason: `Payroll run created for ${period.label} (${newRun.scopeLabel})`,
        }),
      }));

      get().pushToast({
        type: newRun.unresolvedExceptionsCount > 0 ? 'warning' : 'success',
        title: `Payroll Run ${runId} Calculated`,
        message:
          newRun.unresolvedExceptionsCount > 0
            ? `${newRun.unresolvedExceptionsCount} exception(s) flagged for review.`
            : 'Zero exceptions found. Ready for approval submission.',
      });

      return newRun;
    },

    resolvePayrollException: (runId, exceptionId, resolutionAction) => {
      set((s) => {
        const user = s.users.find((u) => u.id === s.currentUserId)!;
        const targetRun = s.payrollRuns.find((r) => r.id === runId);
        if (!targetRun) return s;

        const targetExc = targetRun.exceptions.find((e) => e.id === exceptionId);

        // Apply real side-effect on underlying worker/employee if applicable
        let nextEmployees = s.employees;
        let nextWorkers = s.workers;

        if (targetExc) {
          if (targetExc.category === 'Missing Bank Info' && resolutionAction.includes('Verify')) {
            nextEmployees = s.employees.map((e) =>
              e.id === targetExc.personId ? { ...e, bankVerified: true } : e
            );
            nextWorkers = s.workers.map((w) =>
              w.id === targetExc.personId
                ? { ...w, bankVerified: true, bankAccountMasked: w.bankAccountMasked === 'Missing' ? 'SBI •••• 6120' : w.bankAccountMasked }
                : w
            );
          }
          if (targetExc.category === 'Unverified Attendance' && resolutionAction.includes('Verify')) {
            nextWorkers = s.workers.map((w) =>
              w.id === targetExc.personId ? { ...w, attendanceVerified: true } : w
            );
          }
        }

        const updatedRuns = s.payrollRuns.map((run) => {
          if (run.id !== runId) return run;
          const updatedExceptions = run.exceptions.map((ex) =>
            ex.id === exceptionId
              ? { ...ex, resolved: true, resolutionAction, resolvedBy: user.name, resolvedAt: new Date().toISOString() }
              : ex
          );
          const unresolvedCount = updatedExceptions.filter((e) => !e.resolved).length;
          // If excluded due to unverified attendance and now verified, include them!
          const updatedItems = run.items.map((item) => {
            if (targetExc && item.personId === targetExc.personId && resolutionAction.includes('Verify')) {
              return { ...item, excludedFromRun: false, holdReason: undefined };
            }
            if (targetExc && item.personId === targetExc.personId && resolutionAction.includes('Hold')) {
              return { ...item, excludedFromRun: true, holdReason: resolutionAction };
            }
            return item;
          });
          const activeItems = updatedItems.filter((i) => !i.excludedFromRun);
          const totalGrossPaise = activeItems.reduce((a, b) => a + b.grossEarningsPaise, 0);
          const totalDeductionsPaise = activeItems.reduce((a, b) => a + b.totalDeductionsPaise, 0);
          const totalNetPayablePaise = activeItems.reduce((a, b) => a + b.netPayablePaise, 0);

          return {
            ...run,
            exceptions: updatedExceptions,
            unresolvedExceptionsCount: unresolvedCount,
            items: updatedItems,
            totalHeadcount: activeItems.length,
            totalGrossPaise,
            totalDeductionsPaise,
            totalNetPayablePaise,
            status: unresolvedCount === 0 ? ('Calculation Completed' as const) : ('Exceptions Found' as const),
          };
        });

        return {
          employees: nextEmployees,
          workers: nextWorkers,
          payrollRuns: updatedRuns,
          auditLogs: appendAudit(s, {
            recordReference: runId,
            module: 'Payroll Exceptions',
            action: `Resolved Exception (${targetExc?.category})`,
            oldValue: 'Unresolved',
            newValue: resolutionAction,
            reason: `${targetExc?.personName}: ${resolutionAction}`,
          }),
        };
      });
      get().pushToast({ type: 'success', title: 'Exception Resolved', message: resolutionAction });
    },

    submitPayrollRunForApproval: (runId) => {
      set((s) => {
        const run = s.payrollRuns.find((r) => r.id === runId);
        const user = s.users.find((u) => u.id === s.currentUserId)!;
        if (!run) return s;

        const approvalItem: ApprovalItem = {
          id: `apr_pr_${Date.now()}`,
          companyId: s.company.id,
          requestCode: `APR-${run.id}`,
          category: 'Payroll Run',
          sourceRecordId: run.id,
          title: `${run.periodLabel} Payroll Run (${run.scopeLabel})`,
          requesterName: user.name,
          createdByUserId: user.id,
          projectId: run.projectId === 'ALL' ? undefined : run.projectId,
          amountPaise: run.totalNetPayablePaise,
          supportingDocsCount: 2,
          currentStage: 'Payroll Manager / Finance Head Approval',
          requiredMinRole: 'payroll_manager',
          deadline: '2026-11-28',
          status: 'Pending',
          history: [
            {
              stage: 'Payroll Calculation',
              actorName: user.name,
              actorRole: s.roleConfigs[user.roleId].roleName,
              decision: 'Submitted',
              timestamp: new Date().toISOString(),
              reason: `Submitted ${run.totalHeadcount} records with zero unresolved high-severity blockers.`,
            },
          ],
        };

        return {
          payrollRuns: s.payrollRuns.map((r) =>
            r.id === runId ? { ...r, status: 'Pending Approval' } : r
          ),
          approvals: [approvalItem, ...s.approvals.filter((a) => a.sourceRecordId !== runId)],
          auditLogs: appendAudit(s, {
            recordReference: runId,
            module: 'Payroll Processing',
            action: 'Submitted Payroll for Approval',
            oldValue: run.status,
            newValue: 'Pending Approval',
            reason: 'Ready for authorized manager sign-off',
          }),
        };
      });
      get().pushToast({ type: 'info', title: 'Submitted for Approval', message: 'Payroll run queued in Financial Approval Centre.' });
    },

    approveAndLockPayrollRun: (runId) => {
      const s = get();
      const run = s.payrollRuns.find((r) => r.id === runId);
      const user = s.users.find((u) => u.id === s.currentUserId)!;
      const role = s.roleConfigs[user.roleId];
      if (!run) return { ok: false, error: 'Payroll run not found.' };

      const check = checkMakerChecker(user, role, run.createdByUserId, 'approve_payroll', run.totalNetPayablePaise, s.makerCheckerEnabled);
      if (!check.allowed) {
        get().pushToast({ type: 'error', title: 'Authorization Blocked', message: check.reason || 'Not permitted.' });
        return { ok: false, error: check.reason };
      }

      const nowIso = new Date().toISOString();
      set((prev) => ({
        payrollRuns: prev.payrollRuns.map((r) =>
          r.id === runId
            ? { ...r, status: 'Locked', approvedBy: user.name, approvedAt: nowIso, lockedAt: nowIso }
            : r
        ),
        approvals: prev.approvals.map((a) =>
          a.sourceRecordId === runId ? { ...a, status: 'Approved' } : a
        ),
        auditLogs: appendAudit(prev, {
          recordReference: runId,
          module: 'Payroll Processing',
          action: 'Payroll Approved & Snapshot Locked',
          oldValue: run.status,
          newValue: 'Locked',
          reason: 'Calculations, salary versions, and attendance references frozen.',
          approvalReference: `APR-${runId}`,
        }),
      }));

      get().generatePayslipsForRun(runId);
      get().pushToast({
        type: 'success',
        title: `Payroll ${runId} Locked`,
        message: 'Snapshot preserved and payslips generated. Ready to create Salary Payment Batch.',
      });
      return { ok: true };
    },

    generatePayslipsForRun: (runId) => {
      set((s) => {
        const run = s.payrollRuns.find((r) => r.id === runId);
        if (!run) return s;

        const existingIds = new Set(s.payslips.map((p) => `${p.payrollRunId}_${p.employeeId}`));
        const newSlips: Payslip[] = [];

        run.items
          .filter((i) => i.personType === 'Employee' && !i.excludedFromRun)
          .forEach((item, idx) => {
            if (existingIds.has(`${run.id}_${item.personId}`)) return;
            const emp = s.employees.find((e) => e.id === item.personId);
            if (!emp) return;
            newSlips.push({
              id: `ps_${run.id}_${emp.id}`,
              companyId: s.company.id,
              payslipNumber: `PS-${run.id.replace(/\D/g, '')}-${101 + idx}`,
              payrollRunId: run.id,
              periodLabel: run.periodLabel,
              employeeId: emp.id,
              employeeCode: emp.employeeCode,
              employeeName: emp.name,
              designation: emp.designation,
              department: emp.department,
              projectId: emp.projectId,
              uanNumber: emp.uanNumber,
              panMasked: emp.panMasked,
              bankAccountMasked: emp.bankAccountMasked,
              payableDays: item.payableDays,
              workingDays: 26,
              earnings: item.earnings,
              deductions: item.deductions,
              grossEarningsPaise: item.grossEarningsPaise,
              totalDeductionsPaise: item.totalDeductionsPaise,
              netPayPaise: item.netPayablePaise,
              paymentStatus: run.status === 'Paid' ? 'Paid' : 'Pending Payment',
              generatedAt: new Date().toISOString(),
            });
          });

        if (newSlips.length === 0) return s;
        return {
          payslips: [...newSlips, ...s.payslips],
          auditLogs: appendAudit(s, {
            recordReference: runId,
            module: 'Payslips',
            action: 'Bulk Payslips Generated',
            oldValue: '0',
            newValue: `${newSlips.length} payslips issued`,
            reason: `Generated payslips for ${run.periodLabel}`,
          }),
        };
      });
    },

    issuePayslipCorrection: (payslipId, note) => {
      set((s) => {
        const slip = s.payslips.find((p) => p.id === payslipId);
        if (!slip) return s;
        return {
          payslips: s.payslips.map((p) =>
            p.id === payslipId ? { ...p, paymentStatus: 'Revised', correctionNote: note } : p
          ),
          auditLogs: appendAudit(s, {
            recordReference: slip.payslipNumber,
            module: 'Payslips',
            action: 'Payslip Correction Note Logged',
            oldValue: slip.paymentStatus,
            newValue: 'Revised',
            reason: note,
          }),
        };
      });
      get().pushToast({ type: 'info', title: 'Correction Recorded', message: 'Payslip marked Revised with audit note.' });
    },

    submitOvertimeRecord: (record) => {
      set((s) => {
        const amountPaise = Math.round(
          record.hourlyRatePaise * record.multiplier * record.reportedOvertimeHours
        );
        const newOt: OvertimeRecord = {
          ...record,
          id: `ot_${Date.now()}`,
          companyId: s.company.id,
          approvedOvertimeHours: 0,
          calculatedAmountPaise: amountPaise,
          approvalStatus: 'Submitted',
        };
        return {
          overtimeRecords: [newOt, ...s.overtimeRecords],
          auditLogs: appendAudit(s, {
            recordReference: newOt.id,
            module: 'Overtime & Incentives',
            action: 'Overtime Logged',
            oldValue: 'None',
            newValue: `${record.personName} · ${record.reportedOvertimeHours} hrs (${formatINR(amountPaise)})`,
            reason: `${record.category} on ${record.date}`,
          }),
        };
      });
      get().pushToast({ type: 'success', title: 'Overtime Submitted', message: 'Awaiting Site Manager verification & HR approval.' });
    },

    advanceOvertimeStatus: (id, nextStatus) => {
      set((s) => {
        const ot = s.overtimeRecords.find((o) => o.id === id);
        const user = s.users.find((u) => u.id === s.currentUserId)!;
        if (!ot) return s;
        return {
          overtimeRecords: s.overtimeRecords.map((o) =>
            o.id === id
              ? {
                  ...o,
                  approvalStatus: nextStatus,
                  verifiedBySiteManager: nextStatus === 'Site Verified' ? user.name : o.verifiedBySiteManager,
                  approvedBy: nextStatus === 'Approved' ? user.name : o.approvedBy,
                  approvedOvertimeHours: nextStatus === 'Approved' ? o.reportedOvertimeHours : nextStatus === 'Rejected' ? 0 : o.approvedOvertimeHours,
                }
              : o
          ),
          auditLogs: appendAudit(s, {
            recordReference: id,
            module: 'Overtime & Incentives',
            action: `Overtime ${nextStatus}`,
            oldValue: ot.approvalStatus,
            newValue: nextStatus,
            reason: `${ot.personName} (${ot.reportedOvertimeHours} hrs)`,
          }),
        };
      });
      get().pushToast({ type: 'success', title: `Overtime ${nextStatus}`, message: 'Overtime workflow updated.' });
    },

    approveIncentive: (id) => {
      set((s) => {
        const inc = s.incentiveRecords.find((i) => i.id === id);
        const user = s.users.find((u) => u.id === s.currentUserId)!;
        if (!inc) return s;
        return {
          incentiveRecords: s.incentiveRecords.map((i) =>
            i.id === id ? { ...i, status: 'Approved', approver: user.name } : i
          ),
          auditLogs: appendAudit(s, {
            recordReference: inc.supportingRef,
            module: 'Overtime & Incentives',
            action: 'Incentive Approved',
            oldValue: inc.status,
            newValue: 'Approved',
            reason: `${inc.personName}: ${formatINR(inc.amountPaise)}`,
          }),
        };
      });
      get().pushToast({ type: 'success', title: 'Incentive Approved', message: 'Included in upcoming payroll run.' });
    },

    requestAdvance: (payload) => {
      set((s) => {
        const user = s.users.find((u) => u.id === s.currentUserId)!;
        const code = `ADV-2026-0${32 + s.advances.length}`;
        const monthlyDeductionPaise = Math.round(payload.amountPaise / Math.max(1, payload.installmentsTotal));
        const newAdv: EmployeeAdvance = {
          id: `adv_${Date.now()}`,
          companyId: s.company.id,
          advanceCode: code,
          personId: payload.personId,
          personName: payload.personName,
          personType: payload.personType,
          projectId: payload.projectId,
          requestDate: new Date().toISOString().slice(0, 10),
          reason: payload.reason,
          requestedAmountPaise: payload.amountPaise,
          approvedAmountPaise: 0,
          disbursedAmountPaise: 0,
          outstandingAmountPaise: 0,
          monthlyDeductionPaise,
          installmentsTotal: payload.installmentsTotal,
          installmentsPaid: 0,
          status: 'Requested',
          createdByUserId: user.id,
          repayments: [],
        };
        return {
          advances: [newAdv, ...s.advances],
          auditLogs: appendAudit(s, {
            recordReference: code,
            module: 'Advances & Loans',
            action: 'Advance Requested',
            oldValue: 'None',
            newValue: `${payload.personName} · ${formatINR(payload.amountPaise)}`,
            reason: payload.reason,
          }),
        };
      });
      get().pushToast({ type: 'success', title: 'Advance Requested', message: 'Queued for HR & Finance review.' });
    },

    processAdvanceStatus: (id, nextStatus) => {
      set((s) => {
        const adv = s.advances.find((a) => a.id === id);
        const user = s.users.find((u) => u.id === s.currentUserId)!;
        if (!adv) return s;

        return {
          advances: s.advances.map((a) => {
            if (a.id !== id) return a;
            if (nextStatus === 'Approved') {
              return { ...a, status: 'Approved', approvedAmountPaise: a.requestedAmountPaise, approvedBy: user.name };
            }
            if (nextStatus === 'Disbursed') {
              const amt = a.approvedAmountPaise || a.requestedAmountPaise;
              return {
                ...a,
                status: 'Disbursed',
                approvedAmountPaise: amt,
                disbursedAmountPaise: amt,
                outstandingAmountPaise: amt,
                approvedBy: a.approvedBy || user.name,
              };
            }
            return { ...a, status: 'Rejected' };
          }),
          auditLogs: appendAudit(s, {
            recordReference: adv.advanceCode,
            module: 'Advances & Loans',
            action: `Advance ${nextStatus}`,
            oldValue: adv.status,
            newValue: nextStatus,
            reason: `${adv.personName} · ${formatINR(adv.requestedAmountPaise)}`,
          }),
        };
      });
      get().pushToast({ type: 'success', title: `Advance ${nextStatus}`, message: 'Advance ledger updated.' });
    },

    createSalaryPaymentBatch: (runId, method) => {
      const s = get();
      const run = s.payrollRuns.find((r) => r.id === runId);
      const user = s.users.find((u) => u.id === s.currentUserId)!;
      if (!run) return { ok: false, error: 'Payroll run not found.' };
      if (run.status !== 'Locked') {
        return { ok: false, error: 'Payroll run must be Approved & Locked before creating a payment batch.' };
      }

      const activeItems = run.items.filter((i) => !i.excludedFromRun && i.netPayablePaise > 0);
      const batchId = `batch_${Date.now()}`;
      const batchCode = `SAL-BATCH-${run.id.replace('PR-', '')}`;

      const batch: SalaryPaymentBatch = {
        id: batchId,
        companyId: s.company.id,
        batchCode,
        payrollRunId: run.id,
        periodLabel: run.periodLabel,
        totalEmployees: activeItems.length,
        totalPayablePaise: run.totalNetPayablePaise,
        approvedAmountPaise: run.totalNetPayablePaise,
        paymentMethod: method,
        bankAccountRef: s.company.primaryBankRef,
        status: 'Awaiting Authorization',
        createdByUserId: user.id,
        createdByName: user.name,
        transactions: activeItems.map((item, idx) => {
          const emp = s.employees.find((e) => e.id === item.personId);
          const wrk = s.workers.find((w) => w.id === item.personId);
          return {
            id: `stx_${batchId}_${idx + 1}`,
            batchId,
            personId: item.personId,
            personCode: item.personCode,
            personName: item.personName,
            bankAccountMasked: emp?.bankAccountMasked || wrk?.bankAccountMasked || '•••• 0000',
            ifsc: emp?.bankIfsc || 'SBIN0004120',
            netPayablePaise: item.netPayablePaise,
            paymentReference: `PEND-${batchCode}-${idx + 1}`,
            transferStatus: 'Queued',
            transactionDate: new Date().toISOString().slice(0, 10),
          };
        }),
      };

      set((prev) => ({
        salaryBatches: [batch, ...prev.salaryBatches],
        payrollRuns: prev.payrollRuns.map((r) =>
          r.id === runId ? { ...r, status: 'Payment Processing' } : r
        ),
        auditLogs: appendAudit(prev, {
          recordReference: batchCode,
          module: 'Salary Payments',
          action: 'Payment Batch Created',
          oldValue: 'Locked Payroll',
          newValue: `Awaiting Authorization (${formatINR(batch.totalPayablePaise)})`,
          reason: `Created ${method} payment batch for ${run.periodLabel}`,
        }),
      }));
      get().pushToast({ type: 'info', title: 'Payment Batch Created', message: `${batchCode} is awaiting Treasury/Finance release.` });
      return { ok: true };
    },

    authorizeAndReleaseSalaryBatch: (batchId) => {
      const s = get();
      const batch = s.salaryBatches.find((b) => b.id === batchId);
      const user = s.users.find((u) => u.id === s.currentUserId)!;
      const role = s.roleConfigs[user.roleId];
      if (!batch) return { ok: false, error: 'Batch not found.' };

      const check = checkMakerChecker(user, role, batch.createdByUserId, 'release_payment', batch.totalPayablePaise, s.makerCheckerEnabled);
      if (!check.allowed) {
        get().pushToast({ type: 'error', title: 'Maker-Checker Restriction', message: check.reason || 'Unauthorized.' });
        return { ok: false, error: check.reason };
      }

      // Mock bank provider payout simulation: bankVerified=false items fail realistically; others confirm with UTR!
      const updatedTxs = batch.transactions.map((tx, idx) => {
        const emp = s.employees.find((e) => e.id === tx.personId);
        const wrk = s.workers.find((w) => w.id === tx.personId);
        const verified = emp ? emp.bankVerified : wrk ? wrk.bankVerified : true;
        if (!verified) {
          return {
            ...tx,
            transferStatus: 'Failed' as const,
            paymentReference: `ERR-NACH-${900 + idx}`,
            failureReason: 'Beneficiary bank verification incomplete / IFSC return',
          };
        }
        return {
          ...tx,
          transferStatus: 'Success' as const,
          paymentReference: `UTR2611${Date.now().toString().slice(-6)}${idx}`,
          failureReason: undefined,
        };
      });

      const anyFailed = updatedTxs.some((t) => t.transferStatus === 'Failed');
      const nextBatchStatus = anyFailed ? 'Partially Paid' : 'Paid';
      const paidTotal = updatedTxs
        .filter((t) => t.transferStatus === 'Success')
        .reduce((a, b) => a + b.netPayablePaise, 0);

      const newLedgerTx: FinancialTransaction = {
        id: `tx_${Date.now()}`,
        companyId: s.company.id,
        transactionRef: `TXN-2026-${9910 + s.transactions.length}`,
        utrNumber: `HDFCN${Date.now().toString().slice(-10)}`,
        date: new Date().toISOString().slice(0, 10),
        direction: 'Debit',
        module: 'Salary Payment',
        counterparty: `${batch.periodLabel} Salary Batch (${batch.batchCode})`,
        paymentMode: 'NEFT',
        bankAccountRef: batch.bankAccountRef,
        amountPaise: paidTotal,
        status: 'Confirmed',
        reconciled: false,
        createdByUserId: batch.createdByUserId,
        releasedByUserId: user.id,
      };

      set((prev) => ({
        salaryBatches: prev.salaryBatches.map((b) =>
          b.id === batchId
            ? {
                ...b,
                status: nextBatchStatus,
                authorizedBy: user.name,
                authorizedAt: new Date().toISOString(),
                transactions: updatedTxs,
              }
            : b
        ),
        payrollRuns: prev.payrollRuns.map((r) =>
          r.id === batch.payrollRunId
            ? { ...r, status: anyFailed ? 'Partially Paid' : 'Paid' }
            : r
        ),
        payslips: prev.payslips.map((ps) =>
          ps.payrollRunId === batch.payrollRunId
            ? {
                ...ps,
                paymentStatus: updatedTxs.find((t) => t.personId === ps.employeeId)?.transferStatus === 'Success' ? 'Paid' : 'On Hold',
              }
            : ps
        ),
        transactions: [newLedgerTx, ...prev.transactions],
        auditLogs: appendAudit(prev, {
          recordReference: batch.batchCode,
          module: 'Salary Payments',
          action: 'Bank Payment Batch Released',
          oldValue: batch.status,
          newValue: `${nextBatchStatus} (${formatINR(paidTotal)} confirmed)`,
          reason: `Released via ${batch.paymentMethod}`,
        }),
      }));

      get().pushToast({
        type: anyFailed ? 'warning' : 'success',
        title: `Batch ${nextBatchStatus}`,
        message: anyFailed
          ? 'Most transfers succeeded, but unverified bank records returned errors.'
          : `All ${updatedTxs.length} transfers confirmed by bank gateway.`,
      });
      return { ok: true };
    },

    retryFailedSalaryTransaction: (batchId, txId) => {
      set((s) => {
        const batch = s.salaryBatches.find((b) => b.id === batchId);
        if (!batch) return s;
        const updatedTxs = batch.transactions.map((tx) =>
          tx.id === txId
            ? {
                ...tx,
                transferStatus: 'Success' as const,
                paymentReference: `UTR-RETRY-${Date.now().toString().slice(-7)}`,
                failureReason: undefined,
                transactionDate: new Date().toISOString().slice(0, 10),
              }
            : tx
        );
        const allPaid = updatedTxs.every((t) => t.transferStatus === 'Success');
        return {
          salaryBatches: s.salaryBatches.map((b) =>
            b.id === batchId
              ? { ...b, status: allPaid ? 'Paid' : 'Partially Paid', transactions: updatedTxs }
              : b
          ),
          auditLogs: appendAudit(s, {
            recordReference: batch.batchCode,
            module: 'Salary Payments',
            action: 'Failed Transfer Retried & Confirmed',
            oldValue: 'Failed',
            newValue: 'Success',
            reason: `Re-initiated NEFT/IMPS transfer for ${txId}`,
          }),
        };
      });
      get().pushToast({ type: 'success', title: 'Retry Successful', message: 'Transfer confirmed with new UTR reference.' });
    },

    uploadSupplierInvoice: (payload) => {
      set((s) => {
        const supplier = s.suppliers.find((sup) => sup.id === payload.supplierId)!;
        const user = s.users.find((u) => u.id === s.currentUserId)!;
        const subtotalPaise = payload.quantity * payload.unitPricePaise;
        const taxAmountPaise = Math.round((subtotalPaise * payload.taxRatePercent) / 100);
        const totalAmountPaise = subtotalPaise + taxAmountPaise;
        const newId = `sinv_${Date.now()}`;

        const draftInv: Omit<SupplierInvoice, 'matchResult'> = {
          id: newId,
          companyId: s.company.id,
          invoiceNumber: payload.invoiceNumber,
          supplierId: supplier.id,
          supplierName: supplier.name,
          gstin: supplier.gstin,
          poNumber: payload.poNumber,
          grnNumber: payload.grnNumber,
          projectId: payload.projectId,
          siteId: payload.siteId,
          invoiceDate: payload.invoiceDate,
          dueDate: payload.dueDate,
          subtotalPaise,
          taxAmountPaise,
          tdsApplicablePaise: 0,
          totalAmountPaise,
          paidAmountPaise: 0,
          status: 'Uploaded',
          items: [
            {
              description: payload.description,
              hsnCode: payload.hsnCode,
              quantity: payload.quantity,
              unit: payload.unit,
              unitPricePaise: payload.unitPricePaise,
              taxRatePercent: payload.taxRatePercent,
              taxAmountPaise,
              lineTotalPaise: totalAmountPaise,
            },
          ],
          uploadedFileName: payload.uploadedFileName,
          createdByUserId: user.id,
          approvalHistory: [
            {
              stage: 'Uploaded',
              actorName: user.name,
              actorRole: s.roleConfigs[user.roleId].roleName,
              decision: 'Submitted',
              timestamp: new Date().toISOString(),
              reason: 'Uploaded via Accounts Payable',
            },
          ],
        };

        const matchResult = performThreeWayMatch(draftInv, s.supplierInvoices, s.purchaseOrders, s.materialReceipts);
        const fullInvoice: SupplierInvoice = {
          ...draftInv,
          status: matchResult.matched ? 'Pending Approval' : 'Verification Required',
          matchResult,
        };

        return {
          supplierInvoices: [fullInvoice, ...s.supplierInvoices],
          auditLogs: appendAudit(s, {
            recordReference: payload.invoiceNumber,
            module: 'Supplier Invoices',
            action: 'Supplier Invoice Uploaded & 3-Way Checked',
            oldValue: 'None',
            newValue: `${fullInvoice.status} · ${formatINR(totalAmountPaise)}`,
            reason: matchResult.matched ? '3-way match clean' : matchResult.flags.join(' | '),
          }),
        };
      });
      get().pushToast({
        type: 'info',
        title: 'Invoice Uploaded & Checked',
        message: 'Automated 3-way matching completed against PO & GRN records.',
      });
    },

    updateSupplierInvoiceStatus: (invoiceId, nextStatus, note) => {
      const s = get();
      const inv = s.supplierInvoices.find((i) => i.id === invoiceId);
      const user = s.users.find((u) => u.id === s.currentUserId)!;
      const role = s.roleConfigs[user.roleId];
      if (!inv) return { ok: false, error: 'Invoice not found' };

      if (nextStatus === 'Approved') {
        const check = checkMakerChecker(user, role, inv.createdByUserId, 'approve_invoice', inv.totalAmountPaise, s.makerCheckerEnabled);
        if (!check.allowed) {
          get().pushToast({ type: 'error', title: 'Approval Blocked', message: check.reason || 'Unauthorized' });
          return { ok: false, error: check.reason };
        }
      }

      set((prev) => ({
        supplierInvoices: prev.supplierInvoices.map((i) =>
          i.id === invoiceId
            ? {
                ...i,
                status: nextStatus,
                approvalHistory: [
                  ...i.approvalHistory,
                  {
                    stage: nextStatus,
                    actorName: user.name,
                    actorRole: role.roleName,
                    decision: nextStatus === 'Rejected' ? 'Rejected' : nextStatus === 'Approved' ? 'Approved' : 'Verified',
                    timestamp: new Date().toISOString(),
                    reason: note || `Status updated to ${nextStatus}`,
                  },
                ],
              }
            : i
        ),
        auditLogs: appendAudit(prev, {
          recordReference: inv.invoiceNumber,
          module: 'Supplier Invoices',
          action: `Invoice ${nextStatus}`,
          oldValue: inv.status,
          newValue: nextStatus,
          reason: note || `Supplier ${inv.supplierName}`,
        }),
      }));
      get().pushToast({ type: 'success', title: `Invoice ${nextStatus}`, message: inv.invoiceNumber });
      return { ok: true };
    },

    paySupplierInvoice: (invoiceId) => {
      const s = get();
      const inv = s.supplierInvoices.find((i) => i.id === invoiceId);
      const user = s.users.find((u) => u.id === s.currentUserId)!;
      const role = s.roleConfigs[user.roleId];
      if (!inv) return { ok: false, error: 'Invoice not found' };

      const check = checkMakerChecker(user, role, inv.createdByUserId, 'release_payment', inv.totalAmountPaise, s.makerCheckerEnabled);
      if (!check.allowed) {
        get().pushToast({ type: 'error', title: 'Payment Blocked', message: check.reason || 'Unauthorized' });
        return { ok: false, error: check.reason };
      }

      const newTx: FinancialTransaction = {
        id: `tx_${Date.now()}`,
        companyId: s.company.id,
        transactionRef: `TXN-2026-${9910 + s.transactions.length}`,
        utrNumber: `HDFCN${Date.now().toString().slice(-10)}`,
        date: new Date().toISOString().slice(0, 10),
        direction: 'Debit',
        module: 'Supplier Payment',
        counterparty: inv.supplierName,
        projectId: inv.projectId,
        siteId: inv.siteId,
        paymentMode: 'NEFT',
        bankAccountRef: s.company.primaryBankRef,
        amountPaise: inv.totalAmountPaise,
        status: 'Confirmed',
        reconciled: false,
        createdByUserId: inv.createdByUserId,
        releasedByUserId: user.id,
      };

      set((prev) => ({
        supplierInvoices: prev.supplierInvoices.map((i) =>
          i.id === invoiceId ? { ...i, status: 'Paid', paidAmountPaise: i.totalAmountPaise } : i
        ),
        transactions: [newTx, ...prev.transactions],
        projectBudgets: prev.projectBudgets.map((b) =>
          b.projectId === inv.projectId
            ? {
                ...b,
                actualPaidPaise: b.actualPaidPaise + inv.totalAmountPaise,
                outstandingPayablesPaise: Math.max(0, b.outstandingPayablesPaise - inv.totalAmountPaise),
              }
            : b
        ),
        auditLogs: appendAudit(prev, {
          recordReference: inv.invoiceNumber,
          module: 'Payment Processing',
          action: 'Supplier Invoice Paid',
          oldValue: inv.status,
          newValue: `Paid (${formatINR(inv.totalAmountPaise)}) · ${newTx.utrNumber}`,
          reason: `Payment released to ${inv.supplierName}`,
        }),
      }));
      get().pushToast({ type: 'success', title: 'Payment Confirmed', message: `UTR ${newTx.utrNumber} settled.` });
      return { ok: true };
    },

    submitContractorInvoice: (payload) => {
      set((s) => {
        const con = s.contractors.find((c) => c.id === payload.contractorId)!;
        const user = s.users.find((u) => u.id === s.currentUserId)!;
        const calc = calculateContractorNetPayable({
          grossBillAmountPaise: payload.grossBillAmountPaise,
          retentionPercent: con.retentionPercent,
          advanceRecoveryPaise: payload.advanceRecoveryPaise,
          otherDeductionsPaise: payload.otherDeductionsPaise,
          gstPercent: 18,
          tdsPercent: con.tdsPercent,
        });

        const newBill: ContractorInvoice = {
          id: `cinv_${Date.now()}`,
          companyId: s.company.id,
          billNumber: payload.billNumber,
          contractorId: con.id,
          contractorName: con.name,
          companyName: con.companyName,
          contractRef: con.contractRef,
          projectId: con.projectId,
          siteId: con.siteId,
          workCategory: con.workCategory,
          workCompletedSummary: payload.workCompletedSummary,
          claimedQuantity: payload.claimedQuantity,
          verifiedQuantity: payload.verifiedQuantity,
          grossBillAmountPaise: payload.grossBillAmountPaise,
          ...calc,
          advanceRecoveryPaise: payload.advanceRecoveryPaise,
          otherDeductionsPaise: payload.otherDeductionsPaise,
          billDate: new Date().toISOString().slice(0, 10),
          dueDate: '2026-12-05',
          status: 'Submitted',
          createdByUserId: user.id,
          approvalHistory: [
            {
              stage: 'Submitted',
              actorName: user.name,
              actorRole: s.roleConfigs[user.roleId].roleName,
              decision: 'Submitted',
              timestamp: new Date().toISOString(),
              reason: 'RA Bill submitted for site measurement verification',
            },
          ],
        };

        return {
          contractorInvoices: [newBill, ...s.contractorInvoices],
          auditLogs: appendAudit(s, {
            recordReference: payload.billNumber,
            module: 'Contractor Payments',
            action: 'Contractor RA Bill Submitted',
            oldValue: 'None',
            newValue: `Net ${formatINR(calc.netPayablePaise)} (Retention ${formatINR(calc.retentionDeductedPaise)}, TDS ${formatINR(calc.tdsDeductedPaise)})`,
            reason: payload.workCompletedSummary,
          }),
        };
      });
      get().pushToast({ type: 'success', title: 'Contractor RA Bill Recorded', message: 'Awaiting Site & PM certification.' });
    },

    advanceContractorInvoice: (billId, action) => {
      const s = get();
      const bill = s.contractorInvoices.find((b) => b.id === billId);
      const user = s.users.find((u) => u.id === s.currentUserId)!;
      const role = s.roleConfigs[user.roleId];
      if (!bill) return { ok: false, error: 'Contractor bill not found.' };

      if (action === 'Approved') {
        const check = checkMakerChecker(user, role, bill.createdByUserId, 'approve_invoice', bill.netPayablePaise, s.makerCheckerEnabled);
        if (!check.allowed) {
          get().pushToast({ type: 'error', title: 'Approval Blocked', message: check.reason || 'Unauthorized' });
          return { ok: false, error: check.reason };
        }
      }
      if (action === 'Paid') {
        const check = checkMakerChecker(user, role, bill.createdByUserId, 'release_payment', bill.netPayablePaise, s.makerCheckerEnabled);
        if (!check.allowed) {
          get().pushToast({ type: 'error', title: 'Payment Release Blocked', message: check.reason || 'Unauthorized' });
          return { ok: false, error: check.reason };
        }
      }

      set((prev) => {
        const extraTx: FinancialTransaction[] =
          action === 'Paid'
            ? [
                {
                  id: `tx_${Date.now()}`,
                  companyId: prev.company.id,
                  transactionRef: `TXN-2026-${9910 + prev.transactions.length}`,
                  utrNumber: `HDFCN${Date.now().toString().slice(-10)}`,
                  date: new Date().toISOString().slice(0, 10),
                  direction: 'Debit',
                  module: 'Contractor Payment',
                  counterparty: bill.companyName,
                  projectId: bill.projectId,
                  siteId: bill.siteId,
                  paymentMode: 'NEFT',
                  bankAccountRef: prev.company.primaryBankRef,
                  amountPaise: bill.netPayablePaise,
                  status: 'Confirmed',
                  reconciled: false,
                  createdByUserId: bill.createdByUserId,
                  releasedByUserId: user.id,
                },
              ]
            : [];

        return {
          contractorInvoices: prev.contractorInvoices.map((b) =>
            b.id === billId
              ? {
                  ...b,
                  status: action,
                  siteVerifiedBy: action === 'Site Verified' ? user.name : b.siteVerifiedBy,
                  pmVerifiedBy: action === 'PM Verified' ? user.name : b.pmVerifiedBy,
                  approvalHistory: [
                    ...b.approvalHistory,
                    {
                      stage: action,
                      actorName: user.name,
                      actorRole: role.roleName,
                      decision: action === 'Rejected' ? 'Rejected' : action === 'Approved' ? 'Approved' : 'Verified',
                      timestamp: new Date().toISOString(),
                      reason: `Contractor RA bill moved to ${action}`,
                    },
                  ],
                }
              : b
          ),
          transactions: [...extraTx, ...prev.transactions],
          auditLogs: appendAudit(prev, {
            recordReference: bill.billNumber,
            module: 'Contractor Payments',
            action: `RA Bill ${action}`,
            oldValue: bill.status,
            newValue: action,
            reason: `${bill.companyName} · Net ${formatINR(bill.netPayablePaise)}`,
          }),
        };
      });
      get().pushToast({ type: 'success', title: `RA Bill ${action}`, message: bill.billNumber });
      return { ok: true };
    },

    submitReimbursement: (payload) => {
      set((s) => {
        const emp = s.employees.find((e) => e.id === payload.employeeId)!;
        const user = s.users.find((u) => u.id === s.currentUserId)!;
        const duplicateFlag = s.reimbursements.some(
          (r) =>
            r.employeeId === payload.employeeId &&
            r.expenseDate === payload.expenseDate &&
            r.amountPaise === payload.amountPaise
        );

        const claim: EmployeeReimbursement = {
          id: `reimb_${Date.now()}`,
          companyId: s.company.id,
          claimNumber: `RMB-2026-${420 + s.reimbursements.length}`,
          employeeId: emp.id,
          employeeName: emp.name,
          category: payload.category,
          projectId: payload.projectId,
          siteId: payload.siteId,
          expenseDate: payload.expenseDate,
          amountPaise: payload.amountPaise,
          paymentMethod: payload.paymentMethod,
          businessPurpose: payload.businessPurpose,
          receiptFileName: payload.receiptFileName,
          remarks: payload.remarks,
          status: 'Submitted',
          duplicateFlag,
          createdByUserId: user.id,
          approvalHistory: [
            {
              stage: 'Submitted',
              actorName: user.name,
              actorRole: s.roleConfigs[user.roleId].roleName,
              decision: 'Submitted',
              timestamp: new Date().toISOString(),
              reason: duplicateFlag ? 'Potential duplicate claim flagged' : 'Submitted for verification',
            },
          ],
        };
        return {
          reimbursements: [claim, ...s.reimbursements],
          auditLogs: appendAudit(s, {
            recordReference: claim.claimNumber,
            module: 'Employee Reimbursements',
            action: 'Reimbursement Claim Submitted',
            oldValue: 'None',
            newValue: `${emp.name} · ${formatINR(payload.amountPaise)}${duplicateFlag ? ' (DUPLICATE FLAG)' : ''}`,
            reason: payload.businessPurpose,
          }),
        };
      });
      get().pushToast({ type: 'success', title: 'Claim Submitted', message: 'Reimbursement submitted for review.' });
    },

    updateReimbursementStatus: (id, nextStatus) => {
      set((s) => {
        const claim = s.reimbursements.find((r) => r.id === id);
        const user = s.users.find((u) => u.id === s.currentUserId)!;
        if (!claim) return s;
        return {
          reimbursements: s.reimbursements.map((r) =>
            r.id === id ? { ...r, status: nextStatus } : r
          ),
          auditLogs: appendAudit(s, {
            recordReference: claim.claimNumber,
            module: 'Employee Reimbursements',
            action: `Reimbursement ${nextStatus}`,
            oldValue: claim.status,
            newValue: nextStatus,
            reason: `${claim.employeeName} · ${formatINR(claim.amountPaise)}`,
          }),
        };
      });
      get().pushToast({ type: 'success', title: `Claim ${nextStatus}`, message: 'Reimbursement updated.' });
    },

    createSiteExpense: (payload) => {
      set((s) => {
        const user = s.users.find((u) => u.id === s.currentUserId)!;
        const exp: SiteExpense = {
          id: `sexp_${Date.now()}`,
          companyId: s.company.id,
          expenseCode: `SEXP-2026-${805 + s.siteExpenses.length}`,
          ...payload,
          approvalStatus: 'Pending Approval',
          paymentStatus: 'Unpaid',
          createdByUserId: user.id,
        };
        return {
          siteExpenses: [exp, ...s.siteExpenses],
          auditLogs: appendAudit(s, {
            recordReference: exp.expenseCode,
            module: 'Site Expenses',
            action: 'Site Expense Logged (Pending Approval)',
            oldValue: 'None',
            newValue: `${payload.category} · ${formatINR(payload.amountPaise)}`,
            reason: payload.description,
          }),
        };
      });
      get().pushToast({ type: 'success', title: 'Site Expense Logged', message: 'Pending finance approval before inclusion in confirmed spend.' });
    },

    approveAndPaySiteExpense: (id, mode) => {
      set((s) => {
        const exp = s.siteExpenses.find((e) => e.id === id);
        if (!exp) return s;
        return {
          siteExpenses: s.siteExpenses.map((e) => {
            if (e.id !== id) return e;
            if (mode === 'Approve') return { ...e, approvalStatus: 'Approved' };
            if (mode === 'Pay') return { ...e, approvalStatus: 'Approved', paymentStatus: 'Paid' };
            return { ...e, approvalStatus: 'Rejected' };
          }),
          auditLogs: appendAudit(s, {
            recordReference: exp.expenseCode,
            module: 'Site Expenses',
            action: `Site Expense ${mode}`,
            oldValue: `${exp.approvalStatus}/${exp.paymentStatus}`,
            newValue: mode,
            reason: exp.description,
          }),
        };
      });
      get().pushToast({ type: 'success', title: `Site Expense ${mode}`, message: 'Updated expense status.' });
    },

    updateProjectBudgetThresholds: (budgetId, warningPct, criticalPct) => {
      set((s) => {
        const b = s.projectBudgets.find((pb) => pb.id === budgetId);
        if (!b) return s;
        return {
          projectBudgets: s.projectBudgets.map((pb) =>
            pb.id === budgetId
              ? { ...pb, alertThresholdWarningPct: warningPct, alertThresholdCriticalPct: criticalPct }
              : pb
          ),
          auditLogs: appendAudit(s, {
            recordReference: b.projectId,
            module: 'Project Budgets',
            action: 'Budget Alert Thresholds Updated',
            oldValue: `${b.alertThresholdWarningPct}% / ${b.alertThresholdCriticalPct}%`,
            newValue: `${warningPct}% / ${criticalPct}%`,
            reason: `Updated alert configuration for ${b.projectName}`,
          }),
        };
      });
      get().pushToast({ type: 'success', title: 'Thresholds Saved', message: 'Project budget alerts recalculated.' });
    },

    importBankStatementCSV: (sessionId, csvText) => {
      const s = get();
      const lines = csvText
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.toLowerCase().startsWith('date,'));

      const parsedRecords = lines.map((line, idx) => {
        const [dateStr = '2026-11-16', bankRef = `REF-${idx}`, desc = 'Bank Entry', dir = 'Debit', amtStr = '0'] = line.split(',').map((c) => c.trim());
        const amtPaise = toPaise(Number(amtStr.replace(/[^\d.-]/g, '')) || 0);
        const direction: 'Debit' | 'Credit' = dir.toLowerCase().includes('cr') ? 'Credit' : 'Debit';

        const matchedTx = s.transactions.find(
          (t) =>
            (t.utrNumber && t.utrNumber === bankRef) ||
            (t.direction === direction && Math.abs(t.amountPaise - amtPaise) === 0)
        );
        const amountMismatchTx = !matchedTx
          ? s.transactions.find((t) => t.direction === direction && t.utrNumber === bankRef)
          : undefined;

        return {
          id: `bs_imp_${Date.now()}_${idx}`,
          statementDate: dateStr,
          bankRef,
          description: desc,
          direction,
          amountPaise: amtPaise,
          matchedTransactionId: matchedTx?.id || amountMismatchTx?.id,
          matchStatus: matchedTx
            ? ('Matched' as const)
            : amountMismatchTx
            ? ('Amount Discrepancy' as const)
            : ('Unmatched' as const),
          discrepancyNote: matchedTx
            ? undefined
            : amountMismatchTx
            ? 'UTR matched with amount variance'
            : 'No matching internal transaction found',
          resolved: Boolean(matchedTx),
        };
      });

      set((prev) => ({
        reconciliations: prev.reconciliations.map((rec) =>
          rec.id === sessionId
            ? { ...rec, records: [...parsedRecords, ...rec.records] }
            : rec
        ),
        auditLogs: appendAudit(prev, {
          recordReference: sessionId,
          module: 'Bank Reconciliation',
          action: 'Bank Statement Records Imported',
          oldValue: 'Previous batch',
          newValue: `${parsedRecords.length} statement lines parsed`,
          reason: 'Statement upload & automated UTR matching',
        }),
      }));

      get().pushToast({
        type: 'success',
        title: 'Statement Imported',
        message: `Parsed ${parsedRecords.length} bank lines and matched against internal ledger.`,
      });
      return parsedRecords.length;
    },

    resolveReconciliationRecord: (sessionId, recordId, resolutionNote) => {
      set((s) => ({
        reconciliations: s.reconciliations.map((rec) =>
          rec.id === sessionId
            ? {
                ...rec,
                records: rec.records.map((r) =>
                  r.id === recordId
                    ? { ...r, resolved: true, matchStatus: 'Matched', discrepancyNote: resolutionNote }
                    : r
                ),
              }
            : rec
        ),
        auditLogs: appendAudit(s, {
          recordReference: recordId,
          module: 'Bank Reconciliation',
          action: 'Reconciliation Discrepancy Resolved',
          oldValue: 'Unmatched / Discrepancy',
          newValue: 'Matched & Resolved',
          reason: resolutionNote,
        }),
      }));
      get().pushToast({ type: 'success', title: 'Entry Reconciled', message: resolutionNote });
    },

    lockReconciliationSession: (sessionId) => {
      set((s) => ({
        reconciliations: s.reconciliations.map((rec) =>
          rec.id === sessionId ? { ...rec, status: 'Locked' } : rec
        ),
        auditLogs: appendAudit(s, {
          recordReference: sessionId,
          module: 'Bank Reconciliation',
          action: 'Reconciliation Period Locked',
          oldValue: 'In Progress',
          newValue: 'Locked',
          reason: 'All discrepancies resolved and period finalized',
        }),
      }));
      get().pushToast({ type: 'success', title: 'Reconciliation Locked', message: 'Period statement finalized.' });
    },

    updateComplianceRates: (patch) => {
      set((s) => ({
        complianceRates: { ...s.complianceRates, ...patch },
        auditLogs: appendAudit(s, {
          recordReference: s.complianceRates.id,
          module: 'Tax & Compliance',
          action: 'Statutory Configuration Version Updated',
          oldValue: s.complianceRates.versionTag,
          newValue: patch.versionTag || s.complianceRates.versionTag,
          reason: 'Updated versioned compliance parameters',
        }),
      }));
      get().pushToast({ type: 'success', title: 'Compliance Rates Updated', message: 'New version applied to future payroll calculations.' });
    },

    updateComplianceFilingStatus: (id, filingStatus, paymentStatus) => {
      set((s) => {
        const rec = s.complianceRecords.find((c) => c.id === id);
        if (!rec) return s;
        return {
          complianceRecords: s.complianceRecords.map((c) =>
            c.id === id ? { ...c, filingStatus, paymentStatus } : c
          ),
          auditLogs: appendAudit(s, {
            recordReference: rec.category,
            module: 'Statutory Compliance',
            action: 'Compliance Filing & Payment Updated',
            oldValue: `${rec.filingStatus} / ${rec.paymentStatus}`,
            newValue: `${filingStatus} / ${paymentStatus}`,
            reason: `Updated statutory status for ${rec.period}`,
          }),
        };
      });
      get().pushToast({ type: 'success', title: 'Compliance Updated', message: `${filingStatus} · ${paymentStatus}` });
    },

    processApprovalItem: (approvalId, decision, reason) => {
      const s = get();
      const item = s.approvals.find((a) => a.id === approvalId);
      const user = s.users.find((u) => u.id === s.currentUserId)!;
      const role = s.roleConfigs[user.roleId];
      if (!item) return { ok: false, error: 'Approval item not found.' };

      const actionKind =
        item.category === 'Payroll Run'
          ? 'approve_payroll'
          : item.category === 'Salary Payment Batch'
          ? 'release_payment'
          : 'approve_invoice';

      if (decision === 'Approved') {
        const check = checkMakerChecker(user, role, item.createdByUserId, actionKind, item.amountPaise, s.makerCheckerEnabled);
        if (!check.allowed) {
          get().pushToast({ type: 'error', title: 'Approval Blocked', message: check.reason || 'Unauthorized' });
          return { ok: false, error: check.reason };
        }
      }

      // Sync source record if applicable
      if (decision === 'Approved' && item.category === 'Payroll Run') {
        const res = get().approveAndLockPayrollRun(item.sourceRecordId);
        if (!res.ok) return res;
      }

      set((prev) => ({
        approvals: prev.approvals.map((a) =>
          a.id === approvalId
            ? {
                ...a,
                status: decision,
                history: [
                  ...a.history,
                  {
                    stage: a.currentStage,
                    actorName: user.name,
                    actorRole: role.roleName,
                    decision,
                    timestamp: new Date().toISOString(),
                    reason,
                  },
                ],
              }
            : a
        ),
        supplierInvoices:
          item.category === 'Supplier Invoice' && (decision === 'Approved' || decision === 'Rejected')
            ? prev.supplierInvoices.map((i) =>
                i.id === item.sourceRecordId ? { ...i, status: decision } : i
              )
            : prev.supplierInvoices,
        contractorInvoices:
          item.category === 'Contractor Invoice' && (decision === 'Approved' || decision === 'Rejected')
            ? prev.contractorInvoices.map((c) =>
                c.id === item.sourceRecordId ? { ...c, status: decision } : c
              )
            : prev.contractorInvoices,
        reimbursements:
          item.category === 'Employee Reimbursement' && (decision === 'Approved' || decision === 'Rejected')
            ? prev.reimbursements.map((r) =>
                r.id === item.sourceRecordId ? { ...r, status: decision } : r
              )
            : prev.reimbursements,
        siteExpenses:
          item.category === 'Site Expense' && (decision === 'Approved' || decision === 'Rejected')
            ? prev.siteExpenses.map((se) =>
                se.id === item.sourceRecordId ? { ...se, approvalStatus: decision } : se
              )
            : prev.siteExpenses,
        advances:
          item.category === 'Advance Disbursement' && (decision === 'Approved' || decision === 'Rejected')
            ? prev.advances.map((adv) =>
                adv.id === item.sourceRecordId
                  ? { ...adv, status: decision, approvedAmountPaise: decision === 'Approved' ? adv.requestedAmountPaise : 0 }
                  : adv
              )
            : prev.advances,
        auditLogs: appendAudit(prev, {
          recordReference: item.requestCode,
          module: 'Approval Centre',
          action: `${item.category} ${decision}`,
          oldValue: item.status,
          newValue: decision,
          reason,
          approvalReference: item.requestCode,
        }),
      }));

      get().pushToast({
        type: decision === 'Rejected' ? 'warning' : 'success',
        title: `${item.requestCode}: ${decision}`,
        message: reason,
      });
      return { ok: true };
    },

    addWorkflowRule: (rule) => {
      set((s) => ({
        workflowRules: [
          ...s.workflowRules,
          { ...rule, id: `wf_${Date.now()}`, companyId: s.company.id },
        ],
        auditLogs: appendAudit(s, {
          recordReference: rule.ruleName,
          module: 'Approval Workflows',
          action: 'Approval Workflow Rule Added',
          oldValue: 'None',
          newValue: `${rule.category} · ${rule.stages.join(' → ')}`,
          reason: 'Configured multi-stage approval threshold',
        }),
      }));
      get().pushToast({ type: 'success', title: 'Workflow Rule Added', message: rule.ruleName });
    },
  };
});

export function useCurrentUser() {
  const users = useFinanceStore((s) => s.users);
  const currentUserId = useFinanceStore((s) => s.currentUserId);
  const roleConfigs = useFinanceStore((s) => s.roleConfigs);
  const user = users.find((u) => u.id === currentUserId) || users[0];
  const role = roleConfigs[user.roleId];
  return { user, role };
}
