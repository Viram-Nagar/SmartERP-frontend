"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useCompany } from "@/context/CompanyContext";
import { formatINR } from "@/lib/gst";

const STATUS_STYLES = {
  unpaid: "bg-red-950/40    text-red-400    border-red-900/50",
  partial: "bg-amber-950/40  text-amber-400  border-amber-900/50",
  paid: "bg-emerald-950/40 text-emerald-400 border-emerald-900/50",
  draft: "bg-zinc-800      text-zinc-400   border-zinc-700",
  cancelled: "bg-zinc-800/50   text-zinc-600   border-zinc-700",
};

export default function BillingPage() {
  const router = useRouter();
  const { activeCompany } = useCompany();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [downloading, setDownloading] = useState(null);

  const fetchInvoices = useCallback(async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ company_id: activeCompany.id });
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await api.get(`/invoices?${params}`);
      setInvoices(res.data.invoices);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeCompany, statusFilter, search]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleDownloadPDF = async (e, invoiceId) => {
    e.stopPropagation();
    setDownloading(invoiceId);
    try {
      const res = await api.get(
        `/invoices/${invoiceId}/pdf?company_id=${activeCompany.id}`,
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("PDF download failed");
    } finally {
      setDownloading(null);
    }
  };

  // Summary stats
  const stats = {
    total: invoices.length,
    totalValue: invoices.reduce(
      (s, i) => s + parseFloat(i.total_amount || 0),
      0,
    ),
    outstanding: invoices
      .filter((i) => i.status === "unpaid" || i.status === "partial")
      .reduce((s, i) => s + parseFloat(i.balance_due || 0), 0),
    paid: invoices.filter((i) => i.status === "paid").length,
  };

  return (
    <div className="p-6 h-full flex flex-col space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-semibold">
            Billing & Invoices
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            All GST invoices generated from sales vouchers
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/vouchers/sales")}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          + New Invoice
          <kbd className="bg-indigo-500 border border-indigo-400 rounded px-1 text-[10px]">
            F8
          </kbd>
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: "Total Invoices",
            value: stats.total,
            sub: "all time",
            color: "text-white",
          },
          {
            label: "Total Billed",
            value: formatINR(stats.totalValue),
            sub: "gross value",
            color: "text-indigo-400",
          },
          {
            label: "Outstanding",
            value: formatINR(stats.outstanding),
            sub: "unpaid + partial",
            color: "text-red-400",
          },
          {
            label: "Paid",
            value: stats.paid,
            sub: "invoices settled",
            color: "text-emerald-400",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
          >
            <p className="text-zinc-500 text-xs">{s.label}</p>
            <p className={`text-xl font-bold font-mono mt-1 ${s.color}`}>
              {s.value}
            </p>
            <p className="text-zinc-600 text-xs mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
            ⌕
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number, customer..."
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-1.5">
          {["", "unpaid", "partial", "paid", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-xl border border-zinc-800 bg-zinc-900">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-zinc-900 border-b border-zinc-800">
            <tr>
              {[
                "Invoice No.",
                "Customer",
                "Date",
                "Amount",
                "Balance Due",
                "Status",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-zinc-400 text-xs font-medium uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-zinc-500">
                  Loading...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <p className="text-zinc-500 text-sm">No invoices yet</p>
                  <button
                    onClick={() => router.push("/dashboard/vouchers/sales")}
                    className="mt-2 text-indigo-400 hover:text-indigo-300 text-sm"
                  >
                    Create first invoice via Sales Voucher (F8) →
                  </button>
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => router.push(`/dashboard/billing/${inv.id}`)}
                  className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors cursor-pointer group"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-indigo-400 text-sm">
                      {inv.invoice_number}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white text-sm">
                      {inv.customer_name || "—"}
                    </p>
                    {inv.customer_gstin && (
                      <p className="text-zinc-500 text-xs font-mono">
                        {inv.customer_gstin}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-sm">
                    {new Date(inv.invoice_date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 font-mono text-white text-sm">
                    {formatINR(inv.total_amount)}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">
                    <span
                      className={
                        parseFloat(inv.balance_due) > 0
                          ? "text-red-400"
                          : "text-zinc-500"
                      }
                    >
                      {formatINR(inv.balance_due)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`capitalize px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[inv.status] || ""}`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleDownloadPDF(e, inv.id)}
                        disabled={downloading === inv.id}
                        className="px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
                      >
                        {downloading === inv.id ? "..." : "⬇ PDF"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-zinc-600 text-xs">
        {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
