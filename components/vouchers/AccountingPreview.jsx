export default function AccountingPreview({ entries }) {
  const total = entries
    .filter((e) => e.type === "Dr")
    .reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

  return (
    <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-3">
      <p className="text-zinc-600 text-xs uppercase tracking-wider font-medium">
        Accounting Entry Preview
      </p>
      <div className="space-y-1.5">
        {entries.map((e, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span
                className={`w-6 text-center text-xs font-bold ${e.type === "Dr" ? "text-emerald-400" : "text-red-400"}`}
              >
                {e.type}
              </span>
              <span
                className={`${e.type === "Cr" ? "pl-4 text-zinc-400" : "text-zinc-300"}`}
              >
                {e.ledger}
              </span>
            </div>
            <span
              className={`font-mono ${e.type === "Dr" ? "text-emerald-400" : "text-red-400"}`}
            >
              ₹
              {parseFloat(e.amount).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-between border-t border-zinc-800 pt-2 text-xs text-zinc-500">
        <span>Total</span>
        <span className="font-mono text-white">
          ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}
