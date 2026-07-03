"use client";

import { useState, useEffect } from "react";
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

/**
 * DEBIT NOTE — Purchase Return
 *
 * Dr: Supplier Ledger    (reduce amount payable)
 * Cr: Purchase Account   (reduce purchase expense)
 * Cr: Input GST          (reverse input tax credit)
 *
 * Stock: returned items → deducted from inventory
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

export default function DebitNotePage() {
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
    getLedgersByType,
  } = useVoucherForm("debit_note");

  const [stockItems, setStockItems] = useState([]);
  const [supplierLedger, setSupplierLedger] = useState("");
  const [purchaseLedger, setPurchaseLedger] = useState("");
  const [isIGST, setIsIGST] = useState(false);
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!activeCompany) return;
    api
      .get(`/stock-items/summary?company_id=${activeCompany.id}`)
      .then((r) => setStockItems(r.data.stockItems))
      .catch(console.error);
  }, [activeCompany]);

  useEffect(() => {
    const pl = getLedgersByType("expense").find((l) =>
      l.name.toLowerCase().includes("purchase"),
    );
    if (pl && !purchaseLedger) setPurchaseLedger(pl.id);
  }, [ledgers]);

  const totals = calculateTotals(
    items.filter((i) => i.unit_price && i.quantity),
    isIGST,
  );

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (!supplierLedger) {
      setError("Select a supplier");
      return;
    }
    if (!purchaseLedger) {
      setError("Select a purchase account");
      return;
    }
    if (items.every((i) => !i.unit_price || !i.quantity)) {
      setError("Add at least one item");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post("/vouchers/debit-note", {
        company_id: activeCompany.id,
        voucher_date: date,
        reference_number: reference,
        narration,
        supplier_ledger_id: supplierLedger,
        purchase_ledger_id: purchaseLedger,
        items: items.filter((i) => i.quantity && i.unit_price),
        is_igst: isIGST,
      });
      setSuccess(res.data.message);
      setSupplierLedger("");
      setItems([{ ...EMPTY_ITEM }]);
      setNarration("");
      setReference("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post debit note");
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

  if (loading)
    return (
      <div className="flex items-center justify-center h-full text-zinc-500">
        Loading...
      </div>
    );

  return (
    <VoucherLayout
      title="Debit Note"
      voucherNumber={nextNumber}
      shortcut="Alt+F9"
      onSave={handleSubmit}
      submitting={isSubmitting}
      success={success}
      error={error}
    >
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-start gap-3 p-3 bg-orange-950/30 border border-orange-900/50 rounded-xl">
          <span className="text-orange-400 mt-0.5">↪</span>
          <div>
            <p className="text-orange-300 text-sm font-medium">
              Purchase Return / Debit Note
            </p>
            <p className="text-orange-600 text-xs mt-0.5">
              Reduces the supplier's outstanding payable. Returned items are
              removed from stock automatically.
            </p>
          </div>
        </div>

        <VoucherHeader
          date={date}
          setDate={setDate}
          reference={reference}
          setReference={setReference}
          voucherNumber={nextNumber}
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
            <p className="text-zinc-400 text-xs uppercase tracking-wider font-medium">
              Supplier
            </p>
            <LedgerSelect
              value={supplierLedger}
              onChange={setSupplierLedger}
              ledgers={getLedgersByType("supplier")}
              placeholder="Select supplier..."
            />
          </div>
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
            <p className="text-zinc-400 text-xs uppercase tracking-wider font-medium">
              Purchase Account
            </p>
            <LedgerSelect
              value={purchaseLedger}
              onChange={setPurchaseLedger}
              ledgers={getLedgersByType("expense")}
              placeholder="Select purchase ledger..."
              showBalance={false}
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div>
            <p className="text-zinc-300 text-sm font-medium">GST Type</p>
            <p className="text-zinc-500 text-xs">
              {isIGST ? "IGST — Interstate" : "CGST + SGST — Intrastate"}
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

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4">
          <p className="text-zinc-400 text-xs uppercase tracking-wider font-medium">
            Items Being Returned to Supplier
          </p>
          <LineItemsTable
            items={items}
            onChange={setItems}
            stockItems={stockItems}
            isIGST={isIGST}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <NarrationField value={narration} onChange={setNarration} />
          <GSTSummary totals={totals} isIGST={isIGST} />
        </div>
      </div>
    </VoucherLayout>
  );
}
