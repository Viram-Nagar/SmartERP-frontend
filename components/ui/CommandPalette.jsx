"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SHORTCUTS } from "@/lib/shortcuts";

const NAV_COMMANDS = [
  {
    id: "nav_users",
    label: "User Management",
    path: "/dashboard/settings/users",
    group: "Settings",
  },
  {
    id: "nav_audit",
    label: "Audit Log",
    path: "/dashboard/settings/audit",
    group: "Settings",
  },
  {
    id: "nav_contra",
    label: "Contra Voucher",
    path: "/dashboard/vouchers/contra",
    group: "Vouchers",
  },
  {
    id: "nav_dashboard",
    label: "Go to Dashboard",
    path: "/dashboard",
    group: "Navigate",
  },
  {
    id: "nav_companies",
    label: "Switch Company",
    path: "/companies",
    group: "Navigate",
  },
  {
    id: "nav_ledgers",
    label: "Ledgers",
    path: "/dashboard/ledgers",
    group: "Masters",
  },
  {
    id: "nav_groups",
    label: "Groups",
    path: "/dashboard/groups",
    group: "Masters",
  },
  {
    id: "nav_stock",
    label: "Stock Items",
    path: "/dashboard/stock",
    group: "Masters",
  },
  {
    id: "nav_customers",
    label: "Customers",
    path: "/dashboard/customers",
    group: "Masters",
  },
  {
    id: "nav_suppliers",
    label: "Suppliers",
    path: "/dashboard/suppliers",
    group: "Masters",
  },
  {
    id: "nav_sales",
    label: "Sales Voucher",
    path: "/dashboard/vouchers/sales",
    group: "Vouchers",
  },
  {
    id: "nav_purchase",
    label: "Purchase Voucher",
    path: "/dashboard/vouchers/purchase",
    group: "Vouchers",
  },
  {
    id: "nav_payment",
    label: "Payment Voucher",
    path: "/dashboard/vouchers/payment",
    group: "Vouchers",
  },
  {
    id: "nav_receipt",
    label: "Receipt Voucher",
    path: "/dashboard/vouchers/receipt",
    group: "Vouchers",
  },
  {
    id: "nav_invoices",
    label: "Billing & Invoices",
    path: "/dashboard/billing",
    group: "Billing",
  },
  {
    id: "nav_inventory",
    label: "Inventory",
    path: "/dashboard/inventory",
    group: "Inventory",
  },
  {
    id: "nav_banking",
    label: "Banking",
    path: "/dashboard/banking",
    group: "Banking",
  },
  {
    id: "nav_gst",
    label: "GST Reports",
    path: "/dashboard/gst",
    group: "Reports",
  },
  {
    id: "nav_bs",
    label: "Balance Sheet",
    path: "/dashboard/reports/balance-sheet",
    group: "Reports",
  },
  {
    id: "nav_pl",
    label: "Profit & Loss",
    path: "/dashboard/reports/profit-loss",
    group: "Reports",
  },
  {
    id: "nav_trial",
    label: "Trial Balance",
    path: "/dashboard/reports/trial-balance",
    group: "Reports",
  },
];

export default function CommandPalette({ open, onClose }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = NAV_COMMANDS.filter(
    (c) =>
      c.label.toLowerCase().includes(query.toLowerCase()) ||
      c.group.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && filtered[selectedIdx]) {
        router.push(filtered[selectedIdx].path);
        onClose();
      }
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, filtered, selectedIdx]);

  if (!open) return null;

  // Group filtered results
  const groups = [...new Set(filtered.map((c) => c.group))];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
          <span className="text-zinc-500 text-lg">⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search screens, vouchers, reports..."
            className="flex-1 bg-transparent text-white placeholder:text-zinc-500 outline-none text-sm"
          />
          <kbd className="bg-zinc-800 border border-zinc-700 rounded px-1.5 text-zinc-500 text-xs">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-8">
              No results for "{query}"
            </p>
          ) : (
            groups.map((group) => (
              <div key={group}>
                <p className="text-zinc-600 text-xs font-medium px-4 py-1.5 uppercase tracking-wider">
                  {group}
                </p>
                {filtered
                  .filter((c) => c.group === group)
                  .map((cmd) => {
                    const globalIdx = filtered.indexOf(cmd);
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => {
                          router.push(cmd.path);
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIdx(globalIdx)}
                        className={`
                        w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors
                        ${selectedIdx === globalIdx ? "bg-indigo-600/20 text-white" : "text-zinc-300 hover:bg-zinc-800"}
                      `}
                      >
                        <span className="text-sm">{cmd.label}</span>
                        {selectedIdx === globalIdx && (
                          <kbd className="bg-zinc-700 border border-zinc-600 rounded px-1.5 text-zinc-300 text-xs">
                            Enter ↵
                          </kbd>
                        )}
                      </button>
                    );
                  })}
              </div>
            ))
          )}
        </div>

        <div className="border-t border-zinc-800 px-4 py-2 flex items-center gap-4 text-zinc-600 text-xs">
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
            Open
          </span>
          <span>
            <kbd className="bg-zinc-800 border border-zinc-700 rounded px-1">
              Esc
            </kbd>{" "}
            Close
          </span>
        </div>
      </div>
    </div>
  );
}
