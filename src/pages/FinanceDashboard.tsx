import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  AreaChart,
  Area,
} from 'recharts';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  FileWarning,
  Landmark,
  ShieldAlert,
} from 'lucide-react';
import { useCurrentUser, useFinanceStore } from '../store/useFinanceStore';
import {
  Button,
  KpiStatCard,
  PageHeader,
  StatusTag,
  SurfaceCard,
} from '../components/ui/primitives';
import { formatINR, formatINRCompact } from '../utils/currency';

export default function FinanceDashboard() {
  const navigate = useNavigate();
  const { role } = useCurrentUser();

  const company = useFinanceStore((s) => s.company);
  const filters = useFinanceStore((s) => s.filters);
  const setFilters = useFinanceStore((s) => s.setFilters);
  const branches = useFinanceStore((s) => s.branches);
  const projects = useFinanceStore((s) => s.projects);
  const sites = useFinanceStore((s) => s.sites);
  const projectBudgets = useFinanceStore((s) => s.projectBudgets);
  const payrollRuns = useFinanceStore((s) => s.payrollRuns);
  const supplierInvoices = useFinanceStore((s) => s.supplierInvoices);
  const contractorInvoices = useFinanceStore((s) => s.contractorInvoices);
  const reimbursements = useFinanceStore((s) => s.reimbursements);
  const approvals = useFinanceStore((s) => s.approvals);
  const transactions = useFinanceStore((s) => s.transactions);
  const salaryBatches = useFinanceStore((s) => s.salaryBatches);
  const reconciliations = useFinanceStore((s) => s.reconciliations);
  const complianceRecords = useFinanceStore((s) => s.complianceRecords);
  const cashFlowEntries = useFinanceStore((s) => s.cashFlowEntries);

  const [customRangeOpen, setCustomRangeOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState('2026-11-01');
  const [dateTo, setDateTo] = useState('2026-11-30');

  const scopedProjects = useMemo(() => {
    return projects.filter(
      (p) =>
        (filters.branchId === 'ALL' || p.branchId === filters.branchId) &&
        (filters.projectId === 'ALL' || p.id === filters.projectId)
    );
  }, [projects, filters.branchId, filters.projectId]);

  const scopedProjectIds = new Set(scopedProjects.map((p) => p.id));

  const scopedBudgets = projectBudgets.filter((b) => scopedProjectIds.has(b.projectId));
  const totalBudgetPaise = scopedBudgets.reduce((a, b) => a + b.approvedBudgetPaise, 0);
  const totalExpensesPaise = scopedBudgets.reduce((a, b) => a + b.approvedExpensesPaise, 0);
  const availableBudgetPaise = totalBudgetPaise - totalExpensesPaise;

  const latestNovRun = payrollRuns.find((r) => r.periodLabel === 'November 2026') || payrollRuns[0];
  const payrollPayablePaise = latestNovRun ? latestNovRun.totalNetPayablePaise : 0;

  const unpaidSupplierInvoices = supplierInvoices.filter(
    (inv) => scopedProjectIds.has(inv.projectId) && inv.status !== 'Paid' && inv.status !== 'Rejected'
  );
  const supplierPayablesPaise = unpaidSupplierInvoices.reduce(
    (a, b) => a + (b.totalAmountPaise - b.paidAmountPaise),
    0
  );

  const unpaidContractorBills = contractorInvoices.filter(
    (c) => scopedProjectIds.has(c.projectId) && c.status !== 'Paid' && c.status !== 'Rejected'
  );
  const contractorPayablesPaise = unpaidContractorBills.reduce((a, b) => a + b.netPayablePaise, 0);

  const pendingReimbPaise = reimbursements
    .filter((r) => scopedProjectIds.has(r.projectId) && r.status !== 'Paid' && r.status !== 'Rejected')
    .reduce((a, b) => a + b.amountPaise, 0);

  const pendingApprovalsList = approvals.filter(
    (a) => a.status === 'Pending' && (!a.projectId || scopedProjectIds.has(a.projectId))
  );
  const paymentsPendingApprovalPaise = pendingApprovalsList.reduce((a, b) => a + b.amountPaise, 0);

  const totalPaymentsMadePaise = transactions
    .filter((t) => t.direction === 'Debit' && t.status === 'Confirmed')
    .reduce((a, b) => a + b.amountPaise, 0);

  const outstandingInvoicesCount = unpaidSupplierInvoices.length + unpaidContractorBills.length;

  // Chart 1: Monthly Cash Inflow vs Outflow + Material vs Payroll Trend
  const monthlyTrendData = useMemo(() => {
    const months = ['Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026', 'Nov 2026'];
    return months.map((m) => {
      const entries = cashFlowEntries.filter((e) => e.monthLabel === m);
      const inflow = Math.round(
        entries.filter((e) => e.type === 'Inflow').reduce((a, b) => a + b.amountPaise, 0) / 100000
      );
      const outflow = Math.round(
        entries.filter((e) => e.type === 'Outflow').reduce((a, b) => a + b.amountPaise, 0) / 100000
      );
      const payroll = Math.round(outflow * 0.44);
      const materials = Math.round(outflow * 0.56);
      return { month: m.slice(0, 3), inflowL: inflow, outflowL: outflow, payrollL: payroll, materialsL: materials };
    });
  }, [cashFlowEntries]);

  // Chart 2: Project Budget vs Actual Spending
  const budgetVsActualData = scopedBudgets.map((b) => ({
    name: b.projectName.split(' ').slice(0, 2).join(' '),
    BudgetL: Math.round(b.approvedBudgetPaise / 100000),
    ActualL: Math.round(b.approvedExpensesPaise / 100000),
    CommittedL: Math.round(b.committedPaise / 100000),
  }));

  // Expense Distribution Breakdown
  const expenseCategories = [
    { label: 'Material Purchases', amountPaise: 1129000000 },
    { label: 'Labour Wages', amountPaise: 465000000 },
    { label: 'Contractor Invoices', amountPaise: 494000000 },
    { label: 'Employee Salaries', amountPaise: 325000000 },
    { label: 'Equipment Rentals & Maintenance', amountPaise: 172000000 },
    { label: 'Site Operations & Utilities', amountPaise: 96000000 },
    { label: 'Transportation', amountPaise: 54000000 },
    { label: 'Overtime & Incentives', amountPaise: 31000000 },
    { label: 'Employee Reimbursements', amountPaise: 19500000 },
    { label: 'Other Expenses', amountPaise: 14500000 },
  ];
  const distTotal = expenseCategories.reduce((a, b) => a + b.amountPaise, 0);

  // Action Centre Alerts
  const failedSalaryTxs = salaryBatches.flatMap((b) =>
    b.transactions.filter((t) => t.transferStatus === 'Failed')
  );
  const reconMismatches = reconciliations.flatMap((r) =>
    r.records.filter((rec) => !rec.resolved)
  );
  const overdueCompliance = complianceRecords.filter(
    (c) => c.filingStatus === 'Overdue' || c.filingStatus === 'Pending Preparation'
  );
  const flaggedSupplierInvoices = supplierInvoices.filter(
    (i) => i.status === 'Verification Required' || i.status === 'Under Review'
  );

  const actionItems = [
    ...(latestNovRun && latestNovRun.unresolvedExceptionsCount > 0
      ? [
          {
            id: 'act_pr_exc',
            title: `Payroll ${latestNovRun.id} has ${latestNovRun.unresolvedExceptionsCount} unresolved exception(s)`,
            meta: `${latestNovRun.periodLabel} · Resolve missing bank or unverified attendance`,
            tone: 'warning' as const,
            path: '/payroll-processing',
            actionLabel: 'Resolve Now',
          },
        ]
      : []),
    ...(flaggedSupplierInvoices.length > 0
      ? [
          {
            id: 'act_sinv',
            title: `${flaggedSupplierInvoices.length} supplier invoice(s) awaiting 3-way verification`,
            meta: `${flaggedSupplierInvoices[0].invoiceNumber} · ${flaggedSupplierInvoices[0].matchResult.flags[0] || 'Review needed'}`,
            tone: 'danger' as const,
            path: '/supplier-invoices',
            actionLabel: 'Inspect Match',
          },
        ]
      : []),
    ...(pendingApprovalsList.length > 0
      ? [
          {
            id: 'act_apr',
            title: `${pendingApprovalsList.length} financial items awaiting approval (${formatINRCompact(paymentsPendingApprovalPaise)})`,
            meta: 'Supplier invoices, Contractor RA bills, Reimbursements & Advances',
            tone: 'info' as const,
            path: '/payment-approvals',
            actionLabel: 'Open Queue',
          },
        ]
      : []),
    ...(failedSalaryTxs.length > 0
      ? [
          {
            id: 'act_sal_fail',
            title: `${failedSalaryTxs.length} salary bank transfer failed (${failedSalaryTxs[0].personName})`,
            meta: failedSalaryTxs[0].failureReason || 'Bank NACH return requires retry',
            tone: 'danger' as const,
            path: '/salary-payments',
            actionLabel: 'Retry Payout',
          },
        ]
      : []),
    ...(reconMismatches.length > 0
      ? [
          {
            id: 'act_recon',
            title: `${reconMismatches.length} bank reconciliation mismatch(es) in HDFC Escrow`,
            meta: 'Unmatched bank charges & fuel surcharge variance',
            tone: 'warning' as const,
            path: '/bank-reconciliation',
            actionLabel: 'Reconcile',
          },
        ]
      : []),
    ...(overdueCompliance.length > 0
      ? [
          {
            id: 'act_comp',
            title: `${overdueCompliance.length} statutory compliance deadline(s) pending/overdue`,
            meta: `${overdueCompliance[0].category} · Due ${overdueCompliance[0].dueDate}`,
            tone: 'danger' as const,
            path: '/statutory-compliance',
            actionLabel: 'View Compliance',
          },
        ]
      : []),
  ];

  const scopedSites =
    filters.projectId === 'ALL'
      ? sites
      : sites.filter((s) => s.projectId === filters.projectId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Good morning, Finance Team."
        subtitle={`${company.name} · Financial Year ${filters.financialYear} · Period: ${filters.periodLabel} · Sample demonstration dataset`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCustomRangeOpen((v) => !v)}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{customRangeOpen ? 'Hide Date Range' : 'Custom Date Range'}</span>
            </Button>
            {role.canRunPayroll && (
              <Button size="sm" onClick={() => navigate('/payroll-processing')}>
                <span>Run Payroll</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        }
      />

      {/* Inline Scope Filters + Optional Custom Date Range */}
      <SurfaceCard className="p-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <span className="block text-[11px] font-medium text-[#64748B] mb-1">Company Branch</span>
            <select
              value={filters.branchId}
              onChange={(e) => setFilters({ branchId: e.target.value, projectId: 'ALL', siteId: 'ALL' })}
              className="w-full h-9 px-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-[#172B4D]"
            >
              <option value="ALL">All Branches ({branches.length})</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name} — {b.city}</option>
              ))}
            </select>
          </div>
          <div>
            <span className="block text-[11px] font-medium text-[#64748B] mb-1">Project</span>
            <select
              value={filters.projectId}
              onChange={(e) => setFilters({ projectId: e.target.value, siteId: 'ALL' })}
              className="w-full h-9 px-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-[#172B4D]"
            >
              <option value="ALL">All Projects ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.code} · {p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <span className="block text-[11px] font-medium text-[#64748B] mb-1">Site</span>
            <select
              value={filters.siteId}
              onChange={(e) => setFilters({ siteId: e.target.value })}
              className="w-full h-9 px-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-[#172B4D]"
            >
              <option value="ALL">All Sites ({scopedSites.length})</option>
              {scopedSites.map((s) => (
                <option key={s.id} value={s.id}>{s.code} · {s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <span className="block text-[11px] font-medium text-[#64748B] mb-1">Financial Year & Period</span>
            <select
              value={filters.periodLabel}
              onChange={(e) => setFilters({ periodLabel: e.target.value })}
              className="w-full h-9 px-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-[#172B4D]"
            >
              <option value="November 2026">FY 2026–27 · November 2026</option>
              <option value="October 2026">FY 2026–27 · October 2026</option>
              <option value="December 2026">FY 2026–27 · December 2026</option>
            </select>
          </div>
        </div>

        {customRangeOpen && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-end gap-3">
            <div>
              <span className="block text-[11px] font-medium text-[#64748B] mb-1">From Date</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9 px-2.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <span className="block text-[11px] font-medium text-[#64748B] mb-1">To Date</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9 px-2.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <span className="text-xs text-[#64748B] pb-2">
              Active custom window: <strong className="text-[#172B4D]">{dateFrom}</strong> to{' '}
              <strong className="text-[#172B4D]">{dateTo}</strong>
            </span>
          </div>
        )}
      </SurfaceCard>

      {/* 10 Financial KPI Cards */}
      <section aria-label="Financial KPIs" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <KpiStatCard
          label="Total Project Budget"
          value={formatINRCompact(totalBudgetPaise)}
          subtext={`${scopedProjects.length} active construction projects`}
          onClick={() => navigate('/project-budgets')}
        />
        <KpiStatCard
          label="Total Project Expenses"
          value={formatINRCompact(totalExpensesPaise)}
          subtext={`${totalBudgetPaise ? ((totalExpensesPaise / totalBudgetPaise) * 100).toFixed(1) : 0}% of approved budget`}
          tone="info"
          onClick={() => navigate('/financial-overview')}
        />
        <KpiStatCard
          label="Available Budget"
          value={formatINRCompact(availableBudgetPaise)}
          subtext="Remaining authorized headroom"
          tone="success"
          onClick={() => navigate('/project-budgets')}
        />
        <KpiStatCard
          label="Payroll Payable"
          value={role.canViewConfidentialSalaries ? formatINRCompact(payrollPayablePaise) : 'Restricted'}
          subtext={role.canViewConfidentialSalaries ? `${latestNovRun?.totalHeadcount || 0} staff & labour` : 'Requires payroll access'}
          tone="purple"
          onClick={() => navigate('/payroll-overview')}
        />
        <KpiStatCard
          label="Supplier Payables"
          value={formatINRCompact(supplierPayablesPaise)}
          subtext={`${unpaidSupplierInvoices.length} open vendor bills`}
          tone="warning"
          onClick={() => navigate('/supplier-invoices')}
        />
        <KpiStatCard
          label="Contractor Payables"
          value={formatINRCompact(contractorPayablesPaise)}
          subtext={`${unpaidContractorBills.length} certified RA bills`}
          onClick={() => navigate('/contractor-payments')}
        />
        <KpiStatCard
          label="Pending Reimbursements"
          value={formatINRCompact(pendingReimbPaise)}
          subtext={`${reimbursements.filter((r) => r.status !== 'Paid').length} employee claims`}
          onClick={() => navigate('/reimbursements')}
        />
        <KpiStatCard
          label="Payments Pending Approval"
          value={formatINRCompact(paymentsPendingApprovalPaise)}
          subtext={`${pendingApprovalsList.length} requests in queue`}
          tone="warning"
          onClick={() => navigate('/payment-approvals')}
        />
        <KpiStatCard
          label="Total Payments Made"
          value={formatINRCompact(totalPaymentsMadePaise)}
          subtext="Bank-confirmed UTR settlements"
          tone="success"
          onClick={() => navigate('/transactions')}
        />
        <KpiStatCard
          label="Outstanding Invoices"
          value={String(outstandingInvoicesCount)}
          subtext="Supplier + Contractor open items"
          tone="danger"
          onClick={() => navigate('/supplier-invoices')}
        />
      </section>

      {/* Primary Charts Row: Cash Inflow/Outflow & Project Budget vs Actual */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SurfaceCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#172B4D]">Cash Inflow vs Outflow (₹ Lakhs)</h2>
              <p className="text-xs text-[#64748B]">Monthly receipts vs operational disbursements (Jun–Nov 2026)</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/cash-flow')}>
              Details
            </Button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
                  formatter={(v) => [`₹${v ?? 0} L`, '']}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="inflowL" name="Inflows (₹L)" stroke="#16A34A" fill="#16A34A" fillOpacity={0.12} strokeWidth={2} />
                <Area type="monotone" dataKey="outflowL" name="Outflows (₹L)" stroke="#2563EB" fill="#2563EB" fillOpacity={0.12} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#172B4D]">Project Budget vs Actual Spending (₹ Lakhs)</h2>
              <p className="text-xs text-[#64748B]">Approved budget, committed POs, and actual certified spend</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/project-budgets')}>
              Budgets
            </Button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetVsActualData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
                  formatter={(v) => [`₹${v ?? 0} L`, '']}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="BudgetL" name="Approved Budget" fill="#101F35" radius={[4, 4, 0, 0]} />
                <Bar dataKey="CommittedL" name="Committed" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ActualL" name="Actual Spend" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SurfaceCard>
      </div>

      {/* Bottom Row: Finance Action Centre + Expense Distribution + Payroll vs Material */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Finance Action Centre */}
        <SurfaceCard className="lg:col-span-5 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-[#172B4D]">Finance Action Centre</h2>
              <p className="text-xs text-[#64748B]">Items requiring verification, approval, or reconciliation</p>
            </div>
            <span className="text-xs font-mono-num font-semibold text-[#2563EB]">
              {actionItems.length} open
            </span>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {actionItems.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#64748B]">
                <CheckCircle2 className="w-6 h-6 text-[#16A34A] mx-auto mb-2" />
                All pending finance & payroll exceptions are clear.
              </div>
            ) : (
              actionItems.map((item) => (
                <div key={item.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {item.tone === 'danger' ? (
                        <ShieldAlert className="w-4 h-4 text-[#DC2626] shrink-0" />
                      ) : item.tone === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
                      ) : (
                        <FileWarning className="w-4 h-4 text-[#2563EB] shrink-0" />
                      )}
                      <span className="text-xs font-semibold text-[#172B4D] leading-snug">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-0.5 pl-6">{item.meta}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(item.path)}
                    className="h-8 px-2.5 text-[11px] shrink-0"
                  >
                    {item.actionLabel}
                  </Button>
                </div>
              ))
            )}
          </div>
        </SurfaceCard>

        {/* Expense Distribution */}
        <SurfaceCard className="lg:col-span-4 p-5">
          <h2 className="text-sm font-bold text-[#172B4D]">Expense Distribution (YTD)</h2>
          <p className="text-xs text-[#64748B] mb-4">Cumulative certified project & workforce spend</p>
          <div className="space-y-2.5">
            {expenseCategories.map((cat) => {
              const pct = ((cat.amountPaise / distTotal) * 100).toFixed(1);
              return (
                <div key={cat.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#172B4D] font-medium truncate pr-2">{cat.label}</span>
                    <span className="font-mono-num tabular-nums text-[#172B4D] font-semibold shrink-0">
                      {formatINRCompact(cat.amountPaise)}{' '}
                      <span className="text-[#64748B] font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2563EB] rounded-full"
                      style={{ width: `${Math.max(2, Number(pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </SurfaceCard>

        {/* Payroll vs Material Costs + Quick Statutory Summary */}
        <SurfaceCard className="lg:col-span-3 p-5 flex flex-col justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-[#172B4D]">Payroll vs Material Cost (₹L)</h2>
            <p className="text-xs text-[#64748B] mb-3">6-month direct cost ratio</p>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrendData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 11 }} />
                  <Bar dataKey="payrollL" name="Payroll (₹L)" stackId="a" fill="#7C3AED" />
                  <Bar dataKey="materialsL" name="Materials/AP (₹L)" stackId="a" fill="#2563EB" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#64748B] flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5" />
                <span>Primary Escrow</span>
              </span>
              <span className="font-mono-num font-semibold text-[#172B4D]">•••• 4821</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#64748B]">Nov Payroll Run</span>
              <StatusTag status={latestNovRun?.status || 'Draft'} />
            </div>
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
