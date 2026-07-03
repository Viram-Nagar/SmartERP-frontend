"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { useCompany } from "@/context/CompanyContext";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import FundTransferModal from "@/components/banking/FundTransferModal";
import ChequeModal from "@/components/banking/ChequeModal";
import { formatINR } from "@/lib/gst";

const VOUCHER_TYPE_COLORS = {
  payment: "text-red-400",
  receipt: "text-emerald-400",
  contra: "text-blue-400",
  sales: "text-indigo-400",
  purchase: "text-amber-400",
  journal: "text-purple-400",
};

const CHEQUE_STATUS_STYLES = {
  pending: "bg-amber-950/40  text-amber-400  border-amber-900/50",
  cleared: "bg-emerald-950/40 text-emerald-400 border-emerald-900/50",
  bounced: "bg-red-950/40    text-red-400    border-red-900/50",
  cancelled: "bg-zinc-800      text-zinc-500   border-zinc-700",
  stale: "bg-zinc-800      text-zinc-600   border-zinc-700",
};

export default function BankingPage() {
  const { activeCompany } = useCompany();

  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [cheques, setCheques] = useState([]);
  const [reconciliation, setReconciliation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("accounts");
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [chequeOpen, setChequeOpen] = useState(false);
  const [recoLoading, setRecoLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchAccounts = useCallback(async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const res = await api.get(
        `/banking/accounts?company_id=${activeCompany.id}`,
      );
      setAccounts(res.data.accounts);
      if (res.data.accounts.length > 0 && !selectedAccount) {
        setSelectedAccount(
          res.data.accounts.find((a) => a.ledger_type === "bank") ||
            res.data.accounts[0],
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeCompany]);

  const fetchTransactions = useCallback(async () => {
    if (!activeCompany) return;
    const params = new URLSearchParams({ company_id: activeCompany.id });
    if (selectedAccount) params.set("ledger_id", selectedAccount.id);
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    try {
      const res = await api.get(`/banking/transactions?${params}`);
      // Calculate running balance
      let balance = selectedAccount
        ? parseFloat(selectedAccount.current_balance || 0)
        : 0;
      const withBalance = [...res.data.transactions]
        .reverse()
        .map((txn) => {
          const entry = { ...txn, running_balance: balance };
          balance +=
            txn.entry_type === "Dr"
              ? parseFloat(txn.amount)
              : -parseFloat(txn.amount);
          return entry;
        })
        .reverse();
      setTransactions(withBalance);
    } catch (err) {
      console.error(err);
    }
  }, [activeCompany, selectedAccount, dateFrom, dateTo]);

  const fetchCheques = useCallback(async () => {
    if (!activeCompany) return;
    try {
      const res = await api.get(
        `/banking/cheques?company_id=${activeCompany.id}`,
      );
      setCheques(res.data.cheques);
    } catch (err) {
      console.error(err);
    }
  }, [activeCompany]);

  const fetchReconciliation = useCallback(async () => {
    if (!activeCompany || !selectedAccount) return;
    setRecoLoading(true);
    try {
      const res = await api.get(
        `/banking/reconciliation?company_id=${activeCompany.id}&ledger_id=${selectedAccount.id}`,
      );
      setReconciliation(res.data.entries);
    } catch (err) {
      console.error(err);
    } finally {
      setRecoLoading(false);
    }
  }, [activeCompany, selectedAccount]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (activeTab === "transactions") fetchTransactions();
    if (activeTab === "reconciliation") fetchReconciliation();
    if (activeTab === "cheques") fetchCheques();
  }, [activeTab, selectedAccount]);

  const handleReconcile = async (entryId, currentStatus, bankRef) => {
    if (!selectedAccount) return;
    try {
      await api.put(`/banking/reconciliation/${entryId}`, {
        company_id: activeCompany.id,
        ledger_id: selectedAccount.id,
        is_reconciled: !currentStatus,
        bank_reference: bankRef || null,
      });
      fetchReconciliation();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update");
    }
  };

  const handleChequeStatus = async (chequeId, status) => {
    try {
      await api.put(`/banking/cheques/${chequeId}/status`, {
        company_id: activeCompany.id,
        status,
        clearing_date:
          status === "cleared" ? new Date().toISOString().split("T")[0] : null,
      });
      fetchCheques();
    } catch (err) {
      alert("Failed to update cheque status");
    }
  };

  useKeyboardShortcuts(
    [{ key: "F11", action: () => setTransferOpen(true) }],
    !transferOpen && !chequeOpen,
  );

  const totalBankBalance = accounts
    .filter((a) => a.ledger_type === "bank")
    .reduce(
      (s, a) =>
        s +
        (a.balance_type === "Dr"
          ? parseFloat(a.current_balance || 0)
          : -parseFloat(a.current_balance || 0)),
      0,
    );

  const totalCashBalance = accounts
    .filter((a) => a.ledger_type === "cash")
    .reduce(
      (s, a) =>
        s +
        (a.balance_type === "Dr"
          ? parseFloat(a.current_balance || 0)
          : -parseFloat(a.current_balance || 0)),
      0,
    );

  const pendingCheques = cheques.filter((c) => c.status === "pending");

  if (loading)
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
        Loading banking data...
      </div>
    );

  return (
    <div className="p-6 h-full flex flex-col space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-semibold">Banking</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Bank accounts, reconciliation & cheques
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChequeOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-700 hover:bg-violet-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            🧾 Record Cheque
          </button>
          <button
            onClick={() => setTransferOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            ↔ Fund Transfer
            <kbd className="bg-blue-600 border border-blue-500 rounded px-1 text-[10px]">
              F11
            </kbd>
          </button>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-1 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-500 text-xs">Total Bank Balance</p>
          <p
            className={`text-xl font-mono font-bold mt-1 ${totalBankBalance >= 0 ? "text-emerald-400" : "text-red-400"}`}
          >
            {formatINR(Math.abs(totalBankBalance))}
          </p>
          <p className="text-zinc-600 text-xs mt-0.5">
            {accounts.filter((a) => a.ledger_type === "bank").length} accounts
          </p>
        </div>
        <div className="col-span-1 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-500 text-xs">Cash in Hand</p>
          <p
            className={`text-xl font-mono font-bold mt-1 ${totalCashBalance >= 0 ? "text-emerald-400" : "text-red-400"}`}
          >
            {formatINR(Math.abs(totalCashBalance))}
          </p>
          <p className="text-zinc-600 text-xs mt-0.5">
            {accounts.filter((a) => a.ledger_type === "cash").length} accounts
          </p>
        </div>
        <div className="col-span-1 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-500 text-xs">Pending Cheques</p>
          <p className="text-xl font-mono font-bold mt-1 text-amber-400">
            {pendingCheques.length}
          </p>
          <p className="text-zinc-600 text-xs mt-0.5">
            {formatINR(
              pendingCheques.reduce((s, c) => s + parseFloat(c.amount || 0), 0),
            )}{" "}
            value
          </p>
        </div>
        <div className="col-span-1 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-500 text-xs">Total Liquid</p>
          <p
            className={`text-xl font-mono font-bold mt-1 ${totalBankBalance + totalCashBalance >= 0 ? "text-indigo-400" : "text-red-400"}`}
          >
            {formatINR(Math.abs(totalBankBalance + totalCashBalance))}
          </p>
          <p className="text-zinc-600 text-xs mt-0.5">Bank + Cash</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-800">
        {[
          { id: "accounts", label: "Accounts" },
          { id: "transactions", label: "Transactions" },
          { id: "reconciliation", label: "Reconciliation" },
          {
            id: "cheques",
            label: `Cheques${pendingCheques.length > 0 ? ` (${pendingCheques.length})` : ""}`,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Accounts ──────────────────────────────────────── */}
      {activeTab === "accounts" && (
        <div className="grid grid-cols-2 gap-4">
          {accounts.map((account) => {
            const bal = parseFloat(account.current_balance || 0);
            const isDr = account.balance_type === "Dr";
            const monthIn = parseFloat(account.month_debits || 0);
            const monthOut = parseFloat(account.month_credits || 0);
            return (
              <div
                key={account.id}
                onClick={() => {
                  setSelectedAccount(account);
                  setActiveTab("transactions");
                }}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 cursor-pointer transition-colors group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                        account.ledger_type === "bank"
                          ? "bg-blue-950/50 border border-blue-800"
                          : "bg-emerald-950/50 border border-emerald-800"
                      }`}
                    >
                      {account.ledger_type === "bank" ? "🏦" : "💵"}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{account.name}</p>
                      <p className="text-zinc-500 text-xs capitalize">
                        {account.ledger_type} account
                      </p>
                    </div>
                  </div>
                  {parseInt(account.pending_cheques) > 0 && (
                    <span className="bg-amber-950/40 border border-amber-900/50 text-amber-400 text-xs rounded-full px-2 py-0.5">
                      {account.pending_cheques} cheque
                      {parseInt(account.pending_cheques) > 1 ? "s" : ""} pending
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-zinc-500 text-xs">Current Balance</p>
                  <p
                    className={`text-2xl font-mono font-bold ${isDr ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {formatINR(Math.abs(bal))}
                    <span className="text-sm ml-1 font-normal text-zinc-500">
                      {account.balance_type}
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-zinc-800">
                  <div>
                    <p className="text-zinc-600 text-xs">This month in</p>
                    <p className="text-emerald-400 font-mono text-sm mt-0.5">
                      +{formatINR(monthIn)}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-600 text-xs">This month out</p>
                    <p className="text-red-400 font-mono text-sm mt-0.5">
                      -{formatINR(monthOut)}
                    </p>
                  </div>
                </div>

                <p className="text-zinc-600 text-xs mt-3 group-hover:text-indigo-400 transition-colors">
                  Click to view transactions →
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Tab: Transactions ──────────────────────────────────── */}
      {activeTab === "transactions" && (
        <div className="flex-1 flex flex-col space-y-3 min-h-0">
          {/* Account selector + date filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedAccount?.id || ""}
              onChange={(e) =>
                setSelectedAccount(
                  accounts.find((a) => a.id === e.target.value),
                )
              }
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">All accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
            <span className="text-zinc-600 text-sm">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={fetchTransactions}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm transition-colors"
            >
              Apply
            </button>
            {selectedAccount && (
              <div className="ml-auto text-right">
                <p className="text-zinc-500 text-xs">Current Balance</p>
                <p
                  className={`font-mono font-semibold ${selectedAccount.balance_type === "Dr" ? "text-emerald-400" : "text-red-400"}`}
                >
                  {formatINR(
                    Math.abs(parseFloat(selectedAccount.current_balance || 0)),
                  )}{" "}
                  {selectedAccount.balance_type}
                </p>
              </div>
            )}
          </div>

          {/* Transactions table */}
          <div className="flex-1 overflow-auto rounded-xl border border-zinc-800 bg-zinc-900">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-zinc-900 border-b border-zinc-800">
                <tr>
                  {[
                    "Date",
                    "Voucher",
                    "Type",
                    "Description",
                    "Debit (In)",
                    "Credit (Out)",
                    "Balance",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-zinc-400 text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-zinc-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map((txn, idx) => (
                    <tr
                      key={`${txn.entry_id}-${idx}`}
                      className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors"
                    >
                      <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">
                        {new Date(txn.voucher_date).toLocaleDateString(
                          "en-IN",
                          { day: "2-digit", month: "short", year: "numeric" },
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-mono text-xs ${VOUCHER_TYPE_COLORS[txn.voucher_type] || "text-zinc-400"}`}
                        >
                          {txn.voucher_number}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize text-xs text-zinc-500">
                          {txn.voucher_type?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-zinc-300 text-sm truncate">
                          {txn.entry_narration || txn.voucher_narration || "—"}
                        </p>
                        {txn.reference_number && (
                          <p className="text-zinc-600 text-xs font-mono">
                            {txn.reference_number}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {txn.entry_type === "Dr" ? (
                          <span className="text-emerald-400 font-mono text-sm">
                            {formatINR(txn.amount)}
                          </span>
                        ) : (
                          <span className="text-zinc-700">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {txn.entry_type === "Cr" ? (
                          <span className="text-red-400 font-mono text-sm">
                            {formatINR(txn.amount)}
                          </span>
                        ) : (
                          <span className="text-zinc-700">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-white">
                        {formatINR(Math.abs(txn.running_balance || 0))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="text-zinc-600 text-xs">
            {transactions.length} transactions
          </p>
        </div>
      )}

      {/* ── Tab: Reconciliation ────────────────────────────────── */}
      {activeTab === "reconciliation" && (
        <div className="flex-1 flex flex-col space-y-3 min-h-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <select
                value={selectedAccount?.id || ""}
                onChange={(e) =>
                  setSelectedAccount(
                    accounts.find((a) => a.id === e.target.value),
                  )
                }
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
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
              <button
                onClick={fetchReconciliation}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors"
              >
                Load
              </button>
            </div>

            {reconciliation.length > 0 && (
              <div className="flex items-center gap-4 text-xs">
                <span className="text-zinc-500">
                  Reconciled:{" "}
                  <span className="text-emerald-400 font-medium">
                    {reconciliation.filter((r) => r.is_reconciled).length}
                  </span>
                </span>
                <span className="text-zinc-500">
                  Pending:{" "}
                  <span className="text-amber-400 font-medium">
                    {reconciliation.filter((r) => !r.is_reconciled).length}
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Info banner */}
          <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl">
            <p className="text-blue-400 text-xs">
              ✓ Tick each voucher entry that appears in your bank statement. Use
              bank reference to record the statement reference number.
            </p>
          </div>

          <div className="flex-1 overflow-auto rounded-xl border border-zinc-800 bg-zinc-900">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-zinc-900 border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3 text-left text-zinc-400 text-xs font-medium uppercase tracking-wider w-12">
                    ✓
                  </th>
                  {[
                    "Date",
                    "Voucher",
                    "Description",
                    "Debit",
                    "Credit",
                    "Bank Ref",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-zinc-400 text-xs font-medium uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recoLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-zinc-500">
                      Loading...
                    </td>
                  </tr>
                ) : reconciliation.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-zinc-500">
                      Select a bank account and click Load
                    </td>
                  </tr>
                ) : (
                  reconciliation.map((entry) => (
                    <tr
                      key={entry.entry_id}
                      className={`border-b border-zinc-800/50 transition-colors ${
                        entry.is_reconciled
                          ? "bg-emerald-950/10"
                          : "hover:bg-zinc-800/20"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            handleReconcile(
                              entry.entry_id,
                              entry.is_reconciled,
                              entry.bank_reference,
                            )
                          }
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            entry.is_reconciled
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-zinc-600 hover:border-indigo-500"
                          }`}
                        >
                          {entry.is_reconciled && (
                            <span className="text-[10px]">✓</span>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">
                        {new Date(entry.voucher_date).toLocaleDateString(
                          "en-IN",
                          { day: "2-digit", month: "short", year: "numeric" },
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-indigo-400">
                          {entry.voucher_number}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-sm max-w-xs truncate">
                        {entry.entry_narration ||
                          entry.voucher_narration ||
                          "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {entry.entry_type === "Dr" ? (
                          <span className="text-emerald-400 font-mono text-sm">
                            {formatINR(entry.amount)}
                          </span>
                        ) : (
                          <span className="text-zinc-700">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {entry.entry_type === "Cr" ? (
                          <span className="text-red-400 font-mono text-sm">
                            {formatINR(entry.amount)}
                          </span>
                        ) : (
                          <span className="text-zinc-700">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {entry.bank_reference ? (
                          <span className="text-zinc-400 font-mono text-xs">
                            {entry.bank_reference}
                          </span>
                        ) : (
                          <span className="text-zinc-700 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Cheques ───────────────────────────────────────── */}
      {activeTab === "cheques" && (
        <div className="flex-1 flex flex-col space-y-3 min-h-0">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {["", "issued", "received"].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    const filtered = t
                      ? cheques.filter((c) => c.cheque_type === t)
                      : cheques;
                    setCheques((prev) =>
                      t ? prev.filter((c) => c.cheque_type === t) : prev,
                    );
                    fetchCheques();
                  }}
                  className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white rounded-lg text-xs capitalize transition-colors"
                >
                  {t || "All"}
                </button>
              ))}
            </div>
            <button
              onClick={() => setChequeOpen(true)}
              className="ml-auto px-3 py-1.5 bg-violet-700 hover:bg-violet-600 text-white rounded-lg text-xs transition-colors"
            >
              + Record Cheque
            </button>
          </div>

          <div className="flex-1 overflow-auto rounded-xl border border-zinc-800 bg-zinc-900">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-zinc-900 border-b border-zinc-800">
                <tr>
                  {[
                    "Type",
                    "Cheque No.",
                    "Date",
                    "Payee/Payer",
                    "Account",
                    "Amount",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-zinc-400 text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cheques.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-zinc-500">
                      No cheques recorded
                    </td>
                  </tr>
                ) : (
                  cheques.map((cheque) => (
                    <tr
                      key={cheque.id}
                      className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`capitalize px-2 py-0.5 rounded-full text-xs font-medium border ${
                            cheque.cheque_type === "issued"
                              ? "bg-red-950/40 text-red-400 border-red-900/50"
                              : "bg-emerald-950/40 text-emerald-400 border-emerald-900/50"
                          }`}
                        >
                          {cheque.cheque_type === "issued" ? "📤" : "📥"}{" "}
                          {cheque.cheque_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-indigo-400 text-sm">
                        {cheque.cheque_number}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">
                        {new Date(cheque.cheque_date).toLocaleDateString(
                          "en-IN",
                          { day: "2-digit", month: "short", year: "numeric" },
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-300 text-sm">
                        {cheque.payee_payer || "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-sm">
                        {cheque.account_name}
                      </td>
                      <td className="px-4 py-3 font-mono text-white text-sm">
                        {formatINR(cheque.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`capitalize px-2 py-0.5 rounded-full text-xs font-medium border ${CHEQUE_STATUS_STYLES[cheque.status] || ""}`}
                        >
                          {cheque.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {cheque.status === "pending" && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                handleChequeStatus(cheque.id, "cleared")
                              }
                              className="px-2 py-1 text-emerald-400 hover:bg-emerald-950/30 rounded text-xs transition-colors"
                            >
                              Clear
                            </button>
                            <button
                              onClick={() =>
                                handleChequeStatus(cheque.id, "bounced")
                              }
                              className="px-2 py-1 text-red-400 hover:bg-red-950/30 rounded text-xs transition-colors"
                            >
                              Bounce
                            </button>
                            <button
                              onClick={() =>
                                handleChequeStatus(cheque.id, "cancelled")
                              }
                              className="px-2 py-1 text-zinc-500 hover:text-zinc-300 rounded text-xs transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="text-zinc-600 text-xs">{cheques.length} cheques</p>
        </div>
      )}

      {/* Modals */}
      <FundTransferModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        accounts={accounts}
        onSuccess={() => {
          fetchAccounts();
          if (activeTab === "transactions") fetchTransactions();
        }}
      />
      <ChequeModal
        open={chequeOpen}
        onClose={() => setChequeOpen(false)}
        accounts={accounts}
        onSuccess={fetchCheques}
      />
    </div>
  );
}
