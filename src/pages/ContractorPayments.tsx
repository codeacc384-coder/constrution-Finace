import React, { useState } from 'react';
import { Briefcase, Plus } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import {
  Button,
  InputField,
  KpiStatCard,
  PageHeader,
  SelectField,
  StatusTag,
  SurfaceCard,
} from '../components/ui/primitives';
import { ModalDialog } from '../components/ui/ModalDrawer';
import { formatINR, toPaise } from '../utils/currency';
import { calculateContractorNetPayable } from '../services/invoiceMatchingService';

export default function ContractorPayments() {
  const contractors = useFinanceStore((s) => s.contractors);
  const contractorInvoices = useFinanceStore((s) => s.contractorInvoices);
  const projects = useFinanceStore((s) => s.projects);
  const submitContractorInvoice = useFinanceStore((s) => s.submitContractorInvoice);
  const advanceContractorInvoice = useFinanceStore((s) => s.advanceContractorInvoice);

  const [modalOpen, setModalOpen] = useState(false);
  const [contractorId, setContractorId] = useState(contractors[0]?.id || 'con_1');
  const [billNumber, setBillNumber] = useState('');
  const [summary, setSummary] = useState('');
  const [claimedQty, setClaimedQty] = useState('500 sq.m');
  const [verifiedQty, setVerifiedQty] = useState('500 sq.m');
  const [grossRupees, setGrossRupees] = useState('250000');
  const [advRecovery, setAdvRecovery] = useState('0');
  const [otherDed, setOtherDed] = useState('0');

  const selectedCon = contractors.find((c) => c.id === contractorId) || contractors[0];
  const previewCalc = calculateContractorNetPayable({
    grossBillAmountPaise: toPaise(Number(grossRupees) || 0),
    retentionPercent: selectedCon?.retentionPercent || 5,
    advanceRecoveryPaise: toPaise(Number(advRecovery) || 0),
    otherDeductionsPaise: toPaise(Number(otherDed) || 0),
    gstPercent: 18,
    tdsPercent: selectedCon?.tdsPercent || 2,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitContractorInvoice({
      contractorId,
      billNumber: billNumber || `RA-${Date.now().toString().slice(-4)}`,
      workCompletedSummary: summary || 'Certified BOQ Milestone Work',
      claimedQuantity: claimedQty,
      verifiedQuantity: verifiedQty,
      grossBillAmountPaise: toPaise(Number(grossRupees) || 0),
      advanceRecoveryPaise: toPaise(Number(advRecovery) || 0),
      otherDeductionsPaise: toPaise(Number(otherDed) || 0),
    });
    setModalOpen(false);
    setBillNumber('');
    setSummary('');
  };

  const getProjName = (id: string) => projects.find((p) => p.id === id)?.name || id;
  const totalNetPayable = contractorInvoices
    .filter((b) => b.status !== 'Paid' && b.status !== 'Rejected')
    .reduce((a, b) => a + b.netPayablePaise, 0);
  const totalRetention = contractorInvoices.reduce((a, b) => a + b.retentionDeductedPaise, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contractor & Subcontractor Payments"
        subtitle="Separate from employee payroll — manage milestone/BOQ RA bills, retention money, TDS 194C, and multi-stage engineering verification."
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span>Submit Contractor RA Bill</span>
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <KpiStatCard label="Registered Work Contractors" value={String(contractors.length)} subtext="Active BOQ & milestone contracts" />
        <KpiStatCard label="Net RA Payables Open" value={formatINR(totalNetPayable)} subtext="After retention & TDS deductions" tone="warning" />
        <KpiStatCard label="Retention Held (Security)" value={formatINR(totalRetention)} subtext="Payable post defect liability period" tone="purple" />
      </div>

      {/* RA Bills Table */}
      <SurfaceCard className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-[#2563EB]" />
          <h2 className="text-sm font-bold text-[#172B4D]">Contractor Running Account (RA) Bills</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                <th className="py-3 px-4">RA Bill & Work Order</th>
                <th className="py-3 px-4">Contractor</th>
                <th className="py-3 px-4">Verified Work</th>
                <th className="py-3 px-4 text-right">Gross + GST</th>
                <th className="py-3 px-4 text-right">Retention / TDS / Ded</th>
                <th className="py-3 px-4 text-right">Net Payable</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Workflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {contractorInvoices.map((bill) => (
                <tr key={bill.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4">
                    <div className="font-mono-num font-bold text-[#2563EB]">{bill.billNumber}</div>
                    <div className="text-[11px] text-[#64748B] font-mono-num">{bill.contractRef}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#172B4D]">{bill.companyName}</div>
                    <div className="text-[11px] text-[#64748B]">{getProjName(bill.projectId)}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-[#172B4D]">{bill.workCompletedSummary}</div>
                    <div className="text-[11px] text-[#64748B]">Verified Qty: {bill.verifiedQuantity}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono-num tabular-nums">
                    {formatINR(bill.grossBillAmountPaise)} + {formatINR(bill.gstAmountPaise)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-num tabular-nums text-[#DC2626]">
                    -{formatINR(bill.retentionDeductedPaise + bill.tdsDeductedPaise + bill.advanceRecoveryPaise + bill.otherDeductionsPaise)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-num tabular-nums font-bold text-[#172B4D]">
                    {formatINR(bill.netPayablePaise)}
                  </td>
                  <td className="py-3 px-4"><StatusTag status={bill.status} /></td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      {bill.status === 'Submitted' && (
                        <Button size="sm" variant="outline" onClick={() => advanceContractorInvoice(bill.id, 'Site Verified')}>
                          Site Verify
                        </Button>
                      )}
                      {bill.status === 'Site Verified' && (
                        <Button size="sm" variant="outline" onClick={() => advanceContractorInvoice(bill.id, 'PM Verified')}>
                          PM Certify
                        </Button>
                      )}
                      {(bill.status === 'PM Verified' || bill.status === 'Pending Finance Approval') && (
                        <Button size="sm" onClick={() => advanceContractorInvoice(bill.id, 'Approved')}>
                          Finance Approve
                        </Button>
                      )}
                      {bill.status === 'Approved' && (
                        <Button size="sm" variant="success" onClick={() => advanceContractorInvoice(bill.id, 'Paid')}>
                          Release Payment
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SurfaceCard>

      <ModalDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Submit Contractor Running Account (RA) Bill"
        subtitle="Automatically computes retention, TDS 194C, GST 18%, and net payable."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectField label="Contractor" value={contractorId} onChange={(e) => setContractorId(e.target.value)}>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>{c.companyName} ({c.contractRef})</option>
              ))}
            </SelectField>
            <InputField label="RA Bill Number" value={billNumber} onChange={(e) => setBillNumber(e.target.value)} placeholder="e.g., RA-BKC-08" required />
          </div>
          <InputField label="Work Completed Summary" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="e.g., Tower-A 5th Floor Shuttering" required />
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Claimed Quantity" value={claimedQty} onChange={(e) => setClaimedQty(e.target.value)} required />
            <InputField label="Verified Quantity" value={verifiedQty} onChange={(e) => setVerifiedQty(e.target.value)} required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <InputField label="Gross Work Value (₹)" type="number" value={grossRupees} onChange={(e) => setGrossRupees(e.target.value)} required />
            <InputField label="Advance Recovery (₹)" type="number" value={advRecovery} onChange={(e) => setAdvRecovery(e.target.value)} />
            <InputField label="Other Deductions (₹)" type="number" value={otherDed} onChange={(e) => setOtherDed(e.target.value)} />
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
            <div className="flex justify-between"><span>GST (18%)</span><span className="font-mono-num">+{formatINR(previewCalc.gstAmountPaise)}</span></div>
            <div className="flex justify-between text-[#DC2626]"><span>Retention ({selectedCon?.retentionPercent}%)</span><span className="font-mono-num">-{formatINR(previewCalc.retentionDeductedPaise)}</span></div>
            <div className="flex justify-between text-[#DC2626]"><span>TDS 194C ({selectedCon?.tdsPercent}%)</span><span className="font-mono-num">-{formatINR(previewCalc.tdsDeductedPaise)}</span></div>
            <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold text-sm text-[#172B4D]">
              <span>Computed Net Payable</span>
              <span className="font-mono-num text-[#16A34A]">{formatINR(previewCalc.netPayablePaise)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Submit RA Bill</Button>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
}
