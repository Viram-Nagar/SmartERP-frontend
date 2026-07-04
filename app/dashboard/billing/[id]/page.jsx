"use client";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useCompany } from "@/context/CompanyContext";
import { formatINR } from "@/lib/gst";

const STATUS_STYLES = {
  unpaid: "bg-red-950/40 text-red-400 border-red-900/50",
  partial: "bg-amber-950/40 text-amber-400 border-amber-900/50",
  paid: "bg-emerald-950/40 text-emerald-400 border-emerald-900/50",
  cancelled: "bg-zinc-800 text-zinc-500 border-zinc-700",
};

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { activeCompany } = useCompany();

  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/invoices/${id}`);
        setInvoice(res.data.invoice);
        setItems(res.data.items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetch();
  }, [id]);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await api.get(
        `/invoices/${id}/pdf?company_id=${activeCompany.id}`,
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${invoice.invoice_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("PDF download failed");
    } finally {
      setDownloading(false);
    }
  };

  useKeyboardShortcuts([
    {
      key: "d",
      ctrl: true,
      action: handleDownloadPDF,
    },
  ]);

  const handleMarkPaid = async () => {
    setMarkingPaid(true);
    try {
      const res = await api.put(`/invoices/${id}/status`, {
        company_id: activeCompany.id,
        status: "paid",
        paid_amount: invoice.total_amount,
      });
      setInvoice(res.data.invoice);
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setMarkingPaid(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
        Loading...
      </div>
    );
  if (!invoice)
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
        Invoice not found
      </div>
    );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="text-zinc-500 hover:text-white text-sm transition-colors flex items-center gap-1"
        >
          ← Back
        </button>
        <div className="flex items-center gap-2">
          {invoice.status !== "paid" && invoice.status !== "cancelled" && (
            <button
              onClick={handleMarkPaid}
              disabled={markingPaid}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {markingPaid ? "Updating..." : "✓ Mark as Paid"}
            </button>
          )}
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {downloading ? "Generating..." : "⬇ Download PDF"}
            <kbd className="bg-indigo-500 border border-indigo-400 rounded px-1 text-[10px]">
              Ctrl+D
            </kbd>
          </button>
        </div>
      </div>

      {/* Invoice header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-white text-2xl font-bold font-mono">
                {invoice.invoice_number}
              </h1>
              <span
                className={`capitalize px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[invoice.status] || ""}`}
              >
                {invoice.status}
              </span>
            </div>
            <p className="text-zinc-500 text-sm">
              {new Date(invoice.invoice_date).toLocaleDateString("en-IN", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-white text-3xl font-mono font-bold">
              {formatINR(invoice.total_amount)}
            </p>
            {parseFloat(invoice.balance_due) > 0 && (
              <p className="text-red-400 text-sm">
                Balance due: {formatINR(invoice.balance_due)}
              </p>
            )}
          </div>
        </div>

        {/* Bill to */}
        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-zinc-800">
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">
              Bill To
            </p>
            <p className="text-white font-semibold">
              {invoice.customer_name || "—"}
            </p>
            {invoice.customer_address && (
              <p className="text-zinc-400 text-sm mt-1">
                {invoice.customer_address}
              </p>
            )}
            {invoice.customer_phone && (
              <p className="text-zinc-500 text-sm">{invoice.customer_phone}</p>
            )}
            {invoice.customer_gstin && (
              <p className="text-zinc-400 text-sm font-mono mt-1">
                GSTIN: {invoice.customer_gstin}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">
              Invoice Details
            </p>
            <div className="space-y-1 text-sm">
              <p className="text-zinc-400">
                Type:{" "}
                <span className="text-white capitalize">
                  {invoice.invoice_type}
                </span>
              </p>
              {invoice.due_date && (
                <p className="text-zinc-400">
                  Due:{" "}
                  <span className="text-white">
                    {new Date(invoice.due_date).toLocaleDateString("en-IN")}
                  </span>
                </p>
              )}
              <p className="text-zinc-400">
                Paid:{" "}
                <span className="text-emerald-400 font-mono">
                  {formatINR(invoice.paid_amount)}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-800">
          <p className="text-zinc-400 text-xs uppercase tracking-wider font-medium">
            Line Items
          </p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-zinc-800/50">
            <tr>
              {[
                "#",
                "Description",
                "HSN",
                "Qty",
                "Rate",
                "Disc%",
                "GST%",
                "Amount",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-left text-zinc-500 text-xs font-medium uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {items.map((item, idx) => (
              <tr
                key={item.id}
                className={idx % 2 === 1 ? "bg-zinc-800/20" : ""}
              >
                <td className="px-4 py-3 text-zinc-500 text-xs">{idx + 1}</td>
                <td className="px-4 py-3">
                  <p className="text-white font-medium">
                    {item.description || item.item_name || "—"}
                  </p>
                </td>
                <td className="px-4 py-3 text-zinc-400 font-mono text-xs">
                  {item.hsn_code || "—"}
                </td>
                <td className="px-4 py-3 text-zinc-300 font-mono">
                  {parseFloat(item.quantity)}
                </td>
                <td className="px-4 py-3 text-zinc-300 font-mono">
                  {formatINR(item.unit_price)}
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {item.discount_percent || 0}%
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {item.gst_rate || 0}%
                </td>
                <td className="px-4 py-3 text-white font-mono font-medium">
                  {formatINR(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tax summary */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
        <p className="text-zinc-400 text-xs uppercase tracking-wider font-medium">
          Tax Summary
        </p>
        <div className="max-w-sm ml-auto space-y-2">
          {[
            ["Subtotal", formatINR(invoice.subtotal), false],
            ["Discount", `- ${formatINR(invoice.discount_amount)}`, false],
            ["Taxable Amount", formatINR(invoice.taxable_amount), false],
            parseFloat(invoice.cgst_amount) > 0 && [
              "CGST",
              formatINR(invoice.cgst_amount),
              true,
            ],
            parseFloat(invoice.sgst_amount) > 0 && [
              "SGST",
              formatINR(invoice.sgst_amount),
              true,
            ],
            parseFloat(invoice.igst_amount) > 0 && [
              "IGST",
              formatINR(invoice.igst_amount),
              true,
            ],
          ]
            .filter(Boolean)
            .map(([label, value, isTax]) => (
              <div
                key={label}
                className="flex items-center justify-between text-sm"
              >
                <span className={isTax ? "text-indigo-400" : "text-zinc-400"}>
                  {label}
                </span>
                <span
                  className={`font-mono ${isTax ? "text-indigo-400" : "text-zinc-300"}`}
                >
                  {value}
                </span>
              </div>
            ))}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-700">
            <span className="text-white font-semibold">Grand Total</span>
            <span className="text-white text-xl font-mono font-bold">
              {formatINR(invoice.total_amount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
