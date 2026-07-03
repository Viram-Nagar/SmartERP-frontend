"use client";

import { useState } from "react";
import { useVoucherForm } from "@/hooks/useVoucherForm";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import VoucherLayout from "@/components/vouchers/VoucherLayout";
import VoucherHeader from "@/components/vouchers/VoucherHeader";
import NarrationField from "@/components/vouchers/NarrationField";
import AccountingPreview from "@/components/vouchers/AccountingPreview";
import { Input } from "@/components/ui/input";

/**
 * JOURNAL VOUCHER
 *
 * Free-form multi-entry voucher for accounting adjustments.
 * User manually specifies Dr/Cr for each entry.
 * Engine validates that total Dr = total Cr before posting.
 *
 * Examples:
 * - Depreciation entry
 * - Bad debt write-off
 * - Opening balance entries
 * - Accruals and provisions
 */

const EMPTY_ROW = {
  ledger_id: "",
  entry_type: "Dr",
  amount: "",
  narration: "",
};

export default function JournalVoucherPage() {
  const {
    ledgers,
    nextNumber,
    loading,
    submitting,
    error,
    success,
    date,
    setDate,
    reference,
    setReference,
    narration,
    setNarration,
    submit,
    setError,
  } = useVoucherForm("journal");

  const [rows, setRows] = useState([
    { ...EMPTY_ROW, entry_type: "Dr" },
    { ...EMPTY_ROW, entry_type: "Cr" },
  ]);

  const addRow = (type = "Dr") =>
    setRows((prev) => [...prev, { ...EMPTY_ROW, entry_type: type }]);

  const removeRow = (idx) => {
    if (rows.length <= 2) return;
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateRow = (idx, key, val) =>
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [key]: val } : r)),
    );

  // Running totals
  const totalDr = rows
    .filter((r) => r.entry_type === "Dr")
    .reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const totalCr = rows
    .filter((r) => r.entry_type === "Cr")
    .reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const isBalanced = Math.abs(totalDr - totalCr) < 0.01 && totalDr > 0;
  const diff = totalDr - totalCr;

  const handleSubmit = async () => {
    setError("");
    if (rows.some((r) => !r.ledger_id || !r.amount)) {
      setError("All rows must have a ledger and amount");
      return;
    }
    if (!isBalanced) {
      setError(
        `Voucher is out of balance by ₹${Math.abs(diff).toFixed(2)}. Dr must equal Cr.`,
      );
      return;
    }

    const entries = rows.map((r) => ({
      ledger_id: r.ledger_id,
      entry_type: r.entry_type,
      amount: parseFloat(r.amount),
      narration: r.narration || narration,
    }));

    const result = await submit(entries);
    if (result) {
      setRows([
        { ...EMPTY_ROW, entry_type: "Dr" },
        { ...EMPTY_ROW, entry_type: "Cr" },
      ]);
      setNarration("");
      setReference("");
    }
  };

  useKeyboardShortcuts([
    { key: "s", ctrl: true, action: handleSubmit },
    { key: "n", alt: true, action: () => addRow("Dr") },
  ]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-full text-zinc-500">
        Loading...
      </div>
    );

  return (
    <VoucherLayout
      title="Journal Voucher"
      voucherNumber={nextNumber}
      shortcut="F7"
      onSave={handleSubmit}
      submitting={submitting}
      success={success}
      error={error}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <VoucherHeader
          date={date}
          setDate={setDate}
          reference={reference}
          setReference={setReference}
          voucherNumber={nextNumber}
        />

        {/* Entries table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-zinc-800/50 border-b border-zinc-800">
            <div className="col-span-1 text-zinc-500 text-xs uppercase tracking-wider">
              Type
            </div>
            <div className="col-span-5 text-zinc-500 text-xs uppercase tracking-wider">
              Ledger
            </div>
            <div className="col-span-3 text-zinc-500 text-xs uppercase tracking-wider text-right">
              Amount (₹)
            </div>
            <div className="col-span-2 text-zinc-500 text-xs uppercase tracking-wider">
              Narration
            </div>
            <div className="col-span-1" />
          </div>

          {/* Rows */}
          <div className="divide-y divide-zinc-800/50">
            {rows.map((row, idx) => (
              <div
                key={idx}
                className={`grid grid-cols-12 gap-2 px-4 py-3 items-center ${row.entry_type === "Dr" ? "bg-emerald-950/5" : "bg-red-950/5"}`}
              >
                {/* Dr/Cr toggle */}
                <div className="col-span-1">
                  <div className="flex flex-col rounded-lg border border-zinc-700 overflow-hidden">
                    {["Dr", "Cr"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => updateRow(idx, "entry_type", t)}
                        className={`px-2 py-1 text-xs font-bold transition-colors ${
                          row.entry_type === t
                            ? t === "Dr"
                              ? "bg-emerald-700 text-white"
                              : "bg-red-800 text-white"
                            : "bg-zinc-800 text-zinc-500 hover:text-white"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ledger */}
                <div className="col-span-5">
                  <select
                    value={row.ledger_id}
                    onChange={(e) =>
                      updateRow(idx, "ledger_id", e.target.value)
                    }
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:border-indigo-500 focus:outline-none px-3 py-2"
                  >
                    <option value="">Select ledger</option>
                    {ledgers.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.group_name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div className="col-span-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                      ₹
                    </span>
                    <Input
                      type="number"
                      value={row.amount}
                      onChange={(e) => updateRow(idx, "amount", e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="bg-zinc-800 border-zinc-700 text-white pl-7 font-mono focus:border-indigo-500 text-right"
                    />
                  </div>
                </div>

                {/* Narration */}
                <div className="col-span-2">
                  <Input
                    value={row.narration}
                    onChange={(e) =>
                      updateRow(idx, "narration", e.target.value)
                    }
                    placeholder="Remark"
                    className="bg-zinc-800 border-zinc-700 text-zinc-400 text-sm placeholder:text-zinc-600 focus:border-indigo-500"
                  />
                </div>

                {/* Remove */}
                <div className="col-span-1 flex justify-center">
                  {rows.length > 2 && (
                    <button
                      onClick={() => removeRow(idx)}
                      className="text-zinc-600 hover:text-red-400 transition-colors text-xl leading-none"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add row buttons */}
          <div className="flex gap-2 px-4 py-3 border-t border-zinc-800 bg-zinc-900/50">
            <button
              onClick={() => addRow("Dr")}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 hover:text-emerald-300 rounded-lg text-xs transition-colors"
            >
              + Dr row
            </button>
            <button
              onClick={() => addRow("Cr")}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-950/30 border border-red-900/50 text-red-400 hover:text-red-300 rounded-lg text-xs transition-colors"
            >
              + Cr row
            </button>
          </div>

          {/* Balance indicator */}
          <div
            className={`px-4 py-3 border-t ${isBalanced ? "border-emerald-900/50 bg-emerald-950/20" : "border-zinc-800 bg-zinc-900"}`}
          >
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-6">
                <span className="text-zinc-500">
                  Total Dr:{" "}
                  <span className="text-emerald-400 font-mono">
                    ₹
                    {totalDr.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </span>
                <span className="text-zinc-500">
                  Total Cr:{" "}
                  <span className="text-red-400 font-mono">
                    ₹
                    {totalCr.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </span>
              </div>
              <div
                className={`flex items-center gap-2 ${isBalanced ? "text-emerald-400" : "text-amber-400"}`}
              >
                {isBalanced ? (
                  <>
                    <span>✓</span>
                    <span className="text-sm font-medium">Balanced</span>
                  </>
                ) : (
                  <span className="text-sm">
                    Difference:{" "}
                    <span className="font-mono">
                      ₹{Math.abs(diff).toFixed(2)}
                    </span>
                    {diff > 0 ? " (Dr > Cr)" : " (Cr > Dr)"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <NarrationField value={narration} onChange={setNarration} />

        {/* Preview */}
        {rows.some((r) => r.ledger_id && r.amount) && (
          <AccountingPreview
            entries={rows
              .filter((r) => r.ledger_id && r.amount)
              .map((r) => ({
                ledger: ledgers.find((l) => l.id === r.ledger_id)?.name || "—",
                type: r.entry_type,
                amount: parseFloat(r.amount),
              }))}
          />
        )}
      </div>
    </VoucherLayout>
  );
}
