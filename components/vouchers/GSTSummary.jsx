import { formatINR } from "@/lib/gst";

export default function GSTSummary({ totals, isIGST }) {
  const {
    subtotal,
    totalDiscount,
    totalTaxable,
    totalCGST,
    totalSGST,
    totalIGST,
    totalTax,
    grandTotal,
  } = totals;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-800">
        <p className="text-zinc-400 text-xs uppercase tracking-wider font-medium">
          Tax Summary
        </p>
      </div>
      <div className="p-5 space-y-2">
        <Row label="Subtotal" value={formatINR(subtotal)} dim />
        {totalDiscount > 0 && (
          <Row
            label="Discount"
            value={`- ${formatINR(totalDiscount)}`}
            dim
            red
          />
        )}
        <Row label="Taxable Amount" value={formatINR(totalTaxable)} />
        <div className="border-t border-zinc-800 my-2" />
        {!isIGST && totalCGST > 0 && (
          <Row label="CGST" value={formatINR(totalCGST)} tax />
        )}
        {!isIGST && totalSGST > 0 && (
          <Row label="SGST" value={formatINR(totalSGST)} tax />
        )}
        {isIGST && totalIGST > 0 && (
          <Row label="IGST" value={formatINR(totalIGST)} tax />
        )}
        {totalTax > 0 && (
          <Row label="Total Tax" value={formatINR(totalTax)} tax />
        )}
        <div className="border-t border-zinc-700 mt-3 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold">Grand Total</span>
            <span className="text-white text-xl font-mono font-bold">
              {formatINR(grandTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, dim, red, tax }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span
        className={
          dim ? "text-zinc-500" : tax ? "text-indigo-400" : "text-zinc-300"
        }
      >
        {label}
      </span>
      <span
        className={`font-mono ${red ? "text-red-400" : tax ? "text-indigo-400" : dim ? "text-zinc-400" : "text-white"}`}
      >
        {value}
      </span>
    </div>
  );
}
