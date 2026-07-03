"use client";

import { useState } from "react";
import api from "@/lib/api";
import { useCompany } from "@/context/CompanyContext";

export default function ReportShell({
  title,
  subtitle,
  exportUrl,
  exportFileName,
  dateType = "range", // 'range' | 'asof'
  children,
  onLoad,
}) {
  const { activeCompany } = useCompany();
  const now = new Date();
  const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;

  const [from, setFrom] = useState(`${fy}-04-01`);
  const [to, setTo] = useState(`${fy + 1}-03-31`);
  const [asOf, setAsOf] = useState(now.toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const buildParams = () => {
    const p = new URLSearchParams({ company_id: activeCompany.id });
    if (dateType === "range") {
      p.set("from", from);
      p.set("to", to);
    } else p.set("as_of", asOf);
    return p;
  };

  const handleLoad = async () => {
    setLoading(true);
    try {
      await onLoad(buildParams().toString());
      setLoaded(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!exportUrl) return;
    setDownloading(true);
    try {
      const res = await api.get(`${exportUrl}?${buildParams()}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = exportFileName || "report.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Export failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-white text-xl font-semibold">{title}</h1>
          {subtitle && (
            <p className="text-zinc-500 text-sm mt-0.5">{subtitle}</p>
          )}
        </div>
        {exportUrl && loaded && (
          <button
            onClick={handleExport}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {downloading ? "Generating..." : "⬇ Export Excel"}
          </button>
        )}
      </div>

      {/* Date picker */}
      <div className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
        {dateType === "range" ? (
          <>
            <div className="space-y-1">
              <p className="text-zinc-500 text-xs">From</p>
              <input
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setLoaded(false);
                }}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="mt-4 text-zinc-600">to</div>
            <div className="space-y-1">
              <p className="text-zinc-500 text-xs">To</p>
              <input
                type="date"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setLoaded(false);
                }}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </>
        ) : (
          <div className="space-y-1">
            <p className="text-zinc-500 text-xs">As of Date</p>
            <input
              type="date"
              value={asOf}
              onChange={(e) => {
                setAsOf(e.target.value);
                setLoaded(false);
              }}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {/* Quick presets */}
        <div className="flex gap-1.5 ml-2">
          {[
            { label: "This FY", from: `${fy}-04-01`, to: `${fy + 1}-03-31` },
            {
              label: "This Month",
              from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
              to: new Date(now.getFullYear(), now.getMonth() + 1, 0)
                .toISOString()
                .split("T")[0],
            },
            {
              label: "Last Month",
              from: `${now.getFullYear()}-${String(now.getMonth()).padStart(2, "0")}-01`,
              to: new Date(now.getFullYear(), now.getMonth(), 0)
                .toISOString()
                .split("T")[0],
            },
          ].map((p) => (
            <button
              key={p.label}
              onClick={() => {
                if (dateType === "range") {
                  setFrom(p.from);
                  setTo(p.to);
                }
                setLoaded(false);
              }}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 hover:text-white rounded-lg text-xs transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleLoad}
          disabled={loading}
          className="ml-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "Loading..." : loaded ? "↻ Refresh" : "Generate Report"}
        </button>
      </div>

      {/* Content */}
      {!loaded ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-2xl mx-auto">
              📊
            </div>
            <p className="text-zinc-400 font-medium">{title}</p>
            <p className="text-zinc-600 text-sm">
              Set the date range and click Generate Report
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">{children}</div>
      )}
    </div>
  );
}
