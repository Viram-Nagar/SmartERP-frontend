/**
 * SmartERP GST Engine
 *
 * Intrastate sale (same state): CGST + SGST (each = half of GST rate)
 * Interstate sale (different state): IGST (full GST rate)
 */

export const GST_RATES = [0, 0.1, 0.25, 1, 1.5, 3, 5, 7.5, 12, 18, 28];

/**
 * Calculate GST for a single line item
 */
export function calculateLineItem(item, isIGST = false) {
  const quantity = parseFloat(item.quantity) || 0;
  const unitPrice = parseFloat(item.unit_price) || 0;
  const discPercent = parseFloat(item.discount_percent) || 0;
  const gstRate = parseFloat(item.gst_rate) || 0;

  const grossAmount = quantity * unitPrice;
  const discountAmount = grossAmount * (discPercent / 100);
  const taxableAmount = grossAmount - discountAmount;

  let cgst = 0,
    sgst = 0,
    igst = 0;

  if (isIGST) {
    igst = taxableAmount * (gstRate / 100);
  } else {
    cgst = taxableAmount * (gstRate / 2 / 100);
    sgst = taxableAmount * (gstRate / 2 / 100);
  }

  const taxAmount = cgst + sgst + igst;
  const lineTotal = taxableAmount + taxAmount;

  return {
    grossAmount,
    discountAmount,
    taxableAmount,
    cgst,
    sgst,
    igst,
    taxAmount,
    lineTotal,
    cgst_rate: isIGST ? 0 : gstRate / 2,
    sgst_rate: isIGST ? 0 : gstRate / 2,
    igst_rate: isIGST ? gstRate : 0,
  };
}

/**
 * Calculate totals for all line items
 */
export function calculateTotals(items, isIGST = false) {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTaxable = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;

  const processedItems = items.map((item) => {
    const calc = calculateLineItem(item, isIGST);
    subtotal += calc.grossAmount;
    totalDiscount += calc.discountAmount;
    totalTaxable += calc.taxableAmount;
    totalCGST += calc.cgst;
    totalSGST += calc.sgst;
    totalIGST += calc.igst;
    return { ...item, ...calc };
  });

  const totalTax = totalCGST + totalSGST + totalIGST;
  const grandTotal = totalTaxable + totalTax;

  return {
    processedItems,
    subtotal,
    totalDiscount,
    totalTaxable,
    totalCGST,
    totalSGST,
    totalIGST,
    totalTax,
    grandTotal,
  };
}

/**
 * Format currency in Indian style
 */
export function formatINR(amount) {
  return `₹${parseFloat(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
