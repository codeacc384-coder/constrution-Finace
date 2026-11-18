import React, { useMemo, useState } from 'react';
import { Plus, Wrench } from 'lucide-react';
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
import { SiteExpenseCategory } from '../types/finance';

const CATEGORIES: SiteExpenseCategory[] = [
  'Material Purchases',
  'Labour Expenses',
  'Transportation',
  'Equipment Rental',
  'Fuel',
  'Maintenance',
  'Food & Accommodation',
  'Safety Equipment',
  'Site Utilities',
  'Other Expenses',
];

export default function SiteExpenses() {
  const siteExpenses = useFinanceStore((s) => s.siteExpenses);
  const projects = useFinanceStore((s) => s.projects);
  const sites = useFinanceStore((s) => s.sites);
  const createSiteExpense = useFinanceStore((s) => s.createSiteExpense);
  const approveAndPaySiteExpense = useFinanceStore((s) => s.approveAndPaySiteExpense);

  const [projectFilter, setProjectFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);

  const [projectId, setProjectId] = useState(projects[0]?.id || 'proj_skyrise');
  const [siteId, setSiteId] = useState(sites[0]?.id || 'site_bkc_a');
  const [category, setCategory] = useState<SiteExpenseCategory>('Fuel');
  const [description, setDescription] = useState('');
  const [requestedBy, setRequestedBy] = useState('Mahesh Rane');
  const [amountRupees, setAmountRupees] = useState('18500');
  const [date, setDate] = useState('2026-11-16');
  const [receiptRef, setReceiptRef] = useState('SITE-BILL-209');

  const filtered = useMemo(
    () =>
      siteExpenses.filter((e) => projectFilter === 'ALL' || e.projectId === projectFilter),
    [siteExpenses, projectFilter]
  );

  // Strictly separate confirmed paid expenses from pending/unapproved amounts!
  const confirmedPaidTotal = filtered
    .filter((e) => e.approvalStatus === 'Approved' && e.paymentStatus === 'Paid')
    .reduce((a, b) => a + b.amountPaise, 0);

  const approvedUnpaidTotal = filtered
    .filter((e) => e.approvalStatus === 'Approved' && e.paymentStatus === 'Unpaid')
    .reduce((a, b) => a + b.amountPaise, 0);

  const pendingUnapprovedTotal = filtered
    .filter((e) => e.approvalStatus === 'Pending Approval')
    .reduce((a, b) => a + b.amountPaise, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSiteExpense({
      projectId,
      siteId,
      category,
      description: description || 'Site operational expenditure',
      requestedBy,
      amountPaise: toPaise(Number(amountRupees) || 0),
      date,
      receiptRef,
    });
    setModalOpen(false);
    setDescription('');
  };

  const getProjName = (id: string) => projects.find((p) => p.id === id)?.name || id;
  const getSiteName = (id: string) => sites.find((s) => s.id === id)?.name || id;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site Expense Management"
        subtitle="Centralized site expenditure ledger — strictly separating confirmed paid expenses from pending unapproved requests."
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span>Log Site Expense</span>
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <KpiStatCard
          label="Confirmed Paid Expenses"
          value={formatINR(confirmedPaidTotal)}
          subtext="Approved & settled site vouchers"
          tone="success"
        />
        <KpiStatCard
          label="Approved Awaiting Payout"
          value={formatINR(approvedUnpaidTotal)}
          subtext="Cleared by Finance, unpaid"
          tone="info"
        />
        <KpiStatCard
          label="Pending / Unapproved Amount"
          value={formatINR(pendingUnapprovedTotal)}
          subtext="Excluded from confirmed spend totals"
          tone="warning"
        />
      </div>

      <SurfaceCard className="p-3.5 flex items-center justify-between gap-3">
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="h-9 px-3 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg"
        >
          <option value="ALL">All Construction Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <span className="text-xs text-[#64748B]">Showing {filtered.length} site expense vouchers</span>
      </SurfaceCard>

      <SurfaceCard className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-[#2563EB]" />
          <h2 className="text-sm font-bold text-[#172B4D]">Site Expense Vouchers</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                <th className="py-3 px-4">Voucher ID</th>
                <th className="py-3 px-4">Project & Site</th>
                <th className="py-3 px-4">Category & Description</th>
                <th className="py-3 px-4">Requested By</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Approval / Payment</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4">
                    <div className="font-mono-num font-bold text-[#2563EB]">{exp.expenseCode}</div>
                    <div className="text-[11px] text-[#64748B]">{exp.date} · {exp.receiptRef}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-[#172B4D]">{getProjName(exp.projectId)}</div>
                    <div className="text-[11px] text-[#64748B]">{getSiteName(exp.siteId)}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#172B4D]">{exp.category}</div>
                    <div className="text-[11px] text-[#64748B]">{exp.description}</div>
                  </td>
                  <td className="py-3 px-4 text-[#172B4D]">{exp.requestedBy}</td>
                  <td className="py-3 px-4 text-right font-mono-num tabular-nums font-bold">{formatINR(exp.amountPaise)}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1 items-start">
                      <StatusTag status={exp.approvalStatus} />
                      <StatusTag status={exp.paymentStatus} tone={exp.paymentStatus === 'Paid' ? 'success' : 'neutral'} />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      {exp.approvalStatus === 'Pending Approval' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => approveAndPaySiteExpense(exp.id, 'Approve')}>Approve</Button>
                          <Button size="sm" variant="ghost" onClick={() => approveAndPaySiteExpense(exp.id, 'Reject')}>Reject</Button>
                        </>
                      )}
                      {exp.approvalStatus === 'Approved' && exp.paymentStatus === 'Unpaid' && (
                        <Button size="sm" variant="success" onClick={() => approveAndPaySiteExpense(exp.id, 'Pay')}>Mark Paid</Button>
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
        title="Log Site Expense Voucher"
        subtitle="Pending site expenses remain separate from confirmed paid totals until Finance approves and settles."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <SelectField label="Expense Category" value={category} onChange={(e) => setCategory(e.target.value as SiteExpenseCategory)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </SelectField>
            <InputField label="Amount (₹)" type="number" value={amountRupees} onChange={(e) => setAmountRupees(e.target.value)} required />
            <InputField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            <InputField label="Requested By" value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)} required />
          </div>
          <InputField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Crane hydraulic oil & filter replacement" required />
          <InputField label="Bill / Receipt Reference" value={receiptRef} onChange={(e) => setReceiptRef(e.target.value)} required />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Log Expense</Button>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
}
