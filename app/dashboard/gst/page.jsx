"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { useCompany } from "@/context/CompanyContext";
import { formatINR } from "@/lib/gst";
import PeriodSelector from "@/components/reports/PeriodSelector";

const now = new Date();
const DEFAULT_PERIOD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

export default function GSTPage() {
  const { activeCompany } = useCompany();

  const [period, setPeriod] = useState({
    period: DEFAULT_PERIOD,
    from: null,
    to: null,
  });
  const [summary, setSummary] = useState(null);
  const [gstr3b, setGstr3b] = useState(null);
  const [gstr1, setGstr1] = useState(null);
  const [register, setRegister] = useState([]);
  const [trend, setTrend] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");

  const buildParams = useCallback(() => {
    const p = new URLSearchParams({ company_id: activeCompany.id });
    if (period.period) p.set("period", period.period);
    if (period.from) p.set("from", period.from);
    if (period.to) p.set("to", period.to);
    return p;
  }, [activeCompany, period]);

  const fetchData = useCallback(async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const params = buildParams();
      const [sumRes, trendRes] = await Promise.all([
        api.get(`/gst/summary?${params}`),
        api.get(`/gst/monthly-trend?company_id=${activeCompany.id}`),
      ]);
      setSummary(sumRes.data.summary);
      setGstr3b(sumRes.data.gstr3b);
      setTrend(trendRes.data.trend);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeCompany, buildParams]);

  const fetchGSTR1 = useCallback(async () => {
    if (!activeCompany) return;
    try {
      const res = await api.get(`/gst/gstr1?${buildParams()}`);
      setGstr1(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [activeCompany, buildParams]);

  const fetchRegister = useCallback(async () => {
    if (!activeCompany) return;
    try {
      const params = buildParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      const res = await api.get(`/gst/register?${params}`);
      setRegister(res.data.records);
    } catch (err) {
      console.error(err);
    }
  }, [activeCompany, buildParams, typeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === "gstr1") fetchGSTR1();
    if (activeTab === "register") fetchRegister();
  }, [activeTab, period]);

  const handleDownload = async (type) => {
    setDownloading(type);
    try {
      const params = buildParams();
      const url =
        type === "gstr1"
          ? `/gst/export/gstr1?${params}`
          : `/gst/export/register?${params}`;
      const res = await api.get(url, { responseType: "blob" });
      const blob = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = blob;
      a.download = `${type}_${period.period || "custom"}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blob);
    } catch (err) {
      alert("Export failed");
    } finally {
      setDownloading(null);
    }
  };

  // Compute summary values
  const salesRow = summary?.find((r) => r.record_type === "sales");
  const purchaseRow = summary?.find((r) => r.record_type === "purchase");

  const periodLabel = period.period
    ? new Date(period.period + "-01").toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      })
    : `${period.from} to ${period.to}`;

  return (
    <div className="p-6 h-full flex flex-col space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-white text-xl font-semibold">GST Reports</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Tax summary · GSTR-1 · GSTR-3B · Register · HSN
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownload("gstr1")}
            disabled={!!downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {downloading === "gstr1" ? "..." : "⬇ GSTR-1 Excel"}
          </button>
          <button
            onClick={() => handleDownload("register")}
            disabled={!!downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {downloading === "register" ? "..." : "⬇ Register Excel"}
          </button>
        </div>
      </div>

      {/* Period selector */}
      <PeriodSelector value={period} onChange={setPeriod} />

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-800">
        {[
          { id: "dashboard", label: "Dashboard" },
          { id: "gstr3b", label: "GSTR-3B" },
          { id: "gstr1", label: "GSTR-1" },
          { id: "register", label: "GST Register" },
          { id: "trend", label: "Monthly Trend" },
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

      {loading ? (
        <div className="flex items-center justify-center py-12 text-zinc-500">
          Loading GST data...
        </div>
      ) : (
        <>
          {/* ── Tab: Dashboard ──────────────────────────────────── */}
          {activeTab === "dashboard" && (
            <div className="space-y-5">
              <p className="text-zinc-500 text-sm">
                Period: <span className="text-white">{periodLabel}</span>
              </p>

              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-5">
                {/* Sales / Output Tax */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-zinc-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <p className="text-zinc-300 text-sm font-medium">
                      Outward Supplies (Sales)
                    </p>
                  </div>
                  <div className="p-5 space-y-3">
                    {[
                      ["Invoices", salesRow?.invoice_count || 0, "text-white"],
                      [
                        "Taxable Value",
                        formatINR(salesRow?.taxable_value || 0),
                        "text-white",
                      ],
                      [
                        "CGST Collected",
                        formatINR(salesRow?.total_cgst || 0),
                        "text-indigo-400",
                      ],
                      [
                        "SGST Collected",
                        formatINR(salesRow?.total_sgst || 0),
                        "text-indigo-400",
                      ],
                      [
                        "IGST Collected",
                        formatINR(salesRow?.total_igst || 0),
                        "text-indigo-400",
                      ],
                      [
                        "Total Output Tax",
                        formatINR(salesRow?.total_tax || 0),
                        "text-emerald-400",
                      ],
                    ].map(([label, value, color]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between"
                      >
                        <span className="text-zinc-500 text-sm">{label}</span>
                        <span
                          className={`font-mono text-sm font-medium ${color}`}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Purchase / Input Tax */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-zinc-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <p className="text-zinc-300 text-sm font-medium">
                      Inward Supplies (Purchases)
                    </p>
                  </div>
                  <div className="p-5 space-y-3">
                    {[
                      [
                        "Invoices",
                        purchaseRow?.invoice_count || 0,
                        "text-white",
                      ],
                      [
                        "Taxable Value",
                        formatINR(purchaseRow?.taxable_value || 0),
                        "text-white",
                      ],
                      [
                        "Input CGST",
                        formatINR(purchaseRow?.total_cgst || 0),
                        "text-amber-400",
                      ],
                      [
                        "Input SGST",
                        formatINR(purchaseRow?.total_sgst || 0),
                        "text-amber-400",
                      ],
                      [
                        "Input IGST",
                        formatINR(purchaseRow?.total_igst || 0),
                        "text-amber-400",
                      ],
                      [
                        "Total Input Credit",
                        formatINR(purchaseRow?.total_tax || 0),
                        "text-emerald-400",
                      ],
                    ].map(([label, value, color]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between"
                      >
                        <span className="text-zinc-500 text-sm">{label}</span>
                        <span
                          className={`font-mono text-sm font-medium ${color}`}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Net payable banner */}
              {gstr3b && (
                <div
                  className={`p-5 rounded-xl border ${
                    gstr3b.netTaxPayable.total > 0
                      ? "bg-red-950/20 border-red-900/50"
                      : "bg-emerald-950/20 border-emerald-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-zinc-400 text-sm">
                        Net GST Payable (Output Tax − Input Credit)
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                        <span>
                          Output:{" "}
                          <span className="text-red-400 font-mono">
                            {formatINR(gstr3b.outwardSupplies.total_tax)}
                          </span>
                        </span>
                        <span>−</span>
                        <span>
                          Input Credit:{" "}
                          <span className="text-emerald-400 font-mono">
                            {formatINR(gstr3b.inputTaxCredit.total_tax)}
                          </span>
                        </span>
                        <span>=</span>
                        <span className="text-white font-medium">
                          Net Liability
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-3xl font-mono font-bold ${
                          gstr3b.netTaxPayable.total > 0
                            ? "text-red-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {formatINR(gstr3b.netTaxPayable.total)}
                      </p>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        {gstr3b.netTaxPayable.total > 0
                          ? "Payable to Government"
                          : "No liability"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: GSTR-3B ────────────────────────────────────── */}
          {activeTab === "gstr3b" && gstr3b && (
            <div className="space-y-4 max-w-2xl">
              <p className="text-zinc-500 text-sm">
                GSTR-3B auto-computed data for{" "}
                <span className="text-white">{periodLabel}</span>. Download or
                copy these figures into the GST portal.
              </p>

              {/* 3.1 Outward Supplies */}
              <GSTRSection
                title="3.1 — Details of Outward Supplies"
                rows={[
                  [
                    "(a) Outward taxable supplies (other than zero rated, nil and exempted)",
                    formatINR(gstr3b.outwardSupplies.taxable),
                    formatINR(gstr3b.outwardSupplies.cgst),
                    formatINR(gstr3b.outwardSupplies.sgst),
                    formatINR(gstr3b.outwardSupplies.igst),
                  ],
                ]}
              />

              {/* 4 ITC */}
              <GSTRSection
                title="4 — Eligible ITC (Input Tax Credit)"
                rows={[
                  [
                    "(A) ITC Available — Inputs",
                    formatINR(gstr3b.inputTaxCredit.taxable),
                    formatINR(gstr3b.inputTaxCredit.cgst),
                    formatINR(gstr3b.inputTaxCredit.sgst),
                    formatINR(gstr3b.inputTaxCredit.igst),
                  ],
                ]}
              />

              {/* 6 Net Payment */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-zinc-800">
                  <p className="text-white text-sm font-semibold">
                    6 — Payment of Tax
                  </p>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    [
                      "CGST Payable",
                      formatINR(gstr3b.netTaxPayable.cgst),
                      "text-zinc-300",
                    ],
                    [
                      "SGST Payable",
                      formatINR(gstr3b.netTaxPayable.sgst),
                      "text-zinc-300",
                    ],
                    [
                      "IGST Payable",
                      formatINR(gstr3b.netTaxPayable.igst),
                      "text-zinc-300",
                    ],
                  ].map(([label, value, color]) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-zinc-500">{label}</span>
                      <span className={`font-mono ${color}`}>{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-3 border-t border-zinc-800">
                    <span className="text-white font-semibold">
                      Total Net Tax Payable
                    </span>
                    <span
                      className={`font-mono text-lg font-bold ${
                        gstr3b.netTaxPayable.total > 0
                          ? "text-red-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {formatINR(gstr3b.netTaxPayable.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: GSTR-1 ─────────────────────────────────────── */}
          {activeTab === "gstr1" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-zinc-500 text-sm">
                  Outward supplies for{" "}
                  <span className="text-white">{periodLabel}</span>
                </p>
                <button
                  onClick={() => handleDownload("gstr1")}
                  disabled={!!downloading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {downloading === "gstr1"
                    ? "Generating..."
                    : "⬇ Download Excel"}
                </button>
              </div>

              {!gstr1 ? (
                <button
                  onClick={fetchGSTR1}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm"
                >
                  Load GSTR-1 Data
                </button>
              ) : (
                <div className="space-y-4">
                  {/* B2B table */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
                      <p className="text-zinc-300 text-sm font-medium">
                        B2B Supplies ({gstr1.b2b.length})
                      </p>
                      <p className="text-zinc-500 text-xs">
                        Registered buyers with GSTIN
                      </p>
                    </div>
                    <div className="overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-zinc-800/50">
                          <tr>
                            {[
                              "Invoice No.",
                              "Date",
                              "Party",
                              "GSTIN",
                              "Taxable",
                              "CGST",
                              "SGST",
                              "IGST",
                              "Total",
                            ].map((h) => (
                              <th
                                key={h}
                                className="px-4 py-2.5 text-left text-zinc-400 text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {gstr1.b2b.length === 0 ? (
                            <tr>
                              <td
                                colSpan={9}
                                className="text-center py-8 text-zinc-500"
                              >
                                No B2B supplies in this period
                              </td>
                            </tr>
                          ) : (
                            gstr1.b2b.map((row, idx) => (
                              <tr
                                key={idx}
                                className={`border-b border-zinc-800/50 ${idx % 2 === 1 ? "bg-zinc-800/20" : ""}`}
                              >
                                <td className="px-4 py-2.5 text-indigo-400 font-mono text-xs">
                                  {row.invoice_number}
                                </td>
                                <td className="px-4 py-2.5 text-zinc-400 text-xs whitespace-nowrap">
                                  {new Date(
                                    row.invoice_date,
                                  ).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                  })}
                                </td>
                                <td className="px-4 py-2.5 text-zinc-300 text-sm">
                                  {row.party_name || "—"}
                                </td>
                                <td className="px-4 py-2.5 text-zinc-400 font-mono text-xs">
                                  {row.party_gstin || "—"}
                                </td>
                                <td className="px-4 py-2.5 text-white font-mono text-sm">
                                  {formatINR(row.taxable_value)}
                                </td>
                                <td className="px-4 py-2.5 text-indigo-400 font-mono text-sm">
                                  {formatINR(row.cgst)}
                                </td>
                                <td className="px-4 py-2.5 text-indigo-400 font-mono text-sm">
                                  {formatINR(row.sgst)}
                                </td>
                                <td className="px-4 py-2.5 text-indigo-400 font-mono text-sm">
                                  {formatINR(row.igst)}
                                </td>
                                <td className="px-4 py-2.5 text-emerald-400 font-mono text-sm font-medium">
                                  {formatINR(row.invoice_value)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* HSN Summary */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-zinc-800">
                      <p className="text-zinc-300 text-sm font-medium">
                        HSN-wise Summary
                      </p>
                    </div>
                    <div className="overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-zinc-800/50">
                          <tr>
                            {[
                              "HSN Code",
                              "GST Rate",
                              "Qty",
                              "Taxable Value",
                              "CGST",
                              "SGST",
                              "IGST",
                            ].map((h) => (
                              <th
                                key={h}
                                className="px-4 py-2.5 text-left text-zinc-400 text-xs font-medium uppercase tracking-wider"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {gstr1.hsn.length === 0 ? (
                            <tr>
                              <td
                                colSpan={7}
                                className="text-center py-8 text-zinc-500"
                              >
                                No HSN data — add HSN codes to stock items
                              </td>
                            </tr>
                          ) : (
                            gstr1.hsn.map((row, idx) => (
                              <tr
                                key={idx}
                                className={`border-b border-zinc-800/50 ${idx % 2 === 1 ? "bg-zinc-800/20" : ""}`}
                              >
                                <td className="px-4 py-2.5 text-indigo-400 font-mono text-sm">
                                  {row.hsn_code}
                                </td>
                                <td className="px-4 py-2.5 text-zinc-400 text-sm">
                                  {row.gst_rate}%
                                </td>
                                <td className="px-4 py-2.5 text-zinc-300 font-mono text-sm">
                                  {parseFloat(row.total_qty || 0).toFixed(2)}
                                </td>
                                <td className="px-4 py-2.5 text-white font-mono text-sm">
                                  {formatINR(row.total_value)}
                                </td>
                                <td className="px-4 py-2.5 text-indigo-400 font-mono text-sm">
                                  {formatINR(row.cgst_amount)}
                                </td>
                                <td className="px-4 py-2.5 text-indigo-400 font-mono text-sm">
                                  {formatINR(row.sgst_amount)}
                                </td>
                                <td className="px-4 py-2.5 text-indigo-400 font-mono text-sm">
                                  {formatINR(row.igst_amount)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Rate-wise */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-zinc-800">
                      <p className="text-zinc-300 text-sm font-medium">
                        Rate-wise Summary
                      </p>
                    </div>
                    <div className="overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-zinc-800/50">
                          <tr>
                            {[
                              "GST Rate",
                              "Invoices",
                              "Taxable Value",
                              "CGST",
                              "SGST",
                              "IGST",
                              "Total Tax",
                            ].map((h) => (
                              <th
                                key={h}
                                className="px-4 py-2.5 text-left text-zinc-400 text-xs font-medium uppercase tracking-wider"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {gstr1.rateWise.map((row, idx) => (
                            <tr
                              key={idx}
                              className={`border-b border-zinc-800/50 ${idx % 2 === 1 ? "bg-zinc-800/20" : ""}`}
                            >
                              <td className="px-4 py-2.5">
                                <span className="bg-indigo-950/50 border border-indigo-900/50 text-indigo-300 rounded px-2 py-0.5 text-xs font-mono">
                                  {row.gst_rate}%
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-zinc-400">
                                {row.invoice_count}
                              </td>
                              <td className="px-4 py-2.5 text-white font-mono">
                                {formatINR(row.taxable_value)}
                              </td>
                              <td className="px-4 py-2.5 text-indigo-400 font-mono">
                                {formatINR(row.cgst)}
                              </td>
                              <td className="px-4 py-2.5 text-indigo-400 font-mono">
                                {formatINR(row.sgst)}
                              </td>
                              <td className="px-4 py-2.5 text-indigo-400 font-mono">
                                {formatINR(row.igst)}
                              </td>
                              <td className="px-4 py-2.5 text-emerald-400 font-mono font-semibold">
                                {formatINR(
                                  parseFloat(row.cgst || 0) +
                                    parseFloat(row.sgst || 0) +
                                    parseFloat(row.igst || 0),
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: GST Register ────────────────────────────────── */}
          {activeTab === "register" && (
            <div className="flex-1 flex flex-col space-y-3 min-h-0">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  {[
                    { value: "all", label: "All" },
                    { value: "sales", label: "Sales" },
                    { value: "purchase", label: "Purchase" },
                  ].map((t) => (
                    <button
                      key={t.value}
                      onClick={() => {
                        setTypeFilter(t.value);
                        setTimeout(fetchRegister, 50);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        typeFilter === t.value
                          ? "bg-indigo-600 text-white"
                          : "bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handleDownload("register")}
                  disabled={!!downloading}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {downloading === "register" ? "..." : "⬇ Excel"}
                </button>
              </div>

              <div className="flex-1 overflow-auto rounded-xl border border-zinc-800 bg-zinc-900">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-zinc-900 border-b border-zinc-800">
                    <tr>
                      {[
                        "Type",
                        "Invoice No.",
                        "Date",
                        "Party",
                        "GSTIN",
                        "Taxable",
                        "CGST",
                        "SGST",
                        "IGST",
                        "Total Tax",
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
                    {register.length === 0 ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="text-center py-12 text-zinc-500"
                        >
                          No records found
                        </td>
                      </tr>
                    ) : (
                      register.map((row, idx) => (
                        <tr
                          key={row.id}
                          className={`border-b border-zinc-800/50 ${idx % 2 === 1 ? "bg-zinc-800/20" : ""}`}
                        >
                          <td className="px-4 py-2.5">
                            <span
                              className={`capitalize px-2 py-0.5 rounded-full text-xs font-medium border ${
                                row.record_type === "sales"
                                  ? "bg-indigo-950/40 text-indigo-400 border-indigo-900/50"
                                  : "bg-amber-950/40 text-amber-400 border-amber-900/50"
                              }`}
                            >
                              {row.record_type}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-indigo-400 text-xs">
                            {row.invoice_number}
                          </td>
                          <td className="px-4 py-2.5 text-zinc-400 text-xs whitespace-nowrap">
                            {new Date(row.invoice_date).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-zinc-300 text-sm">
                            {row.party_name || "—"}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-zinc-400 text-xs">
                            {row.party_gstin || "—"}
                          </td>
                          <td className="px-4 py-2.5 text-white font-mono text-sm">
                            {formatINR(row.taxable_value)}
                          </td>
                          <td className="px-4 py-2.5 text-indigo-400 font-mono text-sm">
                            {formatINR(row.cgst)}
                          </td>
                          <td className="px-4 py-2.5 text-indigo-400 font-mono text-sm">
                            {formatINR(row.sgst)}
                          </td>
                          <td className="px-4 py-2.5 text-indigo-400 font-mono text-sm">
                            {formatINR(row.igst)}
                          </td>
                          <td className="px-4 py-2.5 text-emerald-400 font-mono text-sm font-medium">
                            {formatINR(row.total_tax)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {register.length > 0 && (
                    <tfoot className="border-t border-zinc-700 bg-zinc-800/30">
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-3 text-zinc-500 text-xs font-medium"
                        >
                          {register.length} records
                        </td>
                        <td className="px-4 py-3 text-white font-mono text-sm font-semibold">
                          {formatINR(
                            register.reduce(
                              (s, r) => s + parseFloat(r.taxable_value || 0),
                              0,
                            ),
                          )}
                        </td>
                        <td className="px-4 py-3 text-indigo-400 font-mono text-sm font-semibold">
                          {formatINR(
                            register.reduce(
                              (s, r) => s + parseFloat(r.cgst || 0),
                              0,
                            ),
                          )}
                        </td>
                        <td className="px-4 py-3 text-indigo-400 font-mono text-sm font-semibold">
                          {formatINR(
                            register.reduce(
                              (s, r) => s + parseFloat(r.sgst || 0),
                              0,
                            ),
                          )}
                        </td>
                        <td className="px-4 py-3 text-indigo-400 font-mono text-sm font-semibold">
                          {formatINR(
                            register.reduce(
                              (s, r) => s + parseFloat(r.igst || 0),
                              0,
                            ),
                          )}
                        </td>
                        <td className="px-4 py-3 text-emerald-400 font-mono text-sm font-semibold">
                          {formatINR(
                            register.reduce(
                              (s, r) => s + parseFloat(r.total_tax || 0),
                              0,
                            ),
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* ── Tab: Monthly Trend ──────────────────────────────── */}
          {activeTab === "trend" && (
            <div className="space-y-4">
              <p className="text-zinc-500 text-sm">
                12-month GST trend for current financial year
              </p>
              <div className="grid grid-cols-1 gap-3">
                {/* Group by month */}
                {Array.from(new Set(trend.map((r) => r.month))).map((month) => {
                  const sales = trend.find(
                    (r) => r.month === month && r.record_type === "sales",
                  );
                  const purchase = trend.find(
                    (r) => r.month === month && r.record_type === "purchase",
                  );
                  const netTax =
                    parseFloat(sales?.tax || 0) -
                    parseFloat(purchase?.tax || 0);
                  return (
                    <div
                      key={month}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-white font-medium">
                          {new Date(month + "-01").toLocaleDateString("en-IN", {
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        <span
                          className={`font-mono text-sm font-semibold ${netTax > 0 ? "text-red-400" : "text-emerald-400"}`}
                        >
                          Net: {formatINR(Math.abs(netTax))}{" "}
                          {netTax > 0 ? "payable" : "refund"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-zinc-500 text-xs">Sales</p>
                          <p className="text-white font-mono">
                            {formatINR(sales?.taxable || 0)}
                          </p>
                          <p className="text-indigo-400 font-mono text-xs">
                            Tax: {formatINR(sales?.tax || 0)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-zinc-500 text-xs">Purchases</p>
                          <p className="text-white font-mono">
                            {formatINR(purchase?.taxable || 0)}
                          </p>
                          <p className="text-amber-400 font-mono text-xs">
                            ITC: {formatINR(purchase?.tax || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {trend.length === 0 && (
                  <div className="text-center py-12 text-zinc-500">
                    No GST records found for this year. Post some sales or
                    purchase vouchers first.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Helper component for GSTR-3B section ─────────────────────────────────────
function GSTRSection({ title, rows }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-800">
        <p className="text-white text-sm font-semibold">{title}</p>
      </div>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-800/50">
            <tr>
              <th className="px-5 py-2.5 text-left text-zinc-400 text-xs font-medium uppercase tracking-wider w-64">
                Description
              </th>
              {["Taxable Value", "CGST", "SGST", "IGST"].map((h) => (
                <th
                  key={h}
                  className="px-5 py-2.5 text-right text-zinc-400 text-xs font-medium uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-b border-zinc-800/50">
                <td className="px-5 py-3 text-zinc-400 text-sm">{row[0]}</td>
                {row.slice(1).map((val, vi) => (
                  <td
                    key={vi}
                    className="px-5 py-3 text-right font-mono text-white text-sm"
                  >
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
