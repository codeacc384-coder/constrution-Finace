import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  CheckCircle2,
  Lock,
  Play,
  ShieldCheck,
} from 'lucide-react';
import { useCurrentUser, useFinanceStore } from '../store/useFinanceStore';
import {
  Button,
  PageHeader,
  StatusTag,
  SurfaceCard,
} from '../components/ui/primitives';
import { SideSheet } from '../components/ui/ModalDrawer';
import { formatINR } from '../utils/currency';
import { PayrollRunEmployee } from '../types/finance';

const WIZARD_STEPS = [
  '1. Payroll Period',
  '2. Scope & Workers',
  '3. Attendance & Wages',
  '4. Earnings & Deductions',
  '5. Exceptions',
  '6. Summary',
  '7. Submit Approval',
];

export default function PayrollProcessing() {
  const navigate = useNavigate();
  const { role } = useCurrentUser();

  const payrollPeriods = useFinanceStore((s) => s.payrollPeriods);
  const branches = useFinanceStore((s) => s.branches);
  const projects = useFinanceStore((s) => s.projects);
  const employees = useFinanceStore((s) => s.employees);
  const workers = useFinanceStore((s) => s.workers);
  const payrollRuns = useFinanceStore((s) => s.payrollRuns);
  const createPayrollRun = useFinanceStore((s) => s.createPayrollRun);
  const resolvePayrollException = useFinanceStore((s) => s.resolvePayrollException);
  const submitPayrollRunForApproval = useFinanceStore((s) => s.submitPayrollRunForApproval);
  const approveAndLockPayrollRun = useFinanceStore((s) => s.approveAndLockPayrollRun);

  const [selectedRunId, setSelectedRunId] = useState<string>(payrollRuns[0]?.id || '');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizPeriodId, setWizPeriodId] = useState(payrollPeriods[1]?.id || 'per_2026_11');
  const [wizBranchId, setWizBranchId] = useState<string>('ALL');
  const [wizProjectId, setWizProjectId] = useState<string>('ALL');
  const [inspectRow, setInspectRow] = useState<PayrollRunEmployee | null>(null);

  const activeRun = payrollRuns.find((r) => r.id === selectedRunId) || payrollRuns[0];

  const handleCalculateNewRun = () => {
    const newRun = createPayrollRun({
      periodId: wizPeriodId,
      branchId: wizBranchId,
      projectId: wizProjectId,
    });
    setSelectedRunId(newRun.id);
    setWizardStep(4); // Jump to Exceptions step in wizard
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Processing Engine"
        subtitle="7-step payroll calculation wizard, exception centre, maker-checker approval, and immutable payroll snapshot locking."
        actions={
          role.canRunPayroll && (
            <Button
              onClick={() => {
                setWizardOpen((v) => !v);
                setWizardStep(0);
              }}
            >
              <Calculator className="w-4 h-4" />
              <span>{wizardOpen ? 'Close Payroll Wizard' : 'Start New Payroll Run'}</span>
            </Button>
          )
        }
      />

      {/* 7-Step Payroll Wizard */}
      {wizardOpen && (
        <SurfaceCard className="p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#172B4D]">Multi-Step Payroll Calculation Wizard</h2>
              <p className="text-xs text-[#64748B]">Select scope, verify attendance/wage inputs, resolve exceptions, and submit for approval</p>
            </div>
            <span className="text-xs font-mono-num font-semibold text-[#2563EB]">
              Step {wizardStep + 1} of {WIZARD_STEPS.length}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
            {WIZARD_STEPS.map((label, idx) => (
              <button
                key={label}
                type="button"
                onClick={() => setWizardStep(idx)}
                className={`px-2.5 py-2 text-[11px] font-medium rounded-lg border text-left transition-colors cursor-pointer ${
                  wizardStep === idx
                    ? 'bg-[#101F35] text-white border-[#101F35]'
                    : idx < wizardStep
                    ? 'bg-emerald-50 text-[#15803D] border-emerald-200'
                    : 'bg-slate-50 text-[#64748B] border-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {wizardStep === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="block text-xs font-medium text-[#172B4D] mb-1.5">Select Payroll Period</span>
                <select
                  value={wizPeriodId}
                  onChange={(e) => setWizPeriodId(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg"
                >
                  {payrollPeriods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label} ({p.workingDays} working days · {p.status})
                    </option>
                  ))}
                </select>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="font-semibold text-[#172B4D]">Period Policy Check</div>
                <p className="text-[#64748B]">
                  Only verified site muster records, approved overtime, and active disbursed advances are included automatically.
                </p>
              </div>
            </div>
          )}

          {wizardStep === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="block text-xs font-medium text-[#172B4D] mb-1.5">Company Branch</span>
                <select
                  value={wizBranchId}
                  onChange={(e) => setWizBranchId(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg"
                >
                  <option value="ALL">All Branches ({branches.length})</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className="block text-xs font-medium text-[#172B4D] mb-1.5">Project Scope</span>
                <select
                  value={wizProjectId}
                  onChange={(e) => setWizProjectId(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg"
                >
                  <option value="ALL">All Projects ({projects.length})</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="text-xs space-y-2">
              <div className="font-semibold text-[#172B4D]">
                Eligible Roster Preview: {employees.length} Salaried Staff + {workers.length} Labour Workers
              </div>
              <p className="text-[#64748B]">
                Workers with unverified attendance ({workers.filter((w) => !w.attendanceVerified).length}) will be automatically flagged in the Exception Centre and excluded until verified.
              </p>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-xs">
                <div className="font-bold text-[#172B4D]">Execute Decimal-Safe Payroll Calculation</div>
                <p className="text-[#64748B] mt-0.5">
                  Computes Basic, HRA, Allowances, Approved OT, Incentives, EPF/ESI/PT/TDS, and Advance Recoveries in integer paise.
                </p>
              </div>
              <Button onClick={handleCalculateNewRun}>
                <Play className="w-4 h-4" />
                <span>Calculate Payroll Now</span>
              </Button>
            </div>
          )}

          {wizardStep === 4 && activeRun && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-[#172B4D]">
                Exception Centre for {activeRun.id} ({activeRun.unresolvedExceptionsCount} unresolved)
              </div>
              {activeRun.exceptions.length === 0 ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-[#15803D] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>All checks passed. Zero payroll exceptions detected.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeRun.exceptions.map((ex) => (
                    <div key={ex.id} className="p-3 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-semibold text-[#172B4D]">
                          {ex.personName} · {ex.category} ({ex.severity})
                        </div>
                        <div className="text-[#64748B] mt-0.5">{ex.description}</div>
                        {ex.resolved && (
                          <div className="text-[#16A34A] font-medium mt-1">
                            Resolved: {ex.resolutionAction} ({ex.resolvedBy})
                          </div>
                        )}
                      </div>
                      {!ex.resolved && (
                        <div className="flex flex-wrap gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              resolvePayrollException(activeRun.id, ex.id, 'Verify & Include in Run')
                            }
                          >
                            Verify & Include
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              resolvePayrollException(activeRun.id, ex.id, 'Place on Hold for Next Cycle')
                            }
                          >
                            Hold Payout
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {wizardStep === 5 && activeRun && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <SurfaceCard className="p-3.5">
                <span className="text-[#64748B]">Active Headcount</span>
                <div className="text-lg font-bold font-mono-num mt-1">{activeRun.totalHeadcount}</div>
              </SurfaceCard>
              <SurfaceCard className="p-3.5">
                <span className="text-[#64748B]">Total Gross</span>
                <div className="text-lg font-bold font-mono-num mt-1">{formatINR(activeRun.totalGrossPaise)}</div>
              </SurfaceCard>
              <SurfaceCard className="p-3.5">
                <span className="text-[#64748B]">Total Deductions</span>
                <div className="text-lg font-bold font-mono-num text-[#DC2626] mt-1">{formatINR(activeRun.totalDeductionsPaise)}</div>
              </SurfaceCard>
              <SurfaceCard className="p-3.5">
                <span className="text-[#64748B]">Net Payable</span>
                <div className="text-lg font-bold font-mono-num text-[#16A34A] mt-1">{formatINR(activeRun.totalNetPayablePaise)}</div>
              </SurfaceCard>
            </div>
          )}

          {wizardStep === 6 && activeRun && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs">
                <div className="font-bold text-[#172B4D]">Submit {activeRun.id} for Manager Approval</div>
                <p className="text-[#64748B] mt-0.5">
                  {activeRun.unresolvedExceptionsCount > 0
                    ? `Resolve remaining ${activeRun.unresolvedExceptionsCount} exception(s) in Step 5 or acknowledge holds before locking.`
                    : 'All exceptions handled. Ready for maker-checker manager approval.'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  disabled={activeRun.status === 'Locked' || activeRun.status === 'Paid'}
                  onClick={() => {
                    submitPayrollRunForApproval(activeRun.id);
                    setWizardOpen(false);
                  }}
                >
                  Submit for Approval
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              disabled={wizardStep === 0}
              onClick={() => setWizardStep((s) => Math.max(0, s - 1))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              disabled={wizardStep === WIZARD_STEPS.length - 1}
              onClick={() => setWizardStep((s) => Math.min(WIZARD_STEPS.length - 1, s + 1))}
            >
              Next Step
            </Button>
          </div>
        </SurfaceCard>
      )}

      {/* Run Selector & Actions Bar */}
      <SurfaceCard className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={activeRun?.id || ''}
            onChange={(e) => setSelectedRunId(e.target.value)}
            className="h-10 px-3 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg text-[#172B4D]"
          >
            {payrollRuns.map((run) => (
              <option key={run.id} value={run.id}>
                {run.id} · {run.periodLabel} ({run.status})
              </option>
            ))}
          </select>
          {activeRun && <StatusTag status={activeRun.status} />}
          {activeRun && (
            <span className="text-xs text-[#64748B]">
              Created by <strong>{activeRun.createdBy}</strong> · {activeRun.totalHeadcount} records
            </span>
          )}
        </div>

        {activeRun && (
          <div className="flex flex-wrap items-center gap-2">
            {(activeRun.status === 'Calculation Completed' || activeRun.status === 'Exceptions Found') && role.canRunPayroll && (
              <Button variant="outline" size="sm" onClick={() => submitPayrollRunForApproval(activeRun.id)}>
                Submit for Approval
              </Button>
            )}
            {(activeRun.status === 'Pending Approval' || activeRun.status === 'Calculation Completed') && (
              <Button size="sm" variant="success" onClick={() => approveAndLockPayrollRun(activeRun.id)}>
                <Lock className="w-3.5 h-3.5" />
                <span>Approve & Lock Snapshot</span>
              </Button>
            )}
            {activeRun.status === 'Locked' && (
              <Button size="sm" onClick={() => navigate('/salary-payments')}>
                <span>Proceed to Salary Payment Batch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        )}
      </SurfaceCard>

      {/* Exception Centre Banner for Selected Run */}
      {activeRun && activeRun.exceptions.length > 0 && (
        <SurfaceCard className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-[#172B4D]">
              <AlertTriangle className="w-4 h-4 text-[#D97706]" />
              <span>Payroll Exception Centre ({activeRun.unresolvedExceptionsCount} Open)</span>
            </div>
            <span className="text-xs text-[#64748B]">Exceptions are never silently ignored</span>
          </div>
          <div className="divide-y divide-slate-100">
            {activeRun.exceptions.map((ex) => (
              <div key={ex.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-semibold text-[#172B4D]">{ex.personName}</span>
                  <span className="mx-1.5 text-slate-300">·</span>
                  <StatusTag status={ex.category} tone={ex.resolved ? 'success' : ex.severity === 'High' ? 'danger' : 'warning'} />
                  <p className="text-[#64748B] mt-1">{ex.description}</p>
                </div>
                {ex.resolved ? (
                  <span className="text-xs font-medium text-[#16A34A] shrink-0">
                    ✓ {ex.resolutionAction}
                  </span>
                ) : (
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolvePayrollException(activeRun.id, ex.id, 'Verify & Include in Run')}
                    >
                      Verify & Include
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => resolvePayrollException(activeRun.id, ex.id, 'Place on Hold')}
                    >
                      Hold
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </SurfaceCard>
      )}

      {/* Calculation Transparency Table */}
      {activeRun && (
        <SurfaceCard className="overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-[#172B4D]">
                Payroll Calculation Breakdown — {activeRun.periodLabel}
              </h2>
              <p className="text-xs text-[#64748B]">
                Gross: <strong className="font-mono-num">{formatINR(activeRun.totalGrossPaise)}</strong> · Deductions:{' '}
                <strong className="font-mono-num">{formatINR(activeRun.totalDeductionsPaise)}</strong> · Net Payable:{' '}
                <strong className="font-mono-num text-[#16A34A]">{formatINR(activeRun.totalNetPayablePaise)}</strong>
              </p>
            </div>
            {activeRun.lockedAt && (
              <div className="text-xs text-[#15803D] flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>Snapshot Locked by {activeRun.approvedBy}</span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3 px-4">Person</th>
                  <th className="py-3 px-4">Role / Trade</th>
                  <th className="py-3 px-4 text-right">Payable</th>
                  <th className="py-3 px-4 text-right">Gross</th>
                  <th className="py-3 px-4 text-right">Statutory + Adv</th>
                  <th className="py-3 px-4 text-right">Net Payable</th>
                  <th className="py-3 px-4">State</th>
                  <th className="py-3 px-4 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {activeRun.items.map((item) => (
                  <tr key={item.id} className={item.excludedFromRun ? 'bg-amber-50/30 opacity-75' : 'hover:bg-slate-50/70'}>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#172B4D]">{item.personName}</div>
                      <div className="text-[11px] font-mono-num text-[#64748B]">{item.personCode} · {item.personType}</div>
                    </td>
                    <td className="py-3 px-4 text-[#64748B]">{item.departmentOrTrade}</td>
                    <td className="py-3 px-4 text-right font-mono-num tabular-nums">{item.payableDays} d</td>
                    <td className="py-3 px-4 text-right font-mono-num tabular-nums">
                      {role.canViewConfidentialSalaries ? formatINR(item.grossEarningsPaise) : '••••••'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num tabular-nums text-[#DC2626]">
                      {role.canViewConfidentialSalaries ? `-${formatINR(item.totalDeductionsPaise)}` : '••••'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num tabular-nums font-bold text-[#172B4D]">
                      {role.canViewConfidentialSalaries ? formatINR(item.netPayablePaise) : '••••••'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusTag status={item.excludedFromRun ? 'On Hold' : 'Included'} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button size="sm" variant="ghost" onClick={() => setInspectRow(item)}>
                        Line Items
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SurfaceCard>
      )}

      {/* Line-Item Calculation Transparency Drawer */}
      <SideSheet
        open={Boolean(inspectRow)}
        onClose={() => setInspectRow(null)}
        title={inspectRow ? `${inspectRow.personName} (${inspectRow.personCode})` : ''}
        subtitle={inspectRow ? `Attendance Ref: ${inspectRow.attendanceRef} · ${inspectRow.departmentOrTrade}` : ''}
        widthClass="max-w-lg"
      >
        {inspectRow && (
          <div className="space-y-4 text-xs">
            <SurfaceCard className="p-4 space-y-2">
              <div className="font-bold text-[#172B4D]">Earnings Breakdown</div>
              {inspectRow.earnings.map((e, i) => (
                <div key={i} className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-[#64748B]">{e.label}</span>
                  <span className="font-mono-num font-semibold">{formatINR(e.amountPaise)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-1 font-bold text-[#172B4D]">
                <span>Gross Earnings</span>
                <span className="font-mono-num">{formatINR(inspectRow.grossEarningsPaise)}</span>
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-4 space-y-2">
              <div className="font-bold text-[#172B4D]">Deductions Breakdown</div>
              {inspectRow.deductions.length === 0 ? (
                <p className="text-[#64748B]">No statutory or advance deductions applied.</p>
              ) : (
                inspectRow.deductions.map((d, i) => (
                  <div key={i} className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-[#64748B]">{d.label}</span>
                    <span className="font-mono-num text-[#DC2626]">-{formatINR(d.amountPaise)}</span>
                  </div>
                ))
              )}
              <div className="flex justify-between pt-1 font-bold text-sm text-[#16A34A]">
                <span>Net Payable</span>
                <span className="font-mono-num">{formatINR(inspectRow.netPayablePaise)}</span>
              </div>
            </SurfaceCard>
          </div>
        )}
      </SideSheet>
    </div>
  );
}
