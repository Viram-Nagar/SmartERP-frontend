"use client";

import { useState, useEffect, useRef } from "react";

export default function MasterTable({
  columns, // [{ key, label, width?, render? }]
  data, // array of row objects
  onEdit, // (row) => void
  onDelete, // (row) => void
  onNew, // () => void
  loading,
  emptyMessage = "No records found",
  searchPlaceholder = "Search...",
  onSearch, // (query) => void
  searchValue,
  actions, // extra header buttons: [{ label, onClick, shortcut }]
}) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const tableRef = useRef(null);
  const searchRef = useRef(null);

  // Reset selection when data changes
  useEffect(() => {
    setSelectedIdx(0);
  }, [data]);

  useEffect(() => {
    const handler = (e) => {
      // Ctrl+F focuses search
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }

      const tag = e.target.tagName.toLowerCase();
      const inInput = tag === "input" || tag === "textarea";

      if (inInput) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, data.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && data[selectedIdx]) {
        onEdit?.(data[selectedIdx]);
      }
      if (e.key === "Delete" && data[selectedIdx]) {
        onDelete?.(data[selectedIdx]);
      }
      if (e.key === "Insert" || (e.altKey && e.key === "n")) {
        e.preventDefault();
        onNew?.();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [data, selectedIdx, onEdit, onDelete, onNew]);

  // Scroll selected row into view
  useEffect(() => {
    const row = tableRef.current?.querySelector(`[data-idx="${selectedIdx}"]`);
    row?.scrollIntoView({ block: "nearest" });
  }, [selectedIdx]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
            ⌕
          </span>
          <input
            ref={searchRef}
            value={searchValue}
            onChange={(e) => onSearch?.(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 bg-zinc-800 border border-zinc-700 rounded px-1 text-zinc-500 text-[10px]">
            Ctrl+F
          </kbd>
        </div>

        {/* Extra actions */}
        {actions?.map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-sm transition-colors"
          >
            {a.label}
            {a.shortcut && (
              <kbd className="bg-zinc-700 border border-zinc-600 rounded px-1 text-zinc-400 text-[10px]">
                {a.shortcut}
              </kbd>
            )}
          </button>
        ))}

        {/* New button */}
        {onNew && (
          <button
            onClick={onNew}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            New
            <kbd className="bg-indigo-500 border border-indigo-400 rounded px-1 text-indigo-100 text-[10px]">
              Ins
            </kbd>
          </button>
        )}
      </div>

      {/* Table */}
      <div
        ref={tableRef}
        className="flex-1 overflow-auto rounded-xl border border-zinc-800 bg-zinc-900"
      >
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-zinc-900 border-b border-zinc-800 z-10">
            <tr>
              <th className="w-8 px-3 py-3 text-left text-zinc-600 text-xs font-medium">
                #
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-zinc-400 text-xs font-medium uppercase tracking-wider ${col.width || ""}`}
                >
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-zinc-400 text-xs font-medium uppercase tracking-wider w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  className="text-center py-12 text-zinc-500 text-sm"
                >
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="text-center py-12">
                  <p className="text-zinc-500 text-sm">{emptyMessage}</p>
                  {onNew && (
                    <button
                      onClick={onNew}
                      className="mt-2 text-indigo-400 hover:text-indigo-300 text-sm"
                    >
                      Create first record →
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={row.id}
                  data-idx={idx}
                  onClick={() => setSelectedIdx(idx)}
                  onDoubleClick={() => onEdit?.(row)}
                  className={`
                    border-b border-zinc-800/50 transition-colors cursor-pointer group
                    ${
                      selectedIdx === idx
                        ? "bg-indigo-600/10 border-indigo-500/20"
                        : "hover:bg-zinc-800/40"
                    }
                  `}
                >
                  <td className="px-3 py-3 text-zinc-600 text-xs">{idx + 1}</td>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-zinc-300">
                      {col.render
                        ? col.render(row[col.key], row)
                        : (row[col.key] ?? "—")}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <div
                      className={`
                      flex items-center justify-end gap-1
                      transition-opacity
                      ${selectedIdx === idx ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
                    `}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit?.(row);
                        }}
                        className="px-2 py-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-700 text-xs transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete?.(row);
                        }}
                        className="px-2 py-1 rounded text-zinc-400 hover:text-red-400 hover:bg-red-950/30 text-xs transition-colors"
                      >
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 text-zinc-600 text-xs">
        <span>
          {data.length} record{data.length !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-3">
          <span>
            <kbd className="bg-zinc-800 border border-zinc-700 rounded px-1">
              ↑↓
            </kbd>{" "}
            Navigate
          </span>
          <span>
            <kbd className="bg-zinc-800 border border-zinc-700 rounded px-1">
              Enter
            </kbd>{" "}
            Edit
          </span>
          <span>
            <kbd className="bg-zinc-800 border border-zinc-700 rounded px-1">
              Del
            </kbd>{" "}
            Delete
          </span>
          <span>
            <kbd className="bg-zinc-800 border border-zinc-700 rounded px-1">
              Ins
            </kbd>{" "}
            New
          </span>
        </div>
      </div>
    </div>
  );
}
