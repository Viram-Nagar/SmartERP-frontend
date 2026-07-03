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
 * PURCHASE VOUCHER
 *
 * Dr: Purchase Account    (taxable amount — cost of goods)
 * Dr: Input CGST/SGST/IGST (GST recoverable)
 * Cr: Supplier Ledger     (grand total payable)
 *
 * Stock: auto-added on post
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

export default function PurchaseVoucherPage() {
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
  } = useVoucherForm("purchase");

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
      setError("Select a supplier ledger");
      return;
    }
    if (!purchaseLedger) {
      setError("Select a purchase account");
      return;
    }
    if (items.every((i) => !i.unit_price || !i.quantity)) {
      setError("Add at least one item with quantity and price");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post("/vouchers/purchase", {
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
      setError(
        err.response?.data?.message || "Failed to post purchase voucher",
      );
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

  const supplierLedgers = getLedgersByType("supplier");
  const purchaseLedgers = getLedgersByType("expense");

  if (loading)
    return (
      <div className="flex items-center justify-center h-full text-zinc-500">
        Loading...
      </div>
    );

  return (
    <VoucherLayout
      title="Purchase Voucher"
      voucherNumber={nextNumber}
      shortcut="F9"
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

        {/* Supplier + Purchase Account */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
            <p className="text-zinc-400 text-xs uppercase tracking-wider font-medium">
              Supplier
            </p>
            <LedgerSelect
              value={supplierLedger}
              onChange={setSupplierLedger}
              ledgers={supplierLedgers}
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
              ledgers={purchaseLedgers}
              placeholder="Select purchase ledger..."
              showBalance={false}
            />
          </div>
        </div>

        {/* GST type */}
        <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div>
            <p className="text-zinc-300 text-sm font-medium">GST Type</p>
            <p className="text-zinc-500 text-xs">
              {isIGST
                ? "Interstate purchase — IGST"
                : "Intrastate purchase — CGST + SGST"}
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
            Items Purchased
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
