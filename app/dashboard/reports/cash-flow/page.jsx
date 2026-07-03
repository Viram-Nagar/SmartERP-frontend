"use client";

import { useState } from "react";
import api from "@/lib/api";
import ReportShell from "@/components/reports/ReportShell";
import { formatINR } from "@/lib/gst";

export default function CashFlowPage() {
  const [data, setData] = useState(null);

  const handleLoad = async (params) => {
    const res = await api.get(`/reports/cash-flow?${params}`);
    setData(res.data);
  };

  return (
    <ReportShell
      title="Cash Flow Statement"
      subtitle="Money in and out for the selected period"
      dateType="range"
      onLoad={handleLoad}
    >
      {data && (
        <div className="space-y-5 max-w-3xl">
          {/* Net flow banner */}
          <div
            className={`p-5 rounded-xl border ${
              data.netFlow >= 0
                ? "bg-emerald-950/20 border-emerald-800/50"
                : "bg-red-950/20 border-red-900/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Net Cash Flow</p>
                <p className="text-zinc-500 text-xs mt-0.5">
                  Total In − Total Out across all bank/cash accounts
                </p>
              </div>
              <p
                className={`text-3xl font-mono font-bold ${data.netFlow >= 0 ? "text-emerald-400" : "text-red-400"}`}
              >
                {data.netFlow >= 0 ? "+" : "-"}
                {formatINR(Math.abs(data.netFlow))}
              </p>
            </div>
            <div className="flex gap-6 mt-3 text-sm">
              <span className="text-zinc-500">
                In:{" "}
                <span className="text-emerald-400 font-mono">
                  {formatINR(data.totalIn)}
                </span>
              </span>
              <span className="text-zinc-500">
                Out:{" "}
                <span className="text-red-400 font-mono">
                  {formatINR(data.totalOut)}
                </span>
              </span>
            </div>
          </div>

          {/* By Account */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800">
              <p className="text-zinc-300 text-sm font-medium">By Account</p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-zinc-800/50">
                <tr>
                  {[
                    "Account",
                    "Type",
                    "Money In (Dr)",
                    "Money Out (Cr)",
                    "Net Flow",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-2.5 text-left text-zinc-400 text-xs font-medium uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.accounts.map((acc, idx) => {
                  const net =
                    parseFloat(acc.total_in || 0) -
                    parseFloat(acc.total_out || 0);
                  return (
                    <tr
                      key={acc.name}
                      className={`border-b border-zinc-800/50 ${idx % 2 === 1 ? "bg-zinc-800/20" : ""}`}
                    >
                      <td className="px-5 py-3 text-white font-medium">
                        {acc.name}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`capitalize text-xs px-2 py-0.5 rounded-full border ${
                            acc.ledger_type === "bank"
                              ? "bg-blue-950/40 text-blue-400 border-blue-900/50"
                              : "bg-emerald-950/40 text-emerald-400 border-emerald-900/50"
                          }`}
                        >
                          {acc.ledger_type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-emerald-400 font-mono">
                        {formatINR(acc.total_in)}
                      </td>
                      <td className="px-5 py-3 text-red-400 font-mono">
                        {formatINR(acc.total_out)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`font-mono font-semibold ${net >= 0 ? "text-emerald-400" : "text-red-400"}`}
                        >
                          {net >= 0 ? "+" : ""}
                          {formatINR(net)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Inflows */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <p className="text-zinc-300 text-sm font-medium">Cash Inflows</p>
            </div>
            <div className="divide-y divide-zinc-800/50">
              {data.receipts.map((r) => (
                <div
                  key={r.voucher_type}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div>
                    <p className="text-zinc-300 text-sm capitalize">
                      {r.voucher_type} Vouchers
                    </p>
                    <p className="text-zinc-600 text-xs">
                      {r.count} transactions
                    </p>
                  </div>
                  <span className="text-emerald-400 font-mono font-medium">
                    {formatINR(r.amount)}
                  </span>
                </div>
              ))}
              {data.receipts.length === 0 && (
                <p className="text-zinc-600 text-sm px-5 py-4">
                  No inflows in this period
                </p>
              )}
            </div>
          </div>

          {/* Outflows */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <p className="text-zinc-300 text-sm font-medium">Cash Outflows</p>
            </div>
            <div className="divide-y divide-zinc-800/50">
              {data.payments.map((r) => (
                <div
                  key={r.voucher_type}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div>
                    <p className="text-zinc-300 text-sm capitalize">
                      {r.voucher_type} Vouchers
                    </p>
                    <p className="text-zinc-600 text-xs">
                      {r.count} transactions
                    </p>
                  </div>
                  <span className="text-red-400 font-mono font-medium">
                    {formatINR(r.amount)}
                  </span>
                </div>
              ))}
              {data.payments.length === 0 && (
                <p className="text-zinc-600 text-sm px-5 py-4">
                  No outflows in this period
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </ReportShell>
  );
}
