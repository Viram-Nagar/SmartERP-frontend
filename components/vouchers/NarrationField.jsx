"use client";

export default function NarrationField({ value, onChange }) {
  return (
    <div className="space-y-1.5 mt-4">
      <label className="text-zinc-400 text-xs uppercase tracking-wider">
        Narration
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Brief description of this transaction..."
        rows={2}
        className="w-full rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 px-3 py-2 text-sm resize-none"
      />
    </div>
  );
}
