import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, Info } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { KpiStatCard, PageHeader, StatusTag, SurfaceCard } from '../components/ui/primitives';
import { formatINR, formatINRCompact } from '../utils/currency';

export default function CashFlow() {
  const cashFlowEntries = useFinanceStore((s) => s.cashFlowEntries);
  const company = useFinanceStore((s) => s.company);

  const openingBalancePaise = 845000000; // ₹84.50 L statement opening balance (Oct 31, 2026)

  const actualInflows = cashFlowEntries
    .filter((e) => e.type === 'Inflow' && e.sourceType === 'Connected Bank Feed')
    .reduce((a, b) => a + b.amountPaise, 0);

  const actualOutflows = cashFlowEntries
    .filter((e) => e.type === 'Outflow' && e.sourceType === 'Connected Bank Feed')
    .reduce((a, b) => a + b.amountPaise, 0);

  const projectedInflows = cashFlowEntries
    .filter((e) => e.type === 'Inflow' && e.sourceType === 'Projected / Scheduled')
    .reduce((a, b) => a + b.amountPaise, 0);

  const projectedOutflows = cashFlowEntries
    .filter((e) => e.type === 'Outflow' && e.sourceType === 'Projected / Scheduled')
    .reduce((a, b) => a + b.amountPaise, 0);

  const monthlyChart = useMemo(() => {
    const months = ['Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026', 'Nov 2026'];
    return months.map((m) => {
      const rows = cashFlowEntries.filter((e) => e.monthLabel === m);
      return {
        month: m.slice(0, 3),
        Inflow: Math.round(rows.filter((r) => r.type === 'Inflow').reduce((a, b) => a + b.amountPaise, 0) / 100000),
        Outflow: Math.round(rows.filter((r) => r.type === 'Outflow').reduce((a, b) => a + b.amountPaise, 0) / 100000),
      };
    });
  }, [cashFlowEntries]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cash Flow Management"
        subtitle={`Liquidity visibility across ${company.primaryBankRef} — strictly distinguishing statement-confirmed flows from projected schedules.`}
      />

      <SurfaceCard className="p-3.5 bg-slate-50/90 flex items-center gap-2.5 text-xs text-[#64748B]">
        <Info className="w-4 h-4 text-[#2563EB] shrink-0" />
        <span>
          <strong>Data Source Transparency:</strong> Opening & realized balances reflect imported bank statement snapshots (as of Nov 16, 2026). Projected inflows/outflows are calculated from open payables and scheduled RA bill receipts, never invented as live bank feeds.
        </span>
      </SurfaceCard>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <KpiStatCard label="Statement Opening Balance" value={formatINRCompact(openingBalancePaise)} subtext="Last imported statement (Nov 1)" />
        <KpiStatCard label="Confirmed Inflows (YTD)" value={formatINRCompact(actualInflows)} subtext="Client RA & mobilization receipts" tone="success" />
        <KpiStatCard label="Confirmed Outflows (YTD)" value={formatINRCompact(actualOutflows)} subtext="Payroll, AP & statutory challans" />
        <KpiStatCard label="Expected Inflows (Nov End)" value={formatINRCompact(projectedInflows)} subtext="Scheduled RA-6 realization" tone="info" />
        <KpiStatCard label="Upcoming Obligations (Nov)" value={formatINRCompact(projectedOutflows)} subtext="Payroll + Supplier + Contractor" tone="warning" />
      </div>

      <SurfaceCard className="p-5">
        <h2 className="text-sm font-bold text-[#172B4D]">Monthly Cash Inflow vs Outflow (₹ Lakhs)</h2>
        <p className="text-xs text-[#64748B] mb-4">Confirmed statement cashflows + November projected commitments</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyChart} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} formatter={(v) => [`₹${v ?? 0} L`, '']} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Inflow" name="Cash Inflows (₹L)" fill="#16A34A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Outflow" name="Cash Outflows (₹L)" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SurfaceCard>

      <SurfaceCard className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#2563EB]" />
          <h2 className="text-sm font-bold text-[#172B4D]">Cash Flow Register (Confirmed vs Projected)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category & Description</th>
                <th className="py-3 px-4">Data Source</th>
                <th className="py-3 px-4">Direction</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {cashFlowEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono-num text-[#64748B]">{entry.date}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#172B4D]">{entry.description}</div>
                    <div className="text-[11px] text-[#64748B]">{entry.category}</div>
                  </td>
                  <td className="py-3 px-4">
                    <StatusTag
                      status={entry.sourceType}
                      tone={entry.sourceType === 'Connected Bank Feed' ? 'success' : 'info'}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <StatusTag status={entry.type} tone={entry.type === 'Inflow' ? 'success' : 'neutral'} />
                  </td>
                  <td className={`py-3 px-4 text-right font-mono-num tabular-nums font-bold ${entry.type === 'Inflow' ? 'text-[#16A34A]' : 'text-[#172B4D]'}`}>
                    {entry.type === 'Inflow' ? '+' : '-'}{formatINR(entry.amountPaise)}
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
