"use client";

import { SHORTCUTS, SHORTCUT_GROUPS } from "@/lib/shortcuts";

export default function ShortcutHelp({ open, onClose }) {
  if (!open) return null;

  const grouped = Object.entries(SHORTCUT_GROUPS)
    .map(([key, label]) => ({
      key,
      label,
      shortcuts: SHORTCUTS.filter((s) => s.group === key),
    }))
    .filter((g) => g.shortcuts.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-white font-semibold text-lg">
              Keyboard Shortcuts
            </h2>
            <p className="text-zinc-500 text-xs mt-0.5">
              SmartERP is fully keyboard-driven
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        {/* Shortcut grid */}
        <div className="overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {grouped.map((group) => (
            <div key={group.key}>
              <p className="text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-3">
                {group.label}
              </p>
              <div className="space-y-1.5">
                {group.shortcuts.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-zinc-400 text-sm">
                      {s.description}
                    </span>
                    <kbd className="shrink-0 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-zinc-300 text-xs font-mono whitespace-nowrap">
                      {s.label}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-zinc-800 px-6 py-3 text-center">
          <p className="text-zinc-600 text-xs">
            Press{" "}
            <kbd className="bg-zinc-800 border border-zinc-700 rounded px-1 text-zinc-400">
              Esc
            </kbd>{" "}
            or{" "}
            <kbd className="bg-zinc-800 border border-zinc-700 rounded px-1 text-zinc-400">
              ?
            </kbd>{" "}
            to close
          </p>
        </div>
      </div>
    </div>
  );
}
