"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useCompany } from "@/context/CompanyContext";

const VOUCHER_TYPES = [
  { value: "", label: "All Vouchers" },
  {
    value: "payment",
    label: "Payment",
    shortcut: "Alt+F5",
    path: "/dashboard/vouchers/payment",
  },
  {
    value: "receipt",
    label: "Receipt",
    shortcut: "F6",
    path: "/dashboard/vouchers/receipt",
  },
  {
    value: "contra",
    label: "Contra",
    shortcut: "",
    path: "/dashboard/vouchers/contra",
  },
  {
    value: "journal",
    label: "Journal",
    shortcut: "F7",
    path: "/dashboard/vouchers/journal",
  },
  {
    value: "sales",
    label: "Sales",
    shortcut: "F8",
    path: "/dashboard/vouchers/sales",
  },
  {
    value: "purchase",
    label: "Purchase",
    shortcut: "F9",
    path: "/dashboard/vouchers/purchase",
  },
  {
    value: "credit_note",
    label: "Credit Note",
    shortcut: "Alt+F8",
    path: "/dashboard/vouchers/credit-note",
  },
  {
    value: "debit_note",
    label: "Debit Note",
    shortcut: "Alt+F9",
    path: "/dashboard/vouchers/debit-note",
  },
];

const TYPE_COLORS = {
  payment: "bg-red-950/40    text-red-400    border-red-900/50",
  receipt: "bg-emerald-950/40 text-emerald-400 border-emerald-900/50",
  contra: "bg-blue-950/40   text-blue-400   border-blue-900/50",
  journal: "bg-purple-950/40 text-purple-400 border-purple-900/50",
  sales: "bg-indigo-950/40 text-indigo-400 border-indigo-900/50",
  purchase: "bg-amber-950/40  text-amber-400  border-amber-900/50",
  credit_note: "bg-cyan-950/40   text-cyan-400   border-cyan-900/50",
  debit_note: "bg-orange-950/40 text-orange-400 border-orange-900/50",
};

export default function VouchersPage() {
  const router = useRouter();
  const { activeCompany } = useCompany();

  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchVouchers = useCallback(async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ company_id: activeCompany.id });
      if (typeFilter) params.set("type", typeFilter);
      if (search) params.set("search", search);
      const res = await api.get(`/vouchers?${params}`);
      setVouchers(res.data.vouchers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeCompany, typeFilter, search]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.put(`/vouchers/${cancelTarget.id}/cancel`, {
        company_id: activeCompany.id,
        reason: "Cancelled by user",
      });
      await fetchVouchers();
      setCancelTarget(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-xl font-semibold">Vouchers</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            All accounting transactions
          </p>
        </div>
        {/* Quick create buttons */}
        <div className="flex items-center gap-2">
          {VOUCHER_TYPES.filter((t) => t.path).map((t) => (
            <button
              key={t.value}
              onClick={() => router.push(t.path)}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
            >
              {t.label}
              {t.shortcut && (
                <span className="ml-1.5 text-zinc-600 font-mono text-[10px]">
                  {t.shortcut}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
            ⌕
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search voucher number, narration..."
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {VOUCHER_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === t.value
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-xl border border-zinc-800 bg-zinc-900">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-zinc-900 border-b border-zinc-800">
            <tr>
              <th className="px-4 py-3 text-left text-zinc-400 text-xs font-medium uppercase tracking-wider">
                Voucher No.
              </th>
              <th className="px-4 py-3 text-left text-zinc-400 text-xs font-medium uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-zinc-400 text-xs font-medium uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-zinc-400 text-xs font-medium uppercase tracking-wider">
                Narration
              </th>
              <th className="px-4 py-3 text-right text-zinc-400 text-xs font-medium uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-right text-zinc-400 text-xs font-medium uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-zinc-500">
                  Loading...
                </td>
              </tr>
            ) : vouchers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-zinc-500">
                  No vouchers found
                </td>
              </tr>
            ) : (
              vouchers.map((v) => (
                // Replace the existing <tr> in the voucher list table body with:
                <tr
                  key={v.id}
                  onClick={() => router.push(`/dashboard/vouchers/${v.id}`)}
                  className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors group cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-indigo-400 text-sm">
                      {v.voucher_number}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`capitalize px-2 py-0.5 rounded-full text-xs font-medium border ${TYPE_COLORS[v.voucher_type] || "bg-zinc-800 text-zinc-400 border-zinc-700"}`}
                    >
                      {v.voucher_type.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-sm">
                    {new Date(v.voucher_date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-sm max-w-xs truncate">
                    {v.narration || "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-white text-sm">
                    ₹
                    {parseFloat(v.total_amount || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setCancelTarget(v)}
                      className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs text-zinc-400 hover:text-red-400 hover:bg-red-950/20 rounded transition-all"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3 text-zinc-600 text-xs">
        <span>
          {vouchers.length} voucher{vouchers.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Cancel confirm */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setCancelTarget(null)}
          />
          <div className="relative bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-white font-semibold">Cancel voucher?</h3>
            <p className="text-zinc-400 text-sm">
              <span className="text-white font-mono">
                {cancelTarget.voucher_number}
              </span>{" "}
              will be reversed. All ledger balances affected by this voucher
              will be restored.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setCancelTarget(null)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2 text-sm bg-red-700 hover:bg-red-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {cancelling ? "Reversing..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
