import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import {
  Button,
  KpiStatCard,
  PageHeader,
  StatusTag,
  SurfaceCard,
} from '../components/ui/primitives';
import { formatINR } from '../utils/currency';

export default function PurchaseBills() {
  const navigate = useNavigate();
  const purchaseOrders = useFinanceStore((s) => s.purchaseOrders);
  const materialReceipts = useFinanceStore((s) => s.materialReceipts);
  const supplierInvoices = useFinanceStore((s) => s.supplierInvoices);
  const suppliers = useFinanceStore((s) => s.suppliers);
  const projects = useFinanceStore((s) => s.projects);

  const getSupplier = (id: string) => suppliers.find((s) => s.id === id)?.name || id;
  const getProject = (id: string) => projects.find((p) => p.id === id)?.name || id;

  const totalPOValue = purchaseOrders.reduce((a, b) => a + b.totalOrderedPaise, 0);
  const totalGSTInput = supplierInvoices.reduce((a, b) => a + b.taxAmountPaise, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Bills & Material Receipts"
        subtitle="Procurement purchase orders, verified site Goods Receipt Notes (GRNs), and GST input tax verification."
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate('/supplier-invoices')}>
            Open Supplier Invoices
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <KpiStatCard label="Active Purchase Orders" value={formatINR(totalPOValue)} subtext={`${purchaseOrders.length} issued POs`} />
        <KpiStatCard label="Verified Site GRNs" value={String(materialReceipts.length)} subtext="Signed by site engineers" tone="success" />
        <KpiStatCard label="Eligible Input GST Credit" value={formatINR(totalGSTInput)} subtext="Across billed material purchases" tone="info" />
      </div>

      <SurfaceCard className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-[#2563EB]" />
          <h2 className="text-sm font-bold text-[#172B4D]">Purchase Order & Site GRN Verification Register</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Supplier & Material</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4 text-right">Ordered Qty</th>
                <th className="py-3 px-4 text-right">GRN Received</th>
                <th className="py-3 px-4 text-right">PO Value</th>
                <th className="py-3 px-4">Linked Bill Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {purchaseOrders.map((po) => {
                const grn = materialReceipts.find((g) => g.poNumber === po.poNumber);
                const bill = supplierInvoices.find((inv) => inv.poNumber === po.poNumber);
                const qtyGap = grn ? po.orderedQuantity - grn.receivedQuantity : po.orderedQuantity;
                return (
                  <tr key={po.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="font-mono-num font-bold text-[#2563EB]">{po.poNumber}</div>
                      <div className="text-[11px] text-[#64748B]">{po.poDate}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#172B4D]">{getSupplier(po.supplierId)}</div>
                      <div className="text-[11px] text-[#64748B]">{po.materialSummary}</div>
                    </td>
                    <td className="py-3 px-4">{getProject(po.projectId)}</td>
                    <td className="py-3 px-4 text-right font-mono-num tabular-nums">
                      {po.orderedQuantity} {po.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num tabular-nums">
                      {grn ? (
                        <span className={qtyGap > 0 ? 'text-[#D97706] font-semibold' : 'text-[#16A34A] font-semibold'}>
                          {grn.receivedQuantity} {grn.unit} ({grn.grnNumber})
                        </span>
                      ) : (
                        <span className="text-[#DC2626]">Pending GRN</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num tabular-nums font-bold">
                      {formatINR(po.totalOrderedPaise)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusTag status={bill ? bill.status : 'Awaiting Bill'} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SurfaceCard>
    </div>
  );
}
