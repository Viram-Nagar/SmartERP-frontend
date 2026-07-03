"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { useCompany } from "@/context/CompanyContext";
import { useRole } from "@/context/RoleContext";

const ACTION_COLORS = {
  voucher_created: "bg-indigo-950/40 text-indigo-400  border-indigo-900/50",
  voucher_cancelled: "bg-red-950/40    text-red-400     border-red-900/50",
  user_invited: "bg-cyan-950/40   text-cyan-400    border-cyan-900/50",
  user_role_updated: "bg-amber-950/40  text-amber-400   border-amber-900/50",
  user_removed: "bg-red-950/40    text-red-400     border-red-900/50",
};

const ACTION_ICONS = {
  voucher_created: "🧾",
  voucher_cancelled: "⊘",
  user_invited: "👤",
  user_role_updated: "🔑",
  user_removed: "🗑",
};

export default function AuditLogPage() {
  const { activeCompany } = useCompany();
  const { can } = useRole();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);

  const fetchLogs = useCallback(async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        company_id: activeCompany.id,
        limit: "200",
      });
      if (search) params.set("action", search);
      const res = await api.get(`/users/audit-logs?${params}`);
      setLogs(res.data.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeCompany, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  if (!can("audit:read"))
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <p className="text-red-400 text-lg">⛔ Access Denied</p>
          <p className="text-zinc-500 text-sm">
            Only owners can view audit logs.
          </p>
        </div>
      </div>
    );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-semibold">Audit Log</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Complete record of all actions in this company
          </p>
        </div>
        <div className="text-zinc-500 text-xs">{logs.length} entries</div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
            ⌕
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchLogs()}
            placeholder="Filter by action (e.g. voucher_created)..."
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button
          onClick={fetchLogs}
          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm transition-colors"
        >
          Search
        </button>
      </div>

      {/* Log table */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-12 text-zinc-500">
            Loading audit log...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            No audit entries found
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              onClick={() => setExpanded(expanded === log.id ? null : log.id)}
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm shrink-0">
                  {ACTION_ICONS[log.action] || "📋"}
                </div>

                {/* Action + user */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`capitalize px-2 py-0.5 rounded-full text-xs font-medium border ${ACTION_COLORS[log.action] || "bg-zinc-800 text-zinc-400 border-zinc-700"}`}
                    >
                      {log.action.replace(/_/g, " ")}
                    </span>
                    {log.table_name && (
                      <span className="text-zinc-500 text-xs font-mono">
                        → {log.table_name}
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-500 text-xs mt-0.5">
                    by{" "}
                    <span className="text-zinc-300">
                      {log.user_name || "System"}
                    </span>
                    {log.user_email && (
                      <span className="text-zinc-600"> ({log.user_email})</span>
                    )}
                  </p>
                </div>

                {/* Time */}
                <div className="text-right shrink-0">
                  <p className="text-zinc-400 text-xs">
                    {new Date(log.created_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-zinc-600 text-xs">
                    {new Date(log.created_at).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <span className="text-zinc-600 text-xs">
                  {expanded === log.id ? "▾" : "▸"}
                </span>
              </div>

              {/* Expanded details */}
              {expanded === log.id && (
                <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {log.record_id && (
                      <div>
                        <p className="text-zinc-600 mb-0.5">Record ID</p>
                        <p className="text-zinc-400 font-mono">
                          {log.record_id}
                        </p>
                      </div>
                    )}
                    {log.ip_address && (
                      <div>
                        <p className="text-zinc-600 mb-0.5">IP Address</p>
                        <p className="text-zinc-400 font-mono">
                          {log.ip_address}
                        </p>
                      </div>
                    )}
                  </div>
                  {log.new_data && (
                    <div>
                      <p className="text-zinc-600 text-xs mb-1">Data</p>
                      <pre className="bg-zinc-800 rounded-lg p-2 text-zinc-300 text-xs overflow-auto max-h-32">
                        {JSON.stringify(
                          typeof log.new_data === "string"
                            ? JSON.parse(log.new_data)
                            : log.new_data,
                          null,
                          2,
                        )}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
