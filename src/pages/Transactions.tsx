import React, { useMemo, useState } from 'react';
import { Download, FileSpreadsheet, Search } from 'lucide-react';
import { useCurrentUser, useFinanceStore } from '../store/useFinanceStore';
import { Button, PageHeader, StatusTag, SurfaceCard } from '../components/ui/primitives';
import { downloadCSV, formatINR } from '../utils/currency';

export default function Transactions() {
  const { role } = useCurrentUser();
  const transactions = useFinanceStore((s) => s.transactions);
  const [search, setSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState('ALL');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return transactions.filter(
      (t) =>
        (directionFilter === 'ALL' || t.direction === directionFilter) &&
        (t.transactionRef.toLowerCase().includes(q) ||
          t.utrNumber.toLowerCase().includes(q) ||
          t.counterparty.toLowerCase().includes(q) ||
          t.module.toLowerCase().includes(q))
    );
  }, [transactions, search, directionFilter]);

  const handleExport = () => {
    downloadCSV(
      'buildflow-transactions.csv',
      ['Ref', 'UTR', 'Date', 'Direction', 'Module', 'Counterparty', 'Mode', 'Amount (INR)', 'Status', 'Reconciled'],
      filtered.map((t) => [
        t.transactionRef,
        t.utrNumber,
        t.date,
        t.direction,
        t.module,
        t.counterparty,
        t.paymentMode,
        (t.amountPaise / 100).toFixed(2),
        t.status,
        t.reconciled ? 'Yes' : 'No',
      ])
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Transactions Ledger"
        subtitle="Confirmed bank inflows and outgoing settlements with UTR traceability and reconciliation flags."
        actions={
          role.canExportReports && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>
          )
        }
      />

      <SurfaceCard className="p-3.5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search UTR, transaction ref, counterparty..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#2563EB]"
          />
        </div>
        <select
          value={directionFilter}
          onChange={(e) => setDirectionFilter(e.target.value)}
          className="h-10 px-3 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg"
        >
          <option value="ALL">All Credits & Debits</option>
          <option value="Debit">Outgoing Debits</option>
          <option value="Credit">Incoming Credits</option>
        </select>
      </SurfaceCard>

      <SurfaceCard className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-[#2563EB]" />
          <h2 className="text-sm font-bold text-[#172B4D]">Bank Transaction Register ({filtered.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                <th className="py-3 px-4">Ref & UTR</th>
                <th className="py-3 px-4">Date & Mode</th>
                <th className="py-3 px-4">Module & Counterparty</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Bank Status</th>
                <th className="py-3 px-4">Reconciled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4">
                    <div className="font-mono-num font-bold text-[#2563EB]">{tx.transactionRef}</div>
                    <div className="font-mono-num text-[11px] text-[#64748B]">{tx.utrNumber}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-mono-num">{tx.date}</div>
                    <div className="text-[11px] text-[#64748B]">{tx.paymentMode} · {tx.bankAccountRef}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#172B4D]">{tx.counterparty}</div>
                    <div className="text-[11px] text-[#64748B]">{tx.module}</div>
                  </td>
                  <td className={`py-3 px-4 text-right font-mono-num tabular-nums font-bold ${tx.direction === 'Credit' ? 'text-[#16A34A]' : 'text-[#172B4D]'}`}>
                    {tx.direction === 'Credit' ? '+' : '-'}{formatINR(tx.amountPaise)}
                  </td>
                  <td className="py-3 px-4"><StatusTag status={tx.status} /></td>
                  <td className="py-3 px-4"><StatusTag status={tx.reconciled ? 'Matched' : 'Pending Recon'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SurfaceCard>
    </div>
  );
}
