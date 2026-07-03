"use client";

import { useState } from "react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useVoucherForm } from "@/hooks/useVoucherForm";
import VoucherLayout from "@/components/vouchers/VoucherLayout";
import VoucherHeader from "@/components/vouchers/VoucherHeader";
import LedgerSelect from "@/components/vouchers/LedgerSelect";
import NarrationField from "@/components/vouchers/NarrationField";
import { Input } from "@/components/ui/input";
import AccountingPreview from "@/components/vouchers/AccountingPreview";
/**
 * RECEIPT VOUCHER
 *
 * Dr — Bank / Cash ledger          (where money goes)
 * Cr — Customer / Income ledger    (who paid / income source)
 *
 * Example: Received ₹25,000 from Ramesh Traders
 *   Dr  HDFC Bank             25,000
 *   Cr  Ramesh Traders        25,000
 */

const EMPTY_ROW = { ledger_id: "", amount: "", narration: "" };

export default function ReceiptVoucherPage() {
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
  } = useVoucherForm("receipt");

  const [receiveTo, setReceiveTo] = useState("");
  const [rows, setRows] = useState([{ ...EMPTY_ROW }]);

  const bankCashLedgers = getLedgersByType("bank", "cash");
  const incomeLedgers = getLedgersByType(
    "customer",
    "income",
    "supplier",
    "liability",
  );
  const total = rows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  const addRow = () => setRows((prev) => [...prev, { ...EMPTY_ROW }]);
  const removeRow = (idx) => {
    if (rows.length > 1) setRows((prev) => prev.filter((_, i) => i !== idx));
  };
  const updateRow = (idx, key, val) =>
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [key]: val } : r)),
    );

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (!receiveTo) {
      setError("Select a receipt account (Bank/Cash)");
      return;
    }
    if (rows.some((r) => !r.ledger_id || !r.amount)) {
      setError("All rows must have a ledger and amount");
      return;
    }

    const entries = [
      // Dr — Bank/Cash increases
      { ledger_id: receiveTo, entry_type: "Dr", amount: total, narration },
      // Cr — Customer/Income decreases
      ...rows.map((r) => ({
        ledger_id: r.ledger_id,
        entry_type: "Cr",
        amount: parseFloat(r.amount),
        narration: r.narration || narration,
      })),
    ];

    const result = await submit(entries);
    if (result) {
      setReceiveTo("");
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
      title="Receipt Voucher"
      voucherNumber={nextNumber}
      shortcut="F6"
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

        {/* Receive Into (Dr side) */}
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-900/50 border border-emerald-800 flex items-center justify-center text-emerald-400 text-xs font-bold shrink-0">
              Dr
            </span>
            <p className="text-zinc-300 text-sm font-medium">Received Into</p>
            <span className="text-zinc-600 text-xs">
              (Bank or Cash being credited)
            </span>
          </div>
          <LedgerSelect
            value={receiveTo}
            onChange={setReceiveTo}
            ledgers={bankCashLedgers}
            placeholder="Select Bank / Cash account..."
          />
        </div>

        {/* Cr rows — who paid */}
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-900/50 border border-red-800 flex items-center justify-center text-red-400 text-xs font-bold shrink-0">
                Cr
              </span>
              <p className="text-zinc-300 text-sm font-medium">Received From</p>
              <span className="text-zinc-600 text-xs">
                (Customer / Income source)
              </span>
            </div>
            <button
              onClick={addRow}
              className="text-indigo-400 hover:text-indigo-300 text-xs transition-colors"
            >
              + Add row
            </button>
          </div>

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

          <div className="space-y-2">
            {rows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-5">
                  <LedgerSelect
                    value={row.ledger_id}
                    onChange={(val) => updateRow(idx, "ledger_id", val)}
                    ledgers={incomeLedgers}
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

          <div className="flex justify-end pt-2 border-t border-zinc-800">
            <div className="text-right">
              <p className="text-zinc-500 text-xs">Total Receipt</p>
              <p className="text-white text-xl font-mono font-semibold">
                ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <NarrationField value={narration} onChange={setNarration} />

        {receiveTo && total > 0 && (
          <AccountingPreview
            entries={[
              {
                ledger: ledgers.find((l) => l.id === receiveTo)?.name || "—",
                type: "Dr",
                amount: total,
              },
              ...rows
                .filter((r) => r.ledger_id && r.amount)
                .map((r) => ({
                  ledger:
                    ledgers.find((l) => l.id === r.ledger_id)?.name || "—",
                  type: "Cr",
                  amount: parseFloat(r.amount),
                })),
            ]}
          />
        )}
      </div>
    </VoucherLayout>
  );
}
