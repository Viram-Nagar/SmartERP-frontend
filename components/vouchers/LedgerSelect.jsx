"use client";

export default function LedgerSelect({
  value,
  onChange,
  ledgers,
  placeholder = "Select ledger",
  showBalance = true,
}) {
  const selected = ledgers.find((l) => l.id === value);

  return (
    <div className="space-y-1">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 px-3 py-2 text-sm"
      >
        <option value="">{placeholder}</option>
        {ledgers.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name} {l.group_name ? `(${l.group_name})` : ""}
          </option>
        ))}
      </select>
      {showBalance && selected && (
        <p className="text-zinc-500 text-xs px-1">
          Current balance:
          <span
            className={`ml-1 font-mono ${
              selected.balance_type === "Dr"
                ? "text-emerald-400"
                : "text-red-400"
            }`}
          >
            ₹
            {Math.abs(parseFloat(selected.current_balance || 0)).toLocaleString(
              "en-IN",
              { minimumFractionDigits: 2 },
            )}{" "}
            {selected.balance_type}
          </span>
        </p>
      )}
    </div>
  );
}
