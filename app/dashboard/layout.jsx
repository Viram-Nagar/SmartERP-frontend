"use client";

console.log("Dashboard Layout Loaded");

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCompany } from "@/context/CompanyContext";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import Calculator from "@/components/ui/Calculator";
import ShortcutHelp from "@/components/ui/ShortcutHelp";
import CommandPalette from "@/components/ui/CommandPalette";

const NAV_ITEMS = [
  {
    section: "Masters",
    items: [
      {
        label: "Stock Groups",
        path: "/dashboard/stock-groups",
        icon: "🗃️",
        key: "",
      },
      {
        label: "Ledgers",
        path: "/dashboard/ledgers",
        icon: "📒",
        key: "Alt+L",
      },
      { label: "Groups", path: "/dashboard/groups", icon: "🗂️", key: "Alt+G" },
      {
        label: "Stock Items",
        path: "/dashboard/stock",
        icon: "📦",
        key: "Alt+S",
      },
      { label: "Units", path: "/dashboard/units", icon: "📏", key: "Alt+U" },
    ],
  },
  {
    section: "Transactions",
    items: [
      {
        label: "Reversing Jnl",
        path: "/dashboard/vouchers/reversing-journal",
        icon: "⟳",
        key: "F10",
      },
      {
        label: "Contra",
        path: "/dashboard/vouchers/contra",
        icon: "🔄",
        key: "",
      },
      {
        label: "Sales",
        path: "/dashboard/vouchers/sales",
        icon: "🧾",
        key: "F8",
      },
      {
        label: "Purchase",
        path: "/dashboard/vouchers/purchase",
        icon: "🛒",
        key: "F9",
      },
      {
        label: "Payment",
        path: "/dashboard/vouchers/payment",
        icon: "💸",
        key: "Alt+F5",
      },
      {
        label: "Receipt",
        path: "/dashboard/vouchers/receipt",
        icon: "💰",
        key: "F6",
      },
      {
        label: "Journal",
        path: "/dashboard/vouchers/journal",
        icon: "📓",
        key: "F7",
      },
      {
        label: "Credit Note",
        path: "/dashboard/vouchers/credit-note",
        icon: "↩️",
        key: "Alt+F8",
      },
      {
        label: "Debit Note",
        path: "/dashboard/vouchers/debit-note",
        icon: "↪️",
        key: "Alt+F9",
      },
    ],
  },
  {
    section: "Parties",
    items: [
      {
        label: "Customers",
        path: "/dashboard/customers",
        icon: "👥",
        key: "Ctrl+C",
      },
      {
        label: "Suppliers",
        path: "/dashboard/suppliers",
        icon: "🏭",
        key: "Ctrl+S",
      },
    ],
  },
  {
    section: "Operations",
    items: [
      {
        label: "Inventory",
        path: "/dashboard/inventory",
        icon: "🏪",
        key: "Ctrl+I",
      },
      {
        label: "Billing",
        path: "/dashboard/billing",
        icon: "🧾",
        key: "Ctrl+B",
      },
      { label: "Banking", path: "/dashboard/banking", icon: "🏦", key: "" },
      { label: "GST", path: "/dashboard/gst", icon: "📊", key: "Alt+X" },
    ],
  },
  {
    section: "Reports",
    items: [
      {
        label: "Balance Sheet",
        path: "/dashboard/reports/balance-sheet",
        icon: "📈",
        key: "Alt+B",
      },
      {
        label: "Profit & Loss",
        path: "/dashboard/reports/profit-loss",
        icon: "📉",
        key: "Alt+P",
      },
      {
        label: "Trial Balance",
        path: "/dashboard/reports/trial-balance",
        icon: "⚖️",
        key: "Alt+T",
      },
      {
        label: "Cash Flow",
        path: "/dashboard/reports/cash-flow",
        icon: "💹",
        key: "Alt+C",
      },
      {
        label: "Stock Summary",
        path: "/dashboard/reports/stock-summary",
        icon: "📋",
        key: "Alt+R",
      },
    ],
  },
  {
    section: "Settings",
    items: [
      {
        label: "Users",
        path: "/dashboard/settings/users",
        icon: "👥",
        key: "",
      },
      {
        label: "Audit Log",
        path: "/dashboard/settings/audit",
        icon: "📋",
        key: "",
      },
    ],
  },
];

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { activeCompany, clearCompany } = useCompany();

  const [calcOpen, setCalcOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Redirect if no company selected
  useEffect(() => {
    if (typeof window !== "undefined" && !activeCompany) {
      router.replace("/companies");
    }
  }, [activeCompany]);

  const anyOverlayOpen = calcOpen || helpOpen || cmdOpen;

  // Global shortcuts
  useKeyboardShortcuts(
    [
      // Company
      {
        key: "F1",
        action: () => {
          clearCompany();
          router.push("/companies");
        },
      },
      { key: "h", ctrl: true, action: () => router.push("/dashboard") },
      { key: "k", ctrl: true, action: () => setCmdOpen(true) },
      { key: "F4", action: () => setCalcOpen((v) => !v) },
      {
        key: "?",
        shift: true,
        action: () => {
          console.log("? pressed");
          setHelpOpen(true);
        },
      },
      { key: "F5", action: () => window.location.reload() },
      {
        key: "Escape",
        action: () => {
          if (calcOpen) {
            setCalcOpen(false);
            return;
          }
          if (helpOpen) {
            setHelpOpen(false);
            return;
          }
          if (cmdOpen) {
            setCmdOpen(false);
            return;
          }
          if (pathname !== "/dashboard") router.back();
        },
      },
      {
        key: "q",
        ctrl: true,
        action: () => {
          logout();
        },
      },

      // Vouchers
      { key: "F6", action: () => router.push("/dashboard/vouchers/receipt") },
      { key: "F7", action: () => router.push("/dashboard/vouchers/journal") },
      { key: "F8", action: () => router.push("/dashboard/vouchers/sales") },
      { key: "F9", action: () => router.push("/dashboard/vouchers/purchase") },
      {
        key: "F8",
        alt: true,
        action: () => router.push("/dashboard/vouchers/credit-note"),
      },
      {
        key: "F9",
        alt: true,
        action: () => router.push("/dashboard/vouchers/debit-note"),
      },
      {
        key: "F5",
        alt: true,
        action: () => router.push("/dashboard/vouchers/payment"),
      },

      // Masters
      { key: "l", alt: true, action: () => router.push("/dashboard/ledgers") },
      { key: "g", alt: true, action: () => router.push("/dashboard/groups") },
      { key: "s", alt: true, action: () => router.push("/dashboard/stock") },
      { key: "u", alt: true, action: () => router.push("/dashboard/units") },

      // Inventory
      {
        key: "i",
        ctrl: true,
        action: () => router.push("/dashboard/inventory"),
      },
      {
        key: "r",
        ctrl: true,
        action: () => router.push("/dashboard/reports/stock-summary"),
      },

      // Billing
      { key: "b", ctrl: true, action: () => router.push("/dashboard/billing") },

      // Reports
      {
        key: "b",
        alt: true,
        action: () => router.push("/dashboard/reports/balance-sheet"),
      },
      {
        key: "p",
        alt: true,
        action: () => router.push("/dashboard/reports/profit-loss"),
      },
      {
        key: "t",
        alt: true,
        action: () => router.push("/dashboard/reports/trial-balance"),
      },
      {
        key: "c",
        alt: true,
        action: () => router.push("/dashboard/reports/cash-flow"),
      },
      {
        key: "r",
        alt: true,
        action: () => router.push("/dashboard/reports/stock-summary"),
      },
      { key: "x", alt: true, action: () => router.push("/dashboard/gst") },

      // Search
      { key: "f", ctrl: true, action: () => setCmdOpen(true) },
    ],
    !anyOverlayOpen,
  );

  if (!activeCompany) return null;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* ── Top Bar ─────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 shrink-0 z-30">
        <div className="flex items-center gap-3">
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="text-zinc-500 hover:text-white transition-colors p-1 rounded"
          >
            ☰
          </button>

          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-indigo-500 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">S</span>
            </div>
            <span className="text-white text-sm font-semibold">SmartERP</span>
          </div>

          {/* Divider */}
          <span className="text-zinc-700">|</span>

          {/* Active company */}
          <button
            onClick={() => {
              clearCompany();
              router.push("/companies");
            }}
            className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors"
            title="F1 — Switch company"
          >
            <span className="w-5 h-5 rounded bg-indigo-600/30 text-indigo-300 text-[10px] font-bold flex items-center justify-center">
              {activeCompany.name.charAt(0)}
            </span>
            <span className="text-sm">{activeCompany.name}</span>
            <span className="text-zinc-600 text-xs">▾</span>
          </button>

          {/* Financial year badge */}
          {activeCompany.financial_year_start && (
            <span className="hidden sm:inline text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-zinc-400">
              {formatFY(
                activeCompany.financial_year_start,
                activeCompany.financial_year_end,
              )}
            </span>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCmdOpen(true)}
            className="hidden sm:flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-400 hover:text-white text-xs transition-colors"
          >
            <span>Search</span>
            <kbd className="bg-zinc-700 border border-zinc-600 rounded px-1 text-zinc-300">
              Ctrl+K
            </kbd>
          </button>
          <button
            onClick={() => setCalcOpen((v) => !v)}
            className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors text-sm"
            title="F4 — Calculator"
          >
            🧮
          </button>
          <button
            onClick={() => setHelpOpen(true)}
            className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors text-sm"
            title="? — Keyboard shortcuts"
          >
            ⌨️
          </button>
          <div className="w-px h-5 bg-zinc-700 mx-1" />
          <span className="text-zinc-500 text-xs hidden sm:inline">
            {user?.name}
          </span>
          <button
            onClick={logout}
            className="text-zinc-500 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-red-950/20 transition-colors"
            title="Ctrl+Q — Logout"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside
          className={`
          ${sidebarOpen ? "w-52" : "w-0"}
          transition-all duration-200 overflow-hidden
          bg-zinc-900 border-r border-zinc-800 flex-col shrink-0
          overflow-y-auto
        `}
        >
          <nav className="py-3">
            {/* Dashboard home */}
            <Link
              href="/dashboard"
              className={`
                flex items-center gap-2.5 px-4 py-2 text-sm transition-colors
                ${
                  pathname === "/dashboard"
                    ? "text-white bg-indigo-600/20 border-r-2 border-indigo-500"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                }
              `}
            >
              <span>🏠</span>
              <span>Gateway</span>
            </Link>

            {NAV_ITEMS.map(({ section, items }) => (
              <div key={section} className="mt-4">
                <p className="px-4 py-1 text-zinc-600 text-[10px] font-semibold uppercase tracking-widest">
                  {section}
                </p>
                {items.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`
                      flex items-center justify-between px-4 py-2 text-sm transition-colors
                      ${
                        pathname.startsWith(item.path)
                          ? "text-white bg-indigo-600/20 border-r-2 border-indigo-500"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                      }
                    `}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-base leading-none">
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </span>
                    {item.key && (
                      <span className="text-zinc-600 text-[10px] font-mono hidden lg:inline">
                        {item.key}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* ── Main Content ─────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* ── Status Bar (Tally-style bottom bar) ─────────────────── */}
      <footer className="shrink-0 border-t border-zinc-800 bg-zinc-900 px-4 py-1.5 flex items-center justify-between text-xs text-zinc-600">
        <div className="flex items-center gap-4">
          <span className="text-zinc-500">
            {pathname.replace("/dashboard", "").replace(/\//g, " › ").trim() ||
              "Gateway"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>
            <kbd className="bg-zinc-800 border border-zinc-700 rounded px-1 text-zinc-500">
              F1
            </kbd>{" "}
            Companies
          </span>
          <span>
            <kbd className="bg-zinc-800 border border-zinc-700 rounded px-1 text-zinc-500">
              F4
            </kbd>{" "}
            Calc
          </span>
          <span>
            <kbd className="bg-zinc-800 border border-zinc-700 rounded px-1 text-zinc-500">
              ?
            </kbd>{" "}
            Help
          </span>
          <span>
            <kbd className="bg-zinc-800 border border-zinc-700 rounded px-1 text-zinc-500">
              Ctrl+K
            </kbd>{" "}
            Search
          </span>
          <span>
            <kbd className="bg-zinc-800 border border-zinc-700 rounded px-1 text-zinc-500">
              Ctrl+Q
            </kbd>{" "}
            Quit
          </span>
        </div>
      </footer>

      {/* ── Overlays ─────────────────────────────────────────────── */}
      <Calculator open={calcOpen} onClose={() => setCalcOpen(false)} />
      <ShortcutHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}

function formatFY(start, end) {
  if (!start || !end) return "";
  return `FY ${new Date(start).getFullYear()}-${String(new Date(end).getFullYear()).slice(-2)}`;
}
