import React, { useMemo, useState } from 'react';
import { Download, FileText, Lock, Printer } from 'lucide-react';
import { useCurrentUser, useFinanceStore } from '../store/useFinanceStore';
import {
  Button,
  EmptyState,
  PageHeader,
  StatusTag,
  SurfaceCard,
} from '../components/ui/primitives';
import { ModalDialog } from '../components/ui/ModalDrawer';
import { downloadCSV, formatINR } from '../utils/currency';
import { Payslip } from '../types/finance';

export default function Payslips() {
  const { role } = useCurrentUser();
  const company = useFinanceStore((s) => s.company);
  const payslips = useFinanceStore((s) => s.payslips);
  const payrollRuns = useFinanceStore((s) => s.payrollRuns);
  const generatePayslipsForRun = useFinanceStore((s) => s.generatePayslipsForRun);
  const issuePayslipCorrection = useFinanceStore((s) => s.issuePayslipCorrection);

  const [periodFilter, setPeriodFilter] = useState('ALL');
  const [previewSlip, setPreviewSlip] = useState<Payslip | null>(null);
  const [correctionText, setCorrectionText] = useState('');

  const filtered = useMemo(
    () =>
      payslips.filter((p) => periodFilter === 'ALL' || p.periodLabel === periodFilter),
    [payslips, periodFilter]
  );

  const lockedRuns = payrollRuns.filter((r) => r.status === 'Locked' || r.status === 'Paid');

  const handleBulkExport = () => {
    downloadCSV(
      `buildflow-payslips-${periodFilter}.csv`,
      ['Payslip #', 'Period', 'Employee ID', 'Name', 'Department', 'Gross (INR)', 'Deductions (INR)', 'Net Pay (INR)', 'Status'],
      filtered.map((p) => [
        p.payslipNumber,
        p.periodLabel,
        p.employeeCode,
        p.employeeName,
        p.department,
        (p.grossEarningsPaise / 100).toFixed(2),
        (p.totalDeductionsPaise / 100).toFixed(2),
        (p.netPayPaise / 100).toFixed(2),
        p.paymentStatus,
      ])
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payslip Management"
        subtitle="Access-controlled Indian salary slips with earnings/statutory breakdown, PDF print export, and revision tracking."
        actions={
          <div className="flex flex-wrap gap-2">
            {role.canExportReports && role.canViewConfidentialSalaries && (
              <Button variant="outline" size="sm" onClick={handleBulkExport}>
                <Download className="w-3.5 h-3.5" />
                <span>Export Register CSV</span>
              </Button>
            )}
            {lockedRuns.map((run) => (
              <Button key={run.id} size="sm" onClick={() => generatePayslipsForRun(run.id)}>
                Generate Missing ({run.periodLabel})
              </Button>
            ))}
          </div>
        }
      />

      {!role.canViewConfidentialSalaries ? (
        <SurfaceCard className="p-8 text-center space-y-2">
          <Lock className="w-7 h-7 text-[#D97706] mx-auto" />
          <div className="text-sm font-bold text-[#172B4D]">Private Payslip Access Restricted</div>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            Payslips contain confidential employee compensation and bank records. Your current role ({role.roleName}) does not permit viewing payslip registers.
          </p>
        </SurfaceCard>
      ) : (
        <>
          <SurfaceCard className="p-3.5 flex flex-wrap items-center justify-between gap-3">
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="h-9 px-3 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="ALL">All Payroll Periods</option>
              <option value="November 2026">November 2026</option>
              <option value="October 2026">October 2026</option>
            </select>
            <span className="text-xs text-[#64748B]">
              Showing <strong>{filtered.length}</strong> authenticated payslips (no public download URLs exposed)
            </span>
          </SurfaceCard>

          <SurfaceCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    <th className="py-3 px-4">Payslip #</th>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4 text-right">Payable Days</th>
                    <th className="py-3 px-4 text-right">Gross</th>
                    <th className="py-3 px-4 text-right">Deductions</th>
                    <th className="py-3 px-4 text-right">Net Pay</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filtered.map((ps) => (
                    <tr key={ps.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono-num font-semibold text-[#2563EB]">{ps.payslipNumber}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#172B4D]">{ps.employeeName}</div>
                        <div className="text-[11px] text-[#64748B]">{ps.employeeCode} · {ps.designation}</div>
                      </td>
                      <td className="py-3 px-4 text-[#172B4D]">{ps.periodLabel}</td>
                      <td className="py-3 px-4 text-right font-mono-num tabular-nums">{ps.payableDays}/{ps.workingDays}</td>
                      <td className="py-3 px-4 text-right font-mono-num tabular-nums">{formatINR(ps.grossEarningsPaise)}</td>
                      <td className="py-3 px-4 text-right font-mono-num tabular-nums text-[#DC2626]">-{formatINR(ps.totalDeductionsPaise)}</td>
                      <td className="py-3 px-4 text-right font-mono-num tabular-nums font-bold">{formatINR(ps.netPayPaise)}</td>
                      <td className="py-3 px-4"><StatusTag status={ps.paymentStatus} /></td>
                      <td className="py-3 px-4 text-right">
                        <Button size="sm" variant="outline" onClick={() => setPreviewSlip(ps)}>
                          <FileText className="w-3.5 h-3.5" />
                          <span>Preview / PDF</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <EmptyState title="No Payslips Found" description="Lock a payroll run to issue employee payslips." />
            )}
          </SurfaceCard>
        </>
      )}

      {/* Printable Indian Payslip Modal */}
      <ModalDialog
        open={Boolean(previewSlip)}
        onClose={() => setPreviewSlip(null)}
        title={previewSlip ? `Payslip · ${previewSlip.payslipNumber}` : ''}
        subtitle={previewSlip ? `${company.legalName} · ${previewSlip.periodLabel}` : ''}
        maxWidth="max-w-3xl"
      >
        {previewSlip && (
          <div className="space-y-5 text-xs">
            <div className="border border-slate-200 rounded-xl p-5 space-y-4 bg-white">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-200 pb-4">
                <div>
                  <div className="text-base font-bold text-[#101F35]">{company.legalName}</div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">{company.registeredAddress}</div>
                </div>
                <div className="sm:text-right">
                  <div className="font-bold text-[#172B4D]">PAYSLIP — {previewSlip.periodLabel.toUpperCase()}</div>
                  <div className="font-mono-num text-[#64748B]">{previewSlip.payslipNumber}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg">
                <div><span className="text-[#64748B] block">Employee Name</span><strong>{previewSlip.employeeName}</strong></div>
                <div><span className="text-[#64748B] block">Employee ID</span><strong className="font-mono-num">{previewSlip.employeeCode}</strong></div>
                <div><span className="text-[#64748B] block">UAN (EPF)</span><strong className="font-mono-num">{previewSlip.uanNumber}</strong></div>
                <div><span className="text-[#64748B] block">Bank Account</span><strong className="font-mono-num">{previewSlip.bankAccountMasked}</strong></div>
                <div><span className="text-[#64748B] block">Designation</span><strong>{previewSlip.designation}</strong></div>
                <div><span className="text-[#64748B] block">Department</span><strong>{previewSlip.department}</strong></div>
                <div><span className="text-[#64748B] block">Payable Days</span><strong className="font-mono-num">{previewSlip.payableDays} / {previewSlip.workingDays}</strong></div>
                <div><span className="text-[#64748B] block">PAN</span><strong className="font-mono-num">{previewSlip.panMasked}</strong></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                  <div className="font-bold text-[#172B4D] border-b border-slate-100 pb-1.5">Earnings</div>
                  {previewSlip.earnings.map((e, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-[#64748B]">{e.label}</span>
                      <span className="font-mono-num">{formatINR(e.amountPaise)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t border-slate-200 font-bold">
                    <span>Total Gross Earnings</span>
                    <span className="font-mono-num">{formatINR(previewSlip.grossEarningsPaise)}</span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                  <div className="font-bold text-[#172B4D] border-b border-slate-100 pb-1.5">Deductions</div>
                  {previewSlip.deductions.map((d, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-[#64748B]">{d.label}</span>
                      <span className="font-mono-num text-[#DC2626]">{formatINR(d.amountPaise)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t border-slate-200 font-bold">
                    <span>Total Deductions</span>
                    <span className="font-mono-num text-[#DC2626]">{formatINR(previewSlip.totalDeductionsPaise)}</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-[#101F35] text-white rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-300">Net Salary Payable</div>
                  <div className="text-lg font-bold font-mono-num">{formatINR(previewSlip.netPayPaise)}</div>
                </div>
                <StatusTag status={previewSlip.paymentStatus} />
              </div>

              {previewSlip.correctionNote && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-[#B45309]">
                  <strong>Correction Note:</strong> {previewSlip.correctionNote}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={correctionText}
                  onChange={(e) => setCorrectionText(e.target.value)}
                  placeholder="Optional correction / revision note..."
                  className="flex-1 h-9 px-3 text-xs border border-slate-200 rounded-lg"
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!correctionText.trim()}
                  onClick={() => {
                    issuePayslipCorrection(previewSlip.id, correctionText);
                    setPreviewSlip({ ...previewSlip, paymentStatus: 'Revised', correctionNote: correctionText });
                    setCorrectionText('');
                  }}
                >
                  Log Revision
                </Button>
              </div>
              <Button size="sm" onClick={() => window.print()}>
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </Button>
            </div>
          </div>
        )}
      </ModalDialog>
    </div>
  );
}
