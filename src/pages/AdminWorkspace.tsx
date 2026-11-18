import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { History, Plus, Settings, ShieldCheck, Users } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import {
  Button,
  InputField,
  PageHeader,
  SegmentedTabs,
  SelectField,
  StatusTag,
  SurfaceCard,
} from '../components/ui/primitives';
import { ModalDialog } from '../components/ui/ModalDrawer';
import { formatINR, toPaise } from '../utils/currency';
import { ApprovalCategory, CompanySize, FinanceRoleId } from '../types/finance';
import { getRolesForCompanySize } from '../services/rbacService';

type AdminTab = 'workflows' | 'roles' | 'settings' | 'audit';

export default function AdminWorkspace() {
  const location = useLocation();
  const resolveTab = (path: string): AdminTab =>
    path.includes('roles-permissions')
      ? 'roles'
      : path.includes('finance-settings')
      ? 'settings'
      : path.includes('audit-logs')
      ? 'audit'
      : 'workflows';

  const [tab, setTab] = useState<AdminTab>(resolveTab(location.pathname));

  useEffect(() => {
    setTab(resolveTab(location.pathname));
  }, [location.pathname]);
  const [auditSearch, setAuditSearch] = useState('');
  const [wfModalOpen, setWfModalOpen] = useState(false);

  const company = useFinanceStore((s) => s.company);
  const roleConfigs = useFinanceStore((s) => s.roleConfigs);
  const makerCheckerEnabled = useFinanceStore((s) => s.makerCheckerEnabled);
  const workflowRules = useFinanceStore((s) => s.workflowRules);
  const auditLogs = useFinanceStore((s) => s.auditLogs);
  const switchCompanySize = useFinanceStore((s) => s.switchCompanySize);
  const updateRoleConfig = useFinanceStore((s) => s.updateRoleConfig);
  const toggleMakerChecker = useFinanceStore((s) => s.toggleMakerChecker);
  const updateCompanySettings = useFinanceStore((s) => s.updateCompanySettings);
  const addWorkflowRule = useFinanceStore((s) => s.addWorkflowRule);

  // Settings form
  const [compName, setCompName] = useState(company.name);
  const [gstin, setGstin] = useState(company.gstin);
  const [tan, setTan] = useState(company.tan);
  const [bankRef, setBankRef] = useState(company.primaryBankRef);

  // Workflow modal form
  const [wfCategory, setWfCategory] = useState<ApprovalCategory>('Supplier Invoice');
  const [wfName, setWfName] = useState('');
  const [wfMin, setWfMin] = useState('0');
  const [wfMax, setWfMax] = useState('500000');
  const [wfStages, setWfStages] = useState('Site GRN Verification, Finance Manager Approval');

  const rolesForTier = getRolesForCompanySize(company.size);

  const filteredLogs = useMemo(() => {
    const q = auditSearch.toLowerCase();
    return auditLogs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.userName.toLowerCase().includes(q) ||
        l.recordReference.toLowerCase().includes(q) ||
        l.module.toLowerCase().includes(q)
    );
  }, [auditLogs, auditSearch]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings({ name: compName, gstin, tan, primaryBankRef: bankRef });
  };

  const handleAddWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    addWorkflowRule({
      category: wfCategory,
      ruleName: wfName || `${wfCategory} Threshold Rule`,
      minAmountPaise: toPaise(Number(wfMin) || 0),
      maxAmountPaise: wfMax ? toPaise(Number(wfMax)) : null,
      stages: wfStages.split(',').map((s) => s.trim()).filter(Boolean),
      makerCheckerEnforced: true,
      active: true,
    });
    setWfModalOpen(false);
    setWfName('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administration, Controls & Audit"
        subtitle="Configure company size tier (Small/Medium/Large), finance & payroll RBAC, maker-checker rules, and immutable audit logs."
      />

      <SegmentedTabs<AdminTab>
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'workflows', label: 'Approval Workflows', count: workflowRules.length },
          { id: 'roles', label: 'Finance Roles & Permissions', count: rolesForTier.length },
          { id: 'settings', label: 'Finance Settings' },
          { id: 'audit', label: 'Audit Logs (Immutable)', count: auditLogs.length },
        ]}
      />

      {tab === 'workflows' && (
        <div className="space-y-4">
          <SurfaceCard className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold text-[#172B4D]">Strict Maker-Checker Separation</div>
                <p className="text-[#64748B]">
                  Prevents the creator of a payroll run, supplier invoice, or payment batch from approving or releasing the same record.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Button
                size="sm"
                variant={makerCheckerEnabled ? 'success' : 'outline'}
                onClick={() => toggleMakerChecker(!makerCheckerEnabled)}
              >
                {makerCheckerEnabled ? 'Maker-Checker: Enforced' : 'Maker-Checker: Disabled'}
              </Button>
              <Button size="sm" onClick={() => setWfModalOpen(true)}>
                <Plus className="w-3.5 h-3.5" />
                <span>Add Rule</span>
              </Button>
            </div>
          </SurfaceCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workflowRules.map((rule) => (
              <SurfaceCard key={rule.id} className="p-4 space-y-2.5 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-[#172B4D]">{rule.ruleName}</div>
                    <div className="text-[#64748B]">{rule.category}</div>
                  </div>
                  <StatusTag status={rule.active ? 'Active' : 'Inactive'} />
                </div>
                <div className="font-mono-num text-[#172B4D]">
                  Threshold: {formatINR(rule.minAmountPaise)} – {rule.maxAmountPaise ? formatINR(rule.maxAmountPaise) : 'Unlimited'}
                </div>
                <div className="pt-2 border-t border-slate-100 text-[#64748B]">
                  <strong>Stages:</strong> {rule.stages.join(' → ')}
                </div>
              </SurfaceCard>
            ))}
          </div>
        </div>
      )}

      {tab === 'roles' && (
        <div className="space-y-4">
          <SurfaceCard className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs">
              <div className="font-bold text-[#172B4D] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#2563EB]" />
                <span>Company Structure Size: {company.size.toUpperCase()}</span>
              </div>
              <p className="text-[#64748B] mt-0.5">
                Small firms allow one Finance Manager to oversee payroll & AP; Large enterprises enforce segregated Treasury, Tax, AP, and Audit roles.
              </p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              {(['small', 'medium', 'large'] as CompanySize[]).map((sz) => (
                <Button
                  key={sz}
                  size="sm"
                  variant={company.size === sz ? 'secondary' : 'outline'}
                  onClick={() => switchCompanySize(sz)}
                  className="capitalize"
                >
                  {sz}
                </Button>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4 text-center">View Salaries</th>
                    <th className="py-3 px-4 text-center">HR Notes</th>
                    <th className="py-3 px-4 text-center">Run Payroll</th>
                    <th className="py-3 px-4 text-center">Approve Payroll</th>
                    <th className="py-3 px-4 text-center">Release Bank Pay</th>
                    <th className="py-3 px-4 text-center">Approve Invoices</th>
                    <th className="py-3 px-4 text-right">Payment Limit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {rolesForTier.map((r) => {
                    const toggleField = (field: keyof Pick<typeof r, 'canViewConfidentialSalaries' | 'canViewEmployeeHRRecords' | 'canRunPayroll' | 'canApprovePayroll' | 'canReleasePayment' | 'canApproveInvoices'>) => {
                      updateRoleConfig(r.roleId as FinanceRoleId, { [field]: !r[field] });
                    };
                    return (
                      <tr key={r.roleId} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#172B4D]">{r.roleName}</div>
                          <div className="text-[11px] text-[#64748B] max-w-xs">{r.description}</div>
                        </td>
                        {(
                          [
                            'canViewConfidentialSalaries',
                            'canViewEmployeeHRRecords',
                            'canRunPayroll',
                            'canApprovePayroll',
                            'canReleasePayment',
                            'canApproveInvoices',
                          ] as const
                        ).map((field) => (
                          <td key={field} className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={r[field]}
                              onChange={() => toggleField(field)}
                              aria-label={`${r.roleName} ${field}`}
                              className="w-4 h-4 accent-[#2563EB] cursor-pointer"
                            />
                          </td>
                        ))}
                        <td className="py-3 px-4 text-right font-mono-num">
                          {r.paymentApprovalLimitPaise === -1
                            ? 'Unlimited'
                            : r.paymentApprovalLimitPaise === 0
                            ? '—'
                            : formatINR(r.paymentApprovalLimitPaise)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SurfaceCard>
        </div>
      )}

      {tab === 'settings' && (
        <SurfaceCard className="p-5 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-sm font-bold text-[#172B4D]">Organization Financial & Statutory Profile</h2>
          </div>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <InputField label="Company Display Name" value={compName} onChange={(e) => setCompName(e.target.value)} required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputField label="GSTIN" value={gstin} onChange={(e) => setGstin(e.target.value)} required />
              <InputField label="TAN (TDS)" value={tan} onChange={(e) => setTan(e.target.value)} required />
            </div>
            <InputField label="Primary Corporate Escrow Bank (Masked Ref)" value={bankRef} onChange={(e) => setBankRef(e.target.value)} required />
            <div className="flex justify-end">
              <Button type="submit">Save Finance Settings</Button>
            </div>
          </form>
        </SurfaceCard>
      )}

      {tab === 'audit' && (
        <SurfaceCard className="overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-sm font-bold text-[#172B4D]">Append-Only Financial Audit Trail</h2>
            </div>
            <input
              type="text"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder="Filter by user, action, ref..."
              className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg w-full sm:w-64"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3 px-4">Event & Timestamp</th>
                  <th className="py-3 px-4">Actor & Role</th>
                  <th className="py-3 px-4">Module & Ref</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Old → New Value</th>
                  <th className="py-3 px-4">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="font-mono-num font-semibold text-[#2563EB]">{log.eventCode}</div>
                      <div className="font-mono-num text-[11px] text-[#64748B]">{log.timestamp.slice(0, 19).replace('T', ' ')}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#172B4D]">{log.userName}</div>
                      <div className="text-[11px] text-[#64748B]">{log.userRole}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-[#172B4D]">{log.module}</div>
                      <div className="font-mono-num text-[11px] text-[#64748B]">{log.recordReference}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#172B4D]">{log.action}</td>
                    <td className="py-3 px-4">
                      <div className="text-[11px] text-[#64748B]">Old: {log.oldValue}</div>
                      <div className="text-[11px] text-[#172B4D] font-medium">New: {log.newValue}</div>
                    </td>
                    <td className="py-3 px-4 text-[#64748B]">{log.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SurfaceCard>
      )}

      <ModalDialog
        open={wfModalOpen}
        onClose={() => setWfModalOpen(false)}
        title="Add Approval Workflow Rule"
        subtitle="Define threshold-based approval stages enforced across BuildFlow."
      >
        <form onSubmit={handleAddWorkflow} className="space-y-4">
          <SelectField label="Category" value={wfCategory} onChange={(e) => setWfCategory(e.target.value as ApprovalCategory)}>
            <option value="Supplier Invoice">Supplier Invoice</option>
            <option value="Contractor Invoice">Contractor Invoice</option>
            <option value="Site Expense">Site Expense</option>
            <option value="Employee Reimbursement">Employee Reimbursement</option>
            <option value="Payroll Run">Payroll Run</option>
          </SelectField>
          <InputField label="Rule Name" value={wfName} onChange={(e) => setWfName(e.target.value)} placeholder="e.g., High-Value Steel Orders" required />
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Min Amount (₹)" type="number" value={wfMin} onChange={(e) => setWfMin(e.target.value)} required />
            <InputField label="Max Amount (₹, empty=unlimited)" type="number" value={wfMax} onChange={(e) => setWfMax(e.target.value)} />
          </div>
          <InputField label="Stages (comma separated)" value={wfStages} onChange={(e) => setWfStages(e.target.value)} required />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setWfModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Rule</Button>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
}
