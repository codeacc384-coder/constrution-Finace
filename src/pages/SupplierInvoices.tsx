import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  Plus,
  Search,
  XCircle,
} from 'lucide-react';
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
import { ModalDialog, SideSheet } from '../components/ui/ModalDrawer';
import { formatINR, toPaise } from '../utils/currency';
import { SupplierInvoice } from '../types/finance';

export default function SupplierInvoices() {
  const supplierInvoices = useFinanceStore((s) => s.supplierInvoices);
  const suppliers = useFinanceStore((s) => s.suppliers);
  const purchaseOrders = useFinanceStore((s) => s.purchaseOrders);
  const materialReceipts = useFinanceStore((s) => s.materialReceipts);
  const projects = useFinanceStore((s) => s.projects);
  const sites = useFinanceStore((s) => s.sites);
  const uploadSupplierInvoice = useFinanceStore((s) => s.uploadSupplierInvoice);
  const updateSupplierInvoiceStatus = useFinanceStore((s) => s.updateSupplierInvoiceStatus);
  const paySupplierInvoice = useFinanceStore((s) => s.paySupplierInvoice);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedInvId, setSelectedInvId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Upload form
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || 'sup_1');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [poNumber, setPoNumber] = useState('PO-BKC-2026-114');
  const [grnNumber, setGrnNumber] = useState('GRN-BKC-881');
  const [projectId, setProjectId] = useState(projects[0]?.id || 'proj_skyrise');
  const [siteId, setSiteId] = useState(sites[0]?.id || 'site_bkc_a');
  const [description, setDescription] = useState('OPC 53 Grade Cement (50kg Bags)');
  const [quantity, setQuantity] = useState('500');
  const [unitPriceRupees, setUnitPriceRupees] = useState('385');
  const [taxRate, setTaxRate] = useState('28');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return supplierInvoices.filter(
      (inv) =>
        (statusFilter === 'ALL' || inv.status === statusFilter) &&
        (inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.supplierName.toLowerCase().includes(q) ||
          inv.poNumber.toLowerCase().includes(q))
    );
  }, [supplierInvoices, search, statusFilter]);

  const selectedInv: SupplierInvoice | undefined = supplierInvoices.find((i) => i.id === selectedInvId);
  const totalPayables = supplierInvoices
    .filter((i) => i.status !== 'Paid' && i.status !== 'Rejected')
    .reduce((a, b) => a + (b.totalAmountPaise - b.paidAmountPaise), 0);
  const flaggedCount = supplierInvoices.filter((i) => !i.matchResult.matched).length;

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    uploadSupplierInvoice({
      supplierId,
      invoiceNumber: invoiceNumber || `INV-${Date.now().toString().slice(-4)}`,
      poNumber,
      grnNumber,
      projectId,
      siteId,
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: '2026-12-18',
      description,
      hsnCode: '2523',
      quantity: Number(quantity) || 1,
      unit: 'Units',
      unitPricePaise: toPaise(Number(unitPriceRupees) || 0),
      taxRatePercent: Number(taxRate) || 18,
      uploadedFileName: `${invoiceNumber || 'supplier_bill'}.pdf`,
    });
    setUploadOpen(false);
    setInvoiceNumber('');
  };

  const getProjName = (id: string) => projects.find((p) => p.id === id)?.name || id;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplier Invoice Management"
        subtitle="Accounts payable workbench with automated 3-way matching (PO vs Material Receipt GRN vs Tax Invoice)."
        actions={
          <Button onClick={() => setUploadOpen(true)}>
            <Plus className="w-4 h-4" />
            <span>Upload Supplier Invoice</span>
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiStatCard label="Total Supplier Invoices" value={String(supplierInvoices.length)} subtext="Active AP register" />
        <KpiStatCard label="Open Supplier Payables" value={formatINR(totalPayables)} subtext="Approved & pending bills" tone="warning" />
        <KpiStatCard label="3-Way Match Discrepancies" value={String(flaggedCount)} subtext="Qty, rate, or missing PO/GRN" tone={flaggedCount > 0 ? 'danger' : 'success'} />
        <KpiStatCard
          label="Paid This Period"
          value={formatINR(supplierInvoices.filter((i) => i.status === 'Paid').reduce((a, b) => a + b.paidAmountPaise, 0))}
          subtext="Bank-settled vendor bills"
          tone="success"
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
            placeholder="Search invoice #, supplier name, PO #..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#2563EB]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg"
        >
          <option value="ALL">All Invoice Statuses</option>
          <option value="Verification Required">Verification Required</option>
          <option value="Under Review">Under Review</option>
          <option value="Pending Approval">Pending Approval</option>
          <option value="Approved">Approved</option>
          <option value="Paid">Paid</option>
          <option value="Disputed">Disputed</option>
        </select>
      </SurfaceCard>

      {/* Desktop Table */}
      <SurfaceCard className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                <th className="py-3 px-4">Invoice & PO</th>
                <th className="py-3 px-4">Supplier & GSTIN</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">3-Way Match</th>
                <th className="py-3 px-4 text-right">Subtotal + GST</th>
                <th className="py-3 px-4 text-right">Total Payable</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => setSelectedInvId(inv.id)}
                      className="font-mono-num font-semibold text-[#2563EB] hover:underline cursor-pointer"
                    >
                      {inv.invoiceNumber}
                    </button>
                    <div className="text-[11px] text-[#64748B] font-mono-num">
                      {inv.poNumber} · Due {inv.dueDate}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#172B4D]">{inv.supplierName}</div>
                    <div className="text-[11px] font-mono-num text-[#64748B]">{inv.gstin}</div>
                  </td>
                  <td className="py-3 px-4 text-[#172B4D]">{getProjName(inv.projectId)}</td>
                  <td className="py-3 px-4">
                    {inv.matchResult.matched ? (
                      <span className="inline-flex items-center gap-1 text-[#16A34A] font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Clean 3-Way Match
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[#DC2626] font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" /> {inv.matchResult.flags.length} Flag(s)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-num tabular-nums text-[#64748B]">
                    {formatINR(inv.subtotalPaise)} + {formatINR(inv.taxAmountPaise)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-num tabular-nums font-bold text-[#172B4D]">
                    {formatINR(inv.totalAmountPaise)}
                  </td>
                  <td className="py-3 px-4"><StatusTag status={inv.status} /></td>
                  <td className="py-3 px-4 text-right">
                    <Button size="sm" variant="outline" onClick={() => setSelectedInvId(inv.id)}>
                      Verify / Pay
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SurfaceCard>

      {/* Mobile Stacked Invoice Cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((inv) => (
          <SurfaceCard key={inv.id} className="p-4 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-mono-num font-bold text-[#2563EB]">{inv.invoiceNumber}</div>
                <div className="text-sm font-bold text-[#172B4D] truncate">{inv.supplierName}</div>
              </div>
              <StatusTag status={inv.status} />
            </div>
            <div className="text-xs text-[#64748B]">
              {getProjName(inv.projectId)} · PO {inv.poNumber}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-sm font-mono-num font-bold text-[#172B4D]">{formatINR(inv.totalAmountPaise)}</span>
              <Button size="sm" variant="outline" onClick={() => setSelectedInvId(inv.id)}>Inspect Match</Button>
            </div>
          </SurfaceCard>
        ))}
      </div>

      {/* 3-Way Match & Approval Drawer */}
      <SideSheet
        open={Boolean(selectedInv)}
        onClose={() => setSelectedInvId(null)}
        title={selectedInv ? `${selectedInv.invoiceNumber} · 3-Way Verification` : ''}
        subtitle={selectedInv ? `${selectedInv.supplierName} · GSTIN ${selectedInv.gstin}` : ''}
      >
        {selectedInv && (() => {
          const po = purchaseOrders.find((p) => p.poNumber === selectedInv.poNumber);
          const grn = materialReceipts.find((g) => g.grnNumber === selectedInv.grnNumber);
          return (
            <div className="space-y-5 text-xs">
              <SurfaceCard className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-[#172B4D] flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-[#2563EB]" />
                    <span>3-Way Match Audit (PO ↔ GRN ↔ Invoice)</span>
                  </div>
                  <StatusTag status={selectedInv.matchResult.matched ? 'Matched' : 'Variance Flagged'} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                    <div className="text-[11px] text-[#64748B]">1. Purchase Order</div>
                    <div className="font-mono-num font-bold mt-0.5">{selectedInv.poNumber}</div>
                    <div className="mt-1">
                      {po ? `${po.orderedQuantity} ${po.unit} @ ${formatINR(po.agreedUnitPricePaise)}` : 'PO Missing'}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                    <div className="text-[11px] text-[#64748B]">2. Material Receipt (GRN)</div>
                    <div className="font-mono-num font-bold mt-0.5">{selectedInv.grnNumber}</div>
                    <div className="mt-1">
                      {grn ? `${grn.receivedQuantity} ${grn.unit} (${grn.verifiedBySiteEngineer})` : 'GRN Missing'}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                    <div className="text-[11px] text-[#64748B]">3. Supplier Invoice</div>
                    <div className="font-mono-num font-bold mt-0.5">{selectedInv.invoiceNumber}</div>
                    <div className="mt-1">
                      {selectedInv.items[0]?.quantity} {selectedInv.items[0]?.unit} @ {formatINR(selectedInv.items[0]?.unitPricePaise || 0)}
                    </div>
                  </div>
                </div>

                {selectedInv.matchResult.flags.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-1 text-[#B91C1C]">
                    <div className="font-bold flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" />
                      <span>Discrepancies Detected — Do Not Auto-Approve</span>
                    </div>
                    {selectedInv.matchResult.flags.map((f, i) => (
                      <div key={i}>• {f}</div>
                    ))}
                  </div>
                )}
              </SurfaceCard>

              <SurfaceCard className="p-4 space-y-2">
                <div className="font-bold text-[#172B4D]">Invoice Breakdown ({selectedInv.uploadedFileName})</div>
                {selectedInv.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1.5 border-b border-slate-100">
                    <span>{item.description} (HSN {item.hsnCode}) · {item.quantity} {item.unit}</span>
                    <span className="font-mono-num font-semibold">{formatINR(item.lineTotalPaise)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 font-bold text-sm">
                  <span>Total Payable (incl. GST)</span>
                  <span className="font-mono-num">{formatINR(selectedInv.totalAmountPaise)}</span>
                </div>
              </SurfaceCard>

              <div className="flex flex-wrap gap-2">
                {selectedInv.status !== 'Approved' && selectedInv.status !== 'Paid' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => updateSupplierInvoiceStatus(selectedInv.id, 'Approved', 'Approved after verification')}
                    >
                      Approve Invoice
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateSupplierInvoiceStatus(selectedInv.id, 'Disputed', 'Disputed due to PO/GRN variance')}
                    >
                      Mark Disputed
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => updateSupplierInvoiceStatus(selectedInv.id, 'Rejected', 'Rejected by Finance')}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {selectedInv.status === 'Approved' && (
                  <Button size="sm" variant="success" onClick={() => paySupplierInvoice(selectedInv.id)}>
                    Release Bank Payment ({formatINR(selectedInv.totalAmountPaise)})
                  </Button>
                )}
              </div>
            </div>
          );
        })()}
      </SideSheet>

      {/* Upload Supplier Invoice Modal */}
      <ModalDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload & 3-Way Verify Supplier Invoice"
        subtitle="Try PO-BKC-2026-114 & GRN-BKC-881 for clean match, or a mismatched qty/rate to test automated flags."
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectField label="Supplier" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              {suppliers.map((sup) => (
                <option key={sup.id} value={sup.id}>{sup.name}</option>
              ))}
            </SelectField>
            <InputField label="Invoice Number" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="e.g., UTCL/MH/26-27/5012" required />
            <InputField label="PO Reference" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} required />
            <InputField label="GRN Reference" value={grnNumber} onChange={(e) => setGrnNumber(e.target.value)} required />
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
          </div>
          <InputField label="Material / Item Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
          <div className="grid grid-cols-3 gap-3">
            <InputField label="Invoiced Qty" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
            <InputField label="Unit Rate (₹)" type="number" value={unitPriceRupees} onChange={(e) => setUnitPriceRupees(e.target.value)} required />
            <InputField label="GST %" type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button type="submit">Upload & Run 3-Way Match</Button>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
}
