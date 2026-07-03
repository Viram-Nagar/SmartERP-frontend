"use client";

import { useState } from "react";
import api from "@/lib/api";
import ReportShell from "@/components/reports/ReportShell";
import { formatINR } from "@/lib/gst";

export default function StockSummaryPage() {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");

  const handleLoad = async (params) => {
    const res = await api.get(`/reports/stock-summary?${params}`);
    setData(res.data);
  };

  const filtered =
    data?.rows?.filter(
      (r) =>
        !search ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.sku?.toLowerCase().includes(search.toLowerCase()),
    ) || [];

  return (
    <ReportShell
      title="Stock Summary"
      subtitle="Current inventory valuation and movement"
      exportUrl="/reports/stock-summary/export"
      exportFileName="StockSummary.xlsx"
      dateType="asof"
      onLoad={handleLoad}
    >
      {data && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-3">
            {[
              {
                label: "Total Items",
                value: data.totalItems,
                color: "text-white",
                suffix: "items",
              },
              {
                label: "Low Stock",
                value: data.lowStock.length,
                color: "text-amber-400",
                suffix: "items",
              },
              {
                label: "Stock Value",
                value: formatINR(data.totalValue),
                color: "text-indigo-400",
                suffix: "at cost",
              },
              {
                label: "Retail Value",
                value: formatINR(data.totalRetail),
                color: "text-cyan-400",
                suffix: "at MRP",
              },
            ].map((c) => (
              <div
                key={c.label}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
              >
                <p className="text-zinc-500 text-xs">{c.label}</p>
                <p className={`text-xl font-bold font-mono mt-1 ${c.color}`}>
                  {c.value}
                </p>
                <p className="text-zinc-600 text-xs mt-0.5">{c.suffix}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="relative max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
              ⌕
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or SKU..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Table */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-800/50 border-b border-zinc-800 sticky top-0">
                <tr>
                  {[
                    "Item",
                    "SKU",
                    "Group",
                    "Unit",
                    "Opening",
                    "Stock In",
                    "Stock Out",
                    "Closing Qty",
                    "Cost",
                    "Value",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-zinc-400 text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr
                    key={item.name}
                    className={`border-b border-zinc-800/30 transition-colors ${
                      item.is_low_stock
                        ? "bg-amber-950/10"
                        : idx % 2 === 1
                          ? "bg-zinc-800/10"
                          : ""
                    }`}
                  >
                    <td className="px-4 py-2.5">
                      <p className="text-white text-sm font-medium">
                        {item.name}
                      </p>
                      {item.is_low_stock && (
                        <span className="text-amber-400 text-[10px] bg-amber-950/50 border border-amber-900/50 rounded px-1">
                          LOW
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-500 font-mono text-xs">
                      {item.sku || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-400 text-sm">
                      {item.group_name || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-500 text-xs">
                      {item.unit || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-400 font-mono text-sm">
                      {parseFloat(item.opening_qty || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-emerald-400 font-mono text-sm">
                      +{parseFloat(item.total_in || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-red-400 font-mono text-sm">
                      -{parseFloat(item.total_out || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`font-mono text-sm font-medium ${
                          parseFloat(item.current_qty) === 0
                            ? "text-red-400"
                            : item.is_low_stock
                              ? "text-amber-400"
                              : "text-white"
                        }`}
                      >
                        {parseFloat(item.current_qty).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-400 font-mono text-sm">
                      {formatINR(item.purchase_price)}
                    </td>
                    <td className="px-4 py-2.5 text-indigo-400 font-mono text-sm font-medium">
                      {formatINR(item.stock_value)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-zinc-700 bg-zinc-800/30">
                <tr>
                  <td colSpan={9} className="px-4 py-3 text-white font-bold">
                    TOTAL ({filtered.length} items)
                  </td>
                  <td className="px-4 py-3 text-indigo-400 font-mono font-bold">
                    {formatINR(
                      filtered.reduce(
                        (s, r) => s + parseFloat(r.stock_value || 0),
                        0,
                      ),
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </ReportShell>
  );
}
