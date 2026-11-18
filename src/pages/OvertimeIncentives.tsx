import React, { useState } from 'react';
import { Clock, Plus } from 'lucide-react';
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
import { OvertimeRecord } from '../types/finance';

export default function OvertimeIncentives() {
  const overtimeRecords = useFinanceStore((s) => s.overtimeRecords);
  const incentiveRecords = useFinanceStore((s) => s.incentiveRecords);
  const employees = useFinanceStore((s) => s.employees);
  const workers = useFinanceStore((s) => s.workers);
  const projects = useFinanceStore((s) => s.projects);
  const sites = useFinanceStore((s) => s.sites);
  const submitOvertimeRecord = useFinanceStore((s) => s.submitOvertimeRecord);
  const advanceOvertimeStatus = useFinanceStore((s) => s.advanceOvertimeStatus);
  const approveIncentive = useFinanceStore((s) => s.approveIncentive);

  const [tab, setTab] = useState<'overtime' | 'incentives'>('overtime');
  const [modalOpen, setModalOpen] = useState(false);

  const [personKey, setPersonKey] = useState(`Employee:${employees[0]?.id}`);
  const [date, setDate] = useState('2026-11-17');
  const [hours, setHours] = useState('4');
  const [category, setCategory] = useState<OvertimeRecord['category']>('Night Shift Concrete Pour');
  const [rateRupees, setRateRupees] = useState('220');
  const [multiplier, setMultiplier] = useState('1.5');

  const handleSubmitOT = (e: React.FormEvent) => {
    e.preventDefault();
    const [pType, pId] = personKey.split(':');
    const emp = employees.find((x) => x.id === pId);
    const wrk = workers.find((x) => x.id === pId);
    const name = emp?.name || wrk?.name || 'Staff';
    const projectId = emp?.projectId || wrk?.assignedProjectId || projects[0].id;
    const siteId = emp?.siteId || wrk?.assignedSiteId || sites[0].id;

    submitOvertimeRecord({
      personId: pId,
      personName: name,
      personType: pType as 'Employee' | 'Worker',
      projectId,
      siteId,
      date,
      regularHours: 8,
      reportedOvertimeHours: Number(hours) || 0,
      category,
      hourlyRatePaise: toPaise(Number(rateRupees) || 0),
      multiplier: Number(multiplier) || 1.5,
    });
    setModalOpen(false);
  };

  const getProjName = (id: string) => projects.find((p) => p.id === id)?.name || id;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overtime & Incentives"
        subtitle="Multi-stage overtime verification (Submit → Site Verify → HR/Finance Approve) and construction milestone incentives."
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span>Log Overtime</span>
          </Button>
        }
      />

      <SegmentedTabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'overtime', label: 'Overtime Logs', count: overtimeRecords.length },
          { id: 'incentives', label: 'Incentives & Bonuses', count: incentiveRecords.length },
        ]}
      />

      {tab === 'overtime' ? (
        <SurfaceCard className="overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between text-xs text-[#64748B]">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Only <strong>Approved</strong> overtime hours enter final payroll calculations.
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3 px-4">Person</th>
                  <th className="py-3 px-4">Project & Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Reported / Approved</th>
                  <th className="py-3 px-4 text-right">Rate × Mult</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {overtimeRecords.map((ot) => (
                  <tr key={ot.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#172B4D]">{ot.personName}</div>
                      <div className="text-[11px] text-[#64748B]">{ot.personType}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-[#172B4D]">{getProjName(ot.projectId)}</div>
                      <div className="text-[11px] text-[#64748B] font-mono-num">{ot.date}</div>
                    </td>
                    <td className="py-3 px-4 text-[#172B4D]">{ot.category}</td>
                    <td className="py-3 px-4 text-right font-mono-num tabular-nums">
                      {ot.reportedOvertimeHours}h / <strong>{ot.approvedOvertimeHours}h</strong>
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num tabular-nums">
                      {formatINR(ot.hourlyRatePaise)} × {ot.multiplier}x
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num tabular-nums font-bold">
                      {formatINR(ot.calculatedAmountPaise)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusTag status={ot.approvalStatus} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        {ot.approvalStatus === 'Submitted' && (
                          <Button size="sm" variant="outline" onClick={() => advanceOvertimeStatus(ot.id, 'Site Verified')}>
                            Site Verify
                          </Button>
                        )}
                        {(ot.approvalStatus === 'Submitted' || ot.approvalStatus === 'Site Verified') && (
                          <Button size="sm" onClick={() => advanceOvertimeStatus(ot.id, 'Approved')}>
                            Approve OT
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {incentiveRecords.map((inc) => (
            <SurfaceCard key={inc.id} className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-bold text-[#172B4D]">{inc.personName}</div>
                  <div className="text-xs text-[#64748B]">{inc.type} · {inc.effectivePeriod} · Ref {inc.supportingRef}</div>
                </div>
                <StatusTag status={inc.status} />
              </div>
              <p className="text-xs text-[#172B4D] bg-slate-50 p-3 rounded-lg border border-slate-100">
                {inc.ruleDescription}
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-base font-bold font-mono-num text-[#16A34A]">{formatINR(inc.amountPaise)}</span>
                {inc.status === 'Pending Approval' && (
                  <Button size="sm" onClick={() => approveIncentive(inc.id)}>Approve Incentive</Button>
                )}
              </div>
            </SurfaceCard>
          ))}
        </div>
      )}

      <ModalDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Log Site Overtime Record"
        subtitle="Submitted overtime requires Site Manager verification and HR/Finance approval before payroll inclusion."
      >
        <form onSubmit={handleSubmitOT} className="space-y-4">
          <SelectField label="Employee / Worker" value={personKey} onChange={(e) => setPersonKey(e.target.value)}>
            {employees.map((e) => (
              <option key={e.id} value={`Employee:${e.id}`}>{e.name} ({e.employeeCode})</option>
            ))}
            {workers.map((w) => (
              <option key={w.id} value={`Worker:${w.id}`}>{w.name} ({w.workerCode})</option>
            ))}
          </SelectField>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            <InputField label="Overtime Hours" type="number" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} required />
          </div>
          <SelectField
            label="Overtime Category"
            value={category}
            onChange={(e) => setCategory(e.target.value as OvertimeRecord['category'])}
          >
            <option value="Night Shift Concrete Pour">Night Shift Concrete Pour</option>
            <option value="Weekday Extended">Weekday Extended</option>
            <option value="Sunday / Holiday">Sunday / Holiday</option>
            <option value="Emergency Breakdown">Emergency Breakdown</option>
          </SelectField>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Hourly Rate (₹)" type="number" value={rateRupees} onChange={(e) => setRateRupees(e.target.value)} required />
            <InputField label="Multiplier (e.g. 1.5 or 2.0)" type="number" step="0.25" value={multiplier} onChange={(e) => setMultiplier(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Submit Overtime</Button>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
}
