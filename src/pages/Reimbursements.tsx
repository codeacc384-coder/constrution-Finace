import React, { useState } from 'react';
import { AlertTriangle, CreditCard, Plus } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import {
  Button,
  InputField,
  PageHeader,
  SelectField,
  StatusTag,
  SurfaceCard,
} from '../components/ui/primitives';
import { ModalDialog } from '../components/ui/ModalDrawer';
import { formatINR, toPaise } from '../utils/currency';
import { EmployeeReimbursement } from '../types/finance';

export default function Reimbursements() {
  const reimbursements = useFinanceStore((s) => s.reimbursements);
  const employees = useFinanceStore((s) => s.employees);
  const projects = useFinanceStore((s) => s.projects);
  const sites = useFinanceStore((s) => s.sites);
  const submitReimbursement = useFinanceStore((s) => s.submitReimbursement);
  const updateReimbursementStatus = useFinanceStore((s) => s.updateReimbursementStatus);

  const [modalOpen, setModalOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || 'emp_1');
  const [category, setCategory] = useState<EmployeeReimbursement['category']>('Travel');
  const [projectId, setProjectId] = useState(projects[0]?.id || 'proj_skyrise');
  const [siteId, setSiteId] = useState(sites[0]?.id || 'site_bkc_a');
  const [expenseDate, setExpenseDate] = useState('2026-11-16');
  const [amountRupees, setAmountRupees] = useState('3200');
  const [paymentMethod, setPaymentMethod] = useState<EmployeeReimbursement['paymentMethod']>('Bank Transfer');
  const [purpose, setPurpose] = useState('');
  const [receiptName, setReceiptName] = useState('receipt_nov16.pdf');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitReimbursement({
      employeeId,
      category,
      projectId,
      siteId,
      expenseDate,
      amountPaise: toPaise(Number(amountRupees) || 0),
      paymentMethod,
      businessPurpose: purpose || 'Official site expense',
      receiptFileName: receiptName,
      remarks: 'Submitted with bill attachment',
    });
    setModalOpen(false);
    setPurpose('');
  };

  const getProjName = (id: string) => projects.find((p) => p.id === id)?.name || id;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Reimbursements"
        subtitle="Travel, transportation, site purchase, and lodging claims with automatic duplicate claim detection."
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span>Submit Claim</span>
          </Button>
        }
      />

      <SurfaceCard className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-[#2563EB]" />
          <h2 className="text-sm font-bold text-[#172B4D]">Expense Claim Ledger</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                <th className="py-3 px-4">Claim #</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Category & Purpose</th>
                <th className="py-3 px-4">Project & Receipt</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Workflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {reimbursements.map((claim) => (
                <tr key={claim.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono-num font-bold text-[#2563EB]">
                    <div>{claim.claimNumber}</div>
                    {claim.duplicateFlag && (
                      <div className="text-[11px] text-[#DC2626] font-sans flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="w-3 h-3" /> Potential Duplicate
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#172B4D]">{claim.employeeName}</div>
                    <div className="text-[11px] text-[#64748B]">{claim.expenseDate}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-[#172B4D]">{claim.category} · {claim.paymentMethod}</div>
                    <div className="text-[11px] text-[#64748B]">{claim.businessPurpose}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div>{getProjName(claim.projectId)}</div>
                    <div className="text-[11px] font-mono-num text-[#64748B]">{claim.receiptFileName}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono-num tabular-nums font-bold">{formatINR(claim.amountPaise)}</td>
                  <td className="py-3 px-4"><StatusTag status={claim.status} /></td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      {(claim.status === 'Submitted' || claim.status === 'Under Review' || claim.status === 'Pending Approval') && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => updateReimbursementStatus(claim.id, 'Approved')}>
                            Approve
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => updateReimbursementStatus(claim.id, 'Rejected')}>
                            Reject
                          </Button>
                        </>
                      )}
                      {(claim.status === 'Approved' || claim.status === 'Ready for Payment') && (
                        <Button size="sm" variant="success" onClick={() => updateReimbursementStatus(claim.id, 'Paid')}>
                          Mark Paid
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
        title="Submit Employee Reimbursement Claim"
        subtitle="Duplicate claims (same employee, date, and amount) are automatically flagged."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectField label="Employee" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name} ({e.employeeCode})</option>
              ))}
            </SelectField>
            <SelectField label="Expense Category" value={category} onChange={(e) => setCategory(e.target.value as EmployeeReimbursement['category'])}>
              <option value="Travel">Travel</option>
              <option value="Transportation">Transportation</option>
              <option value="Food Allowance">Food Allowance</option>
              <option value="Accommodation">Accommodation</option>
              <option value="Site Purchase">Site Purchase</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </SelectField>
            <SelectField label="Project" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </SelectField>
            <SelectField label="Site" value={siteId} onChange={(e) => setSiteId(e.target.value)}>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </SelectField>
            <InputField label="Expense Date" type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required />
            <InputField label="Amount (₹)" type="number" value={amountRupees} onChange={(e) => setAmountRupees(e.target.value)} required />
          </div>
          <SelectField label="Payout Mode" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as EmployeeReimbursement['paymentMethod'])}>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="UPI">UPI</option>
            <option value="Payroll Addition">Payroll Addition</option>
          </SelectField>
          <InputField label="Business Purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g., Site inspection travel & toll" required />
          <InputField label="Receipt Attachment Name" value={receiptName} onChange={(e) => setReceiptName(e.target.value)} required />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Submit Reimbursement</Button>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
}
