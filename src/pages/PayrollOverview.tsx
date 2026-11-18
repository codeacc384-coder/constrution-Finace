import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Users } from 'lucide-react';
import { useCurrentUser, useFinanceStore } from '../store/useFinanceStore';
import {
  Button,
  KpiStatCard,
  PageHeader,
  StatusTag,
  SurfaceCard,
} from '../components/ui/primitives';
import { formatINR, formatINRCompact } from '../utils/currency';
import { calculateWorkerWage } from '../services/payrollEngine';

export default function PayrollOverview() {
  const navigate = useNavigate();
  const { role } = useCurrentUser();

  const employees = useFinanceStore((s) => s.employees);
  const workers = useFinanceStore((s) => s.workers);
  const payrollRuns = useFinanceStore((s) => s.payrollRuns);
  const overtimeRecords = useFinanceStore((s) => s.overtimeRecords);
  const advances = useFinanceStore((s) => s.advances);
  const branches = useFinanceStore((s) => s.branches);
  const projects = useFinanceStore((s) => s.projects);

  const [branchFilter, setBranchFilter] = useState('ALL');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [workerTypeFilter, setWorkerTypeFilter] = useState('ALL');

  const latestRun = payrollRuns[0];

  const filteredEmployees = useMemo(
    () =>
      employees.filter(
        (e) =>
          (branchFilter === 'ALL' || e.branchId === branchFilter) &&
          (projectFilter === 'ALL' || e.projectId === projectFilter) &&
          (workerTypeFilter === 'ALL' || e.employmentType === workerTypeFilter)
      ),
    [employees, branchFilter, projectFilter, workerTypeFilter]
  );

  const filteredWorkers = useMemo(
    () =>
      workers.filter(
        (w) =>
          (branchFilter === 'ALL' || w.branchId === branchFilter) &&
          (projectFilter === 'ALL' || w.assignedProjectId === projectFilter) &&
          (workerTypeFilter === 'ALL' || w.employmentType === workerTypeFilter)
      ),
    [workers, branchFilter, projectFilter, workerTypeFilter]
  );

  const totalLabourPayablePaise = filteredWorkers.reduce(
    (acc, w) => acc + calculateWorkerWage(w).grossWagePaise,
    0
  );

  const approvedOvertimePaise = overtimeRecords
    .filter((o) => o.approvalStatus === 'Approved')
    .reduce((a, b) => a + b.calculatedAmountPaise, 0);

  const advancesOutstandingPaise = advances.reduce(
    (a, b) => a + b.outstandingAmountPaise,
    0
  );

  const onHoldCount =
    employees.filter((e) => e.status === 'On Hold').length +
    workers.filter((w) => !w.attendanceVerified).length;

  const categories = [
    {
      name: 'Monthly Salaried Employees',
      count: employees.filter((e) => e.employmentType === 'Monthly Salaried').length,
      rule: 'Prorated Basic + HRA + Allowances − EPF/ESI/PT/TDS − Approved Advances',
      route: '/employee-payroll',
    },
    {
      name: 'Daily Wage Workers',
      count: workers.filter((w) => w.wageType === 'Daily').length,
      rule: '(Approved Days + 0.5 × Half Days) × Agreed Daily Rate + Approved OT',
      route: '/labour-wages',
    },
    {
      name: 'Hourly Wage Operators',
      count: workers.filter((w) => w.wageType === 'Hourly').length,
      rule: 'Approved Payable Hours × Agreed Hourly Rate + Shift Overtime',
      route: '/labour-wages',
    },
    {
      name: 'Weekly Wage Crew',
      count: workers.filter((w) => w.wageType === 'Weekly').length,
      rule: '(Payable Days / 6) × Agreed Weekly Rate − Advance Recovery',
      route: '/labour-wages',
    },
    {
      name: 'Piece-Rate & Task-Based',
      count: workers.filter((w) => w.wageType === 'Piece-Rate' || w.wageType === 'Task-Based').length,
      rule: 'QC-Verified Output Quantity (sq.ft / cum) × Agreed Piece Rate',
      route: '/labour-wages',
    },
    {
      name: 'Contractual & Project-Based Staff',
      count: employees.filter((e) => e.employmentType === 'Contractual' || e.employmentType === 'Project-Based').length,
      rule: 'Fixed-term contract retainer + Site Allowance + Statutory Compliance',
      route: '/employee-payroll',
    },
  ];

  const maskedVal = (val: string) => (role.canViewConfidentialSalaries ? val : 'Confidential');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Overview"
        subtitle="Unified workforce compensation summary across salaried engineers, daily/hourly construction labour, and piece-rate gangs."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/labour-wages')}>
              Labour Wage Sheet
            </Button>
            {role.canRunPayroll && (
              <Button size="sm" onClick={() => navigate('/payroll-processing')}>
                <span>Open Payroll Wizard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        }
      />

      {!role.canViewConfidentialSalaries && (
        <SurfaceCard className="p-4 bg-amber-50/70 border-amber-200 flex items-center gap-3">
          <Lock className="w-4 h-4 text-[#D97706] shrink-0" />
          <p className="text-xs text-[#172B4D]">
            <strong>Salary Confidentiality Active:</strong> Your active role ({role.roleName}) restricts viewing individual salary totals. Switch to Payroll Manager, Finance Manager, or Finance Head to inspect full compensation amounts.
          </p>
        </SurfaceCard>
      )}

      {/* Filters */}
      <SurfaceCard className="p-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="h-9 px-3 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg"
          >
            <option value="ALL">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="h-9 px-3 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            value={workerTypeFilter}
            onChange={(e) => setWorkerTypeFilter(e.target.value)}
            className="h-9 px-3 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg"
          >
            <option value="ALL">All Workforce Categories</option>
            <option value="Monthly Salaried">Monthly Salaried</option>
            <option value="Contractual">Contractual</option>
            <option value="Project-Based">Project-Based</option>
            <option value="Daily Wage">Daily Wage</option>
            <option value="Hourly Worker">Hourly Worker</option>
            <option value="Weekly Wage">Weekly Wage</option>
            <option value="Piece-Rate Worker">Piece-Rate Worker</option>
            <option value="Temporary Labour">Temporary Labour</option>
          </select>
        </div>
      </SurfaceCard>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <KpiStatCard label="Salaried Employees" value={String(filteredEmployees.length)} subtext="Engineering, QS, Stores, Admin" />
        <KpiStatCard label="Labour Workforce" value={String(filteredWorkers.length)} subtext="Active muster-roll crew" />
        <KpiStatCard
          label="Monthly Payroll (Net)"
          value={maskedVal(formatINRCompact(latestRun?.totalNetPayablePaise || 0))}
          subtext={`${latestRun?.periodLabel || 'Nov 2026'} · ${latestRun?.status || 'Draft'}`}
          tone="info"
        />
        <KpiStatCard
          label="Labour Wage Payable"
          value={maskedVal(formatINRCompact(totalLabourPayablePaise))}
          subtext="Daily + Hourly + Piece-rate"
          tone="purple"
        />
        <KpiStatCard
          label="Approved Overtime"
          value={maskedVal(formatINR(approvedOvertimePaise))}
          subtext="Verified by Site Managers"
        />
        <KpiStatCard
          label="Advances Outstanding"
          value={formatINR(advancesOutstandingPaise)}
          subtext="Scheduled payroll recovery"
          tone="warning"
        />
        <KpiStatCard
          label="Total Deductions"
          value={maskedVal(formatINRCompact(latestRun?.totalDeductionsPaise || 0))}
          subtext="EPF, ESI, PT, TDS & Advances"
        />
        <KpiStatCard
          label="Payroll Processed Runs"
          value={String(payrollRuns.length)}
          subtext="Oct (Paid) · Nov (In Progress)"
          tone="success"
        />
        <KpiStatCard
          label="Pending Exceptions"
          value={String(latestRun?.unresolvedExceptionsCount || 0)}
          subtext="Require verification/resolution"
          tone={latestRun?.unresolvedExceptionsCount ? 'warning' : 'success'}
          onClick={() => navigate('/payroll-processing')}
        />
        <KpiStatCard
          label="Workers / Staff On Hold"
          value={String(onHoldCount)}
          subtext="Excluded until muster verified"
          tone={onHoldCount > 0 ? 'danger' : 'neutral'}
        />
      </div>

      {/* Workforce Payroll Categories & Calculation Rules */}
      <SurfaceCard className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#172B4D]">Workforce Payroll Categories & Calculation Rules</h2>
            <p className="text-xs text-[#64748B]">Each construction worker category uses dedicated attendance and rate formulas</p>
          </div>
          <Users className="w-4 h-4 text-[#64748B]" />
        </div>

        <div className="divide-y divide-slate-100">
          {categories.map((cat) => (
            <div key={cat.name} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/70">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[#172B4D]">{cat.name}</div>
                <div className="text-xs text-[#64748B] mt-0.5">{cat.rule}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-mono-num tabular-nums font-semibold text-[#172B4D]">
                  {cat.count} active
                </span>
                <Button variant="outline" size="sm" onClick={() => navigate(cat.route)}>
                  View Roster
                </Button>
              </div>
            </div>
          ))}
        </div>
      </SurfaceCard>

      {/* Recent Payroll Runs */}
      <SurfaceCard className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#172B4D]">Payroll Run Status Summary</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/payroll-processing')}>
            Manage Runs
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                <th className="py-2.5 px-4">Run ID</th>
                <th className="py-2.5 px-4">Period & Scope</th>
                <th className="py-2.5 px-4 text-right">Headcount</th>
                <th className="py-2.5 px-4 text-right">Gross</th>
                <th className="py-2.5 px-4 text-right">Net Payable</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {payrollRuns.map((run) => (
                <tr key={run.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono-num font-semibold text-[#2563EB]">{run.id}</td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-[#172B4D]">{run.periodLabel}</div>
                    <div className="text-[11px] text-[#64748B]">{run.scopeLabel}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono-num tabular-nums">{run.totalHeadcount}</td>
                  <td className="py-3 px-4 text-right font-mono-num tabular-nums">
                    {maskedVal(formatINR(run.totalGrossPaise))}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-num tabular-nums font-semibold">
                    {maskedVal(formatINR(run.totalNetPayablePaise))}
                  </td>
                  <td className="py-3 px-4">
                    <StatusTag status={run.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SurfaceCard>
    </div>
  );
}
