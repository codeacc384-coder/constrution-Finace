import React, { useMemo, useState } from 'react';
import { Lock, Search, ShieldCheck, UserCheck } from 'lucide-react';
import { useCurrentUser, useFinanceStore } from '../store/useFinanceStore';
import {
  Button,
  EmptyState,
  InputField,
  PageHeader,
  SegmentedTabs,
  StatusTag,
  SurfaceCard,
} from '../components/ui/primitives';
import { SideSheet } from '../components/ui/ModalDrawer';
import { formatINR, toPaise } from '../utils/currency';
import { EmployeeRecord } from '../types/finance';

type ProfileTab =
  | 'overview'
  | 'structure'
  | 'earnings'
  | 'deductions'
  | 'advances'
  | 'attendance'
  | 'payslips'
  | 'payments';

export default function EmployeePayroll() {
  const { role } = useCurrentUser();
  const employees = useFinanceStore((s) => s.employees);
  const salaryStructures = useFinanceStore((s) => s.salaryStructures);
  const salaryHistory = useFinanceStore((s) => s.salaryHistory);
  const projects = useFinanceStore((s) => s.projects);
  const sites = useFinanceStore((s) => s.sites);
  const advances = useFinanceStore((s) => s.advances);
  const payslips = useFinanceStore((s) => s.payslips);
  const salaryBatches = useFinanceStore((s) => s.salaryBatches);
  const payrollRuns = useFinanceStore((s) => s.payrollRuns);
  const complianceRates = useFinanceStore((s) => s.complianceRates);
  const reviseEmployeeSalary = useFinanceStore((s) => s.reviseEmployeeSalary);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [reviseOpen, setReviseOpen] = useState(false);

  // Revision form state
  const [revBasic, setRevBasic] = useState('');
  const [revHra, setRevHra] = useState('');
  const [revConv, setRevConv] = useState('');
  const [revSiteAllow, setRevSiteAllow] = useState('');
  const [revSpecial, setRevSpecial] = useState('');
  const [revTds, setRevTds] = useState('');
  const [revDate, setRevDate] = useState('2026-12-01');
  const [revReason, setRevReason] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter(
      (e) =>
        (typeFilter === 'ALL' || e.employmentType === typeFilter) &&
        (e.name.toLowerCase().includes(q) ||
          e.employeeCode.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q) ||
          e.designation.toLowerCase().includes(q))
    );
  }, [employees, search, typeFilter]);

  const selectedEmp: EmployeeRecord | undefined = employees.find((e) => e.id === selectedEmpId);
  const selectedStruct = salaryStructures.find((s) => s.id === selectedEmp?.currentSalaryStructureId);
  const latestRunItem = payrollRuns[0]?.items.find((i) => i.personId === selectedEmpId);

  const openProfile = (emp: EmployeeRecord) => {
    setSelectedEmpId(emp.id);
    setActiveTab('overview');
    setReviseOpen(false);
    const st = salaryStructures.find((s) => s.id === emp.currentSalaryStructureId);
    if (st) {
      setRevBasic(String(st.basicPaise / 100));
      setRevHra(String(st.hraPaise / 100));
      setRevConv(String(st.conveyanceAllowancePaise / 100));
      setRevSiteAllow(String(st.siteAllowancePaise / 100));
      setRevSpecial(String(st.specialAllowancePaise / 100));
      setRevTds(String(st.tdsMonthlyPaise / 100));
    }
  };

  const handleSaveRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;
    reviseEmployeeSalary(selectedEmp.id, {
      basicPaise: toPaise(Number(revBasic) || 0),
      hraPaise: toPaise(Number(revHra) || 0),
      conveyanceAllowancePaise: toPaise(Number(revConv) || 0),
      siteAllowancePaise: toPaise(Number(revSiteAllow) || 0),
      specialAllowancePaise: toPaise(Number(revSpecial) || 0),
      tdsMonthlyPaise: toPaise(Number(revTds) || 0),
      effectiveFrom: revDate,
      reason: revReason || 'Salary Structure Revision',
    });
    setReviseOpen(false);
    setRevReason('');
  };

  const empHistory = salaryHistory.filter((h) => h.employeeId === selectedEmpId);
  const empAdvances = advances.filter((a) => a.personId === selectedEmpId);
  const empPayslips = payslips.filter((p) => p.employeeId === selectedEmpId);
  const empPayments = salaryBatches.flatMap((b) =>
    b.transactions.filter((t) => t.personId === selectedEmpId).map((t) => ({ ...t, period: b.periodLabel }))
  );

  const getProjName = (id: string) => projects.find((p) => p.id === id)?.name || id;
  const getSiteName = (id: string) => sites.find((s) => s.id === id)?.name || id;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Payroll Management"
        subtitle="Salaried engineering, site operations, and office personnel directory with versioned salary structures."
      />

      {!role.canViewConfidentialSalaries && (
        <SurfaceCard className="p-4 bg-amber-50/70 border-amber-200 flex items-center gap-3">
          <Lock className="w-4 h-4 text-[#D97706] shrink-0" />
          <p className="text-xs text-[#172B4D]">
            Confidential salary breakdowns are masked for <strong>{role.roleName}</strong>. Only authorized payroll/finance leads can inspect compensation details.
          </p>
        </SurfaceCard>
      )}

      {/* Search & Filter */}
      <SurfaceCard className="p-3.5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by employee ID, name, department..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#2563EB]"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-10 px-3 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg"
        >
          <option value="ALL">All Employment Types</option>
          <option value="Monthly Salaried">Monthly Salaried</option>
          <option value="Contractual">Contractual</option>
          <option value="Project-Based">Project-Based</option>
        </select>
      </SurfaceCard>

      {/* Desktop Table */}
      <SurfaceCard className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Dept & Designation</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Assigned Project</th>
                <th className="py-3 px-4 text-right">Gross Earnings</th>
                <th className="py-3 px-4 text-right">Deductions</th>
                <th className="py-3 px-4 text-right">Net Payable</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map((emp) => {
                const runItem = payrollRuns[0]?.items.find((i) => i.personId === emp.id);
                return (
                  <tr
                    key={emp.id}
                    onClick={() => openProfile(emp)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#172B4D]">{emp.name}</div>
                      <div className="text-[11px] font-mono-num text-[#64748B]">{emp.employeeCode}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-[#172B4D]">{emp.designation}</div>
                      <div className="text-[11px] text-[#64748B]">{emp.department}</div>
                    </td>
                    <td className="py-3 px-4 text-[#64748B]">{emp.employmentType}</td>
                    <td className="py-3 px-4 text-[#172B4D]">{getProjName(emp.projectId)}</td>
                    <td className="py-3 px-4 text-right font-mono-num tabular-nums">
                      {role.canViewConfidentialSalaries ? formatINR(runItem?.grossEarningsPaise || 0) : '••••••'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num tabular-nums text-[#64748B]">
                      {role.canViewConfidentialSalaries ? formatINR(runItem?.totalDeductionsPaise || 0) : '••••'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num tabular-nums font-semibold text-[#172B4D]">
                      {role.canViewConfidentialSalaries ? formatINR(runItem?.netPayablePaise || 0) : '••••••'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusTag status={emp.bankVerified ? emp.status : 'Bank Unverified'} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openProfile(emp); }}>
                        Inspect
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <EmptyState
            icon={UserCheck}
            title="No employees match your filter"
            description="Adjust the search query or employment type filter."
          />
        )}
      </SurfaceCard>

      {/* Mobile Stacked Employee Cards (No horizontal overflow on 360px/390px) */}
      <div className="md:hidden space-y-3">
        {filtered.map((emp) => {
          const runItem = payrollRuns[0]?.items.find((i) => i.personId === emp.id);
          return (
            <SurfaceCard key={emp.id} className="p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#172B4D] truncate">{emp.name}</div>
                  <div className="text-xs text-[#64748B]">
                    {emp.employeeCode} · {emp.designation}
                  </div>
                </div>
                <StatusTag status={emp.status} />
              </div>
              <div className="text-xs text-[#64748B]">
                {getProjName(emp.projectId)} · {emp.employmentType}
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#64748B] block">Net Payable (Nov)</span>
                  <span className="text-sm font-mono-num font-bold text-[#172B4D]">
                    {role.canViewConfidentialSalaries ? formatINR(runItem?.netPayablePaise || 0) : 'Restricted'}
                  </span>
                </div>
                <Button size="sm" variant="outline" onClick={() => openProfile(emp)}>
                  Open Profile
                </Button>
              </div>
            </SurfaceCard>
          );
        })}
      </div>

      {/* 8-Tab Employee Payroll Profile Sheet */}
      <SideSheet
        open={Boolean(selectedEmp)}
        onClose={() => setSelectedEmpId(null)}
        title={selectedEmp ? `${selectedEmp.name} (${selectedEmp.employeeCode})` : ''}
        subtitle={
          selectedEmp
            ? `${selectedEmp.designation} · ${selectedEmp.department} · ${getProjName(selectedEmp.projectId)}`
            : ''
        }
      >
        {selectedEmp && (
          <div className="space-y-5">
            <div className="overflow-x-auto pb-1">
              <SegmentedTabs<ProfileTab>
                value={activeTab}
                onChange={setActiveTab}
                tabs={[
                  { id: 'overview', label: 'Overview' },
                  { id: 'structure', label: 'Salary Structure' },
                  { id: 'earnings', label: 'Earnings' },
                  { id: 'deductions', label: 'Deductions' },
                  { id: 'advances', label: 'Advances', count: empAdvances.length },
                  { id: 'attendance', label: 'Attendance' },
                  { id: 'payslips', label: 'Payslips', count: empPayslips.length },
                  { id: 'payments', label: 'Payment History', count: empPayments.length },
                ]}
              />
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <SurfaceCard className="p-4 space-y-2">
                    <div className="font-bold text-[#172B4D]">Employment & Site Assignment</div>
                    <div className="flex justify-between"><span className="text-[#64748B]">Employment Type</span><span>{selectedEmp.employmentType}</span></div>
                    <div className="flex justify-between"><span className="text-[#64748B]">Date of Joining</span><span>{selectedEmp.dateOfJoining}</span></div>
                    <div className="flex justify-between"><span className="text-[#64748B]">Assigned Site</span><span>{getSiteName(selectedEmp.siteId)}</span></div>
                    <div className="flex justify-between"><span className="text-[#64748B]">Status</span><StatusTag status={selectedEmp.status} /></div>
                  </SurfaceCard>
                  <SurfaceCard className="p-4 space-y-2">
                    <div className="font-bold text-[#172B4D]">Banking & Statutory IDs</div>
                    <div className="flex justify-between"><span className="text-[#64748B]">Bank Account</span><span className="font-mono-num">{selectedEmp.bankAccountMasked}</span></div>
                    <div className="flex justify-between"><span className="text-[#64748B]">IFSC Code</span><span className="font-mono-num">{selectedEmp.bankIfsc}</span></div>
                    <div className="flex justify-between"><span className="text-[#64748B]">UAN (EPF)</span><span className="font-mono-num">{selectedEmp.uanNumber}</span></div>
                    <div className="flex justify-between"><span className="text-[#64748B]">PAN</span><span className="font-mono-num">{selectedEmp.panMasked}</span></div>
                  </SurfaceCard>
                </div>

                <SurfaceCard className="p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#172B4D] mb-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                    <span>Confidential HR Notes</span>
                  </div>
                  {role.canViewEmployeeHRRecords ? (
                    <p className="text-xs text-[#64748B]">
                      {selectedEmp.confidentialHrNotes || 'No confidential HR remarks logged.'}
                    </p>
                  ) : (
                    <p className="text-xs text-[#D97706]">
                      Access Denied: {role.roleName} cannot view confidential employee HR records (segregation of duties).
                    </p>
                  )}
                </SurfaceCard>
              </div>
            )}

            {activeTab === 'structure' && (
              <div className="space-y-4">
                {!role.canViewConfidentialSalaries ? (
                  <SurfaceCard className="p-6 text-center text-xs text-[#64748B]">
                    Salary structure details are restricted for your role.
                  </SurfaceCard>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-[#172B4D]">
                          Active Salary Structure (Eff. {selectedStruct?.effectiveFrom})
                        </div>
                        <div className="text-xs text-[#64748B]">
                          Approved by {selectedStruct?.approvedBy} · {selectedStruct?.revisionReason}
                        </div>
                      </div>
                      {role.canApprovePayroll && (
                        <Button size="sm" variant="outline" onClick={() => setReviseOpen((v) => !v)}>
                          {reviseOpen ? 'Cancel Revision' : 'Revise Salary'}
                        </Button>
                      )}
                    </div>

                    {reviseOpen && (
                      <form onSubmit={handleSaveRevision} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <div className="text-xs font-bold text-[#172B4D]">
                          New Effective Salary Revision (Historical version preserved automatically)
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <InputField label="Basic (₹)" type="number" value={revBasic} onChange={(e) => setRevBasic(e.target.value)} required />
                          <InputField label="HRA (₹)" type="number" value={revHra} onChange={(e) => setRevHra(e.target.value)} required />
                          <InputField label="Conveyance (₹)" type="number" value={revConv} onChange={(e) => setRevConv(e.target.value)} required />
                          <InputField label="Site Allowance (₹)" type="number" value={revSiteAllow} onChange={(e) => setRevSiteAllow(e.target.value)} required />
                          <InputField label="Special Allow (₹)" type="number" value={revSpecial} onChange={(e) => setRevSpecial(e.target.value)} required />
                          <InputField label="Monthly TDS (₹)" type="number" value={revTds} onChange={(e) => setRevTds(e.target.value)} required />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <InputField label="Effective From Date" type="date" value={revDate} onChange={(e) => setRevDate(e.target.value)} required />
                          <InputField label="Revision Reason" value={revReason} onChange={(e) => setRevReason(e.target.value)} placeholder="e.g., Mid-year site hardship revision" required />
                        </div>
                        <div className="flex justify-end">
                          <Button type="submit" size="sm">Save New Salary Version</Button>
                        </div>
                      </form>
                    )}

                    {selectedStruct && (
                      <SurfaceCard className="p-4 space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-[#64748B]">Basic Salary</span><span className="font-mono-num font-semibold">{formatINR(selectedStruct.basicPaise)}</span></div>
                        <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-[#64748B]">HRA</span><span className="font-mono-num">{formatINR(selectedStruct.hraPaise)}</span></div>
                        <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-[#64748B]">Conveyance Allowance</span><span className="font-mono-num">{formatINR(selectedStruct.conveyanceAllowancePaise)}</span></div>
                        <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-[#64748B]">Site Allowance</span><span className="font-mono-num">{formatINR(selectedStruct.siteAllowancePaise)}</span></div>
                        <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-[#64748B]">Special Allowance</span><span className="font-mono-num">{formatINR(selectedStruct.specialAllowancePaise)}</span></div>
                        <div className="flex justify-between pt-2 font-bold text-[#172B4D]">
                          <span>Monthly Gross CTC Base</span>
                          <span className="font-mono-num">
                            {formatINR(
                              selectedStruct.basicPaise +
                                selectedStruct.hraPaise +
                                selectedStruct.conveyanceAllowancePaise +
                                selectedStruct.siteAllowancePaise +
                                selectedStruct.specialAllowancePaise
                            )}
                          </span>
                        </div>
                      </SurfaceCard>
                    )}

                    <div>
                      <div className="text-xs font-bold text-[#172B4D] mb-2">Preserved Salary Structure History</div>
                      {empHistory.length === 0 ? (
                        <p className="text-xs text-[#64748B]">No prior salary revisions recorded for this employee.</p>
                      ) : (
                        <div className="space-y-2">
                          {empHistory.map((h) => (
                            <SurfaceCard key={h.id} className="p-3 text-xs flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-[#172B4D]">{h.effectiveFrom} to {h.effectiveTo}</div>
                                <div className="text-[#64748B]">{h.changeReason} · Changed by {h.changedBy}</div>
                              </div>
                              <div className="font-mono-num font-bold">{formatINR(h.grossMonthlyPaise)}/mo</div>
                            </SurfaceCard>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'earnings' && (
              <SurfaceCard className="p-4 space-y-2 text-xs">
                <div className="font-bold text-[#172B4D] mb-2">November 2026 Computed Earnings</div>
                {!role.canViewConfidentialSalaries ? (
                  <p className="text-[#64748B]">Restricted by salary permission policy.</p>
                ) : (
                  latestRunItem?.earnings.map((er, i) => (
                    <div key={i} className="flex justify-between py-1.5 border-b border-slate-100">
                      <span>{er.label}</span>
                      <span className="font-mono-num font-semibold">{formatINR(er.amountPaise)}</span>
                    </div>
                  ))
                )}
                {role.canViewConfidentialSalaries && latestRunItem && (
                  <div className="flex justify-between pt-2 font-bold text-sm text-[#172B4D]">
                    <span>Gross Earnings</span>
                    <span className="font-mono-num">{formatINR(latestRunItem.grossEarningsPaise)}</span>
                  </div>
                )}
              </SurfaceCard>
            )}

            {activeTab === 'deductions' && (
              <SurfaceCard className="p-4 space-y-2 text-xs">
                <div className="font-bold text-[#172B4D] mb-2">
                  Statutory & Authorized Deductions ({complianceRates.versionTag})
                </div>
                {!role.canViewConfidentialSalaries ? (
                  <p className="text-[#64748B]">Restricted by salary permission policy.</p>
                ) : (
                  latestRunItem?.deductions.map((de, i) => (
                    <div key={i} className="flex justify-between py-1.5 border-b border-slate-100">
                      <span>{de.label}</span>
                      <span className="font-mono-num text-[#DC2626]">-{formatINR(de.amountPaise)}</span>
                    </div>
                  ))
                )}
                {role.canViewConfidentialSalaries && latestRunItem && (
                  <div className="flex justify-between pt-2 font-bold text-sm text-[#172B4D]">
                    <span>Net Payable</span>
                    <span className="font-mono-num text-[#16A34A]">{formatINR(latestRunItem.netPayablePaise)}</span>
                  </div>
                )}
              </SurfaceCard>
            )}

            {activeTab === 'advances' && (
              <div className="space-y-3">
                {empAdvances.length === 0 ? (
                  <EmptyState title="No Active Advances" description="This employee has no salary advance or loan records." />
                ) : (
                  empAdvances.map((adv) => (
                    <SurfaceCard key={adv.id} className="p-4 text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="font-mono-num font-bold text-[#2563EB]">{adv.advanceCode}</span>
                        <StatusTag status={adv.status} />
                      </div>
                      <div className="text-[#64748B]">{adv.reason}</div>
                      <div className="flex justify-between pt-1">
                        <span>Disbursed: <strong className="font-mono-num">{formatINR(adv.disbursedAmountPaise)}</strong></span>
                        <span>Outstanding: <strong className="font-mono-num text-[#D97706]">{formatINR(adv.outstandingAmountPaise)}</strong></span>
                      </div>
                    </SurfaceCard>
                  ))
                )}
              </div>
            )}

            {activeTab === 'attendance' && (
              <SurfaceCard className="p-4 text-xs space-y-2">
                <div className="font-bold text-[#172B4D]">November 2026 Attendance Summary</div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-[#64748B]">Attendance Reference</span>
                  <span className="font-mono-num">{latestRunItem?.attendanceRef || 'ATT-NOV'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-[#64748B]">Approved Payable Days</span>
                  <span className="font-mono-num font-semibold">{latestRunItem?.payableDays || 26} / 26 days</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#64748B]">Verification Status</span>
                  <StatusTag status="Verified" />
                </div>
              </SurfaceCard>
            )}

            {activeTab === 'payslips' && (
              <div className="space-y-2.5">
                {empPayslips.length === 0 ? (
                  <EmptyState title="No Payslips Issued Yet" description="Payslips appear once a payroll run is locked." />
                ) : (
                  empPayslips.map((ps) => (
                    <SurfaceCard key={ps.id} className="p-3.5 text-xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-[#172B4D]">{ps.periodLabel} · {ps.payslipNumber}</div>
                        <div className="text-[#64748B]">Issued {ps.generatedAt.slice(0, 10)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono-num font-bold text-[#172B4D]">
                          {role.canViewConfidentialSalaries ? formatINR(ps.netPayPaise) : 'Restricted'}
                        </div>
                        <StatusTag status={ps.paymentStatus} className="mt-1" />
                      </div>
                    </SurfaceCard>
                  ))
                )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-2.5">
                {empPayments.length === 0 ? (
                  <EmptyState title="No Bank Transfers Recorded" description="Payment history populates once salary batches execute." />
                ) : (
                  empPayments.map((tx) => (
                    <SurfaceCard key={tx.id} className="p-3.5 text-xs flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-[#172B4D]">{tx.period}</div>
                        <div className="font-mono-num text-[#64748B]">{tx.paymentReference} · {tx.transactionDate}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono-num font-bold">
                          {role.canViewConfidentialSalaries ? formatINR(tx.netPayablePaise) : 'Restricted'}
                        </div>
                        <StatusTag status={tx.transferStatus} className="mt-1" />
                      </div>
                    </SurfaceCard>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </SideSheet>
    </div>
  );
}
