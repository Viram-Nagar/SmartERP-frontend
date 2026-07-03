"use client";

import { useState, useEffect, useCallback } from "react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useVoucherForm } from "@/hooks/useVoucherForm";
import VoucherLayout from "@/components/vouchers/VoucherLayout";
import VoucherHeader from "@/components/vouchers/VoucherHeader";
import LedgerSelect from "@/components/vouchers/LedgerSelect";
import NarrationField from "@/components/vouchers/NarrationField";
import { Input } from "@/components/ui/input";
import AccountingPreview from "@/components/vouchers/AccountingPreview";
/**
 * PAYMENT VOUCHER
 *
 * Accounting logic:
 * Dr — Expense / Supplier ledger   (what we paid for)
 * Cr — Bank / Cash ledger          (where money came from)
 *
 * Example: Paid rent ₹10,000 from HDFC Bank
 *   Dr  Rent Expense         10,000
 *   Cr  HDFC Bank            10,000
 */

const EMPTY_ROW = { ledger_id: "", amount: "", narration: "" };

export default function PaymentVoucherPage() {
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
    setSuccess,
    getLedgersByType,
  } = useVoucherForm("payment");

  // Payment account (Cr side) — Bank or Cash
  const [payFrom, setPayFrom] = useState("");
  // Debit rows — what is being paid for
  const [rows, setRows] = useState([{ ...EMPTY_ROW }]);

  // Ledger groups
  const bankCashLedgers = getLedgersByType("bank", "cash");
  const expenseLedgers = getLedgersByType(
    "expense",
    "supplier",
    "asset",
    "liability",
    "customer",
  );

  // Total amount
  const total = rows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  const addRow = () => setRows((prev) => [...prev, { ...EMPTY_ROW }]);
  const removeRow = (idx) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };
  const updateRow = (idx, key, val) => {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [key]: val } : r)),
    );
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!payFrom) {
      setError("Select a payment account (Bank/Cash)");
      return;
    }
    if (rows.some((r) => !r.ledger_id || !r.amount)) {
      setError("All rows must have a ledger and amount");
      return;
    }

    // Build double-entry: multiple Dr rows + single Cr
    const entries = [
      // Debit entries — expenses/payables
      ...rows.map((r) => ({
        ledger_id: r.ledger_id,
        entry_type: "Dr",
        amount: parseFloat(r.amount),
        narration: r.narration || narration,
      })),
      // Credit entry — bank/cash being reduced
      {
        ledger_id: payFrom,
        entry_type: "Cr",
        amount: total,
        narration: narration,
      },
    ];

    const result = await submit(entries);
    if (result) {
      // Reset form for next entry
      setPayFrom("");
      setRows([{ ...EMPTY_ROW }]);
      setNarration("");
      setReference("");
    }
  };

  useKeyboardShortcuts([
    { key: "s", ctrl: true, action: handleSubmit },
    { key: "n", alt: true, action: addRow },
  ]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-full text-zinc-500">
        Loading...
      </div>
    );

  return (
    <VoucherLayout
      title="Payment Voucher"
      voucherNumber={nextNumber}
      shortcut="Alt+F5"
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

        {/* Pay From (Cr side) */}
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-red-900/50 border border-red-800 flex items-center justify-center text-red-400 text-xs font-bold shrink-0">
              Cr
            </span>
            <p className="text-zinc-300 text-sm font-medium">Payment Account</p>
            <span className="text-zinc-600 text-xs">
              (Bank or Cash being reduced)
            </span>
          </div>
          <LedgerSelect
            value={payFrom}
            onChange={setPayFrom}
            ledgers={bankCashLedgers}
            placeholder="Select Bank / Cash account..."
          />
        </div>

        {/* Debit rows (Dr side) */}
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-900/50 border border-emerald-800 flex items-center justify-center text-emerald-400 text-xs font-bold shrink-0">
                Dr
              </span>
              <p className="text-zinc-300 text-sm font-medium">
                Payment Towards
              </p>
              <span className="text-zinc-600 text-xs">
                (What is being paid for)
              </span>
            </div>
            <button
              onClick={addRow}
              className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-xs transition-colors"
              title="Alt+N — Add row"
            >
              + Add row
              <kbd className="bg-zinc-800 border border-zinc-700 rounded px-1 ml-1 text-zinc-500">
                Alt+N
              </kbd>
            </button>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-12 gap-2 px-1">
            <div className="col-span-5 text-zinc-600 text-xs uppercase tracking-wider">
              Ledger
            </div>
            <div className="col-span-3 text-zinc-600 text-xs uppercase tracking-wider">
              Amount (₹)
            </div>
            <div className="col-span-3 text-zinc-600 text-xs uppercase tracking-wider">
              Narration
            </div>
            <div className="col-span-1" />
          </div>

          {/* Rows */}
          <div className="space-y-2">
            {rows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-5">
                  <LedgerSelect
                    value={row.ledger_id}
                    onChange={(val) => updateRow(idx, "ledger_id", val)}
                    ledgers={expenseLedgers}
                    placeholder="Select ledger..."
                    showBalance={!!row.ledger_id}
                  />
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
                      className="bg-zinc-800 border-zinc-700 text-white pl-7 font-mono focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="col-span-3">
                  <Input
                    value={row.narration}
                    onChange={(e) =>
                      updateRow(idx, "narration", e.target.value)
                    }
                    placeholder="Remark..."
                    className="bg-zinc-800 border-zinc-700 text-zinc-300 placeholder:text-zinc-600 focus:border-indigo-500"
                  />
                </div>
                <div className="col-span-1 flex justify-center pt-2">
                  {rows.length > 1 && (
                    <button
                      onClick={() => removeRow(idx)}
                      className="text-zinc-600 hover:text-red-400 transition-colors text-lg leading-none"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex justify-end pt-2 border-t border-zinc-800">
            <div className="text-right">
              <p className="text-zinc-500 text-xs">Total Payment</p>
              <p className="text-white text-xl font-mono font-semibold">
                ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Narration */}
        <NarrationField value={narration} onChange={setNarration} />

        {/* Accounting preview */}
        {payFrom && total > 0 && (
          <AccountingPreview
            entries={[
              ...rows
                .filter((r) => r.ledger_id && r.amount)
                .map((r) => ({
                  ledger:
                    ledgers.find((l) => l.id === r.ledger_id)?.name || "—",
                  type: "Dr",
                  amount: parseFloat(r.amount),
                })),
              {
                ledger: ledgers.find((l) => l.id === payFrom)?.name || "—",
                type: "Cr",
                amount: total,
              },
            ]}
          />
        )}
      </div>
    </VoucherLayout>
  );
}
