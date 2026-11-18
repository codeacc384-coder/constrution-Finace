import {
  MaterialReceiptReference,
  PurchaseOrderReference,
  SupplierInvoice,
  ThreeWayMatchResult,
} from '../types/finance';
import { percentOfPaise, sumPaise } from '../utils/currency';

/**
 * Performs 3-Way Matching between Purchase Order, Material Receipt (GRN), and Supplier Invoice.
 * Flags duplicates, missing documents, quantity variances, price discrepancies, and GST mismatches.
 */
export function performThreeWayMatch(
  invoice: Pick<
    SupplierInvoice,
    'id' | 'invoiceNumber' | 'supplierId' | 'poNumber' | 'grnNumber' | 'items' | 'subtotalPaise' | 'taxAmountPaise'
  >,
  existingInvoices: SupplierInvoice[],
  purchaseOrders: PurchaseOrderReference[],
  materialReceipts: MaterialReceiptReference[]
): ThreeWayMatchResult {
  const flags: string[] = [];

  // 1. Duplicate invoice detection (same supplier + invoice number)
  const duplicateDetected = existingInvoices.some(
    (inv) =>
      inv.id !== invoice.id &&
      inv.supplierId === invoice.supplierId &&
      inv.invoiceNumber.trim().toUpperCase() === invoice.invoiceNumber.trim().toUpperCase()
  );
  if (duplicateDetected) {
    flags.push(`Duplicate invoice number ${invoice.invoiceNumber} detected for this supplier.`);
  }

  // 2. PO lookup
  const po = purchaseOrders.find(
    (p) => p.poNumber.trim().toUpperCase() === invoice.poNumber.trim().toUpperCase()
  );
  const poFound = Boolean(po);
  if (!poFound) {
    flags.push(`Missing Purchase Order reference (${invoice.poNumber || 'None'}).`);
  }

  // 3. GRN lookup
  const grn = materialReceipts.find(
    (g) => g.grnNumber.trim().toUpperCase() === invoice.grnNumber.trim().toUpperCase()
  );
  const grnFound = Boolean(grn);
  if (!grnFound) {
    flags.push(`Missing Material Receipt / GRN verification (${invoice.grnNumber || 'None'}).`);
  }

  // 4. Quantity & Price checks
  const invoicedQty = invoice.items.reduce((acc, item) => acc + item.quantity, 0);
  const quantityMatch = grn ? invoicedQty <= grn.receivedQuantity : po ? invoicedQty <= po.orderedQuantity : false;
  if (grn && invoicedQty > grn.receivedQuantity) {
    flags.push(
      `Quantity mismatch: Invoiced ${invoicedQty} ${grn.unit} exceeds verified GRN receipt of ${grn.receivedQuantity} ${grn.unit}.`
    );
  }

  let priceMatch = true;
  let variancePaise = 0;
  if (po) {
    const firstItem = invoice.items[0];
    if (firstItem && firstItem.unitPricePaise > po.agreedUnitPricePaise) {
      priceMatch = false;
      variancePaise = (firstItem.unitPricePaise - po.agreedUnitPricePaise) * firstItem.quantity;
      flags.push(
        `Price mismatch: Unit price ₹${(firstItem.unitPricePaise / 100).toLocaleString('en-IN')} exceeds PO agreed rate ₹${(po.agreedUnitPricePaise / 100).toLocaleString('en-IN')}.`
      );
    }
  }

  // 5. Tax math verification
  const expectedTaxPaise = sumPaise(
    invoice.items.map((item) =>
      percentOfPaise(item.quantity * item.unitPricePaise, item.taxRatePercent)
    )
  );
  const taxDiff = Math.abs(expectedTaxPaise - invoice.taxAmountPaise);
  const taxMatch = taxDiff <= 500; // within ₹5 rounding tolerance
  if (!taxMatch) {
    flags.push(
      `Tax discrepancy: Declared GST ₹${(invoice.taxAmountPaise / 100).toLocaleString('en-IN')} differs from line-item computed GST ₹${(expectedTaxPaise / 100).toLocaleString('en-IN')}.`
    );
  }

  const matched =
    poFound &&
    grnFound &&
    !duplicateDetected &&
    quantityMatch &&
    priceMatch &&
    taxMatch;

  return {
    matched,
    poFound,
    grnFound,
    duplicateDetected,
    quantityMatch,
    priceMatch,
    taxMatch,
    flags,
    variancePaise,
  };
}

export function calculateContractorNetPayable(params: {
  grossBillAmountPaise: number;
  retentionPercent: number;
  advanceRecoveryPaise: number;
  otherDeductionsPaise: number;
  gstPercent: number;
  tdsPercent: number;
}): {
  retentionDeductedPaise: number;
  gstAmountPaise: number;
  tdsDeductedPaise: number;
  netPayablePaise: number;
} {
  const retentionDeductedPaise = percentOfPaise(params.grossBillAmountPaise, params.retentionPercent);
  const gstAmountPaise = percentOfPaise(params.grossBillAmountPaise, params.gstPercent);
  const tdsDeductedPaise = percentOfPaise(params.grossBillAmountPaise, params.tdsPercent);
  const netPayablePaise =
    params.grossBillAmountPaise +
    gstAmountPaise -
    retentionDeductedPaise -
    params.advanceRecoveryPaise -
    params.otherDeductionsPaise -
    tdsDeductedPaise;

  return {
    retentionDeductedPaise,
    gstAmountPaise,
    tdsDeductedPaise,
    netPayablePaise,
  };
}
