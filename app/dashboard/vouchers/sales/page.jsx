"use client";

import { useState, useCallback } from "react";
import api from "@/lib/api";
import { useCompany } from "@/context/CompanyContext";
import { useVoucherForm } from "@/hooks/useVoucherForm";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { calculateTotals } from "@/lib/gst";
import VoucherLayout from "@/components/vouchers/VoucherLayout";
import VoucherHeader from "@/components/vouchers/VoucherHeader";
import LedgerSelect from "@/components/vouchers/LedgerSelect";
import LineItemsTable from "@/components/vouchers/LineItemsTable";
import GSTSummary from "@/components/vouchers/GSTSummary";
import NarrationField from "@/components/vouchers/NarrationField";
import { useEffect } from "react";

/**
 * SALES VOUCHER
 *
 * Dr: Customer Ledger     (grand total receivable)
 * Cr: Sales Account       (taxable value)
 * Cr: CGST/SGST/IGST      (tax collected)
 *
 * Stock: auto-deducted on post
 */

const EMPTY_ITEM = {
  stock_item_id: "",
  description: "",
  hsn_code: "",
  quantity: "1",
  unit_price: "",
  discount_percent: "0",
  gst_rate: "18",
};

export default function SalesVoucherPage() {
  const { activeCompany } = useCompany();
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
    setError,
    setSuccess,
    getLedgersByType,
  } = useVoucherForm("sales");

  const [stockItems, setStockItems] = useState([]);
  const [customerLedger, setCustomerLedger] = useState("");
  const [salesLedger, setSalesLedger] = useState("");
  const [isIGST, setIsIGST] = useState(false);
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch stock items
  useEffect(() => {
    if (!activeCompany) return;
    api
      .get(`/stock-items/summary?company_id=${activeCompany.id}`)
      .then((r) => setStockItems(r.data.stockItems))
      .catch(console.error);
  }, [activeCompany]);

  // Auto-select first sales ledger
  useEffect(() => {
    const sl = getLedgersByType("income").find((l) =>
      l.name.toLowerCase().includes("sales"),
    );
    if (sl && !salesLedger) setSalesLedger(sl.id);
  }, [ledgers]);

  const totals = calculateTotals(
    items.filter((i) => i.unit_price && i.quantity),
    isIGST,
  );

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (!customerLedger) {
      setError("Select a customer ledger");
      return;
    }
    if (!salesLedger) {
      setError("Select a sales account");
      return;
    }
    if (items.every((i) => !i.unit_price || !i.quantity)) {
      setError("Add at least one item with quantity and price");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post("/vouchers/sales", {
        company_id: activeCompany.id,
        voucher_date: date,
        reference_number: reference,
        narration,
        customer_ledger_id: customerLedger,
        sales_ledger_id: salesLedger,
        items: items.filter((i) => i.quantity && i.unit_price),
        is_igst: isIGST,
      });
      setSuccess(res.data.message);
      setCustomerLedger("");
      setItems([{ ...EMPTY_ITEM }]);
      setNarration("");
      setReference("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post sales voucher");
    } finally {
      setIsSubmitting(false);
    }
  };

  useKeyboardShortcuts([
    { key: "s", ctrl: true, action: handleSubmit },
    {
      key: "n",
      alt: true,
      action: () => setItems((p) => [...p, { ...EMPTY_ITEM }]),
    },
  ]);

  const customerLedgers = getLedgersByType("customer");
  const salesLedgers = getLedgersByType("income");

  if (loading)
    return (
      <div className="flex items-center justify-center h-full text-zinc-500">
        Loading...
      </div>
    );

  return (
    <VoucherLayout
      title="Sales Voucher"
      voucherNumber={nextNumber}
      shortcut="F8"
      onSave={handleSubmit}
      submitting={isSubmitting}
      success={success}
      error={error}
    >
      <div className="max-w-5xl mx-auto space-y-5">
        <VoucherHeader
          date={date}
          setDate={setDate}
          reference={reference}
          setReference={setReference}
          voucherNumber={nextNumber}
        />

        {/* Party + Sales Account row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
            <p className="text-zinc-400 text-xs uppercase tracking-wider font-medium">
              Customer
            </p>
            <LedgerSelect
              value={customerLedger}
              onChange={setCustomerLedger}
              ledgers={customerLedgers}
              placeholder="Select customer..."
            />
          </div>
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
            <p className="text-zinc-400 text-xs uppercase tracking-wider font-medium">
              Sales Account
            </p>
            <LedgerSelect
              value={salesLedger}
              onChange={setSalesLedger}
              ledgers={salesLedgers}
              placeholder="Select sales ledger..."
              showBalance={false}
            />
          </div>
        </div>

        {/* GST Type toggle */}
        <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div>
            <p className="text-zinc-300 text-sm font-medium">GST Type</p>
            <p className="text-zinc-500 text-xs">
              {isIGST
                ? "Interstate sale — IGST applies (single tax)"
                : "Intrastate sale — CGST + SGST applies (split tax)"}
            </p>
          </div>
          <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
            <button
              onClick={() => setIsIGST(false)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${!isIGST ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}
            >
              CGST + SGST
            </button>
            <button
              onClick={() => setIsIGST(true)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${isIGST ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}
            >
              IGST
            </button>
          </div>
        </div>

        {/* Line items */}
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4">
          <p className="text-zinc-400 text-xs uppercase tracking-wider font-medium">
            Items
          </p>
          <LineItemsTable
            items={items}
            onChange={setItems}
            stockItems={stockItems}
            isIGST={isIGST}
          />
        </div>

        {/* Narration + GST Summary side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <NarrationField value={narration} onChange={setNarration} />
          </div>
          <GSTSummary totals={totals} isIGST={isIGST} />
        </div>
      </div>
    </VoucherLayout>
  );
}
