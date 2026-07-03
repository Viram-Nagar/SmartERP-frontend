"use client";

import { useState } from "react";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function PeriodSelector({ value, onChange, showCustom = true }) {
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;
  const [mode, setMode] = useState("month"); // month | quarter | year | custom

  // Financial year quarters
  const quarters = [
    {
      label: "Q1 (Apr–Jun)",
      months: [`${curYear}-04`, `${curYear}-05`, `${curYear}-06`],
    },
    {
      label: "Q2 (Jul–Sep)",
      months: [`${curYear}-07`, `${curYear}-08`, `${curYear}-09`],
    },
    {
      label: "Q3 (Oct–Dec)",
      months: [`${curYear}-10`, `${curYear}-11`, `${curYear}-12`],
    },
    {
      label: "Q4 (Jan–Mar)",
      months: [`${curYear + 1}-01`, `${curYear + 1}-02`, `${curYear + 1}-03`],
    },
  ];

  const handleMonth = (month) => {
    onChange({ period: month, from: null, to: null });
  };

  const handleQuarter = (q) => {
    const first = q.months[0];
    const last = q.months[2];
    const [y, m] = last.split("-");
    const end = new Date(parseInt(y), parseInt(m), 0)
      .toISOString()
      .split("T")[0];
    onChange({ period: null, from: `${first}-01`, to: end });
  };

  const handleYear = (year) => {
    onChange({ period: null, from: `${year}-04-01`, to: `${year + 1}-03-31` });
  };

  // Generate last 12 months
  const months = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(curYear, curMonth - 1 - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({ key, label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` });
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
      {/* Mode tabs */}
      <div className="flex items-center gap-1">
        {["month", "quarter", "year", ...(showCustom ? ["custom"] : [])].map(
          (m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                mode === m
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700"
              }`}
            >
              {m}
            </button>
          ),
        )}
      </div>

      {/* Month picker */}
      {mode === "month" && (
        <div className="flex flex-wrap gap-1.5">
          {months.map((m) => (
            <button
              key={m.key}
              onClick={() => handleMonth(m.key)}
              className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                value?.period === m.key
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {/* Quarter picker */}
      {mode === "quarter" && (
        <div className="grid grid-cols-2 gap-2">
          {quarters.map((q) => (
            <button
              key={q.label}
              onClick={() => handleQuarter(q)}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-sm transition-colors"
            >
              {q.label}
            </button>
          ))}
        </div>
      )}

      {/* Year picker */}
      {mode === "year" && (
        <div className="flex flex-wrap gap-1.5">
          {[curYear - 2, curYear - 1, curYear].map((y) => (
            <button
              key={y}
              onClick={() => handleYear(y)}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-sm transition-colors"
            >
              FY {y}–{String(y + 1).slice(-2)}
            </button>
          ))}
        </div>
      )}

      {/* Custom date range */}
      {mode === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            onChange={(e) =>
              onChange((prev) => ({ ...prev, from: e.target.value }))
            }
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
          />
          <span className="text-zinc-600 text-sm">to</span>
          <input
            type="date"
            onChange={(e) =>
              onChange((prev) => ({ ...prev, to: e.target.value }))
            }
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
      )}
    </div>
  );
}
