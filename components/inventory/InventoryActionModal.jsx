"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useCompany } from "@/context/CompanyContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField, FormRow } from "@/components/ui/FormField";

const ADJUSTMENT_REASONS = [
  "Physical Count Correction",
  "Damaged Goods",
  "Expired Stock",
  "Theft / Loss",
  "Returned to Supplier",
  "Sample / Internal Use",
  "Opening Balance Correction",
  "Other",
];

const STOCK_IN_REASONS = [
  "Purchase from Supplier",
  "Sales Return",
  "Manufacturing Output",
  "Opening Stock",
  "Transfer In",
  "Other",
];

const STOCK_OUT_REASONS = [
  "Sales to Customer",
  "Damaged / Spoilage",
  "Internal Consumption",
  "Sample Given",
  "Transfer Out",
  "Other",
];

export default function InventoryActionModal({
  open,
  onClose,
  action,
  stockItems,
  onSuccess,
}) {
  const { activeCompany } = useCompany();
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (open) {
      setForm({
        transaction_date: today,
        quantity: "",
        rate: "",
        notes: "",
        reason: "",
        new_quantity: "",
      });
      setError("");
      setSuccess("");
    }
  }, [open, action]);

  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  // When item selected, fill rate from master
  const handleItemSelect = (id) => {
    const item = stockItems.find((s) => s.id === id);
    setForm((p) => ({
      ...p,
      stock_item_id: id,
      rate:
        action === "stock_out"
          ? String(item?.selling_price || "")
          : String(item?.purchase_price || ""),
      new_quantity:
        action === "adjustment"
          ? String(item?.current_qty || "0")
          : p.new_quantity,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      let res;
      const base = {
        company_id: activeCompany.id,
        transaction_date: form.transaction_date,
      };

      if (action === "stock_in") {
        if (!form.stock_item_id || !form.quantity)
          throw new Error("Select item and enter quantity");
        res = await api.post("/inventory/stock-in", {
          ...base,
          stock_item_id: form.stock_item_id,
          quantity: form.quantity,
          rate: form.rate,
          notes: form.notes,
          reason: form.reason,
        });
      } else if (action === "stock_out") {
        if (!form.stock_item_id || !form.quantity)
          throw new Error("Select item and enter quantity");
        res = await api.post("/inventory/stock-out", {
          ...base,
          stock_item_id: form.stock_item_id,
          quantity: form.quantity,
          rate: form.rate,
          notes: form.notes,
          reason: form.reason,
        });
      } else if (action === "transfer") {
        if (!form.from_item_id || !form.to_item_id || !form.quantity)
          throw new Error("Select source, destination and quantity");
        res = await api.post("/inventory/transfer", {
          ...base,
          from_item_id: form.from_item_id,
          to_item_id: form.to_item_id,
          quantity: form.quantity,
          notes: form.notes,
        });
      } else if (action === "adjustment") {
        if (!form.stock_item_id || form.new_quantity === "")
          throw new Error("Select item and enter new quantity");
        res = await api.post("/inventory/adjustment", {
          ...base,
          stock_item_id: form.stock_item_id,
          new_quantity: form.new_quantity,
          reason: form.reason,
          notes: form.notes,
        });
      }

      setSuccess(res.data.message);
      onSuccess?.();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Operation failed",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const selectedItem = stockItems.find((s) => s.id === form.stock_item_id);
  const fromItem = stockItems.find((s) => s.id === form.from_item_id);
  const toItem = stockItems.find((s) => s.id === form.to_item_id);

  const titles = {
    stock_in: { title: "Stock In", icon: "📥", color: "emerald" },
    stock_out: { title: "Stock Out", icon: "📤", color: "red" },
    transfer: { title: "Stock Transfer", icon: "🔄", color: "blue" },
    adjustment: { title: "Stock Adjustment", icon: "⚙️", color: "amber" },
  };
  const meta = titles[action] || {};

  const colorMap = {
    emerald: "bg-emerald-950/40 border-emerald-800 text-emerald-400",
    red: "bg-red-950/40     border-red-800     text-red-400",
    blue: "bg-blue-950/40    border-blue-800    text-blue-400",
    amber: "bg-amber-950/40   border-amber-800   text-amber-400",
  };

  const reasonOptions =
    action === "stock_in"
      ? STOCK_IN_REASONS
      : action === "stock_out"
        ? STOCK_OUT_REASONS
        : ADJUSTMENT_REASONS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div
          className={`flex items-center gap-3 px-5 py-4 border-b border-zinc-800`}
        >
          <span
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm border ${colorMap[meta.color]}`}
          >
            {meta.icon}
          </span>
          <div>
            <h2 className="text-white font-semibold">{meta.title}</h2>
            <p className="text-zinc-500 text-xs">Manual inventory operation</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-zinc-500 hover:text-white transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Date */}
          <FormField label="Transaction Date">
            <Input
              type="date"
              value={form.transaction_date}
              onChange={f("transaction_date")}
              className="bg-zinc-800 border-zinc-700 text-white focus:border-indigo-500"
            />
          </FormField>

          {/* Transfer: two item selects */}
          {action === "transfer" ? (
            <div className="space-y-3">
              <FormField label="Transfer From">
                <select
                  value={form.from_item_id || ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, from_item_id: e.target.value }))
                  }
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-indigo-500 focus:outline-none px-3 py-2 text-sm"
                >
                  <option value="">Select source item</option>
                  {stockItems.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — Available: {parseFloat(s.current_qty)}{" "}
                      {s.unit_symbol}
                    </option>
                  ))}
                </select>
                {fromItem && (
                  <p className="text-zinc-500 text-xs mt-1 px-1">
                    Current:{" "}
                    <span className="text-white font-mono">
                      {parseFloat(fromItem.current_qty)} {fromItem.unit_symbol}
                    </span>
                  </p>
                )}
              </FormField>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-zinc-800" />
                <div className="w-7 h-7 rounded-full bg-blue-950/50 border border-blue-800 flex items-center justify-center text-blue-400 text-sm">
                  ↓
                </div>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>

              <FormField label="Transfer To">
                <select
                  value={form.to_item_id || ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, to_item_id: e.target.value }))
                  }
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-indigo-500 focus:outline-none px-3 py-2 text-sm"
                >
                  <option value="">Select destination item</option>
                  {stockItems
                    .filter((s) => s.id !== form.from_item_id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — Current: {parseFloat(s.current_qty)}{" "}
                        {s.unit_symbol}
                      </option>
                    ))}
                </select>
                {toItem && (
                  <p className="text-zinc-500 text-xs mt-1 px-1">
                    After transfer:{" "}
                    <span className="text-emerald-400 font-mono">
                      {(
                        parseFloat(toItem.current_qty) +
                        parseFloat(form.quantity || 0)
                      ).toFixed(3)}{" "}
                      {toItem.unit_symbol}
                    </span>
                  </p>
                )}
              </FormField>
            </div>
          ) : (
            /* Single item select for stock_in / stock_out / adjustment */
            <FormField label="Stock Item">
              <select
                value={form.stock_item_id || ""}
                onChange={(e) => handleItemSelect(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-indigo-500 focus:outline-none px-3 py-2 text-sm"
              >
                <option value="">Select item</option>
                {stockItems.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.sku ? `(${s.sku})` : ""} —{" "}
                    {parseFloat(s.current_qty)} {s.unit_symbol}
                  </option>
                ))}
              </select>
              {selectedItem && (
                <div className="flex items-center gap-3 mt-1.5 px-1 text-xs">
                  <span className="text-zinc-500">Current stock:</span>
                  <span
                    className={`font-mono font-medium ${
                      parseFloat(selectedItem.current_qty) <= 0
                        ? "text-red-400"
                        : selectedItem.low_stock_alert > 0 &&
                            parseFloat(selectedItem.current_qty) <=
                              parseFloat(selectedItem.low_stock_alert)
                          ? "text-amber-400"
                          : "text-white"
                    }`}
                  >
                    {parseFloat(selectedItem.current_qty)}{" "}
                    {selectedItem.unit_symbol}
                  </span>
                  {selectedItem.low_stock_alert > 0 &&
                    parseFloat(selectedItem.current_qty) <=
                      parseFloat(selectedItem.low_stock_alert) && (
                      <span className="bg-amber-950/50 border border-amber-900/50 text-amber-400 rounded px-1.5 py-0.5">
                        ⚠ Low
                      </span>
                    )}
                </div>
              )}
            </FormField>
          )}

          {/* Adjustment: new quantity field */}
          {action === "adjustment" ? (
            <FormRow>
              <FormField label="New Quantity (Physical Count)" required>
                <Input
                  type="number"
                  value={form.new_quantity}
                  onChange={f("new_quantity")}
                  placeholder="Enter actual quantity"
                  step="0.001"
                  min="0"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500 font-mono"
                />
              </FormField>
              {selectedItem && form.new_quantity !== "" && (
                <FormField label="Difference">
                  <div className="flex items-center h-9 px-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                    <span
                      className={`font-mono text-sm font-medium ${
                        parseFloat(form.new_quantity) -
                          parseFloat(selectedItem.current_qty) >=
                        0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {parseFloat(form.new_quantity) -
                        parseFloat(selectedItem.current_qty) >=
                      0
                        ? "+"
                        : ""}
                      {(
                        parseFloat(form.new_quantity) -
                        parseFloat(selectedItem.current_qty)
                      ).toFixed(3)}
                    </span>
                  </div>
                </FormField>
              )}
            </FormRow>
          ) : (
            /* Quantity + Rate for stock_in / stock_out / transfer */
            <FormRow>
              <FormField label="Quantity" required>
                <Input
                  type="number"
                  value={form.quantity}
                  onChange={f("quantity")}
                  placeholder="0.000"
                  step="0.001"
                  min="0.001"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500 font-mono"
                />
              </FormField>
              {action !== "transfer" && (
                <FormField
                  label={action === "stock_out" ? "Rate (Sale)" : "Rate (Cost)"}
                >
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                      ₹
                    </span>
                    <Input
                      type="number"
                      value={form.rate}
                      onChange={f("rate")}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500 pl-7 font-mono"
                    />
                  </div>
                </FormField>
              )}
            </FormRow>
          )}

          {/* Stock preview after operation */}
          {action !== "transfer" && selectedItem && form.quantity && (
            <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">
                  {action === "stock_in"
                    ? "Stock after adding"
                    : "Stock after removal"}
                  :
                </span>
                <span
                  className={`font-mono font-medium ${
                    action === "stock_in"
                      ? "text-emerald-400"
                      : parseFloat(selectedItem.current_qty) -
                            parseFloat(form.quantity || 0) <
                          0
                        ? "text-red-400"
                        : "text-white"
                  }`}
                >
                  {action === "stock_in"
                    ? (
                        parseFloat(selectedItem.current_qty) +
                        parseFloat(form.quantity || 0)
                      ).toFixed(3)
                    : (
                        parseFloat(selectedItem.current_qty) -
                        parseFloat(form.quantity || 0)
                      ).toFixed(3)}{" "}
                  {selectedItem.unit_symbol}
                </span>
              </div>
              {form.rate && form.quantity && (
                <p className="text-zinc-600 text-xs mt-1">
                  Value: ₹
                  {(
                    parseFloat(form.quantity) * parseFloat(form.rate)
                  ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>
          )}

          {/* Reason */}
          {action !== "transfer" && (
            <FormField label="Reason">
              <select
                value={form.reason}
                onChange={f("reason")}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-indigo-500 focus:outline-none px-3 py-2 text-sm"
              >
                <option value="">Select reason</option>
                {reasonOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          {/* Notes */}
          <FormField label="Notes">
            <textarea
              value={form.notes}
              onChange={f("notes")}
              placeholder="Additional remarks..."
              rows={2}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none px-3 py-2 text-sm resize-none"
            />
          </FormField>

          {/* Messages */}
          {error && (
            <div className="bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-emerald-950/50 border border-emerald-800 rounded-lg px-3 py-2 flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              <p className="text-emerald-400 text-sm">{success}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1 text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !!success}
              className={`flex-1 text-white font-medium ${
                meta.color === "emerald"
                  ? "bg-emerald-700 hover:bg-emerald-600"
                  : meta.color === "red"
                    ? "bg-red-800    hover:bg-red-700"
                    : meta.color === "blue"
                      ? "bg-blue-700   hover:bg-blue-600"
                      : "bg-amber-700  hover:bg-amber-600"
              }`}
            >
              {loading ? "Processing..." : `Confirm ${meta.title}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
