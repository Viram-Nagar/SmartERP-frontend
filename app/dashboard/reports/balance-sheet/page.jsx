"use client";

import { useState } from "react";
import api from "@/lib/api";
import ReportShell from "@/components/reports/ReportShell";
import { formatINR } from "@/lib/gst";

export default function BalanceSheetPage() {
  const [data, setData] = useState(null);

  const handleLoad = async (params) => {
    const res = await api.get(`/reports/balance-sheet?${params}`);
    setData(res.data);
  };

  const totalLiabSide = data ? data.totalLiabilities + data.netProfit : 0;
  const isBalanced = data
    ? Math.abs(totalLiabSide - data.totalAssets) < 1
    : false;

  return (
    <ReportShell
      title="Balance Sheet"
      subtitle="Financial position as of selected date"
      exportUrl="/reports/balance-sheet/export"
      exportFileName="BalanceSheet.xlsx"
      dateType="asof"
      onLoad={handleLoad}
    >
      {data && (
        <div className="space-y-4">
          {/* Balance check */}
          <div
            className={`flex items-center justify-between p-3 rounded-xl border text-sm ${
              isBalanced
                ? "bg-emerald-950/20 border-emerald-800/50 text-emerald-400"
                : "bg-red-950/20 border-red-900/50 text-red-400"
            }`}
          >
            <span>
              {isBalanced
                ? "✓ Balance Sheet is balanced"
                : "⚠ Balance Sheet is out of balance"}
            </span>
            <div className="flex gap-6 text-xs">
              <span>
                Assets:{" "}
                <span className="font-mono font-medium">
                  {formatINR(data.totalAssets)}
                </span>
              </span>
              <span>
                Liabilities + Capital:{" "}
                <span className="font-mono font-medium">
                  {formatINR(totalLiabSide)}
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Liabilities + Capital */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <h2 className="text-red-400 text-sm font-semibold uppercase tracking-wider">
                    Liabilities & Capital
                  </h2>
                </div>
                <span className="text-red-400 font-mono font-semibold">
                  {formatINR(totalLiabSide)}
                </span>
              </div>
              {data.liabilities.map((g) => (
                <BSGroup key={g.group_name} group={g} color="red" />
              ))}
              {/* Retained Earnings / Net Profit */}
              <div
                className={`rounded-xl border overflow-hidden ${
                  data.netProfit >= 0
                    ? "bg-emerald-950/20 border-emerald-800/30"
                    : "bg-red-950/20 border-red-900/30"
                }`}
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-medium text-zinc-300">
                    Net Profit / (Loss)
                  </span>
                  <span
                    className={`font-mono text-sm font-semibold ${data.netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {formatINR(Math.abs(data.netProfit))}
                    {data.netProfit < 0 && (
                      <span className="text-xs ml-1">(Loss)</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Assets */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h2 className="text-emerald-400 text-sm font-semibold uppercase tracking-wider">
                    Assets
                  </h2>
                </div>
                <span className="text-emerald-400 font-mono font-semibold">
                  {formatINR(data.totalAssets)}
                </span>
              </div>
              {data.assets.map((g) => (
                <BSGroup key={g.group_name} group={g} color="emerald" />
              ))}
            </div>
          </div>
        </div>
      )}
    </ReportShell>
  );
}

function BSGroup({ group, color }) {
  const [open, setOpen] = useState(true);
  const colors = {
    emerald: {
      header: "text-emerald-300",
      amount: "text-emerald-400",
      bg: "bg-emerald-950/10 border-emerald-900/20",
    },
    red: {
      header: "text-red-300",
      amount: "text-red-400",
      bg: "bg-red-950/10     border-red-900/20",
    },
  };
  const c = colors[color];

  return (
    <div className={`rounded-xl border overflow-hidden ${c.bg}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5"
      >
        <span className={`text-sm font-medium ${c.header}`}>
          {group.group_name}
        </span>
        <div className="flex items-center gap-3">
          <span className={`font-mono text-sm font-semibold ${c.amount}`}>
            {formatINR(group.total)}
          </span>
          <span className="text-zinc-600 text-xs">{open ? "▾" : "▸"}</span>
        </div>
      </button>
      {open && (
        <div className="border-t border-zinc-800/50">
          {group.ledgers.map((l) => (
            <div
              key={l.ledger_name}
              className="flex items-center justify-between px-5 py-2 hover:bg-zinc-800/30 transition-colors"
            >
              <span className="text-zinc-300 text-sm">{l.ledger_name}</span>
              <span className="text-zinc-400 font-mono text-sm">
                {formatINR(l.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
