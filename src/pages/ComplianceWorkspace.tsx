import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FolderLock, Info, Scale } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import {
  Button,
  InputField,
  PageHeader,
  SegmentedTabs,
  StatusTag,
  SurfaceCard,
} from '../components/ui/primitives';
import { ModalDialog } from '../components/ui/ModalDrawer';
import { formatINR } from '../utils/currency';

type ComplianceTab = 'statutory' | 'tax_records' | 'payroll_compliance' | 'documents';

export default function ComplianceWorkspace() {
  const location = useLocation();
  const resolveTab = (path: string): ComplianceTab =>
    path.includes('tax-records')
      ? 'tax_records'
      : path.includes('payroll-compliance')
      ? 'payroll_compliance'
      : path.includes('financial-documents')
      ? 'documents'
      : 'statutory';

  const [tab, setTab] = useState<ComplianceTab>(resolveTab(location.pathname));

  useEffect(() => {
    setTab(resolveTab(location.pathname));
  }, [location.pathname]);
  const [rateModalOpen, setRateModalOpen] = useState(false);

  const complianceRecords = useFinanceStore((s) => s.complianceRecords);
  const complianceRates = useFinanceStore((s) => s.complianceRates);
  const financialDocuments = useFinanceStore((s) => s.financialDocuments);
  const supplierInvoices = useFinanceStore((s) => s.supplierInvoices);
  const contractorInvoices = useFinanceStore((s) => s.contractorInvoices);
  const updateComplianceFilingStatus = useFinanceStore((s) => s.updateComplianceFilingStatus);
  const updateComplianceRates = useFinanceStore((s) => s.updateComplianceRates);

  const [epfPct, setEpfPct] = useState(String(complianceRates.epfEmployeePct));
  const [esiPct, setEsiPct] = useState(String(complianceRates.esiEmployeePct));
  const [ptRupees, setPtRupees] = useState(String(complianceRates.ptStandardMonthlyPaise / 100));
  const [versionTag, setVersionTag] = useState(complianceRates.versionTag);

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    updateComplianceRates({
      epfEmployeePct: Number(epfPct) || 12,
      esiEmployeePct: Number(esiPct) || 0.75,
      ptStandardMonthlyPaise: Math.round((Number(ptRupees) || 200) * 100),
      versionTag,
    });
    setRateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax & Statutory Compliance"
        subtitle="Configurable, versioned Indian construction statutory compliance (EPF, ESI, PT, LWF, TDS 192/194C, GST Input & Minimum Wages)."
        actions={
          <Button variant="outline" size="sm" onClick={() => setRateModalOpen(true)}>
            Configure Rate Version
          </Button>
        }
      />

      <SurfaceCard className="p-3.5 bg-amber-50/70 border-amber-200 flex items-start gap-2.5 text-xs text-[#172B4D]">
        <Info className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
        <span>
          <strong>Professional Review Disclaimer:</strong> Statutory thresholds, contribution percentages, and due dates are stored in versioned, jurisdiction-configurable tables ({complianceRates.versionTag}). Tax calculations and legal filings must be reviewed by a qualified Chartered Accountant or statutory compliance professional before submission.
        </span>
      </SurfaceCard>

      <SegmentedTabs<ComplianceTab>
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'statutory', label: 'Statutory Compliance', count: complianceRecords.length },
          { id: 'tax_records', label: 'GST & TDS Registers' },
          { id: 'payroll_compliance', label: 'Payroll Compliance Rules' },
          { id: 'documents', label: 'Financial Documents', count: financialDocuments.length },
        ]}
      />

      {tab === 'statutory' && (
        <SurfaceCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3 px-4">Compliance Category</th>
                  <th className="py-3 px-4">Entity & Period</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Filing / Payment</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {complianceRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#172B4D]">{rec.category}</div>
                      <div className="text-[11px] text-[#64748B]">Officer: {rec.assignedOfficer}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{rec.applicableEntity}</div>
                      <div className="text-[11px] text-[#64748B]">{rec.period} · {rec.supportingDocument}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num tabular-nums font-bold">{formatINR(rec.amountPaise)}</td>
                    <td className="py-3 px-4 font-mono-num text-[#64748B]">{rec.dueDate}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <StatusTag status={rec.filingStatus} />
                        <StatusTag status={rec.paymentStatus} tone={rec.paymentStatus === 'Paid' ? 'success' : 'neutral'} />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {rec.filingStatus !== 'Filed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateComplianceFilingStatus(rec.id, 'Filed', 'Paid')}
                        >
                          Record Filing & Challan
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SurfaceCard>
      )}

      {tab === 'tax_records' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SurfaceCard className="p-5 space-y-3">
            <h2 className="text-sm font-bold text-[#172B4D]">GST Input Tax Credit Register (GSTR-2B Match)</h2>
            <div className="divide-y divide-slate-100 text-xs">
              {supplierInvoices.map((inv) => (
                <div key={inv.id} className="py-2.5 flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{inv.supplierName}</div>
                    <div className="font-mono-num text-[11px] text-[#64748B]">GSTIN {inv.gstin} · {inv.invoiceNumber}</div>
                  </div>
                  <div className="text-right font-mono-num font-bold text-[#16A34A]">
                    {formatINR(inv.taxAmountPaise)}
                  </div>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5 space-y-3">
            <h2 className="text-sm font-bold text-[#172B4D]">Contractor TDS Deduction Register (Sec 194C)</h2>
            <div className="divide-y divide-slate-100 text-xs">
              {contractorInvoices.map((bill) => (
                <div key={bill.id} className="py-2.5 flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{bill.companyName}</div>
                    <div className="font-mono-num text-[11px] text-[#64748B]">{bill.billNumber} · Gross {formatINR(bill.grossBillAmountPaise)}</div>
                  </div>
                  <div className="text-right font-mono-num font-bold text-[#172B4D]">
                    {formatINR(bill.tdsDeductedPaise)}
                  </div>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>
      )}

      {tab === 'payroll_compliance' && (
        <SurfaceCard className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-sm font-bold text-[#172B4D]">Active Versioned Statutory Configuration</h2>
            </div>
            <span className="text-xs font-mono-num text-[#64748B]">{complianceRates.versionTag}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <SurfaceCard className="p-3.5"><span className="text-[#64748B]">EPF Employee / Employer</span><div className="text-base font-bold font-mono-num mt-1">{complianceRates.epfEmployeePct}% / {complianceRates.epfEmployerPct}%</div></SurfaceCard>
            <SurfaceCard className="p-3.5"><span className="text-[#64748B]">EPF Wage Ceiling</span><div className="text-base font-bold font-mono-num mt-1">{formatINR(complianceRates.epfWageCeilingPaise)}</div></SurfaceCard>
            <SurfaceCard className="p-3.5"><span className="text-[#64748B]">ESI Employee / Employer</span><div className="text-base font-bold font-mono-num mt-1">{complianceRates.esiEmployeePct}% / {complianceRates.esiEmployerPct}%</div></SurfaceCard>
            <SurfaceCard className="p-3.5"><span className="text-[#64748B]">Standard Monthly PT</span><div className="text-base font-bold font-mono-num mt-1">{formatINR(complianceRates.ptStandardMonthlyPaise)}</div></SurfaceCard>
          </div>
        </SurfaceCard>
      )}

      {tab === 'documents' && (
        <SurfaceCard className="overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
            <FolderLock className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-sm font-bold text-[#172B4D]">Access-Controlled Financial Document Vault</h2>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {financialDocuments.map((doc) => (
              <div key={doc.id} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-[#172B4D]">{doc.title}</div>
                  <div className="text-[11px] text-[#64748B]">
                    {doc.category} · Ref {doc.referenceCode} · Uploaded {doc.uploadedAt} by {doc.uploadedBy} ({doc.fileSize})
                  </div>
                </div>
                <StatusTag status={doc.accessLevel} tone="purple" />
              </div>
            ))}
          </div>
        </SurfaceCard>
      )}

      <ModalDialog
        open={rateModalOpen}
        onClose={() => setRateModalOpen(false)}
        title="Configure Versioned Statutory Compliance Rates"
        subtitle="Changes apply to new payroll runs without altering locked historical snapshots."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveRates} className="space-y-4">
          <InputField label="Configuration Version Tag" value={versionTag} onChange={(e) => setVersionTag(e.target.value)} required />
          <InputField label="EPF Employee Rate (%)" type="number" step="0.1" value={epfPct} onChange={(e) => setEpfPct(e.target.value)} required />
          <InputField label="ESI Employee Rate (%)" type="number" step="0.05" value={esiPct} onChange={(e) => setEsiPct(e.target.value)} required />
          <InputField label="Standard Monthly PT (₹)" type="number" value={ptRupees} onChange={(e) => setPtRupees(e.target.value)} required />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setRateModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Version</Button>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
}
