"use client";

import { useState } from "react";
import api from "@/lib/api";
import { useCompany } from "@/context/CompanyContext";
import ReportShell from "@/components/reports/ReportShell";
import { formatINR } from "@/lib/gst";

const NATURE_COLORS = {
  assets: "text-emerald-400",
  liabilities: "text-red-400",
  income: "text-blue-400",
  expenses: "text-amber-400",
};

export default function TrialBalancePage() {
  const { activeCompany } = useCompany();
  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");

  const handleLoad = async (params) => {
    const res = await api.get(`/reports/trial-balance?${params}`);
    setData(res.data);
  };

  const filtered =
    data?.rows?.filter(
      (r) =>
        !search ||
        r.ledger_name.toLowerCase().includes(search.toLowerCase()) ||
        r.group_name.toLowerCase().includes(search.toLowerCase()),
    ) || [];

  // Group by nature for display
  const grouped = ["assets", "liabilities", "income", "expenses"]
    .map((nature) => ({
      nature,
      rows: filtered.filter((r) => r.nature === nature),
    }))
    .filter((g) => g.rows.length > 0);

  const isBalanced = data
    ? Math.abs(data.totalDebit - data.totalCredit) < 0.01
    : false;

  return (
    <ReportShell
      title="Trial Balance"
      subtitle="All ledger balances as of selected date"
      exportUrl="/reports/trial-balance/export"
      exportFileName="TrialBalance.xlsx"
      dateType="asof"
      onLoad={handleLoad}
    >
      {data && (
        <div className="space-y-4">
          {/* Balance check */}
          <div
            className={`flex items-center justify-between p-3 rounded-xl border ${
              isBalanced
                ? "bg-emerald-950/20 border-emerald-800/50"
                : "bg-red-950/20 border-red-900/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={isBalanced ? "text-emerald-400" : "text-red-400"}
              >
                {isBalanced ? "✓" : "⚠"}
              </span>
              <span
                className={`text-sm font-medium ${isBalanced ? "text-emerald-400" : "text-red-400"}`}
              >
                {isBalanced
                  ? "Trial Balance is balanced"
                  : "Trial Balance is out of balance!"}
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <span className="text-zinc-500">
                Total Dr:{" "}
                <span className="text-emerald-400 font-mono font-medium">
                  {formatINR(data.totalDebit)}
                </span>
              </span>
              <span className="text-zinc-500">
                Total Cr:{" "}
                <span className="text-red-400 font-mono font-medium">
                  {formatINR(data.totalCredit)}
                </span>
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
              ⌕
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ledger or group..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Table */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-800/50 border-b border-zinc-800">
                <tr>
                  {[
                    "Ledger Name",
                    "Group",
                    "Nature",
                    "Opening Balance",
                    "Debit (Dr)",
                    "Credit (Cr)",
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
                {grouped.map((group) => (
                  <>
                    <tr
                      key={`nature-${group.nature}`}
                      className="bg-zinc-800/30"
                    >
                      <td colSpan={6} className="px-4 py-2">
                        <span
                          className={`text-xs font-semibold uppercase tracking-widest ${NATURE_COLORS[group.nature]}`}
                        >
                          {group.nature}
                        </span>
                      </td>
                    </tr>
                    {group.rows.map((r, idx) => (
                      <tr
                        key={r.id}
                        className={`border-b border-zinc-800/30 ${idx % 2 === 1 ? "bg-zinc-800/10" : ""}`}
                      >
                        <td className="px-4 py-2.5 text-white text-sm">
                          {r.ledger_name}
                        </td>
                        <td className="px-4 py-2.5 text-zinc-500 text-sm">
                          {r.group_name}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`capitalize text-xs font-medium ${NATURE_COLORS[r.nature]}`}
                          >
                            {r.nature}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-sm text-zinc-400">
                          {formatINR(Math.abs(r.opening_balance || 0))}
                          <span className="text-zinc-600 text-xs ml-1">
                            {r.opening_type}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-sm">
                          {parseFloat(r.debit_balance) > 0 ? (
                            <span className="text-emerald-400">
                              {formatINR(r.debit_balance)}
                            </span>
                          ) : (
                            <span className="text-zinc-700">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-sm">
                          {parseFloat(r.credit_balance) > 0 ? (
                            <span className="text-red-400">
                              {formatINR(r.credit_balance)}
                            </span>
                          ) : (
                            <span className="text-zinc-700">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {/* Nature subtotal */}
                    <tr className="bg-zinc-800/20 border-b border-zinc-700">
                      <td
                        colSpan={4}
                        className="px-4 py-2 text-zinc-400 text-xs font-medium text-right"
                      >
                        {group.nature.toUpperCase()} TOTAL
                      </td>
                      <td className="px-4 py-2 font-mono text-sm text-emerald-400 font-semibold">
                        {formatINR(
                          group.rows.reduce(
                            (s, r) => s + parseFloat(r.debit_balance || 0),
                            0,
                          ),
                        )}
                      </td>
                      <td className="px-4 py-2 font-mono text-sm text-red-400 font-semibold">
                        {formatINR(
                          group.rows.reduce(
                            (s, r) => s + parseFloat(r.credit_balance || 0),
                            0,
                          ),
                        )}
                      </td>
                    </tr>
                  </>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-zinc-700 bg-zinc-800/30">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-white font-bold">
                    GRAND TOTAL
                  </td>
                  <td className="px-4 py-3 font-mono text-emerald-400 font-bold text-base">
                    {formatINR(data.totalDebit)}
                  </td>
                  <td className="px-4 py-3 font-mono text-red-400 font-bold text-base">
                    {formatINR(data.totalCredit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p className="text-zinc-600 text-xs">
            {data.rows.length} ledger accounts
          </p>
        </div>
      )}
    </ReportShell>
  );
}
