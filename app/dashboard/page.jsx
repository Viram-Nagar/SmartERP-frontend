"use client";

import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCompany } from "@/context/CompanyContext";
import { useAuth } from "@/context/AuthContext";

const MENU_GROUPS = [
  {
    title: "Masters",
    color: "indigo",
    items: [
      {
        label: "Ledgers",
        path: "/dashboard/ledgers",
        shortcut: "Alt+L",
        desc: "Create & manage ledger accounts",
      },
      {
        label: "Groups",
        path: "/dashboard/groups",
        shortcut: "Alt+G",
        desc: "Chart of accounts groups",
      },
      {
        label: "Stock Items",
        path: "/dashboard/stock",
        shortcut: "Alt+S",
        desc: "Products & inventory items",
      },
      {
        label: "Units",
        path: "/dashboard/units",
        shortcut: "Alt+U",
        desc: "Units of measure",
      },
    ],
  },
  {
    title: "Vouchers",
    color: "violet",
    items: [
      {
        label: "Sales",
        path: "/dashboard/vouchers/sales",
        shortcut: "F8",
        desc: "Record sales, generate invoice",
      },
      {
        label: "Purchase",
        path: "/dashboard/vouchers/purchase",
        shortcut: "F9",
        desc: "Record supplier purchases",
      },
      {
        label: "Receipt",
        path: "/dashboard/vouchers/receipt",
        shortcut: "F6",
        desc: "Money received from customers",
      },
      {
        label: "Payment",
        path: "/dashboard/vouchers/payment",
        shortcut: "Alt+F5",
        desc: "Payments made to suppliers",
      },
      {
        label: "Journal",
        path: "/dashboard/vouchers/journal",
        shortcut: "F7",
        desc: "Accounting adjustments",
      },
      {
        label: "Credit Note",
        path: "/dashboard/vouchers/credit-note",
        shortcut: "Alt+F8",
        desc: "Sales returns",
      },
      {
        label: "Debit Note",
        path: "/dashboard/vouchers/debit-note",
        shortcut: "Alt+F9",
        desc: "Purchase returns",
      },
    ],
  },
  {
    title: "Parties",
    color: "cyan",
    items: [
      {
        label: "Customers",
        path: "/dashboard/customers",
        shortcut: "Ctrl+C",
        desc: "Customer accounts & ledgers",
      },
      {
        label: "Suppliers",
        path: "/dashboard/suppliers",
        shortcut: "Ctrl+S",
        desc: "Supplier accounts & history",
      },
    ],
  },
  {
    title: "Inventory",
    color: "amber",
    items: [
      {
        label: "Inventory",
        path: "/dashboard/inventory",
        shortcut: "Ctrl+I",
        desc: "Stock in, out, transfer, adjust",
      },
      {
        label: "Billing",
        path: "/dashboard/billing",
        shortcut: "Ctrl+B",
        desc: "GST invoices & proforma",
      },
      {
        label: "Banking",
        path: "/dashboard/banking",
        shortcut: "",
        desc: "Bank transactions & reconcile",
      },
      {
        label: "GST",
        path: "/dashboard/gst",
        shortcut: "Alt+X",
        desc: "GSTR summary & tax reports",
      },
    ],
  },
  {
    title: "Reports",
    color: "emerald",
    items: [
      {
        label: "Balance Sheet",
        path: "/dashboard/reports/balance-sheet",
        shortcut: "Alt+B",
        desc: "Assets & liabilities",
      },
      {
        label: "Profit & Loss",
        path: "/dashboard/reports/profit-loss",
        shortcut: "Alt+P",
        desc: "Income & expenses",
      },
      {
        label: "Trial Balance",
        path: "/dashboard/reports/trial-balance",
        shortcut: "Alt+T",
        desc: "All ledger balances",
      },
      {
        label: "Cash Flow",
        path: "/dashboard/reports/cash-flow",
        shortcut: "Alt+C",
        desc: "Cash movement summary",
      },
      {
        label: "Stock Summary",
        path: "/dashboard/reports/stock-summary",
        shortcut: "Alt+R",
        desc: "Inventory valuation",
      },
    ],
  },
];

const COLOR_MAP = {
  indigo: {
    card: "hover:border-indigo-500/40 hover:bg-indigo-600/5",
    badge: "text-indigo-400",
    heading: "text-indigo-400",
  },
  violet: {
    card: "hover:border-violet-500/40 hover:bg-violet-600/5",
    badge: "text-violet-400",
    heading: "text-violet-400",
  },
  cyan: {
    card: "hover:border-cyan-500/40 hover:bg-cyan-600/5",
    badge: "text-cyan-400",
    heading: "text-cyan-400",
  },
  amber: {
    card: "hover:border-amber-500/40 hover:bg-amber-600/5",
    badge: "text-amber-400",
    heading: "text-amber-400",
  },
  emerald: {
    card: "hover:border-emerald-500/40 hover:bg-emerald-600/5",
    badge: "text-emerald-400",
    heading: "text-emerald-400",
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const { activeCompany } = useCompany();
  const { user } = useAuth();

  useEffect(() => {
    if (!activeCompany) router.replace("/companies");
  }, [activeCompany]);

  if (!activeCompany) return null;

  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? "Good morning"
      : now.getHours() < 17
        ? "Good afternoon"
        : "Good evening";

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Welcome bar */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-zinc-500 text-sm">
            {greeting}, {user?.name?.split(" ")[0]}
          </p>
          <h1 className="text-white text-xl font-semibold mt-0.5">
            Gateway of SmartERP
          </h1>
          <p className="text-zinc-600 text-xs mt-1">
            {activeCompany.name}
            {activeCompany.gst_number && ` · GSTIN ${activeCompany.gst_number}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-zinc-600 text-xs">
            {now.toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className="text-zinc-500 text-xs mt-0.5">
            {formatFY(
              activeCompany.financial_year_start,
              activeCompany.financial_year_end,
            )}
          </p>
        </div>
      </div>

      {/* Quick tip */}
      <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5">
        <span className="text-zinc-600 text-xs">⌨️</span>
        <p className="text-zinc-500 text-xs">
          Keyboard-first navigation active ·{" "}
          <span className="text-zinc-400">
            Press{" "}
            <kbd className="bg-zinc-800 border border-zinc-700 rounded px-1">
              ?
            </kbd>{" "}
            to see all shortcuts
          </span>{" "}
          or{" "}
          <span className="text-zinc-400">
            <kbd className="bg-zinc-800 border border-zinc-700 rounded px-1">
              Ctrl+K
            </kbd>{" "}
            to search any screen
          </span>
        </p>
      </div>

      {/* Menu groups */}
      {MENU_GROUPS.map((group) => {
        const colors = COLOR_MAP[group.color];
        return (
          <div key={group.title}>
            <h2
              className={`text-xs font-semibold uppercase tracking-widest mb-3 ${colors.heading}`}
            >
              {group.title}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {group.items.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`
                    block p-4 bg-zinc-900 border border-zinc-800 rounded-xl
                    transition-all duration-100 group
                    ${colors.card}
                  `}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-white text-sm font-medium group-hover:text-white transition-colors">
                      {item.label}
                    </p>
                    {item.shortcut && (
                      <span
                        className={`text-[10px] font-mono shrink-0 ${colors.badge}`}
                      >
                        {item.shortcut}
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-600 text-xs leading-relaxed">
                    {item.desc}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        );
      })}

      {/* Bottom padding */}
      <div className="h-4" />
    </div>
  );
}

function formatFY(start, end) {
  if (!start || !end) return "";
  return `FY ${new Date(start).getFullYear()}-${String(new Date(end).getFullYear()).slice(-2)}`;
}
