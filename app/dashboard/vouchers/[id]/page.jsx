"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useCompany } from "@/context/CompanyContext";
import { formatINR } from "@/lib/gst";

const TYPE_LABELS = {
  payment: "Payment Voucher",
  receipt: "Receipt Voucher",
  contra: "Contra Voucher",
  journal: "Journal Voucher",
  sales: "Sales Voucher",
  purchase: "Purchase Voucher",
  credit_note: "Credit Note",
  debit_note: "Debit Note",
  reversing_journal: "Reversing Journal",
};

const TYPE_COLORS = {
  payment: "bg-red-950/40    text-red-400    border-red-900/50",
  receipt: "bg-emerald-950/40 text-emerald-400 border-emerald-900/50",
  contra: "bg-blue-950/40   text-blue-400   border-blue-900/50",
  journal: "bg-purple-950/40 text-purple-400 border-purple-900/50",
  sales: "bg-indigo-950/40 text-indigo-400 border-indigo-900/50",
  purchase: "bg-amber-950/40  text-amber-400  border-amber-900/50",
  credit_note: "bg-cyan-950/40   text-cyan-400   border-cyan-900/50",
  debit_note: "bg-orange-950/40 text-orange-400 border-orange-900/50",
  reversing_journal: "bg-violet-950/40 text-violet-400 border-violet-900/50",
};

export default function VoucherDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { activeCompany } = useCompany();

  const [voucher, setVoucher] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/vouchers/${id}`);
        setVoucher(res.data.voucher);
        setEntries(res.data.entries);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetch();
  }, [id]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.put(`/vouchers/${id}/cancel`, {
        company_id: activeCompany.id,
        reason: "Cancelled by user from detail view",
      });
      const res = await api.get(`/vouchers/${id}`);
      setVoucher(res.data.voucher);
      setShowCancel(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel");
    } finally {
      setCancelling(false);
    }
  };

  const handlePrint = () => window.print();

  if (loading)
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
        Loading...
      </div>
    );
  if (!voucher)
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
        Voucher not found
      </div>
    );

  const totalDr = entries
    .filter((e) => e.entry_type === "Dr")
    .reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const totalCr = entries
    .filter((e) => e.entry_type === "Cr")
    .reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const isCancelled = voucher.status === "cancelled";

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5" id="voucher-print">
      {/* Top actions */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => router.back()}
          className="text-zinc-500 hover:text-white text-sm transition-colors flex items-center gap-1"
        >
          ← Back to vouchers
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-sm transition-colors flex items-center gap-1.5"
          >
            🖨 Print
            <kbd className="bg-zinc-700 border border-zinc-600 rounded px-1 text-[10px]">
              Ctrl+P
            </kbd>
          </button>
          {!isCancelled && (
            <button
              onClick={() => setShowCancel(true)}
              className="px-3 py-1.5 bg-red-950/30 hover:bg-red-900/40 border border-red-900/50 text-red-400 hover:text-red-300 rounded-lg text-sm transition-colors"
            >
              Cancel Voucher
            </button>
          )}
        </div>
      </div>

      {/* Voucher header card */}
      <div
        className={`rounded-xl border p-5 space-y-4 ${isCancelled ? "border-red-900/50 bg-red-950/10" : "border-zinc-800 bg-zinc-900"}`}
      >
        {isCancelled && (
          <div className="flex items-center gap-2 pb-3 border-b border-red-900/30">
            <span className="text-red-400">⊘</span>
            <p className="text-red-400 text-sm font-medium">
              This voucher has been cancelled and reversed
            </p>
          </div>
        )}

        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-white text-xl font-semibold font-mono">
                {voucher.voucher_number}
              </h1>
              <span
                className={`capitalize px-2 py-0.5 rounded-full text-xs font-medium border ${TYPE_COLORS[voucher.voucher_type] || "bg-zinc-800 text-zinc-400 border-zinc-700"}`}
              >
                {TYPE_LABELS[voucher.voucher_type] || voucher.voucher_type}
              </span>
            </div>
            {voucher.narration && (
              <p className="text-zinc-400 text-sm">{voucher.narration}</p>
            )}
          </div>
          <div className="text-right space-y-1">
            <p className="text-white text-2xl font-mono font-bold">
              {formatINR(voucher.total_amount)}
            </p>
            <p className="text-zinc-500 text-xs">
              {new Date(voucher.voucher_date).toLocaleDateString("en-IN", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Meta row */}
        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-zinc-800">
          <div>
            <p className="text-zinc-600 text-xs uppercase tracking-wider">
              Voucher Date
            </p>
            <p className="text-zinc-300 text-sm mt-1">
              {new Date(voucher.voucher_date).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          {voucher.reference_number && (
            <div>
              <p className="text-zinc-600 text-xs uppercase tracking-wider">
                Reference
              </p>
              <p className="text-zinc-300 text-sm mt-1 font-mono">
                {voucher.reference_number}
              </p>
            </div>
          )}
          <div>
            <p className="text-zinc-600 text-xs uppercase tracking-wider">
              Created By
            </p>
            <p className="text-zinc-300 text-sm mt-1">
              {voucher.created_by_name || "System"}
            </p>
          </div>
          <div>
            <p className="text-zinc-600 text-xs uppercase tracking-wider">
              Status
            </p>
            <p
              className={`text-sm mt-1 font-medium capitalize ${isCancelled ? "text-red-400" : "text-emerald-400"}`}
            >
              {voucher.status}
            </p>
          </div>
        </div>
      </div>

      {/* Double-entry table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-800">
          <p className="text-zinc-400 text-xs uppercase tracking-wider font-medium">
            Accounting Entries
          </p>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-zinc-800/50">
            <tr>
              <th className="px-5 py-2.5 text-left text-zinc-500 text-xs uppercase tracking-wider font-medium">
                Ledger
              </th>
              <th className="px-5 py-2.5 text-left text-zinc-500 text-xs uppercase tracking-wider font-medium">
                Group
              </th>
              <th className="px-5 py-2.5 text-center text-zinc-500 text-xs uppercase tracking-wider font-medium w-16">
                Type
              </th>
              <th className="px-5 py-2.5 text-right text-zinc-500 text-xs uppercase tracking-wider font-medium">
                Debit (Dr)
              </th>
              <th className="px-5 py-2.5 text-right text-zinc-500 text-xs uppercase tracking-wider font-medium">
                Credit (Cr)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {entries.map((entry, idx) => (
              <tr
                key={idx}
                className={
                  entry.entry_type === "Dr"
                    ? "bg-emerald-950/5"
                    : "bg-red-950/5"
                }
              >
                <td className="px-5 py-3">
                  <p className="text-white font-medium">{entry.ledger_name}</p>
                  {entry.narration && entry.narration !== voucher.narration && (
                    <p className="text-zinc-500 text-xs mt-0.5">
                      {entry.narration}
                    </p>
                  )}
                </td>
                <td className="px-5 py-3 text-zinc-500 text-sm">
                  {entry.group_name}
                </td>
                <td className="px-5 py-3 text-center">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      entry.entry_type === "Dr"
                        ? "bg-emerald-950/50 text-emerald-400 border border-emerald-900/50"
                        : "bg-red-950/50 text-red-400 border border-red-900/50"
                    }`}
                  >
                    {entry.entry_type}
                  </span>
                </td>
                <td className="px-5 py-3 text-right font-mono">
                  {entry.entry_type === "Dr" ? (
                    <span className="text-emerald-400">
                      {formatINR(entry.amount)}
                    </span>
                  ) : (
                    <span className="text-zinc-700">—</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right font-mono">
                  {entry.entry_type === "Cr" ? (
                    <span className="text-red-400">
                      {formatINR(entry.amount)}
                    </span>
                  ) : (
                    <span className="text-zinc-700">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-zinc-700 bg-zinc-800/30">
            <tr>
              <td
                colSpan={3}
                className="px-5 py-3 text-zinc-400 text-sm font-semibold"
              >
                Total
              </td>
              <td className="px-5 py-3 text-right font-mono font-semibold text-emerald-400">
                {formatINR(totalDr)}
              </td>
              <td className="px-5 py-3 text-right font-mono font-semibold text-red-400">
                {formatINR(totalCr)}
              </td>
            </tr>
            <tr>
              <td colSpan={5} className="px-5 py-2 text-center">
                <span
                  className={`text-xs ${Math.abs(totalDr - totalCr) < 0.01 ? "text-emerald-500" : "text-red-500"}`}
                >
                  {Math.abs(totalDr - totalCr) < 0.01
                    ? "✓ Balanced — Total Debits equal Total Credits"
                    : `⚠ Out of balance by ${formatINR(Math.abs(totalDr - totalCr))}`}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Narration */}
      {voucher.narration && (
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
          <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">
            Narration
          </p>
          <p className="text-zinc-300 text-sm">{voucher.narration}</p>
        </div>
      )}

      {/* Cancel confirm modal */}
      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowCancel(false)}
          />
          <div className="relative bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-red-950/50 border border-red-900/50 flex items-center justify-center text-red-400 shrink-0">
                ⚠
              </div>
              <div>
                <h3 className="text-white font-semibold">
                  Cancel {voucher.voucher_number}?
                </h3>
                <p className="text-zinc-400 text-sm mt-1">
                  All ledger balances affected by this voucher will be reversed.
                  This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancel(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              >
                Keep
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2 text-sm bg-red-700 hover:bg-red-600 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
              >
                {cancelling ? "Cancelling..." : "Cancel & Reverse"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
