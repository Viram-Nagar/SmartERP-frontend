"use client";

import { useEffect } from "react";
import { calculateLineItem, GST_RATES, formatINR } from "@/lib/gst";
import { Input } from "@/components/ui/input";

const EMPTY_ITEM = {
  stock_item_id: "",
  description: "",
  hsn_code: "",
  quantity: "1",
  unit_price: "",
  discount_percent: "0",
  gst_rate: "18",
};

export default function LineItemsTable({
  items,
  onChange, // (updatedItems) => void
  stockItems, // from API
  isIGST,
  readOnly = false,
}) {
  const addRow = () => onChange([...items, { ...EMPTY_ITEM }]);
  const removeRow = (idx) => {
    if (items.length === 1) return;
    onChange(items.filter((_, i) => i !== idx));
  };

  const updateRow = (idx, key, val) => {
    const updated = items.map((item, i) => {
      if (i !== idx) return item;
      const newItem = { ...item, [key]: val };

      // Auto-fill from stock item selection
      if (key === "stock_item_id" && val) {
        const stock = stockItems.find((s) => s.id === val);
        if (stock) {
          newItem.description = stock.name;
          newItem.hsn_code = stock.hsn_code || "";
          newItem.unit_price = String(stock.selling_price || "");
          newItem.gst_rate = String(stock.gst_rate || "18");
        }
      }
      return newItem;
    });
    onChange(updated);
  };

  // Keyboard shortcut: Alt+N adds a row
  useEffect(() => {
    const handler = (e) => {
      if (e.altKey && e.key === "n") {
        e.preventDefault();
        addRow();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [items]);

  return (
    <div className="space-y-3">
      {/* Column headers */}
      <div className="grid grid-cols-12 gap-2 px-3 py-1.5 bg-zinc-800/50 rounded-lg">
        <div className="col-span-3 text-zinc-500 text-xs uppercase tracking-wider">
          Item / Description
        </div>
        <div className="col-span-1 text-zinc-500 text-xs uppercase tracking-wider">
          HSN
        </div>
        <div className="col-span-1 text-zinc-500 text-xs uppercase tracking-wider text-right">
          Qty
        </div>
        <div className="col-span-2 text-zinc-500 text-xs uppercase tracking-wider text-right">
          Rate (₹)
        </div>
        <div className="col-span-1 text-zinc-500 text-xs uppercase tracking-wider text-right">
          Disc%
        </div>
        <div className="col-span-1 text-zinc-500 text-xs uppercase tracking-wider text-right">
          GST%
        </div>
        <div className="col-span-2 text-zinc-500 text-xs uppercase tracking-wider text-right">
          Amount
        </div>
        <div className="col-span-1" />
      </div>

      {/* Rows */}
      {items.map((item, idx) => {
        const calc = calculateLineItem(item, isIGST);
        const stock = stockItems.find((s) => s.id === item.stock_item_id);
        const lowQty =
          stock &&
          parseFloat(item.quantity) > parseFloat(stock.current_qty || 0);

        return (
          <div
            key={idx}
            className={`
              grid grid-cols-12 gap-2 p-3 rounded-xl border transition-colors
              ${
                lowQty
                  ? "bg-red-950/20 border-red-900/50"
                  : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
              }
            `}
          >
            {/* Item select + description */}
            <div className="col-span-3 space-y-1.5">
              <select
                value={item.stock_item_id}
                onChange={(e) =>
                  updateRow(idx, "stock_item_id", e.target.value)
                }
                disabled={readOnly}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs focus:border-indigo-500 focus:outline-none px-2 py-1.5"
              >
                <option value="">— Select Item —</option>
                {stockItems.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.sku ? `(${s.sku})` : ""} | Qty:{" "}
                    {parseFloat(s.current_qty || 0)}
                  </option>
                ))}
              </select>
              <Input
                value={item.description}
                onChange={(e) => updateRow(idx, "description", e.target.value)}
                placeholder="Description / Particulars"
                disabled={readOnly}
                className="bg-zinc-800 border-zinc-700 text-zinc-300 placeholder:text-zinc-600 text-xs focus:border-indigo-500 py-1.5 h-auto"
              />
              {lowQty && (
                <p className="text-red-400 text-[10px]">
                  ⚠ Only {parseFloat(stock.current_qty || 0)} in stock
                </p>
              )}
            </div>

            {/* HSN */}
            <div className="col-span-1">
              <Input
                value={item.hsn_code}
                onChange={(e) => updateRow(idx, "hsn_code", e.target.value)}
                placeholder="HSN"
                disabled={readOnly}
                className="bg-zinc-800 border-zinc-700 text-zinc-400 text-xs font-mono focus:border-indigo-500 py-1.5 h-auto"
              />
            </div>

            {/* Qty */}
            <div className="col-span-1">
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => updateRow(idx, "quantity", e.target.value)}
                placeholder="1"
                min="0.001"
                step="0.001"
                disabled={readOnly}
                className="bg-zinc-800 border-zinc-700 text-white text-xs font-mono focus:border-indigo-500 py-1.5 h-auto text-right"
              />
              {stock && (
                <p className="text-zinc-600 text-[10px] text-right mt-0.5">
                  {stock.unit_symbol}
                </p>
              )}
            </div>

            {/* Rate */}
            <div className="col-span-2">
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">
                  ₹
                </span>
                <Input
                  type="number"
                  value={item.unit_price}
                  onChange={(e) => updateRow(idx, "unit_price", e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  disabled={readOnly}
                  className="bg-zinc-800 border-zinc-700 text-white text-xs font-mono pl-5 focus:border-indigo-500 py-1.5 h-auto text-right"
                />
              </div>
            </div>

            {/* Discount % */}
            <div className="col-span-1">
              <div className="relative">
                <Input
                  type="number"
                  value={item.discount_percent}
                  onChange={(e) =>
                    updateRow(idx, "discount_percent", e.target.value)
                  }
                  placeholder="0"
                  step="0.01"
                  min="0"
                  max="100"
                  disabled={readOnly}
                  className="bg-zinc-800 border-zinc-700 text-white text-xs font-mono focus:border-indigo-500 py-1.5 h-auto text-right pr-5"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">
                  %
                </span>
              </div>
            </div>

            {/* GST % */}
            <div className="col-span-1">
              <select
                value={item.gst_rate}
                onChange={(e) => updateRow(idx, "gst_rate", e.target.value)}
                disabled={readOnly}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs focus:border-indigo-500 focus:outline-none px-2 py-1.5"
              >
                {GST_RATES.map((r) => (
                  <option key={r} value={r}>
                    {r}%
                  </option>
                ))}
              </select>
            </div>

            {/* Amount + GST breakdown */}
            <div className="col-span-2 text-right space-y-0.5">
              <p className="text-white text-sm font-mono font-medium">
                {formatINR(calc.lineTotal)}
              </p>
              {calc.taxableAmount > 0 && (
                <div className="text-[10px] text-zinc-500 space-y-0.5">
                  <p>Taxable: {formatINR(calc.taxableAmount)}</p>
                  {!isIGST && calc.cgst > 0 && (
                    <p>
                      CGST {item.gst_rate / 2}%: {formatINR(calc.cgst)}
                    </p>
                  )}
                  {!isIGST && calc.sgst > 0 && (
                    <p>
                      SGST {item.gst_rate / 2}%: {formatINR(calc.sgst)}
                    </p>
                  )}
                  {isIGST && calc.igst > 0 && (
                    <p>
                      IGST {item.gst_rate}%: {formatINR(calc.igst)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Remove */}
            <div className="col-span-1 flex items-start justify-center pt-1">
              {!readOnly && items.length > 1 && (
                <button
                  onClick={() => removeRow(idx)}
                  className="text-zinc-600 hover:text-red-400 transition-colors text-xl leading-none w-6 h-6 flex items-center justify-center rounded hover:bg-red-950/20"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Add row */}
      {!readOnly && (
        <button
          onClick={addRow}
          className="w-full py-2.5 rounded-xl border border-dashed border-zinc-700 text-zinc-500 hover:text-indigo-400 hover:border-indigo-500/50 text-sm transition-colors flex items-center justify-center gap-2"
        >
          <span>+</span>
          <span>Add Item</span>
          <kbd className="bg-zinc-800 border border-zinc-700 rounded px-1 text-[10px]">
            Alt+N
          </kbd>
        </button>
      )}
    </div>
  );
}
