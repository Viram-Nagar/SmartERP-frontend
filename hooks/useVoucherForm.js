"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useCompany } from "@/context/CompanyContext";

export function useVoucherForm(voucherType) {
  const router = useRouter();
  const { activeCompany } = useCompany();

  const [ledgers, setLedgers] = useState([]);
  const [nextNumber, setNextNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [reference, setReference] = useState("");
  const [narration, setNarration] = useState("");

  const fetchInit = useCallback(async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const [ledgerRes, numRes] = await Promise.all([
        api.get(`/ledgers/summary?company_id=${activeCompany.id}`),
        api.get(
          `/vouchers/next-number?company_id=${activeCompany.id}&type=${voucherType}`,
        ),
      ]);
      setLedgers(ledgerRes.data.ledgers);
      setNextNumber(numRes.data.voucher_number);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeCompany, voucherType]);

  useEffect(() => {
    fetchInit();
  }, [fetchInit]);

  const submit = async (entries) => {
    if (!activeCompany) return;
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.post("/vouchers", {
        company_id: activeCompany.id,
        voucher_type: voucherType,
        voucher_date: date,
        reference_number: reference,
        narration,
        entries,
      });
      setSuccess(res.data.message);
      // Refresh next number for another entry
      const numRes = await api.get(
        `/vouchers/next-number?company_id=${activeCompany.id}&type=${voucherType}`,
      );
      setNextNumber(numRes.data.voucher_number);
      return res.data.voucher;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post voucher");
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  // Ledger helpers
  const getLedgersByType = (...types) =>
    ledgers.filter((l) => types.includes(l.ledger_type));

  const getLedgersByNature = (...natures) =>
    ledgers.filter((l) => natures.includes(l.nature));

  const formatBalance = (ledger) => {
    if (!ledger) return "";
    const bal = Math.abs(parseFloat(ledger.current_balance || 0));
    return `₹${bal.toLocaleString("en-IN", { minimumFractionDigits: 2 })} ${ledger.balance_type}`;
  };

  return {
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
    getLedgersByNature,
    formatBalance,
  };
}
