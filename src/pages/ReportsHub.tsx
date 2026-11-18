import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BarChart3, Download, Printer } from 'lucide-react';
import { useCurrentUser, useFinanceStore } from '../store/useFinanceStore';
import {
  Button,
  PageHeader,
  SegmentedTabs,
  StatusTag,
  SurfaceCard,
} from '../components/ui/primitives';
import { downloadCSV, formatINR } from '../utils/currency';

type ReportTab = 'payroll' | 'expense' | 'project-cost' | 'supplier' | 'statements';

export default function ReportsHub() {
  const { reportType } = useParams<{ reportType?: string }>();
  const { role } = useCurrentUser();

  const resolveTab = (rt?: string): ReportTab =>
    rt === 'expense' || rt === 'project-cost' || rt === 'supplier' || rt === 'statements'
      ? rt
      : 'payroll';

  const [tab, setTab] = useState<ReportTab>(resolveTab(reportType));

  useEffect(() => {
    setTab(resolveTab(reportType));
  }, [reportType]);
  const [projectFilter, setProjectFilter] = useState('ALL');

  const projects = useFinanceStore((s) => s.projects);
  const payrollRuns = useFinanceStore((s) => s.payrollRuns);
  const siteExpenses = useFinanceStore((s) => s.siteExpenses);
  const reimbursements = useFinanceStore((s) => s.reimbursements);
  const projectBudgets = useFinanceStore((s) => s.projectBudgets);
  const supplierInvoices = useFinanceStore((s) => s.supplierInvoices);
  const contractorInvoices = useFinanceStore((s) => s.contractorInvoices);
  const cashFlowEntries = useFinanceStore((s) => s.cashFlowEntries);

  const latestRun = payrollRuns[0];

  const handleExportCurrent = () => {
    if (tab === 'payroll' && latestRun) {
      downloadCSV(
        `payroll-register-${latestRun.id}.csv`,
        ['Code', 'Name', 'Type', 'Dept/Trade', 'Gross (INR)', 'Deductions (INR)', 'Net Payable (INR)'],
        latestRun.items.map((i) => [
          i.personCode,
          i.personName,
          i.personType,
          i.departmentOrTrade,
          (i.grossEarningsPaise / 100).toFixed(2),
          (i.totalDeductionsPaise / 100).toFixed(2),
          (i.netPayablePaise / 100).toFixed(2),
        ])
      );
    } else if (tab === 'supplier') {
      downloadCSV(
        'supplier-outstanding-report.csv',
        ['Invoice #', 'Supplier', 'GSTIN', 'Total (INR)', 'Paid (INR)', 'Status'],
        supplierInvoices.map((i) => [
          i.invoiceNumber,
          i.supplierName,
          i.gstin,
          (i.totalAmountPaise / 100).toFixed(2),
          (i.paidAmountPaise / 100).toFixed(2),
          i.status,
        ])
      );
    } else if (tab === 'project-cost') {
      downloadCSV(
        'project-budget-vs-actual.csv',
        ['Project', 'PM', 'Budget (INR)', 'Committed (INR)', 'Spent (INR)', 'Forecast (INR)'],
        projectBudgets.map((b) => [
          b.projectName,
          b.projectManager,
          (b.approvedBudgetPaise / 100).toFixed(2),
          (b.committedPaise / 100).toFixed(2),
          (b.approvedExpensesPaise / 100).toFixed(2),
          (b.forecastFinalCostPaise / 100).toFixed(2),
        ])
      );
    } else {
      downloadCSV(
        'financial-cash-flow-summary.csv',
        ['Date', 'Category', 'Description', 'Source', 'Type', 'Amount (INR)'],
        cashFlowEntries.map((c) => [
          c.date,
          c.category,
          c.description,
          c.sourceType,
          c.type,
          (c.amountPaise / 100).toFixed(2),
        ])
      );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Reports & Statements"
        subtitle="Dynamically computed payroll registers, AP aging, project budget vs actuals, and financial statements."
        actions={
          <div className="flex flex-wrap gap-2 no-print">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </Button>
            {role.canExportReports && (
              <Button size="sm" onClick={handleExportCurrent}>
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </Button>
            )}
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <SegmentedTabs<ReportTab>
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'payroll', label: 'Payroll Reports' },
            { id: 'expense', label: 'Expense Reports' },
            { id: 'project-cost', label: 'Project Cost Reports' },
            { id: 'supplier', label: 'Supplier & AP Reports' },
            { id: 'statements', label: 'Financial Statements' },
          ]}
        />

        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="h-9 px-3 text-xs font-medium bg-white border border-slate-200 rounded-lg"
        >
          <option value="ALL">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {tab === 'payroll' && latestRun && (
        <SurfaceCard className="overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-sm font-bold text-[#172B4D]">
                Monthly Payroll & Labour Wage Register ({latestRun.periodLabel})
              </h2>
            </div>
            <span className="text-xs font-mono-num font-bold">
              Net Total: {role.canViewConfidentialSalaries ? formatINR(latestRun.totalNetPayablePaise) : 'Restricted'}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  <th className="py-2.5 px-4">Code & Name</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4 text-right">Gross</th>
                  <th className="py-2.5 px-4 text-right">Deductions</th>
                  <th className="py-2.5 px-4 text-right">Net Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {latestRun.items
                  .filter((i) => projectFilter === 'ALL' || i.projectId === projectFilter)
                  .map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5 px-4 font-medium">{item.personCode} · {item.personName}</td>
                      <td className="py-2.5 px-4 text-[#64748B]">{item.personType} · {item.departmentOrTrade}</td>
                      <td className="py-2.5 px-4 text-right font-mono-num">{role.canViewConfidentialSalaries ? formatINR(item.grossEarningsPaise) : '••••'}</td>
                      <td className="py-2.5 px-4 text-right font-mono-num text-[#DC2626]">{role.canViewConfidentialSalaries ? formatINR(item.totalDeductionsPaise) : '••••'}</td>
                      <td className="py-2.5 px-4 text-right font-mono-num font-bold">{role.canViewConfidentialSalaries ? formatINR(item.netPayablePaise) : '••••'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </SurfaceCard>
      )}

      {tab === 'expense' && (
        <SurfaceCard className="p-5 space-y-4">
          <h2 className="text-sm font-bold text-[#172B4D]">Site Expenses & Reimbursements Summary</h2>
          <div className="divide-y divide-slate-100 text-xs">
            {siteExpenses
              .filter((e) => projectFilter === 'ALL' || e.projectId === projectFilter)
              .map((exp) => (
                <div key={exp.id} className="py-2.5 flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{exp.expenseCode} · {exp.category}</div>
                    <div className="text-[#64748B]">{exp.description} ({exp.date})</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusTag status={exp.approvalStatus} />
                    <span className="font-mono-num font-bold">{formatINR(exp.amountPaise)}</span>
                  </div>
                </div>
              ))}
            {reimbursements
              .filter((r) => projectFilter === 'ALL' || r.projectId === projectFilter)
              .map((r) => (
                <div key={r.id} className="py-2.5 flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{r.claimNumber} · {r.employeeName} ({r.category})</div>
                    <div className="text-[#64748B]">{r.businessPurpose}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusTag status={r.status} />
                    <span className="font-mono-num font-bold">{formatINR(r.amountPaise)}</span>
                  </div>
                </div>
              ))}
          </div>
        </SurfaceCard>
      )}

      {tab === 'project-cost' && (
        <SurfaceCard className="overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-bold text-[#172B4D]">Project Budget vs Actual Cost Report</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  <th className="py-2.5 px-4">Project</th>
                  <th className="py-2.5 px-4 text-right">Approved Budget</th>
                  <th className="py-2.5 px-4 text-right">Committed</th>
                  <th className="py-2.5 px-4 text-right">Actual Spent</th>
                  <th className="py-2.5 px-4 text-right">Variance (Budget - Forecast)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {projectBudgets
                  .filter((b) => projectFilter === 'ALL' || b.projectId === projectFilter)
                  .map((b) => {
                    const variance = b.approvedBudgetPaise - b.forecastFinalCostPaise;
                    return (
                      <tr key={b.id}>
                        <td className="py-2.5 px-4 font-semibold">{b.projectName}</td>
                        <td className="py-2.5 px-4 text-right font-mono-num">{formatINR(b.approvedBudgetPaise)}</td>
                        <td className="py-2.5 px-4 text-right font-mono-num">{formatINR(b.committedPaise)}</td>
                        <td className="py-2.5 px-4 text-right font-mono-num font-semibold">{formatINR(b.approvedExpensesPaise)}</td>
                        <td className={`py-2.5 px-4 text-right font-mono-num font-bold ${variance < 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                          {formatINR(variance)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </SurfaceCard>
      )}

      {tab === 'supplier' && (
        <SurfaceCard className="p-5 space-y-4">
          <h2 className="text-sm font-bold text-[#172B4D]">Supplier & Contractor Payables Aging Report</h2>
          <div className="divide-y divide-slate-100 text-xs">
            {supplierInvoices.map((inv) => (
              <div key={inv.id} className="py-2.5 flex justify-between items-center">
                <div>
                  <div className="font-semibold">{inv.supplierName} · {inv.invoiceNumber}</div>
                  <div className="text-[#64748B]">Due {inv.dueDate} · GSTIN {inv.gstin}</div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusTag status={inv.status} />
                  <span className="font-mono-num font-bold">{formatINR(inv.totalAmountPaise)}</span>
                </div>
              </div>
            ))}
            {contractorInvoices.map((bill) => (
              <div key={bill.id} className="py-2.5 flex justify-between items-center">
                <div>
                  <div className="font-semibold">{bill.companyName} · {bill.billNumber}</div>
                  <div className="text-[#64748B]">Due {bill.dueDate} · Contractor RA Bill</div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusTag status={bill.status} />
                  <span className="font-mono-num font-bold">{formatINR(bill.netPayablePaise)}</span>
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      )}

      {tab === 'statements' && (
        <SurfaceCard className="p-5 space-y-4 text-xs">
          <h2 className="text-sm font-bold text-[#172B4D]">Income & Expenditure Statement (FY 2026–2027)</h2>
          <div className="space-y-2 max-w-xl">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-[#64748B]">Realized Client RA Receipts</span>
              <span className="font-mono-num font-bold text-[#16A34A]">
                {formatINR(cashFlowEntries.filter((c) => c.type === 'Inflow' && c.sourceType === 'Connected Bank Feed').reduce((a, b) => a + b.amountPaise, 0))}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-[#64748B]">Certified Project Expenditure (All Projects)</span>
              <span className="font-mono-num font-bold text-[#172B4D]">
                {formatINR(projectBudgets.reduce((a, b) => a + b.approvedExpensesPaise, 0))}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-[#64748B]">Open Accounts Payable (Suppliers + Contractors)</span>
              <span className="font-mono-num font-bold text-[#D97706]">
                {formatINR(
                  supplierInvoices.filter((i) => i.status !== 'Paid').reduce((a, b) => a + b.totalAmountPaise, 0) +
                    contractorInvoices.filter((c) => c.status !== 'Paid').reduce((a, b) => a + b.netPayablePaise, 0)
                )}
              </span>
            </div>
          </div>
        </SurfaceCard>
      )}
    </div>
  );
}
