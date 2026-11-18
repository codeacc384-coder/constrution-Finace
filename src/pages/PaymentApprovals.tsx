import React, { useState } from 'react';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { useCurrentUser, useFinanceStore } from '../store/useFinanceStore';
import {
  Button,
  InputField,
  PageHeader,
  SegmentedTabs,
  StatusTag,
  SurfaceCard,
} from '../components/ui/primitives';
import { SideSheet } from '../components/ui/ModalDrawer';
import { formatINR } from '../utils/currency';
import { ApprovalItem } from '../types/finance';

export default function PaymentApprovals() {
  const { user, role } = useCurrentUser();
  const approvals = useFinanceStore((s) => s.approvals);
  const projects = useFinanceStore((s) => s.projects);
  const processApprovalItem = useFinanceStore((s) => s.processApprovalItem);

  const [filterTab, setFilterTab] = useState<'pending' | 'all'>('pending');
  const [selected, setSelected] = useState<ApprovalItem | null>(null);
  const [remarks, setRemarks] = useState('');

  const list = approvals.filter((a) =>
    filterTab === 'pending'
      ? a.status === 'Pending' || a.status === 'Clarification Requested' || a.status === 'Escalated'
      : true
  );

  const getProjName = (id?: string) => (id ? projects.find((p) => p.id === id)?.name || id : 'Company-Wide');

  const handleDecision = (decision: 'Approved' | 'Rejected' | 'Clarification Requested' | 'Escalated') => {
    if (!selected) return;
    const reasonText = remarks.trim() || `${decision} by ${user.name}`;
    const res = processApprovalItem(selected.id, decision, reasonText);
    if (res.ok) {
      setSelected(null);
      setRemarks('');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Approval Centre"
        subtitle="Centralized maker-checker queue for payroll runs, supplier invoices, contractor RA bills, reimbursements, advances, and site expenses."
      />

      <SegmentedTabs
        value={filterTab}
        onChange={setFilterTab}
        tabs={[
          { id: 'pending', label: 'Pending Action', count: approvals.filter((a) => a.status === 'Pending').length },
          { id: 'all', label: 'All Requests', count: approvals.length },
        ]}
      />

      <div className="space-y-3">
        {list.length === 0 ? (
          <SurfaceCard className="p-10 text-center text-xs text-[#64748B]">
            <CheckCircle2 className="w-7 h-7 text-[#16A34A] mx-auto mb-2" />
            All pending financial approvals have been processed.
          </SurfaceCard>
        ) : (
          list.map((item) => {
            const isCreator = item.createdByUserId === user.id && role.roleId !== 'company_admin';
            return (
              <SurfaceCard key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono-num text-xs font-bold text-[#2563EB]">{item.requestCode}</span>
                    <span className="text-xs font-medium text-[#64748B]">{item.category}</span>
                    <StatusTag status={item.status} />
                  </div>
                  <div className="text-sm font-bold text-[#172B4D]">{item.title}</div>
                  <div className="text-xs text-[#64748B]">
                    Requested by {item.requesterName} · {getProjName(item.projectId)} · Stage: <strong>{item.currentStage}</strong> · Due {item.deadline}
                  </div>
                  {isCreator && item.status === 'Pending' && (
                    <div className="text-[11px] text-[#D97706] flex items-center gap-1 pt-0.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Maker-checker: You initiated this item and cannot self-approve.</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <div className="sm:text-right">
                    <span className="text-[11px] text-[#64748B] block">Amount</span>
                    <span className="text-base font-bold font-mono-num text-[#172B4D]">{formatINR(item.amountPaise)}</span>
                  </div>
                  <Button
                    size="sm"
                    variant={item.status === 'Pending' ? 'primary' : 'outline'}
                    onClick={() => {
                      setSelected(item);
                      setRemarks('');
                    }}
                  >
                    {item.status === 'Pending' ? 'Review & Decide' : 'View History'}
                  </Button>
                </div>
              </SurfaceCard>
            );
          })
        )}
      </div>

      <SideSheet
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.requestCode} · ${selected.category}` : ''}
        subtitle={selected ? selected.title : ''}
        widthClass="max-w-xl"
      >
        {selected && (
          <div className="space-y-5 text-xs">
            <SurfaceCard className="p-4 space-y-2">
              <div className="flex justify-between"><span className="text-[#64748B]">Requester</span><span className="font-semibold">{selected.requesterName}</span></div>
              <div className="flex justify-between"><span className="text-[#64748B]">Project</span><span>{getProjName(selected.projectId)}</span></div>
              <div className="flex justify-between"><span className="text-[#64748B]">Current Stage</span><span className="font-semibold">{selected.currentStage}</span></div>
              <div className="flex justify-between"><span className="text-[#64748B]">Supporting Docs</span><span>{selected.supportingDocsCount} file(s) attached</span></div>
              <div className="flex justify-between pt-2 border-t border-slate-100 text-sm font-bold">
                <span>Approval Amount</span>
                <span className="font-mono-num text-[#2563EB]">{formatINR(selected.amountPaise)}</span>
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-4 space-y-3">
              <div className="font-bold text-[#172B4D]">Approval Audit Trail</div>
              <div className="space-y-2.5">
                {selected.history.map((h, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex justify-between font-semibold text-[#172B4D]">
                      <span>{h.stage} · {h.decision}</span>
                      <span className="font-mono-num text-[11px] text-[#64748B]">{h.timestamp.slice(0, 10)}</span>
                    </div>
                    <div className="text-[#64748B] mt-0.5">{h.actorName} ({h.actorRole}) — {h.reason}</div>
                  </div>
                ))}
              </div>
            </SurfaceCard>

            {selected.status === 'Pending' && (
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <InputField
                  label="Decision Remarks / Reason (Logged to Audit Trail)"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter approval remarks or rejection reason..."
                />
                <div className="flex flex-wrap gap-2">
                  <Button variant="success" onClick={() => handleDecision('Approved')}>Approve</Button>
                  <Button variant="outline" onClick={() => handleDecision('Clarification Requested')}>Request Clarification</Button>
                  <Button variant="outline" onClick={() => handleDecision('Escalated')}>Escalate</Button>
                  <Button variant="danger" onClick={() => handleDecision('Rejected')}>Reject</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </SideSheet>
    </div>
  );
}
