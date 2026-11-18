import React, { useState } from 'react';
import { CheckCircle2, Landmark, Lock, Upload } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import {
  Button,
  KpiStatCard,
  PageHeader,
  StatusTag,
  SurfaceCard,
} from '../components/ui/primitives';
import { ModalDialog } from '../components/ui/ModalDrawer';
import { formatINR } from '../utils/currency';

const SAMPLE_CSV = `date,bankRef,description,direction,amount
2026-11-16,HDFCN52026103190011,NEFT DR-OCTOBER 2026 SALARY BATCH,Debit,1542800
2026-11-16,UPI-99412004,NEFT DR-UNLISTED SITE HARDWARE,Debit,14250`;

export default function BankReconciliation() {
  const reconciliations = useFinanceStore((s) => s.reconciliations);
  const importBankStatementCSV = useFinanceStore((s) => s.importBankStatementCSV);
  const resolveReconciliationRecord = useFinanceStore((s) => s.resolveReconciliationRecord);
  const lockReconciliationSession = useFinanceStore((s) => s.lockReconciliationSession);

  const [importOpen, setImportOpen] = useState(false);
  const [csvText, setCsvText] = useState(SAMPLE_CSV);

  const session = reconciliations[0];
  const matchedCount = session?.records.filter((r) => r.matchStatus === 'Matched').length || 0;
  const unmatchedCount = session?.records.filter((r) => !r.resolved).length || 0;

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    importBankStatementCSV(session.id, csvText);
    setImportOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bank Reconciliation"
        subtitle="Import corporate escrow statements, auto-match against internal UTR ledger entries, resolve variances, and lock reconciliation periods."
        actions={
          <div className="flex flex-wrap gap-2">
            {session?.status !== 'Locked' && (
              <>
                <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import Bank Statement (CSV)</span>
                </Button>
                <Button
                  size="sm"
                  variant="success"
                  disabled={unmatchedCount > 0}
                  onClick={() => session && lockReconciliationSession(session.id)}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Approve & Lock Period</span>
                </Button>
              </>
            )}
          </div>
        }
      />

      {session && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <KpiStatCard label="Bank Account" value="•••• 4821" subtext={session.statementPeriod} />
            <KpiStatCard label="Matched Entries" value={String(matchedCount)} subtext="Confirmed against internal ledger" tone="success" />
            <KpiStatCard label="Unmatched / Discrepancies" value={String(unmatchedCount)} subtext="Must be resolved before locking" tone={unmatchedCount > 0 ? 'warning' : 'success'} />
            <KpiStatCard label="Session Status" value={session.status} subtext={`Imported by ${session.importedBy}`} tone={session.status === 'Locked' ? 'success' : 'info'} />
          </div>

          <SurfaceCard className="overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-[#2563EB]" />
                <h2 className="text-sm font-bold text-[#172B4D]">Statement Lines vs Internal Transaction Matching</h2>
              </div>
              <StatusTag status={session.status} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    <th className="py-3 px-4">Statement Date & Ref</th>
                    <th className="py-3 px-4">Bank Narration</th>
                    <th className="py-3 px-4">Direction</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Match Status</th>
                    <th className="py-3 px-4 text-right">Resolution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {session.records.map((rec) => (
                    <tr key={rec.id} className={!rec.resolved ? 'bg-amber-50/30' : 'hover:bg-slate-50/70'}>
                      <td className="py-3 px-4">
                        <div className="font-mono-num font-semibold text-[#172B4D]">{rec.bankRef}</div>
                        <div className="text-[11px] text-[#64748B]">{rec.statementDate}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#172B4D]">{rec.description}</div>
                        {rec.discrepancyNote && (
                          <div className="text-[11px] text-[#B45309] mt-0.5">{rec.discrepancyNote}</div>
                        )}
                      </td>
                      <td className="py-3 px-4"><StatusTag status={rec.direction} tone={rec.direction === 'Credit' ? 'success' : 'neutral'} /></td>
                      <td className="py-3 px-4 text-right font-mono-num tabular-nums font-bold">{formatINR(rec.amountPaise)}</td>
                      <td className="py-3 px-4"><StatusTag status={rec.matchStatus} /></td>
                      <td className="py-3 px-4 text-right">
                        {rec.resolved ? (
                          <span className="inline-flex items-center gap-1 text-[#16A34A] font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Reconciled
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              resolveReconciliationRecord(
                                session.id,
                                rec.id,
                                'Matched & adjusted via bank charge/surcharge ledger entry'
                              )
                            }
                          >
                            Post Adjustment & Match
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SurfaceCard>
        </>
      )}

      <ModalDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import Bank Statement (CSV)"
        subtitle="Paste CSV rows (date,bankRef,description,direction,amount) to run automated UTR & amount matching."
      >
        <form onSubmit={handleImport} className="space-y-4">
          <textarea
            rows={6}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="w-full p-3 text-xs font-mono-num bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#2563EB]"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button type="submit">Parse & Match Statement</Button>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
}
