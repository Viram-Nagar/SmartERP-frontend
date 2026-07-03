"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useCompany } from "@/context/CompanyContext";
import { useInventory } from "@/hooks/useInventory";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import InventoryActionModal from "@/components/inventory/InventoryActionModal";
import { formatINR } from "@/lib/gst";

const TXN_TYPE_STYLES = {
  stock_in: "bg-emerald-950/40 text-emerald-400 border-emerald-900/50",
  stock_out: "bg-red-950/40     text-red-400     border-red-900/50",
  transfer: "bg-blue-950/40    text-blue-400    border-blue-900/50",
  adjustment: "bg-amber-950/40   text-amber-400   border-amber-900/50",
  opening: "bg-zinc-800       text-zinc-400    border-zinc-700",
};

const TXN_ICONS = {
  stock_in: "📥",
  stock_out: "📤",
  transfer: "🔄",
  adjustment: "⚙️",
  opening: "🏁",
};

export default function InventoryPage() {
  const router = useRouter();
  const { activeCompany } = useCompany();
  const { summary, stockItems, loading, refetch } = useInventory();

  const [activeAction, setActiveAction] = useState(null); // stock_in | stock_out | transfer | adjustment
  const [activeTab, setActiveTab] = useState("stock"); // stock | transactions
  const [transactions, setTransactions] = useState([]);
  const [txnLoading, setTxnLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Fetch transactions when tab switches
  const fetchTransactions = useCallback(async () => {
    if (!activeCompany) return;
    setTxnLoading(true);
    try {
      const params = new URLSearchParams({ company_id: activeCompany.id });
      if (typeFilter) params.set("type", typeFilter);
      if (search) params.set("search", search);
      const res = await api.get(`/inventory/transactions?${params}`);
      setTransactions(res.data.transactions);
    } catch (err) {
      console.error(err);
    } finally {
      setTxnLoading(false);
    }
  }, [activeCompany, typeFilter, search]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "transactions") fetchTransactions();
  };

  useKeyboardShortcuts(
    [
      { key: "i", ctrl: true, action: () => refetch() },
      { key: "n", ctrl: true, action: () => setActiveAction("stock_in") },
      { key: "t", ctrl: true, action: () => setActiveAction("transfer") },
    ],
    !activeAction,
  );

  // Filter stock items
  const filteredItems = stockItems.filter((item) => {
    const q = search.toLowerCase();
    const nameMatch =
      item.name.toLowerCase().includes(q) ||
      item.sku?.toLowerCase().includes(q);
    const lowMatch =
      !lowStockOnly ||
      (parseFloat(item.low_stock_alert) > 0 &&
        parseFloat(item.current_qty) <= parseFloat(item.low_stock_alert));
    return nameMatch && lowMatch;
  });

  const lowStockCount = stockItems.filter(
    (i) =>
      parseFloat(i.low_stock_alert) > 0 &&
      parseFloat(i.current_qty) <= parseFloat(i.low_stock_alert),
  ).length;

  if (loading)
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
        Loading inventory...
      </div>
    );

  return (
    <div className="p-6 h-full flex flex-col space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-semibold">Inventory</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Stock management and tracking
          </p>
        </div>
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {[
            {
              label: "📥 Stock In",
              action: "stock_in",
              key: "Ctrl+N",
              color: "bg-emerald-700 hover:bg-emerald-600",
            },
            {
              label: "📤 Stock Out",
              action: "stock_out",
              key: "",
              color: "bg-red-800    hover:bg-red-700",
            },
            {
              label: "🔄 Transfer",
              action: "transfer",
              key: "Ctrl+T",
              color: "bg-blue-700   hover:bg-blue-600",
            },
            {
              label: "⚙️ Adjust",
              action: "adjustment",
              key: "",
              color: "bg-amber-700  hover:bg-amber-600",
            },
          ].map((b) => (
            <button
              key={b.action}
              onClick={() => setActiveAction(b.action)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-sm font-medium transition-colors ${b.color}`}
            >
              {b.label}
              {b.key && (
                <kbd className="bg-black/20 border border-white/20 rounded px-1 text-[10px]">
                  {b.key}
                </kbd>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      {summary?.summary && (
        <div className="grid grid-cols-6 gap-3">
          {[
            {
              label: "Total Items",
              value: summary.summary.total_items,
              color: "text-white",
              sub: "in master",
            },
            {
              label: "In Stock",
              value: summary.summary.in_stock_items,
              color: "text-emerald-400",
              sub: "have quantity",
            },
            {
              label: "Out of Stock",
              value: summary.summary.out_of_stock_items,
              color: "text-red-400",
              sub: "zero qty",
            },
            {
              label: "Low Stock",
              value: summary.summary.low_stock_items,
              color: "text-amber-400",
              sub: "below alert",
            },
            {
              label: "Stock Value",
              value: formatINR(summary.summary.total_stock_value),
              color: "text-indigo-400",
              sub: "at cost",
            },
            {
              label: "Retail Value",
              value: formatINR(summary.summary.total_retail_value),
              color: "text-cyan-400",
              sub: "at MRP",
            },
          ].map((c) => (
            <div
              key={c.label}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-1"
            >
              <p className="text-zinc-500 text-xs">{c.label}</p>
              <p className={`text-lg font-bold font-mono ${c.color}`}>
                {c.value}
              </p>
              <p className="text-zinc-600 text-[10px]">{c.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Low stock alert banner */}
      {lowStockCount > 0 && (
        <div className="flex items-center justify-between p-3 bg-amber-950/30 border border-amber-900/50 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-amber-400">⚠</span>
            <p className="text-amber-300 text-sm font-medium">
              {lowStockCount} item{lowStockCount > 1 ? "s" : ""} below low stock
              threshold
            </p>
          </div>
          <button
            onClick={() => {
              setActiveTab("stock");
              setLowStockOnly(true);
            }}
            className="text-amber-400 hover:text-amber-300 text-xs underline"
          >
            View low stock items →
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-800">
        {[
          { id: "stock", label: `Stock Items (${stockItems.length})` },
          { id: "transactions", label: "Transaction History" },
          { id: "valuation", label: "Valuation by Group" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Stock Items ─────────────────────────────────── */}
      {activeTab === "stock" && (
        <div className="flex-1 flex flex-col space-y-3 min-h-0">
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
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
            <button
              onClick={() => setLowStockOnly((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                lowStockOnly
                  ? "bg-amber-950/40 border-amber-800 text-amber-400"
                  : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white"
              }`}
            >
              ⚠ Low Stock Only
            </button>
            <button
              onClick={() => router.push("/dashboard/stock")}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs transition-colors"
            >
              Manage Items →
            </button>
          </div>

          {/* Stock table */}
          <div className="flex-1 overflow-auto rounded-xl border border-zinc-800 bg-zinc-900">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-zinc-900 border-b border-zinc-800">
                <tr>
                  {[
                    "Item",
                    "SKU",
                    "Group",
                    "Current Qty",
                    "Alert",
                    "Cost Price",
                    "Sale Price",
                    "Stock Value",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-zinc-400 text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-zinc-500">
                      No items found
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isLow =
                      parseFloat(item.low_stock_alert) > 0 &&
                      parseFloat(item.current_qty) <=
                        parseFloat(item.low_stock_alert);
                    const isOut = parseFloat(item.current_qty) === 0;
                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-zinc-800/50 transition-colors group ${
                          isOut
                            ? "bg-red-950/10"
                            : isLow
                              ? "bg-amber-950/10"
                              : "hover:bg-zinc-800/30"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <p className="text-white font-medium">{item.name}</p>
                          {isOut && (
                            <span className="text-red-400 text-[10px] bg-red-950/50 border border-red-900/50 rounded px-1">
                              OUT OF STOCK
                            </span>
                          )}
                          {isLow && !isOut && (
                            <span className="text-amber-400 text-[10px] bg-amber-950/50 border border-amber-900/50 rounded px-1">
                              LOW STOCK
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-zinc-400 font-mono text-xs">
                          {item.sku || "—"}
                        </td>
                        <td className="px-4 py-3 text-zinc-400 text-sm">
                          {item.group_name || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-mono text-sm font-medium ${
                              isOut
                                ? "text-red-400"
                                : isLow
                                  ? "text-amber-400"
                                  : "text-white"
                            }`}
                          >
                            {parseFloat(item.current_qty).toLocaleString(
                              "en-IN",
                              { maximumFractionDigits: 3 },
                            )}
                            <span className="text-zinc-500 text-xs ml-1">
                              {item.unit_symbol}
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-500 font-mono text-xs">
                          {parseFloat(item.low_stock_alert) > 0
                            ? item.low_stock_alert
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-zinc-400 font-mono text-sm">
                          {formatINR(item.purchase_price)}
                        </td>
                        <td className="px-4 py-3 text-zinc-300 font-mono text-sm">
                          {formatINR(item.selling_price)}
                        </td>
                        <td className="px-4 py-3 text-indigo-400 font-mono text-sm">
                          {formatINR(item.stock_value)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setActiveAction("stock_in");
                              }}
                              className="px-2 py-1 text-emerald-400 hover:bg-emerald-950/30 rounded text-xs transition-colors"
                            >
                              +In
                            </button>
                            <button
                              onClick={() => {
                                setActiveAction("stock_out");
                              }}
                              className="px-2 py-1 text-red-400    hover:bg-red-950/30    rounded text-xs transition-colors"
                            >
                              -Out
                            </button>
                            <button
                              onClick={() => {
                                setActiveAction("adjustment");
                              }}
                              className="px-2 py-1 text-amber-400  hover:bg-amber-950/30  rounded text-xs transition-colors"
                            >
                              Adj
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filteredItems.length > 0 && (
                <tfoot className="border-t border-zinc-700 bg-zinc-800/30">
                  <tr>
                    <td colSpan={7} className="px-4 py-3 text-zinc-500 text-xs">
                      {filteredItems.length} items
                    </td>
                    <td className="px-4 py-3 text-indigo-400 font-mono text-sm font-semibold">
                      {formatINR(
                        filteredItems.reduce(
                          (s, i) => s + parseFloat(i.stock_value || 0),
                          0,
                        ),
                      )}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Transaction History ──────────────────────────── */}
      {activeTab === "transactions" && (
        <div className="flex-1 flex flex-col space-y-3 min-h-0">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                ⌕
              </span>
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
                onBlur={fetchTransactions}
                placeholder="Search item name or SKU..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-1.5">
              {[
                "",
                "stock_in",
                "stock_out",
                "transfer",
                "adjustment",
                "opening",
              ].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTypeFilter(t);
                    setTimeout(fetchTransactions, 50);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    typeFilter === t
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700"
                  }`}
                >
                  {t ? t.replace("_", " ") : "All"}
                </button>
              ))}
            </div>
            <button
              onClick={fetchTransactions}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-lg text-xs transition-colors"
            >
              🔄 Refresh
            </button>
          </div>

          <div className="flex-1 overflow-auto rounded-xl border border-zinc-800 bg-zinc-900">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-zinc-900 border-b border-zinc-800">
                <tr>
                  {[
                    "Date",
                    "Item",
                    "Type",
                    "Qty",
                    "Rate",
                    "Value",
                    "Balance",
                    "Voucher",
                    "Notes",
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
                {txnLoading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-zinc-500">
                      Loading...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-zinc-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map((txn) => (
                    <tr
                      key={txn.id}
                      className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors"
                    >
                      <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">
                        {new Date(txn.transaction_date).toLocaleDateString(
                          "en-IN",
                          { day: "2-digit", month: "short", year: "numeric" },
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white text-sm">{txn.item_name}</p>
                        {txn.item_sku && (
                          <p className="text-zinc-500 text-xs font-mono">
                            {txn.item_sku}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border w-fit ${TXN_TYPE_STYLES[txn.transaction_type] || ""}`}
                        >
                          <span>{TXN_ICONS[txn.transaction_type]}</span>
                          <span className="capitalize">
                            {txn.transaction_type.replace("_", " ")}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-mono text-sm font-medium ${
                            txn.transaction_type === "stock_in" ||
                            txn.transaction_type === "opening"
                              ? "text-emerald-400"
                              : txn.transaction_type === "stock_out"
                                ? "text-red-400"
                                : "text-zinc-300"
                          }`}
                        >
                          {txn.transaction_type === "stock_in" ||
                          txn.transaction_type === "opening"
                            ? "+"
                            : txn.transaction_type === "stock_out"
                              ? "-"
                              : ""}
                          {parseFloat(txn.quantity).toLocaleString("en-IN", {
                            maximumFractionDigits: 3,
                          })}
                          <span className="text-zinc-500 text-xs ml-1">
                            {txn.unit_symbol}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 font-mono text-xs">
                        {parseFloat(txn.rate) > 0 ? formatINR(txn.rate) : "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-300 font-mono text-xs">
                        {parseFloat(txn.value) > 0 ? formatINR(txn.value) : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-white">
                        {parseFloat(txn.balance_qty).toLocaleString("en-IN", {
                          maximumFractionDigits: 3,
                        })}
                        <span className="text-zinc-500 text-xs ml-1">
                          {txn.unit_symbol}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {txn.voucher_number ? (
                          <span className="text-indigo-400 font-mono text-xs">
                            {txn.voucher_number}
                          </span>
                        ) : (
                          <span className="text-zinc-600 text-xs">Manual</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-xs max-w-xs truncate">
                        {txn.notes || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="text-zinc-600 text-xs">
            {transactions.length} transactions
          </p>
        </div>
      )}

      {/* ── Tab: Valuation by Group ───────────────────────────── */}
      {activeTab === "valuation" && summary?.valueByGroup && (
        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-1 gap-3">
            {summary.valueByGroup.map((group, idx) => {
              const totalValue = summary.valueByGroup.reduce(
                (s, g) => s + parseFloat(g.stock_value || 0),
                0,
              );
              const pct =
                totalValue > 0
                  ? (parseFloat(group.stock_value || 0) / totalValue) * 100
                  : 0;
              return (
                <div
                  key={idx}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-white font-medium">
                        {group.group_name}
                      </p>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        {group.item_count} items · Total qty:{" "}
                        {parseFloat(group.total_qty || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-indigo-400 font-mono font-semibold">
                        {formatINR(group.stock_value)}
                      </p>
                      <p className="text-zinc-500 text-xs">
                        {pct.toFixed(1)}% of total
                      </p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="bg-zinc-900 border border-indigo-800/50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">Total Stock Value</p>
              <p className="text-zinc-500 text-xs">All groups at cost price</p>
            </div>
            <p className="text-indigo-400 text-2xl font-mono font-bold">
              {formatINR(summary?.summary?.total_stock_value)}
            </p>
          </div>
          <div className="bg-zinc-900 border border-cyan-800/50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">Total Retail Value</p>
              <p className="text-zinc-500 text-xs">
                All groups at selling price (MRP)
              </p>
            </div>
            <p className="text-cyan-400 text-2xl font-mono font-bold">
              {formatINR(summary?.summary?.total_retail_value)}
            </p>
          </div>
        </div>
      )}

      {/* Action Modal */}
      <InventoryActionModal
        open={!!activeAction}
        onClose={() => setActiveAction(null)}
        action={activeAction}
        stockItems={stockItems}
        onSuccess={refetch}
      />
    </div>
  );
}
