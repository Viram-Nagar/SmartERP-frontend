"use client";

import { useEffect } from "react";

export default function DeleteConfirm({
  open,
  onClose,
  onConfirm,
  name,
  loading,
}) {
  useEffect(() => {
    const handler = (e) => {
      if (!open) return;
      if (e.key === "Enter") onConfirm();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onConfirm, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-sm shadow-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-red-950/50 border border-red-900/50 flex items-center justify-center shrink-0 text-red-400">
            ⚠
          </div>
          <div>
            <h3 className="text-white font-semibold">Delete record?</h3>
            <p className="text-zinc-400 text-sm mt-1">
              <span className="text-white font-medium">"{name}"</span> will be
              permanently removed. This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Cancel{" "}
            <kbd className="ml-1 bg-zinc-800 border border-zinc-700 rounded px-1 text-[10px]">
              Esc
            </kbd>
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm bg-red-700 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Delete"}{" "}
            <kbd className="ml-1 bg-red-600 border border-red-500 rounded px-1 text-[10px]">
              Enter
            </kbd>
          </button>
        </div>
      </div>
    </div>
  );
}
