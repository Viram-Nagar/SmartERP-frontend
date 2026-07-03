"use client";

import { useState } from "react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useVoucherForm } from "@/hooks/useVoucherForm";
import VoucherLayout from "@/components/vouchers/VoucherLayout";
import VoucherHeader from "@/components/vouchers/VoucherHeader";
import LedgerSelect from "@/components/vouchers/LedgerSelect";
import NarrationField from "@/components/vouchers/NarrationField";
import { Input } from "@/components/ui/input";

/**
 * CONTRA VOUCHER
 *
 * Used ONLY for Cash ↔ Bank transfers.
 *
 * Example: Deposited ₹50,000 cash into HDFC Bank
 *   Dr  HDFC Bank    50,000   (bank increases)
 *   Cr  Cash         50,000   (cash decreases)
 *
 * Example: Withdrew ₹10,000 from ICICI Bank
 *   Dr  Cash         10,000   (cash increases)
 *   Cr  ICICI Bank   10,000   (bank decreases)
 */

export default function ContraVoucherPage() {
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
  } = useVoucherForm("contra");

  const [fromLedger, setFromLedger] = useState("");
  const [toLedger, setToLedger] = useState("");
  const [amount, setAmount] = useState("");

  const bankCashLedgers = getLedgersByType("bank", "cash");

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (!fromLedger) {
      setError("Select the source account");
      return;
    }
    if (!toLedger) {
      setError("Select the destination account");
      return;
    }
    if (fromLedger === toLedger) {
      setError("Source and destination cannot be the same");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError("Enter a valid amount");
      return;
    }

    const entries = [
      {
        ledger_id: toLedger,
        entry_type: "Dr",
        amount: parseFloat(amount),
        narration,
      },
      {
        ledger_id: fromLedger,
        entry_type: "Cr",
        amount: parseFloat(amount),
        narration,
      },
    ];

    const result = await submit(entries);
    if (result) {
      setFromLedger("");
      setToLedger("");
      setAmount("");
      setNarration("");
      setReference("");
    }
  };

  useKeyboardShortcuts([{ key: "s", ctrl: true, action: handleSubmit }]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-full text-zinc-500">
        Loading...
      </div>
    );

  const fromDetails = ledgers.find((l) => l.id === fromLedger);
  const toDetails = ledgers.find((l) => l.id === toLedger);

  return (
    <VoucherLayout
      title="Contra Voucher"
      voucherNumber={nextNumber}
      shortcut="Ctrl+Alt+C"
      onSave={handleSubmit}
      submitting={submitting}
      success={success}
      error={error}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <VoucherHeader
          date={date}
          setDate={setDate}
          reference={reference}
          setReference={setReference}
          voucherNumber={nextNumber}
        />

        {/* Transfer card */}
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-5">
          <p className="text-zinc-400 text-sm font-medium">
            Cash / Bank Transfer
          </p>

          {/* From */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-900/50 border border-red-800 flex items-center justify-center text-red-400 text-xs font-bold">
                Cr
              </span>
              <label className="text-zinc-300 text-sm">Transfer From</label>
            </div>
            <LedgerSelect
              value={fromLedger}
              onChange={setFromLedger}
              ledgers={bankCashLedgers}
              placeholder="Select source (Cash/Bank)..."
            />
          </div>

          {/* Arrow */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-800" />
            <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              ↓
            </div>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* To */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-900/50 border border-emerald-800 flex items-center justify-center text-emerald-400 text-xs font-bold">
                Dr
              </span>
              <label className="text-zinc-300 text-sm">Transfer To</label>
            </div>
            <LedgerSelect
              value={toLedger}
              onChange={setToLedger}
              ledgers={bankCashLedgers.filter((l) => l.id !== fromLedger)}
              placeholder="Select destination (Cash/Bank)..."
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-zinc-300 text-sm">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg">
                ₹
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full bg-zinc-800 border border-zinc-700 text-white text-xl font-mono pl-10 pr-4 py-3 rounded-xl focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </div>

        {/* Transfer summary */}
        {fromLedger && toLedger && amount && parseFloat(amount) > 0 && (
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
            <p className="text-zinc-500 text-xs uppercase tracking-wider">
              Transfer Summary
            </p>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-zinc-400 text-xs mb-1">From</p>
                <p className="text-white font-medium">{fromDetails?.name}</p>
                <p className="text-red-400 text-xs font-mono mt-0.5">
                  - ₹
                  {parseFloat(amount).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="text-indigo-400 text-2xl">→</div>
              <div className="text-center">
                <p className="text-zinc-400 text-xs mb-1">To</p>
                <p className="text-white font-medium">{toDetails?.name}</p>
                <p className="text-emerald-400 text-xs font-mono mt-0.5">
                  + ₹
                  {parseFloat(amount).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        <NarrationField value={narration} onChange={setNarration} />

        {fromLedger && toLedger && amount && (
          <AccountingPreview
            entries={[
              {
                ledger: toDetails?.name || "—",
                type: "Dr",
                amount: parseFloat(amount),
              },
              {
                ledger: fromDetails?.name || "—",
                type: "Cr",
                amount: parseFloat(amount),
              },
            ]}
          />
        )}
      </div>
    </VoucherLayout>
  );
}
