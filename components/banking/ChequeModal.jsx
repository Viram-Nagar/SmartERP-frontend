"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useCompany } from "@/context/CompanyContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField, FormRow } from "@/components/ui/FormField";

export default function ChequeModal({ open, onClose, accounts, onSuccess }) {
  const { activeCompany } = useCompany();
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    ledger_id: "",
    cheque_type: "issued",
    cheque_number: "",
    cheque_date: today,
    amount: "",
    payee_payer: "",
    bank_name: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        ledger_id: "",
        cheque_type: "issued",
        cheque_number: "",
        cheque_date: today,
        amount: "",
        payee_payer: "",
        bank_name: "",
        notes: "",
      });
      setError("");
      setSuccess("");
    }
  }, [open]);

  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.ledger_id || !form.cheque_number || !form.amount) {
      setError("Account, cheque number and amount are required");
      return;
    }
    setLoading(true);
    try {
      await api.post("/banking/cheques", {
        ...form,
        company_id: activeCompany.id,
      });
      setSuccess("Cheque recorded successfully");
      onSuccess?.();
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record cheque");
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
          <span className="w-8 h-8 rounded-lg bg-violet-950/50 border border-violet-800 flex items-center justify-center text-violet-400 text-sm">
            🧾
          </span>
          <div>
            <h2 className="text-white font-semibold">Record Cheque</h2>
            <p className="text-zinc-500 text-xs">
              Track issued and received cheques
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
          {/* Cheque type toggle */}
          <FormField label="Cheque Type">
            <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
              {[
                {
                  value: "issued",
                  label: "📤 Issued",
                  desc: "We issued this cheque",
                },
                {
                  value: "received",
                  label: "📥 Received",
                  desc: "We received this cheque",
                },
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() =>
                    setForm((p) => ({ ...p, cheque_type: t.value }))
                  }
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    form.cheque_type === t.value
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="text-zinc-600 text-xs px-1 mt-1">
              {form.cheque_type === "issued"
                ? "Cheque drawn from our account"
                : "Cheque deposited to our account"}
            </p>
          </FormField>

          <FormField label="Bank Account" required>
            <select
              value={form.ledger_id}
              onChange={f("ledger_id")}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-indigo-500 focus:outline-none px-3 py-2 text-sm"
            >
              <option value="">Select account</option>
              {accounts
                .filter((a) => a.ledger_type === "bank")
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
          </FormField>

          <FormRow>
            <FormField label="Cheque Number" required>
              <Input
                value={form.cheque_number}
                onChange={f("cheque_number")}
                placeholder="123456"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500 font-mono"
              />
            </FormField>
            <FormField label="Cheque Date" required>
              <Input
                type="date"
                value={form.cheque_date}
                onChange={f("cheque_date")}
                className="bg-zinc-800 border-zinc-700 text-white focus:border-indigo-500"
              />
            </FormField>
          </FormRow>

          <FormField label="Amount" required>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                ₹
              </span>
              <Input
                type="number"
                value={form.amount}
                onChange={f("amount")}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                className="bg-zinc-800 border-zinc-700 text-white pl-7 font-mono focus:border-indigo-500"
              />
            </div>
          </FormField>

          <FormField
            label={form.cheque_type === "issued" ? "Payee Name" : "Payer Name"}
          >
            <Input
              value={form.payee_payer}
              onChange={f("payee_payer")}
              placeholder={
                form.cheque_type === "issued" ? "Who to pay" : "Who paid us"
              }
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500"
            />
          </FormField>

          <FormField label="Bank Name">
            <Input
              value={form.bank_name}
              onChange={f("bank_name")}
              placeholder="e.g. HDFC Bank"
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500"
            />
          </FormField>

          <FormField label="Notes">
            <Input
              value={form.notes}
              onChange={f("notes")}
              placeholder="Optional remarks"
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500"
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
              className="flex-1 bg-violet-700 hover:bg-violet-600 text-white font-medium"
            >
              {loading ? "Recording..." : "Record Cheque"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
