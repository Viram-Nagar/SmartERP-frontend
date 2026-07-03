"use client";

import { useRouter } from "next/navigation";

export default function VoucherLayout({
  title,
  voucherNumber,
  shortcut,
  children,
  onSave,
  onNew,
  submitting,
  success,
  error,
}) {
  const router = useRouter();

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Voucher top bar — Tally style */}
      <div className="flex items-center justify-between px-6 py-3 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-zinc-500 hover:text-white transition-colors text-sm"
            title="Esc — Go back"
          >
            ← Back
          </button>
          <div className="w-px h-5 bg-zinc-700" />
          <div>
            <h1 className="text-white font-semibold">{title}</h1>
            {voucherNumber && (
              <p className="text-indigo-400 text-xs font-mono">
                {voucherNumber}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {shortcut && (
            <kbd className="text-zinc-600 text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1">
              {shortcut}
            </kbd>
          )}
          {onNew && (
            <button
              onClick={onNew}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-sm transition-colors"
            >
              New
            </button>
          )}
          <button
            onClick={onSave}
            disabled={submitting}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {submitting ? "Posting..." : "Post Voucher"}
            <kbd className="ml-2 bg-indigo-500 border border-indigo-400 rounded px-1 text-[10px]">
              Ctrl+S
            </kbd>
          </button>
        </div>
      </div>

      {/* Status messages */}
      {success && (
        <div className="mx-6 mt-3 bg-emerald-950/50 border border-emerald-800 rounded-lg px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">✓</span>
            <p className="text-emerald-400 text-sm font-medium">{success}</p>
          </div>
          <span className="text-emerald-600 text-xs">Posted to ledgers</span>
        </div>
      )}
      {error && (
        <div className="mx-6 mt-3 bg-red-950/50 border border-red-900 rounded-lg px-4 py-2.5">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">{children}</div>

      {/* Bottom shortcut bar */}
      <div className="shrink-0 border-t border-zinc-800 bg-zinc-900 px-6 py-2 flex items-center gap-6 text-zinc-600 text-xs">
        <span>
          <kbd className="bg-zinc-800 border border-zinc-700 rounded px-1">
            Ctrl+S
          </kbd>{" "}
          Post
        </span>
        <span>
          <kbd className="bg-zinc-800 border border-zinc-700 rounded px-1">
            Esc
          </kbd>{" "}
          Back
        </span>
        <span>
          <kbd className="bg-zinc-800 border border-zinc-700 rounded px-1">
            Tab
          </kbd>{" "}
          Next field
        </span>
        <span>
          <kbd className="bg-zinc-800 border border-zinc-700 rounded px-1">
            Alt+N
          </kbd>{" "}
          New row
        </span>
      </div>
    </div>
  );
}
