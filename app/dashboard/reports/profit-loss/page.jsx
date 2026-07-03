"use client";

import { useState } from "react";
import api from "@/lib/api";
import { useCompany } from "@/context/CompanyContext";
import ReportShell from "@/components/reports/ReportShell";
import { formatINR } from "@/lib/gst";

export default function ProfitLossPage() {
  const { activeCompany } = useCompany();
  const [data, setData] = useState(null);

  const handleLoad = async (params) => {
    const res = await api.get(`/reports/profit-loss?${params}`);
    setData(res.data);
  };

  return (
    <ReportShell
      title="Profit & Loss"
      subtitle="Income vs Expenses for the selected period"
      exportUrl="/reports/profit-loss/export"
      exportFileName="ProfitLoss.xlsx"
      dateType="range"
      onLoad={handleLoad}
    >
      {data && (
        <div className="space-y-5">
          {/* Net profit banner */}
          <div
            className={`p-5 rounded-xl border ${
              data.netProfit >= 0
                ? "bg-emerald-950/20 border-emerald-800/50"
                : "bg-red-950/20 border-red-900/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">
                  {data.netProfit >= 0 ? "Net Profit" : "Net Loss"}
                </p>
                <p className="text-zinc-500 text-xs mt-0.5">
                  Total Income − Total Expenses
                </p>
              </div>
              <p
                className={`text-3xl font-mono font-bold ${data.netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}
              >
                {formatINR(Math.abs(data.netProfit))}
              </p>
            </div>
            <div className="flex items-center gap-6 mt-3 text-sm">
              <span className="text-zinc-500">
                Income:{" "}
                <span className="text-blue-400 font-mono">
                  {formatINR(data.totalIncome)}
                </span>
              </span>
              <span className="text-zinc-500">
                Expenses:{" "}
                <span className="text-amber-400 font-mono">
                  {formatINR(data.totalExpenses)}
                </span>
              </span>
              <span className="text-zinc-500">
                Margin:{" "}
                <span
                  className={`font-mono ${data.netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}
                >
                  {data.totalIncome > 0
                    ? ((data.netProfit / data.totalIncome) * 100).toFixed(1)
                    : 0}
                  %
                </span>
              </span>
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-2 gap-5">
            {/* Income side */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <h2 className="text-blue-400 text-sm font-semibold uppercase tracking-wider">
                  Income
                </h2>
                <span className="ml-auto text-blue-400 font-mono font-semibold">
                  {formatINR(data.totalIncome)}
                </span>
              </div>
              {data.income.map((group) => (
                <PLGroup key={group.group_name} group={group} color="blue" />
              ))}
              {data.income.length === 0 && (
                <p className="text-zinc-600 text-sm py-4 text-center">
                  No income recorded
                </p>
              )}
            </div>

            {/* Expenses side */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <h2 className="text-amber-400 text-sm font-semibold uppercase tracking-wider">
                  Expenses
                </h2>
                <span className="ml-auto text-amber-400 font-mono font-semibold">
                  {formatINR(data.totalExpenses)}
                </span>
              </div>
              {data.expenses.map((group) => (
                <PLGroup key={group.group_name} group={group} color="amber" />
              ))}
              {data.expenses.length === 0 && (
                <p className="text-zinc-600 text-sm py-4 text-center">
                  No expenses recorded
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </ReportShell>
  );
}

function PLGroup({ group, color }) {
  const [open, setOpen] = useState(true);
  const colors = {
    blue: {
      header: "text-blue-300",
      amount: "text-blue-400",
      bg: "bg-blue-950/20  border-blue-900/30",
    },
    amber: {
      header: "text-amber-300",
      amount: "text-amber-400",
      bg: "bg-amber-950/20 border-amber-900/30",
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
