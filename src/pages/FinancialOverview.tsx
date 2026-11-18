import React from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useFinanceStore } from '../store/useFinanceStore';
import { KpiStatCard, PageHeader, StatusTag, SurfaceCard } from '../components/ui/primitives';
import { formatINR, formatINRCompact } from '../utils/currency';

export default function FinancialOverview() {
  const projectBudgets = useFinanceStore((s) => s.projectBudgets);
  const cashFlowEntries = useFinanceStore((s) => s.cashFlowEntries);
  const projects = useFinanceStore((s) => s.projects);

  const totalBudget = projectBudgets.reduce((a, b) => a + b.approvedBudgetPaise, 0);
  const totalCommitted = projectBudgets.reduce((a, b) => a + b.committedPaise, 0);
  const totalSpent = projectBudgets.reduce((a, b) => a + b.approvedExpensesPaise, 0);
  const totalPaid = projectBudgets.reduce((a, b) => a + b.actualPaidPaise, 0);
  const totalInflows = cashFlowEntries
    .filter((e) => e.type === 'Inflow' && e.sourceType === 'Connected Bank Feed')
    .reduce((a, b) => a + b.amountPaise, 0);

  const chartData = projectBudgets.map((b) => ({
    project: b.projectName.split(' ').slice(0, 2).join(' '),
    Budget: Math.round(b.approvedBudgetPaise / 100000),
    Committed: Math.round(b.committedPaise / 100000),
    Paid: Math.round(b.actualPaidPaise / 100000),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Overview"
        subtitle="Consolidated multi-project P&L position, committed liabilities, and realized client receipts across ABC Construction Pvt Ltd."
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <KpiStatCard label="Approved Portfolio Budget" value={formatINRCompact(totalBudget)} subtext={`${projects.length} active projects`} />
        <KpiStatCard label="Committed POs & Contracts" value={formatINRCompact(totalCommitted)} subtext={`${((totalCommitted / totalBudget) * 100).toFixed(1)}% committed`} tone="info" />
        <KpiStatCard label="Approved Expenditure" value={formatINRCompact(totalSpent)} subtext="Certified costs to date" />
        <KpiStatCard label="Cash Disbursed (Paid)" value={formatINRCompact(totalPaid)} subtext="Bank-settled outflows" tone="purple" />
        <KpiStatCard label="Realized Client Receipts" value={formatINRCompact(totalInflows)} subtext="Connected bank feed inflows" tone="success" />
      </div>

      <SurfaceCard className="p-5">
        <h2 className="text-sm font-bold text-[#172B4D]">Portfolio Cost Position by Project (₹ Lakhs)</h2>
        <p className="text-xs text-[#64748B] mb-4">Comparison of approved budget, committed liabilities, and cash paid</p>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="project" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} formatter={(v) => [`₹${v ?? 0} L`, '']} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Budget" fill="#101F35" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Committed" fill="#64748B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Paid" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SurfaceCard>

      <SurfaceCard className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-sm font-bold text-[#172B4D]">Project Financial Matrix</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                <th className="py-3 px-4">Project & PM</th>
                <th className="py-3 px-4 text-right">Approved Budget</th>
                <th className="py-3 px-4 text-right">Committed</th>
                <th className="py-3 px-4 text-right">Approved Spend</th>
                <th className="py-3 px-4 text-right">Outstanding Payables</th>
                <th className="py-3 px-4 text-right">Forecast Final</th>
                <th className="py-3 px-4">Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {projectBudgets.map((b) => {
                const util = (b.approvedExpensesPaise / b.approvedBudgetPaise) * 100;
                const overrun = b.forecastFinalCostPaise > b.approvedBudgetPaise;
                return (
                  <tr key={b.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#172B4D]">{b.projectName}</div>
                      <div className="text-[11px] text-[#64748B]">PM: {b.projectManager}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num tabular-nums">{formatINR(b.approvedBudgetPaise)}</td>
                    <td className="py-3 px-4 text-right font-mono-num tabular-nums">{formatINR(b.committedPaise)}</td>
                    <td className="py-3 px-4 text-right font-mono-num tabular-nums font-semibold">
                      {formatINR(b.approvedExpensesPaise)} ({util.toFixed(1)}%)
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num tabular-nums text-[#D97706]">{formatINR(b.outstandingPayablesPaise)}</td>
                    <td className="py-3 px-4 text-right font-mono-num tabular-nums font-bold">
                      {formatINR(b.forecastFinalCostPaise)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusTag status={overrun ? 'Forecast Overrun' : util >= b.alertThresholdWarningPct ? 'Watch (>70%)' : 'On Track'} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SurfaceCard>
    </div>
  );
}
