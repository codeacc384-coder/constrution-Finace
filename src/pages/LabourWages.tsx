import React, { useMemo, useState } from 'react';
import { ArrowRightLeft, CheckCircle2, Hammer, Search } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import {
  Button,
  KpiStatCard,
  PageHeader,
  StatusTag,
  SurfaceCard,
} from '../components/ui/primitives';
import { SideSheet } from '../components/ui/ModalDrawer';
import { calculateWorkerWage } from '../services/payrollEngine';
import { formatINR } from '../utils/currency';
import { LabourWorkerRecord } from '../types/finance';

export default function LabourWages() {
  const workers = useFinanceStore((s) => s.workers);
  const projects = useFinanceStore((s) => s.projects);
  const sites = useFinanceStore((s) => s.sites);
  const verifyWorkerAttendance = useFinanceStore((s) => s.verifyWorkerAttendance);
  const verifyWorkerBank = useFinanceStore((s) => s.verifyWorkerBank);

  const [search, setSearch] = useState('');
  const [wageTypeFilter, setWageTypeFilter] = useState('ALL');
  const [selectedWorker, setSelectedWorker] = useState<LabourWorkerRecord | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return workers.filter(
      (w) =>
        (wageTypeFilter === 'ALL' || w.wageType === wageTypeFilter) &&
        (w.name.toLowerCase().includes(q) ||
          w.workerCode.toLowerCase().includes(q) ||
          w.trade.toLowerCase().includes(q))
    );
  }, [workers, search, wageTypeFilter]);

  const totals = useMemo(() => {
    let verifiedPayablePaise = 0;
    let unverifiedHoldPaise = 0;
    let transferWorkers = 0;
    workers.forEach((w) => {
      const calc = calculateWorkerWage(w);
      if (w.attendanceVerified) verifiedPayablePaise += calc.grossWagePaise;
      else unverifiedHoldPaise += calc.grossWagePaise;
      if (w.siteTransfers.length > 1) transferWorkers++;
    });
    return { verifiedPayablePaise, unverifiedHoldPaise, transferWorkers };
  }, [workers]);

  const getProjName = (id: string) => projects.find((p) => p.id === id)?.name || id;
  const getSiteName = (id: string) => sites.find((s) => s.id === id)?.name || id;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Labour Wage Management"
        subtitle="Construction workforce wage workspace supporting Daily, Hourly, Weekly, Piece-Rate, and multi-site transfer cost allocations."
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiStatCard label="Total Muster Workers" value={String(workers.length)} subtext="Active trades across 5 sites" />
        <KpiStatCard
          label="Verified Payable Wages"
          value={formatINR(totals.verifiedPayablePaise)}
          subtext="Approved attendance only"
          tone="success"
        />
        <KpiStatCard
          label="Unverified Attendance Hold"
          value={formatINR(totals.unverifiedHoldPaise)}
          subtext="Excluded from final payroll until verified"
          tone={totals.unverifiedHoldPaise > 0 ? 'warning' : 'neutral'}
        />
        <KpiStatCard
          label="Multi-Site Transfer Splits"
          value={String(totals.transferWorkers)}
          subtext="Proportionally allocated across sites"
          tone="info"
        />
      </div>

      {/* Filters */}
      <SurfaceCard className="p-3.5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search worker ID, name, trade (Mason, Bar Bender)..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#2563EB]"
          />
        </div>
        <select
          value={wageTypeFilter}
          onChange={(e) => setWageTypeFilter(e.target.value)}
          className="h-10 px-3 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg"
        >
          <option value="ALL">All Wage Types</option>
          <option value="Daily">Daily Wage</option>
          <option value="Hourly">Hourly Wage</option>
          <option value="Weekly">Weekly Wage</option>
          <option value="Piece-Rate">Piece-Rate</option>
        </select>
      </SurfaceCard>

      {/* Desktop Labour Table */}
      <SurfaceCard className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                <th className="py-3 px-4">Worker</th>
                <th className="py-3 px-4">Trade & Skill</th>
                <th className="py-3 px-4">Site & Project</th>
                <th className="py-3 px-4">Wage Formula Breakdown</th>
                <th className="py-3 px-4 text-right">OT Pay</th>
                <th className="py-3 px-4 text-right">Gross Wage</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map((w) => {
                const calc = calculateWorkerWage(w);
                return (
                  <tr key={w.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#172B4D]">{w.name}</div>
                      <div className="text-[11px] font-mono-num text-[#64748B]">{w.workerCode}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-[#172B4D]">{w.trade}</div>
                      <div className="text-[11px] text-[#64748B]">{w.skillCategory} · {w.wageType}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-[#172B4D]">{getSiteName(w.assignedSiteId)}</div>
                      <div className="text-[11px] text-[#64748B] flex items-center gap-1">
                        <span>{getProjName(w.assignedProjectId)}</span>
                        {w.siteTransfers.length > 1 && (
                          <span className="text-[#2563EB] font-medium inline-flex items-center gap-0.5">
                            · <ArrowRightLeft className="w-3 h-3" /> Split ({w.siteTransfers.length})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono-num text-[11px] text-[#172B4D]">
                      {calc.formulaText}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num tabular-nums">
                      {formatINR(calc.overtimePaise)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num tabular-nums font-bold text-[#172B4D]">
                      {formatINR(calc.grossWagePaise)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <StatusTag status={w.attendanceVerified ? 'Attendance Verified' : 'Unverified Attendance'} />
                        {!w.bankVerified && <StatusTag status="Bank Missing" tone="danger" />}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!w.attendanceVerified && (
                          <Button size="sm" variant="outline" onClick={() => verifyWorkerAttendance(w.id)}>
                            Verify Muster
                          </Button>
                        )}
                        {!w.bankVerified && (
                          <Button size="sm" variant="outline" onClick={() => verifyWorkerBank(w.id)}>
                            Verify Bank
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setSelectedWorker(w)}>
                          Breakdown
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SurfaceCard>

      {/* Mobile Stacked Worker Cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((w) => {
          const calc = calculateWorkerWage(w);
          return (
            <SurfaceCard key={w.id} className="p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-bold text-[#172B4D]">{w.name}</div>
                  <div className="text-xs text-[#64748B]">{w.workerCode} · {w.trade} ({w.wageType})</div>
                </div>
                <StatusTag status={w.attendanceVerified ? 'Verified' : 'Unverified'} />
              </div>
              <div className="text-xs font-mono-num text-[#172B4D] bg-slate-50 p-2 rounded-lg">
                {calc.formulaText}
              </div>
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[11px] text-[#64748B] block">Gross Wage</span>
                  <span className="text-sm font-mono-num font-bold text-[#172B4D]">{formatINR(calc.grossWagePaise)}</span>
                </div>
                <div className="flex gap-1.5">
                  {!w.attendanceVerified && (
                    <Button size="sm" variant="outline" onClick={() => verifyWorkerAttendance(w.id)}>Verify</Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setSelectedWorker(w)}>Details</Button>
                </div>
              </div>
            </SurfaceCard>
          );
        })}
      </div>

      {/* Worker Wage & Site Transfer Allocation Drawer */}
      <SideSheet
        open={Boolean(selectedWorker)}
        onClose={() => setSelectedWorker(null)}
        title={selectedWorker ? `${selectedWorker.name} · Wage Breakdown` : ''}
        subtitle={selectedWorker ? `${selectedWorker.workerCode} · ${selectedWorker.trade} · Supervisor: ${selectedWorker.supervisorName}` : ''}
        widthClass="max-w-xl"
      >
        {selectedWorker && (() => {
          const calc = calculateWorkerWage(selectedWorker);
          return (
            <div className="space-y-5">
              <SurfaceCard className="p-4 space-y-2.5 text-xs">
                <div className="font-bold text-[#172B4D] flex items-center gap-2">
                  <Hammer className="w-4 h-4 text-[#2563EB]" />
                  <span>Wage Calculation Traceability</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-[#64748B]">Formula</span>
                  <span className="font-mono-num font-medium">{calc.formulaText}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-[#64748B]">Base Wage</span>
                  <span className="font-mono-num">{formatINR(calc.baseWagePaise)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-[#64748B]">Approved Overtime ({selectedWorker.approvedOvertimeHours} hrs)</span>
                  <span className="font-mono-num">{formatINR(calc.overtimePaise)}</span>
                </div>
                <div className="flex justify-between pt-1 text-sm font-bold text-[#172B4D]">
                  <span>Total Gross Wage</span>
                  <span className="font-mono-num text-[#16A34A]">{formatINR(calc.grossWagePaise)}</span>
                </div>
              </SurfaceCard>

              <SurfaceCard className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#172B4D]">Project & Site Cost Allocation</div>
                    <div className="text-[11px] text-[#64748B]">
                      {selectedWorker.siteTransfers.length > 1
                        ? 'Worker transferred mid-period — costs allocated proportionally by verified attendance.'
                        : '100% allocated to assigned project site.'}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {calc.siteAllocations.map((alloc) => (
                    <div key={alloc.siteId} className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-xs flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-[#172B4D]">{alloc.siteName}</div>
                        <div className="text-[11px] text-[#64748B]">
                          {alloc.projectName} · {alloc.attendanceSummary} ({alloc.sharePercent}%)
                        </div>
                      </div>
                      <div className="font-mono-num font-bold text-[#172B4D]">
                        {formatINR(alloc.allocatedAmountPaise)}
                      </div>
                    </div>
                  ))}
                </div>
              </SurfaceCard>

              <div className="flex flex-wrap gap-2">
                {!selectedWorker.attendanceVerified && (
                  <Button
                    onClick={() => {
                      verifyWorkerAttendance(selectedWorker.id);
                      setSelectedWorker({ ...selectedWorker, attendanceVerified: true });
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify Site Attendance</span>
                  </Button>
                )}
                {!selectedWorker.bankVerified && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      verifyWorkerBank(selectedWorker.id);
                      setSelectedWorker({ ...selectedWorker, bankVerified: true });
                    }}
                  >
                    <span>Verify Bank Details</span>
                  </Button>
                )}
              </div>
            </div>
          );
        })()}
      </SideSheet>
    </div>
  );
}
