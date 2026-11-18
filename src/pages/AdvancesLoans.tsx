import React, { useState } from 'react';
import { Plus, Wallet } from 'lucide-react';
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
import { ModalDialog, SideSheet } from '../components/ui/ModalDrawer';
import { formatINR, toPaise } from '../utils/currency';
import { EmployeeAdvance } from '../types/finance';

export default function AdvancesLoans() {
  const advances = useFinanceStore((s) => s.advances);
  const employees = useFinanceStore((s) => s.employees);
  const workers = useFinanceStore((s) => s.workers);
  const requestAdvance = useFinanceStore((s) => s.requestAdvance);
  const processAdvanceStatus = useFinanceStore((s) => s.processAdvanceStatus);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAdv, setSelectedAdv] = useState<EmployeeAdvance | null>(null);

  const [personKey, setPersonKey] = useState(`Employee:${employees[0]?.id}`);
  const [amountRupees, setAmountRupees] = useState('12000');
  const [installments, setInstallments] = useState('4');
  const [reason, setReason] = useState('');

  const totalDisbursed = advances.reduce((a, b) => a + b.disbursedAmountPaise, 0);
  const totalOutstanding = advances.reduce((a, b) => a + b.outstandingAmountPaise, 0);
  const pendingCount = advances.filter((a) => a.status === 'Requested' || a.status === 'Under Review').length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const [pType, pId] = personKey.split(':');
    const emp = employees.find((x) => x.id === pId);
    const wrk = workers.find((x) => x.id === pId);
    requestAdvance({
      personId: pId,
      personName: emp?.name || wrk?.name || 'Employee',
      personType: pType as 'Employee' | 'Worker',
      projectId: emp?.projectId || wrk?.assignedProjectId || 'proj_skyrise',
      amountPaise: toPaise(Number(amountRupees) || 0),
      installmentsTotal: Number(installments) || 1,
      reason: reason || 'Personal contingency advance',
    });
    setModalOpen(false);
    setReason('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Advances & Loans"
        subtitle="Manage employee and worker salary advances, authorized repayment schedules, and automatic payroll deductions."
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span>Request Advance</span>
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <KpiStatCard label="Total Disbursed Advances" value={formatINR(totalDisbursed)} subtext="Active loan & advance pool" />
        <KpiStatCard label="Outstanding Recoverable" value={formatINR(totalOutstanding)} subtext="Scheduled across upcoming payrolls" tone="warning" />
        <KpiStatCard label="Requests Pending Review" value={String(pendingCount)} subtext="Require HR & Finance approval" tone={pendingCount > 0 ? 'info' : 'neutral'} />
      </div>

      <SurfaceCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                <th className="py-3 px-4">Advance ID</th>
                <th className="py-3 px-4">Employee / Worker</th>
                <th className="py-3 px-4 text-right">Requested / Approved</th>
                <th className="py-3 px-4 text-right">Monthly Deduction</th>
                <th className="py-3 px-4 text-right">Outstanding</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {advances.map((adv) => (
                <tr key={adv.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono-num font-semibold text-[#2563EB]">{adv.advanceCode}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#172B4D]">{adv.personName}</div>
                    <div className="text-[11px] text-[#64748B]">{adv.personType} · {adv.requestDate}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono-num tabular-nums">
                    {formatINR(adv.requestedAmountPaise)} / <strong>{formatINR(adv.approvedAmountPaise)}</strong>
                  </td>
                  <td className="py-3 px-4 text-right font-mono-num tabular-nums">
                    {formatINR(adv.monthlyDeductionPaise)}/mo ({adv.installmentsPaid}/{adv.installmentsTotal})
                  </td>
                  <td className="py-3 px-4 text-right font-mono-num tabular-nums font-bold text-[#D97706]">
                    {formatINR(adv.outstandingAmountPaise)}
                  </td>
                  <td className="py-3 px-4">
                    <StatusTag status={adv.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      {adv.status === 'Requested' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => processAdvanceStatus(adv.id, 'Approved')}>Approve</Button>
                          <Button size="sm" variant="ghost" onClick={() => processAdvanceStatus(adv.id, 'Rejected')}>Reject</Button>
                        </>
                      )}
                      {adv.status === 'Approved' && (
                        <Button size="sm" variant="success" onClick={() => processAdvanceStatus(adv.id, 'Disbursed')}>Disburse</Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setSelectedAdv(adv)}>Ledger</Button>
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
        title="New Salary / Wage Advance Request"
        subtitle="Only approved and disbursed advances apply automated deductions in payroll."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <SelectField label="Employee / Worker" value={personKey} onChange={(e) => setPersonKey(e.target.value)}>
            {employees.map((e) => (
              <option key={e.id} value={`Employee:${e.id}`}>{e.name} ({e.employeeCode})</option>
            ))}
            {workers.map((w) => (
              <option key={w.id} value={`Worker:${w.id}`}>{w.name} ({w.workerCode})</option>
            ))}
          </SelectField>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Requested Amount (₹)" type="number" value={amountRupees} onChange={(e) => setAmountRupees(e.target.value)} required />
            <InputField label="Recovery Installments (Months)" type="number" min="1" max="12" value={installments} onChange={(e) => setInstallments(e.target.value)} required />
          </div>
          <InputField label="Business / Personal Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., Medical emergency / relocation" required />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Submit Request</Button>
          </div>
        </form>
      </ModalDialog>

      <SideSheet
        open={Boolean(selectedAdv)}
        onClose={() => setSelectedAdv(null)}
        title={selectedAdv ? `${selectedAdv.advanceCode} · Repayment Ledger` : ''}
        subtitle={selectedAdv ? `${selectedAdv.personName} · ${selectedAdv.reason}` : ''}
        widthClass="max-w-lg"
      >
        {selectedAdv && (
          <div className="space-y-4 text-xs">
            <SurfaceCard className="p-4 space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#172B4D]">
                <Wallet className="w-4 h-4 text-[#2563EB]" />
                <span>Repayment Schedule Summary</span>
              </div>
              <div className="flex justify-between"><span className="text-[#64748B]">Disbursed Amount</span><span className="font-mono-num font-bold">{formatINR(selectedAdv.disbursedAmountPaise)}</span></div>
              <div className="flex justify-between"><span className="text-[#64748B]">Monthly EMI Deduction</span><span className="font-mono-num">{formatINR(selectedAdv.monthlyDeductionPaise)}</span></div>
              <div className="flex justify-between"><span className="text-[#64748B]">Remaining Balance</span><span className="font-mono-num font-bold text-[#D97706]">{formatINR(selectedAdv.outstandingAmountPaise)}</span></div>
            </SurfaceCard>

            <SurfaceCard className="p-4 space-y-2">
              <div className="font-bold text-[#172B4D]">Transaction History</div>
              {selectedAdv.repayments.length === 0 ? (
                <p className="text-[#64748B]">No repayments deducted yet.</p>
              ) : (
                selectedAdv.repayments.map((rep) => (
                  <div key={rep.id} className="flex justify-between py-1.5 border-b border-slate-100">
                    <div>
                      <div className="font-semibold">{rep.periodLabel}</div>
                      <div className="text-[11px] text-[#64748B]">{rep.date} · {rep.mode}</div>
                    </div>
                    <span className="font-mono-num font-semibold text-[#16A34A]">-{formatINR(rep.amountPaise)}</span>
                  </div>
                ))
              )}
            </SurfaceCard>
          </div>
        )}
      </SideSheet>
    </div>
  );
}
