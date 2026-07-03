"use client";

import { useState } from "react";
import api from "@/lib/api";
import { useCompany } from "@/context/CompanyContext";
import { useVoucherForm } from "@/hooks/useVoucherForm";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import VoucherLayout from "@/components/vouchers/VoucherLayout";
import VoucherHeader from "@/components/vouchers/VoucherHeader";
import NarrationField from "@/components/vouchers/NarrationField";
import AccountingPreview from "@/components/vouchers/AccountingPreview";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * REVERSING JOURNAL
 *
 * Posts a journal entry today AND automatically posts
 * the mirror-image reversal on a future date.
 *
 * Used for: accruals, prepayments, provisions that need
 * to be reversed in the next period.
 */

const EMPTY_ROW = {
  ledger_id: "",
  entry_type: "Dr",
  amount: "",
  narration: "",
};

export default function ReversingJournalPage() {
  const { activeCompany } = useCompany();
  const {
    ledgers,
    nextNumber,
    loading,
    date,
    setDate,
    reference,
    setReference,
    narration,
    setNarration,
    setError,
    setSuccess,
    error,
    success,
  } = useVoucherForm("reversing_journal");

  const [reversalDate, setReversalDate] = useState("");
  const [rows, setRows] = useState([
    { ...EMPTY_ROW, entry_type: "Dr" },
    { ...EMPTY_ROW, entry_type: "Cr" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addRow = (type = "Dr") =>
    setRows((p) => [...p, { ...EMPTY_ROW, entry_type: type }]);
  const removeRow = (idx) => {
    if (rows.length > 2) setRows((p) => p.filter((_, i) => i !== idx));
  };
  const updateRow = (idx, key, val) =>
    setRows((p) => p.map((r, i) => (i === idx ? { ...r, [key]: val } : r)));

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
    setSuccess("");
    if (!reversalDate) {
      setError("Set a reversal date");
      return;
    }
    if (reversalDate <= date) {
      setError("Reversal date must be after the voucher date");
      return;
    }
    if (rows.some((r) => !r.ledger_id || !r.amount)) {
      setError("All rows must have a ledger and amount");
      return;
    }
    if (!isBalanced) {
      setError(`Out of balance by ₹${Math.abs(diff).toFixed(2)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post("/vouchers/reversing-journal", {
        company_id: activeCompany.id,
        voucher_date: date,
        reversal_date: reversalDate,
        reference_number: reference,
        narration,
        entries: rows.map((r) => ({
          ledger_id: r.ledger_id,
          entry_type: r.entry_type,
          amount: parseFloat(r.amount),
          narration: r.narration || narration,
        })),
      });
      setSuccess(res.data.message);
      setRows([
        { ...EMPTY_ROW, entry_type: "Dr" },
        { ...EMPTY_ROW, entry_type: "Cr" },
      ]);
      setNarration("");
      setReference("");
      setReversalDate("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post");
    } finally {
      setIsSubmitting(false);
    }
  };

  useKeyboardShortcuts([{ key: "s", ctrl: true, action: handleSubmit }]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-full text-zinc-500">
        Loading...
      </div>
    );

  return (
    <VoucherLayout
      title="Reversing Journal"
      voucherNumber={nextNumber}
      shortcut="F10"
      onSave={handleSubmit}
      submitting={isSubmitting}
      success={success}
      error={error}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Info banner */}
        <div className="flex items-start gap-3 p-3 bg-purple-950/30 border border-purple-900/50 rounded-xl">
          <span className="text-purple-400 mt-0.5">⟳</span>
          <div>
            <p className="text-purple-300 text-sm font-medium">
              Auto-Reversing Journal
            </p>
            <p className="text-purple-600 text-xs mt-0.5">
              Posts the journal on the voucher date and automatically creates
              the mirror reversal on the reversal date. Used for accruals and
              period-end adjustments.
            </p>
          </div>
        </div>

        {/* Header + reversal date */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs uppercase tracking-wider">
              Voucher No.
            </Label>
            <div className="flex items-center h-9 px-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
              <span className="text-indigo-400 font-mono text-sm">
                {nextNumber || "..."}
              </span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs uppercase tracking-wider">
              Date
            </Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white focus:border-indigo-500 h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs uppercase tracking-wider text-purple-400">
              Reversal Date ✱
            </Label>
            <Input
              type="date"
              value={reversalDate}
              onChange={(e) => setReversalDate(e.target.value)}
              min={date}
              required
              className="bg-zinc-800 border-purple-700 text-white focus:border-purple-500 h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs uppercase tracking-wider">
              Reference
            </Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Optional"
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-indigo-500 h-9"
            />
          </div>
        </div>

        {/* Reversal preview */}
        {date && reversalDate && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
              <p className="text-zinc-500 text-xs mb-1">Posts on</p>
              <p className="text-white font-medium">
                {new Date(date).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="p-3 bg-purple-950/30 border border-purple-900/50 rounded-xl text-center">
              <p className="text-purple-500 text-xs mb-1">Auto-reverses on</p>
              <p className="text-purple-300 font-medium">
                {new Date(reversalDate).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        )}

        {/* Entries */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
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

          <div className="divide-y divide-zinc-800/50">
            {rows.map((row, idx) => (
              <div
                key={idx}
                className={`grid grid-cols-12 gap-2 px-4 py-3 items-center ${row.entry_type === "Dr" ? "bg-emerald-950/5" : "bg-red-950/5"}`}
              >
                <div className="col-span-1">
                  <div className="flex flex-col rounded-lg border border-zinc-700 overflow-hidden">
                    {["Dr", "Cr"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => updateRow(idx, "entry_type", t)}
                        className={`px-2 py-1 text-xs font-bold transition-colors ${row.entry_type === t ? (t === "Dr" ? "bg-emerald-700 text-white" : "bg-red-800 text-white") : "bg-zinc-800 text-zinc-500 hover:text-white"}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
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

          <div className="flex gap-2 px-4 py-3 border-t border-zinc-800">
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
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <NarrationField value={narration} onChange={setNarration} />

        {/* Reversal preview */}
        {rows.some((r) => r.ledger_id && r.amount) && isBalanced && (
          <div className="space-y-3">
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">
                Original Entry ({date})
              </p>
              <AccountingPreview
                entries={rows
                  .filter((r) => r.ledger_id && r.amount)
                  .map((r) => ({
                    ledger:
                      ledgers.find((l) => l.id === r.ledger_id)?.name || "—",
                    type: r.entry_type,
                    amount: parseFloat(r.amount),
                  }))}
              />
            </div>
            <div>
              <p className="text-purple-500 text-xs uppercase tracking-wider mb-2">
                Auto-Reversal ({reversalDate || "..."})
              </p>
              <div className="opacity-75">
                <AccountingPreview
                  entries={rows
                    .filter((r) => r.ledger_id && r.amount)
                    .map((r) => ({
                      ledger:
                        ledgers.find((l) => l.id === r.ledger_id)?.name || "—",
                      type: r.entry_type === "Dr" ? "Cr" : "Dr",
                      amount: parseFloat(r.amount),
                    }))}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </VoucherLayout>
  );
}
