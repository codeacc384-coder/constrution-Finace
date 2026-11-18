import React, { useState } from 'react';
import { AlertTriangle, PieChart, Settings2 } from 'lucide-react';
import { useCurrentUser, useFinanceStore } from '../store/useFinanceStore';
import {
  Button,
  InputField,
  PageHeader,
  StatusTag,
  SurfaceCard,
} from '../components/ui/primitives';
import { ModalDialog } from '../components/ui/ModalDrawer';
import { formatINR, formatINRCompact } from '../utils/currency';
import { ProjectBudget } from '../types/finance';

export default function ProjectBudgets() {
  const { role } = useCurrentUser();
  const projectBudgets = useFinanceStore((s) => s.projectBudgets);
  const updateProjectBudgetThresholds = useFinanceStore((s) => s.updateProjectBudgetThresholds);

  const [selectedBudgetId, setSelectedBudgetId] = useState(projectBudgets[0]?.id || '');
  const [thresholdModal, setThresholdModal] = useState<ProjectBudget | null>(null);
  const [warnPct, setWarnPct] = useState('70');
  const [critPct, setCritPct] = useState('85');

  const activeBudget = projectBudgets.find((b) => b.id === selectedBudgetId) || projectBudgets[0];

  const openThresholdEditor = (b: ProjectBudget) => {
    setThresholdModal(b);
    setWarnPct(String(b.alertThresholdWarningPct));
    setCritPct(String(b.alertThresholdCriticalPct));
  };

  const handleSaveThreshold = (e: React.FormEvent) => {
    e.preventDefault();
    if (!thresholdModal) return;
    updateProjectBudgetThresholds(thresholdModal.id, Number(warnPct) || 70, Number(critPct) || 85);
    setThresholdModal(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Budget Monitoring"
        subtitle="Track approved budgets, committed POs, actual payments, forecast final costs, and configurable utilization alerts."
      />

      {/* Project Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projectBudgets.map((b) => {
          const utilPct = (b.approvedExpensesPaise / b.approvedBudgetPaise) * 100;
          const isOverrun = b.forecastFinalCostPaise > b.approvedBudgetPaise || utilPct > 100;
          const isCritical = utilPct >= b.alertThresholdCriticalPct;
          const isWarning = utilPct >= b.alertThresholdWarningPct;
          const remaining = b.approvedBudgetPaise - b.approvedExpensesPaise;

          return (
            <SurfaceCard
              key={b.id}
              className={`p-5 space-y-4 ${activeBudget?.id === b.id ? 'border-[#2563EB] ring-1 ring-[#2563EB]/20' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <button
                    type="button"
                    onClick={() => setSelectedBudgetId(b.id)}
                    className="text-base font-bold text-[#172B4D] hover:text-[#2563EB] cursor-pointer text-left"
                  >
                    {b.projectName}
                  </button>
                  <div className="text-xs text-[#64748B]">PM: {b.projectManager} · Thresholds: {b.alertThresholdWarningPct}% / {b.alertThresholdCriticalPct}%</div>
                </div>
                <StatusTag
                  status={
                    isOverrun
                      ? 'Forecast Overrun'
                      : isCritical
                      ? `Critical (> ${b.alertThresholdCriticalPct}%)`
                      : isWarning
                      ? `Warning (> ${b.alertThresholdWarningPct}%)`
                      : 'Within Budget'
                  }
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#64748B]">Utilization ({utilPct.toFixed(1)}%)</span>
                  <span className="font-mono-num font-semibold text-[#172B4D]">
                    {formatINRCompact(b.approvedExpensesPaise)} / {formatINRCompact(b.approvedBudgetPaise)}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isOverrun || isCritical ? 'bg-[#DC2626]' : isWarning ? 'bg-[#F59E0B]' : 'bg-[#2563EB]'
                    }`}
                    style={{ width: `${Math.min(100, utilPct)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                <div>
                  <span className="text-[#64748B] block">Committed</span>
                  <span className="font-mono-num font-semibold">{formatINRCompact(b.committedPaise)}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Remaining</span>
                  <span className="font-mono-num font-semibold text-[#16A34A]">{formatINRCompact(remaining)}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Forecast Cost</span>
                  <span className={`font-mono-num font-semibold ${isOverrun ? 'text-[#DC2626]' : 'text-[#172B4D]'}`}>
                    {formatINRCompact(b.forecastFinalCostPaise)}
                  </span>
                </div>
              </div>

              {isOverrun && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-[#B45309] flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Forecast exceeds approved budget. Additional spending is blocked pending formal budget revision approval.</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <Button size="sm" variant="outline" onClick={() => setSelectedBudgetId(b.id)}>
                  <PieChart className="w-3.5 h-3.5" />
                  <span>Category Breakdown</span>
                </Button>
                {role.canModifyBudgets && (
                  <Button size="sm" variant="ghost" onClick={() => openThresholdEditor(b)}>
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>Alert Rules</span>
                  </Button>
                )}
              </div>
            </SurfaceCard>
          );
        })}
      </div>

      {/* Selected Project Category Breakdown */}
      {activeBudget && (
        <SurfaceCard className="overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#172B4D]">
                Cost Category Breakdown — {activeBudget.projectName}
              </h2>
              <p className="text-xs text-[#64748B]">
                Approved Budget vs Committed vs Approved Spent vs Actual Paid vs Forecast
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3 px-4">Budget Category</th>
                  <th className="py-3 px-4 text-right">Approved Budget</th>
                  <th className="py-3 px-4 text-right">Committed</th>
                  <th className="py-3 px-4 text-right">Approved Spent</th>
                  <th className="py-3 px-4 text-right">Actual Paid</th>
                  <th className="py-3 px-4 text-right">Forecast Final</th>
                  <th className="py-3 px-4 text-right">Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {activeBudget.categories.map((cat) => {
                  const rem = cat.approvedBudgetPaise - cat.approvedSpentPaise;
                  const forecastOver = cat.forecastFinalPaise > cat.approvedBudgetPaise;
                  return (
                    <tr key={cat.category} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-semibold text-[#172B4D]">{cat.category}</td>
                      <td className="py-3 px-4 text-right font-mono-num tabular-nums">{formatINR(cat.approvedBudgetPaise)}</td>
                      <td className="py-3 px-4 text-right font-mono-num tabular-nums text-[#64748B]">{formatINR(cat.committedPaise)}</td>
                      <td className="py-3 px-4 text-right font-mono-num tabular-nums font-medium">{formatINR(cat.approvedSpentPaise)}</td>
                      <td className="py-3 px-4 text-right font-mono-num tabular-nums">{formatINR(cat.actualPaidPaise)}</td>
                      <td className={`py-3 px-4 text-right font-mono-num tabular-nums font-bold ${forecastOver ? 'text-[#DC2626]' : 'text-[#172B4D]'}`}>
                        {formatINR(cat.forecastFinalPaise)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num tabular-nums text-[#16A34A] font-semibold">
                        {formatINR(rem)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SurfaceCard>
      )}

      <ModalDialog
        open={Boolean(thresholdModal)}
        onClose={() => setThresholdModal(null)}
        title="Configure Project Budget Alert Thresholds"
        subtitle={thresholdModal?.projectName}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveThreshold} className="space-y-4">
          <InputField label="Warning Alert Threshold (%)" type="number" min="50" max="99" value={warnPct} onChange={(e) => setWarnPct(e.target.value)} required />
          <InputField label="Critical Alert Threshold (%)" type="number" min="60" max="100" value={critPct} onChange={(e) => setCritPct(e.target.value)} required />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setThresholdModal(null)}>Cancel</Button>
            <Button type="submit">Save Thresholds</Button>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
}
