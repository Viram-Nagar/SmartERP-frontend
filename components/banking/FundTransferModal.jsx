"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useCompany } from "@/context/CompanyContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/FormField";
import { formatINR } from "@/lib/gst";

export default function FundTransferModal({
  open,
  onClose,
  accounts,
  onSuccess,
}) {
  const { activeCompany } = useCompany();
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    from_ledger_id: "",
    to_ledger_id: "",
    amount: "",
    transfer_date: today,
    reference: "",
    narration: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        from_ledger_id: "",
        to_ledger_id: "",
        amount: "",
        transfer_date: today,
        reference: "",
        narration: "",
      });
      setError("");
      setSuccess("");
    }
  }, [open]);

  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const fromAccount = accounts.find((a) => a.id === form.from_ledger_id);
  const toAccount = accounts.find((a) => a.id === form.to_ledger_id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.from_ledger_id) {
      setError("Select source account");
      return;
    }
    if (!form.to_ledger_id) {
      setError("Select destination account");
      return;
    }
    if (form.from_ledger_id === form.to_ledger_id) {
      setError("Accounts must be different");
      return;
    }
    if (!form.amount || parseFloat(form.amount) <= 0) {
      setError("Enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/banking/fund-transfer", {
        ...form,
        company_id: activeCompany.id,
        amount: parseFloat(form.amount),
      });
      setSuccess(res.data.message);
      onSuccess?.();
      setTimeout(onClose, 1800);
    } catch (err) {
      setError(err.response?.data?.message || "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800">
          <span className="w-8 h-8 rounded-lg bg-blue-950/50 border border-blue-800 flex items-center justify-center text-blue-400">
            ↔
          </span>
          <div>
            <h2 className="text-white font-semibold">Fund Transfer</h2>
            <p className="text-zinc-500 text-xs">
              Between bank / cash accounts
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-zinc-500 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <FormField label="Transfer Date">
            <Input
              type="date"
              value={form.transfer_date}
              onChange={f("transfer_date")}
              className="bg-zinc-800 border-zinc-700 text-white focus:border-indigo-500"
            />
          </FormField>

          {/* From */}
          <FormField label="From Account">
            <select
              value={form.from_ledger_id}
              onChange={f("from_ledger_id")}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-indigo-500 focus:outline-none px-3 py-2 text-sm"
            >
              <option value="">Select source account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — ₹
                  {Math.abs(parseFloat(a.current_balance || 0)).toLocaleString(
                    "en-IN",
                  )}{" "}
                  {a.balance_type}
                </option>
              ))}
            </select>
            {fromAccount && (
              <p className="text-zinc-500 text-xs px-1 mt-1">
                Available:{" "}
                <span
                  className={`font-mono font-medium ${parseFloat(fromAccount.current_balance) > 0 ? "text-emerald-400" : "text-red-400"}`}
                >
                  {formatINR(Math.abs(fromAccount.current_balance))}{" "}
                  {fromAccount.balance_type}
                </span>
              </p>
            )}
          </FormField>

          {/* Arrow */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-800" />
            <div className="w-8 h-8 rounded-full bg-blue-950/30 border border-blue-800/50 flex items-center justify-center text-blue-400 text-lg">
              ↓
            </div>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* To */}
          <FormField label="To Account">
            <select
              value={form.to_ledger_id}
              onChange={f("to_ledger_id")}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-indigo-500 focus:outline-none px-3 py-2 text-sm"
            >
              <option value="">Select destination account</option>
              {accounts
                .filter((a) => a.id !== form.from_ledger_id)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} — ₹
                    {Math.abs(
                      parseFloat(a.current_balance || 0),
                    ).toLocaleString("en-IN")}{" "}
                    {a.balance_type}
                  </option>
                ))}
            </select>
            {toAccount && form.amount && parseFloat(form.amount) > 0 && (
              <p className="text-zinc-500 text-xs px-1 mt-1">
                After transfer:{" "}
                <span className="text-emerald-400 font-mono">
                  {formatINR(
                    Math.abs(parseFloat(toAccount.current_balance || 0)) +
                      parseFloat(form.amount),
                  )}{" "}
                  Dr
                </span>
              </p>
            )}
          </FormField>

          {/* Amount */}
          <FormField label="Amount">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg font-medium">
                ₹
              </span>
              <Input
                type="number"
                value={form.amount}
                onChange={f("amount")}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                className="bg-zinc-800 border-zinc-700 text-white text-xl font-mono pl-10 py-3 h-auto focus:border-indigo-500"
              />
            </div>
          </FormField>

          {/* Transfer summary preview */}
          {fromAccount &&
            toAccount &&
            form.amount &&
            parseFloat(form.amount) > 0 && (
              <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                <div className="flex items-center justify-between text-sm">
                  <div className="text-center flex-1">
                    <p className="text-zinc-500 text-xs mb-1">From</p>
                    <p className="text-white font-medium text-sm">
                      {fromAccount.name}
                    </p>
                    <p className="text-red-400 font-mono text-xs mt-0.5">
                      - {formatINR(form.amount)}
                    </p>
                  </div>
                  <div className="text-indigo-400 text-xl px-3">→</div>
                  <div className="text-center flex-1">
                    <p className="text-zinc-500 text-xs mb-1">To</p>
                    <p className="text-white font-medium text-sm">
                      {toAccount.name}
                    </p>
                    <p className="text-emerald-400 font-mono text-xs mt-0.5">
                      + {formatINR(form.amount)}
                    </p>
                  </div>
                </div>
              </div>
            )}

          <FormField label="Reference / Cheque No.">
            <Input
              value={form.reference}
              onChange={f("reference")}
              placeholder="Optional"
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-indigo-500"
            />
          </FormField>

          <FormField label="Narration">
            <Input
              value={form.narration}
              onChange={f("narration")}
              placeholder="e.g. Cash deposit to HDFC Bank"
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-indigo-500"
            />
          </FormField>

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
              className="flex-1 bg-blue-700 hover:bg-blue-600 text-white font-medium"
            >
              {loading ? "Transferring..." : "Transfer Funds"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
