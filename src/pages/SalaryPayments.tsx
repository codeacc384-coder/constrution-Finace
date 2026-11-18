import React, { useState } from 'react';
import { BadgeIndianRupee, RefreshCw, Send, ShieldAlert } from 'lucide-react';
import { useCurrentUser, useFinanceStore } from '../store/useFinanceStore';
import {
  Button,
  PageHeader,
  StatusTag,
  SurfaceCard,
} from '../components/ui/primitives';
import { formatINR } from '../utils/currency';
import { SalaryPaymentBatch } from '../types/finance';

export default function SalaryPayments() {
  const { user, role } = useCurrentUser();
  const payrollRuns = useFinanceStore((s) => s.payrollRuns);
  const salaryBatches = useFinanceStore((s) => s.salaryBatches);
  const createSalaryPaymentBatch = useFinanceStore((s) => s.createSalaryPaymentBatch);
  const authorizeAndReleaseSalaryBatch = useFinanceStore((s) => s.authorizeAndReleaseSalaryBatch);
  const retryFailedSalaryTransaction = useFinanceStore((s) => s.retryFailedSalaryTransaction);

  const [selectedBatchId, setSelectedBatchId] = useState(salaryBatches[0]?.id || '');
  const [payMethod, setPayMethod] = useState<SalaryPaymentBatch['paymentMethod']>('NEFT Bulk');

  const lockedRunsWithoutBatch = payrollRuns.filter(
    (r) => r.status === 'Locked' && !salaryBatches.some((b) => b.payrollRunId === r.id)
  );

  const activeBatch = salaryBatches.find((b) => b.id === selectedBatchId) || salaryBatches[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Salary Payment Processing"
        subtitle="Separated from Payroll Approval — authorize, release, and reconcile bank disbursement batches with maker-checker enforcement."
      />

      {/* Create Batch from Locked Payroll Runs */}
      {lockedRunsWithoutBatch.length > 0 && (
        <SurfaceCard className="p-4 bg-blue-50/60 border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs">
            <div className="font-bold text-[#172B4D]">
              Locked Payroll Ready for Payment Batch ({lockedRunsWithoutBatch[0].id})
            </div>
            <p className="text-[#64748B] mt-0.5">
              {lockedRunsWithoutBatch[0].periodLabel} · {lockedRunsWithoutBatch[0].totalHeadcount} payees · Net{' '}
              <strong className="font-mono-num">{formatINR(lockedRunsWithoutBatch[0].totalNetPayablePaise)}</strong>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as SalaryPaymentBatch['paymentMethod'])}
              className="h-9 px-2.5 text-xs bg-white border border-slate-200 rounded-lg"
            >
              <option value="NEFT Bulk">NEFT Bulk</option>
              <option value="Bank Host-to-Host">Bank Host-to-Host</option>
              <option value="IMPS Instant">IMPS Instant</option>
            </select>
            <Button
              size="sm"
              onClick={() => createSalaryPaymentBatch(lockedRunsWithoutBatch[0].id, payMethod)}
            >
              Create Payment Batch
            </Button>
          </div>
        </SurfaceCard>
      )}

      {/* Payment Batches Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {salaryBatches.map((batch) => {
          const isSelected = batch.id === activeBatch?.id;
          const isCreator = batch.createdByUserId === user.id;
          return (
            <SurfaceCard
              key={batch.id}
              className={`p-4 space-y-3 transition-colors ${isSelected ? 'border-[#2563EB] ring-1 ring-[#2563EB]/20' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <button
                    type="button"
                    onClick={() => setSelectedBatchId(batch.id)}
                    className="text-sm font-bold text-[#2563EB] hover:underline cursor-pointer font-mono-num"
                  >
                    {batch.batchCode}
                  </button>
                  <div className="text-xs text-[#64748B]">{batch.periodLabel} · {batch.paymentMethod}</div>
                </div>
                <StatusTag status={batch.status} />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[#64748B]">{batch.totalEmployees} payees</span>
                <span className="text-base font-bold font-mono-num text-[#172B4D]">
                  {formatINR(batch.totalPayablePaise)}
                </span>
              </div>

              <div className="text-[11px] text-[#64748B] border-t border-slate-100 pt-2 flex items-center justify-between">
                <span>Created by {batch.createdByName}</span>
                {batch.status === 'Awaiting Authorization' && (
                  <Button
                    size="sm"
                    variant={isCreator && role.roleId !== 'company_admin' ? 'outline' : 'success'}
                    onClick={() => authorizeAndReleaseSalaryBatch(batch.id)}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Authorize & Release</span>
                  </Button>
                )}
              </div>
              {batch.status === 'Awaiting Authorization' && isCreator && role.roleId !== 'company_admin' && (
                <div className="text-[11px] text-[#D97706] flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>Maker-checker: Another authorized user must release this batch.</span>
                </div>
              )}
            </SurfaceCard>
          );
        })}
      </div>

      {/* Individual Batch Transactions Table */}
      {activeBatch && (
        <SurfaceCard className="overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
                <BadgeIndianRupee className="w-4 h-4 text-[#2563EB]" />
                <span>Bank Disbursement Records — {activeBatch.batchCode}</span>
              </h2>
              <p className="text-xs text-[#64748B]">
                Source Escrow: {activeBatch.bankAccountRef} · {activeBatch.authorizedBy ? `Released by ${activeBatch.authorizedBy}` : 'Pending bank release'}
              </p>
            </div>
            <StatusTag status={activeBatch.status} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3 px-4">Payee</th>
                  <th className="py-3 px-4">Masked Bank & IFSC</th>
                  <th className="py-3 px-4">Payment Reference / UTR</th>
                  <th className="py-3 px-4 text-right">Net Payable</th>
                  <th className="py-3 px-4">Bank Status</th>
                  <th className="py-3 px-4 text-right">Reconciliation / Retry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {activeBatch.transactions.map((tx) => (
                  <tr key={tx.id} className={tx.transferStatus === 'Failed' ? 'bg-red-50/40' : 'hover:bg-slate-50/70'}>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#172B4D]">{tx.personName}</div>
                      <div className="text-[11px] font-mono-num text-[#64748B]">{tx.personCode}</div>
                    </td>
                    <td className="py-3 px-4 font-mono-num text-[#64748B]">
                      {tx.bankAccountMasked} · {tx.ifsc}
                    </td>
                    <td className="py-3 px-4 font-mono-num text-[#172B4D]">
                      <div>{tx.paymentReference}</div>
                      {tx.failureReason && (
                        <div className="text-[11px] text-[#DC2626] font-sans mt-0.5">{tx.failureReason}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num tabular-nums font-bold">
                      {formatINR(tx.netPayablePaise)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusTag status={tx.transferStatus} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {tx.transferStatus === 'Failed' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => retryFailedSalaryTransaction(activeBatch.id, tx.id)}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Retry Bank Transfer</span>
                        </Button>
                      ) : (
                        <span className="text-[11px] text-[#64748B]">{tx.transactionDate}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SurfaceCard>
      )}
    </div>
  );
}
