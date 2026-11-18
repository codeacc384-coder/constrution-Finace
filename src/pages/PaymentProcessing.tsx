import React from 'react';
import { ArrowLeftRight, Send, ShieldAlert } from 'lucide-react';
import { useCurrentUser, useFinanceStore } from '../store/useFinanceStore';
import {
  Button,
  KpiStatCard,
  PageHeader,
  StatusTag,
  SurfaceCard,
} from '../components/ui/primitives';
import { formatINR } from '../utils/currency';

export default function PaymentProcessing() {
  const { user, role } = useCurrentUser();
  const salaryBatches = useFinanceStore((s) => s.salaryBatches);
  const supplierInvoices = useFinanceStore((s) => s.supplierInvoices);
  const contractorInvoices = useFinanceStore((s) => s.contractorInvoices);
  const reimbursements = useFinanceStore((s) => s.reimbursements);
  const authorizeAndReleaseSalaryBatch = useFinanceStore((s) => s.authorizeAndReleaseSalaryBatch);
  const paySupplierInvoice = useFinanceStore((s) => s.paySupplierInvoice);
  const advanceContractorInvoice = useFinanceStore((s) => s.advanceContractorInvoice);
  const updateReimbursementStatus = useFinanceStore((s) => s.updateReimbursementStatus);

  const pendingBatches = salaryBatches.filter((b) => b.status === 'Awaiting Authorization');
  const readySuppliers = supplierInvoices.filter((i) => i.status === 'Approved');
  const readyContractors = contractorInvoices.filter((c) => c.status === 'Approved');
  const readyReimbursements = reimbursements.filter(
    (r) => r.status === 'Approved' || r.status === 'Ready for Payment'
  );

  const totalQueuePaise =
    pendingBatches.reduce((a, b) => a + b.totalPayablePaise, 0) +
    readySuppliers.reduce((a, b) => a + b.totalAmountPaise, 0) +
    readyContractors.reduce((a, b) => a + b.netPayablePaise, 0) +
    readyReimbursements.reduce((a, b) => a + b.amountPaise, 0);

  const totalReadyItems =
    pendingBatches.length + readySuppliers.length + readyContractors.length + readyReimbursements.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Unified Payment Processing"
        subtitle="Treasury release queue for approved salary batches, supplier invoices, contractor RA bills, and employee reimbursements."
      />

      {!role.canReleasePayment && (
        <SurfaceCard className="p-4 bg-amber-50/70 border-amber-200 flex items-center gap-3 text-xs">
          <ShieldAlert className="w-4 h-4 text-[#D97706] shrink-0" />
          <span>
            <strong>View-Only Queue:</strong> {role.roleName} is not authorized to release bank payments. Switch to Treasury Officer, Finance Manager, or Finance Head to execute payouts.
          </span>
        </SurfaceCard>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <KpiStatCard label="Total Ready for Release" value={formatINR(totalQueuePaise)} subtext={`${totalReadyItems} approved payment items`} tone="info" />
        <KpiStatCard label="Approved Vendor & RA Bills" value={String(readySuppliers.length + readyContractors.length)} subtext="Cleared via 3-way match & PM sign-off" />
        <KpiStatCard label="Reimbursements Ready" value={String(readyReimbursements.length)} subtext="Direct NEFT / UPI payout" />
      </div>

      <SurfaceCard className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-[#2563EB]" />
          <h2 className="text-sm font-bold text-[#172B4D]">Approved Disbursement Queue</h2>
        </div>
        <div className="divide-y divide-slate-100 text-xs">
          {totalReadyItems === 0 ? (
            <div className="p-10 text-center text-[#64748B]">
              No approved items currently awaiting bank release. Approve pending invoices or lock a payroll run first.
            </div>
          ) : (
            <>
              {pendingBatches.map((b) => (
                <div key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-[#172B4D]">{b.batchCode} · Salary Batch ({b.periodLabel})</div>
                    <div className="text-[#64748B]">{b.totalEmployees} payees · Created by {b.createdByName}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono-num font-bold text-sm">{formatINR(b.totalPayablePaise)}</span>
                    <Button
                      size="sm"
                      variant="success"
                      disabled={!role.canReleasePayment || (b.createdByUserId === user.id && role.roleId !== 'company_admin')}
                      onClick={() => authorizeAndReleaseSalaryBatch(b.id)}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Release Batch</span>
                    </Button>
                  </div>
                </div>
              ))}

              {readySuppliers.map((inv) => (
                <div key={inv.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-[#172B4D]">{inv.invoiceNumber} · {inv.supplierName}</div>
                    <div className="text-[#64748B]">Supplier Invoice · PO {inv.poNumber}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusTag status={inv.status} />
                    <span className="font-mono-num font-bold text-sm">{formatINR(inv.totalAmountPaise)}</span>
                    <Button size="sm" variant="success" disabled={!role.canReleasePayment} onClick={() => paySupplierInvoice(inv.id)}>
                      <Send className="w-3.5 h-3.5" />
                      <span>Pay Supplier</span>
                    </Button>
                  </div>
                </div>
              ))}

              {readyContractors.map((bill) => (
                <div key={bill.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-[#172B4D]">{bill.billNumber} · {bill.companyName}</div>
                    <div className="text-[#64748B]">Contractor RA Bill · {bill.workCompletedSummary}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusTag status={bill.status} />
                    <span className="font-mono-num font-bold text-sm">{formatINR(bill.netPayablePaise)}</span>
                    <Button size="sm" variant="success" disabled={!role.canReleasePayment} onClick={() => advanceContractorInvoice(bill.id, 'Paid')}>
                      <Send className="w-3.5 h-3.5" />
                      <span>Release RA Pay</span>
                    </Button>
                  </div>
                </div>
              ))}

              {readyReimbursements.map((claim) => (
                <div key={claim.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-[#172B4D]">{claim.claimNumber} · {claim.employeeName}</div>
                    <div className="text-[#64748B]">Reimbursement · {claim.category} · {claim.paymentMethod}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusTag status={claim.status} />
                    <span className="font-mono-num font-bold text-sm">{formatINR(claim.amountPaise)}</span>
                    <Button size="sm" variant="success" disabled={!role.canReleasePayment} onClick={() => updateReimbursementStatus(claim.id, 'Paid')}>
                      <Send className="w-3.5 h-3.5" />
                      <span>Settle Claim</span>
                    </Button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </SurfaceCard>
    </div>
  );
}
