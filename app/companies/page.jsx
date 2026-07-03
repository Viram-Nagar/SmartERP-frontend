"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useCompany } from "@/context/CompanyContext";
import CompanyFormModal from "@/components/company/CompanyFormModal";

export default function CompaniesPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const { selectCompany } = useCompany();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await api.get("/companies");
      setCompanies(res.data.companies);
    } catch (err) {
      if (err.response?.status === 401) router.replace("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);
  console.log("Companies", { loading, user }); // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (modalOpen || deleteConfirm) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, companies.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && companies[selectedIdx]) {
        handleSelect(companies[selectedIdx]);
      }
      if (e.key === "F1" || (e.altKey && e.key === "n")) {
        e.preventDefault();
        if (companies.length < 5) {
          setEditTarget(null);
          setModalOpen(true);
        }
      }
      if (e.ctrlKey && e.key === "q") {
        e.preventDefault();
        logout();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [companies, selectedIdx, modalOpen, deleteConfirm]);

  const handleSelect = (company) => {
    selectCompany(company);
    router.push("/dashboard");
  };

  const handleCreate = async (form) => {
    const res = await api.post("/companies", form);
    setCompanies((prev) => [...prev, res.data.company]);
    setSelectedIdx(companies.length);
  };

  const handleUpdate = async (form) => {
    const res = await api.put(`/companies/${editTarget.id}`, form);
    setCompanies((prev) =>
      prev.map((c) => (c.id === editTarget.id ? res.data.company : c)),
    );
    setEditTarget(null);
  };

  const handleDelete = async (id) => {
    await api.delete(`/companies/${id}`);
    setCompanies((prev) => prev.filter((c) => c.id !== id));
    setDeleteConfirm(null);
    setSelectedIdx(0);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-indigo-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">S</span>
          </div>
          <span className="text-white font-semibold tracking-tight">
            SmartERP
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-zinc-500 text-sm">{user?.name}</span>
          <button
            onClick={logout}
            className="text-zinc-500 hover:text-white text-sm transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl space-y-6">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-white text-2xl font-semibold">
              Select Company
            </h1>
            <p className="text-zinc-500 text-sm">
              {companies.length === 0
                ? "No companies yet. Create your first one."
                : `${companies.length} of 5 companies · use ↑↓ to navigate, Enter to open`}
            </p>
          </div>

          {/* Company list */}
          <div className="space-y-2">
            {companies.map((company, idx) => (
              <div
                key={company.id}
                onClick={() => handleSelect(company)}
                className={`
                  group relative flex items-center gap-4 px-5 py-4 rounded-xl border cursor-pointer
                  transition-all duration-100
                  ${
                    selectedIdx === idx
                      ? "bg-indigo-600/10 border-indigo-500/50 ring-1 ring-indigo-500/30"
                      : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50"
                  }
                `}
                onMouseEnter={() => setSelectedIdx(idx)}
              >
                {/* Company avatar */}
                <div
                  className={`
                  w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0
                  ${selectedIdx === idx ? "bg-indigo-500 text-white" : "bg-zinc-800 text-zinc-400"}
                `}
                >
                  {company.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium truncate">
                      {company.name}
                    </p>
                    {company.gst_number && (
                      <span className="text-xs bg-zinc-800 text-zinc-400 border border-zinc-700 rounded px-1.5 py-0.5 shrink-0">
                        GST
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-500 text-xs mt-0.5 truncate">
                    {[
                      company.state,
                      formatFY(
                        company.financial_year_start,
                        company.financial_year_end,
                      ),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>

                {/* Actions (visible on hover / selection) */}
                <div
                  className={`
                  flex items-center gap-1 transition-opacity
                  ${selectedIdx === idx ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
                `}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditTarget(company);
                      setModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-700 text-xs transition-colors"
                  >
                    Alter
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(company);
                    }}
                    className="px-2.5 py-1.5 rounded-md text-zinc-400 hover:text-red-400 hover:bg-red-950/30 text-xs transition-colors"
                  >
                    Delete
                  </button>
                </div>

                {/* Enter hint on selected */}
                {selectedIdx === idx && (
                  <div className="shrink-0">
                    <span className="text-xs bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-zinc-400">
                      Enter ↵
                    </span>
                  </div>
                )}
              </div>
            ))}

            {/* Empty state */}
            {companies.length === 0 && (
              <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl">
                <p className="text-zinc-500 text-sm mb-4">No companies found</p>
                <button
                  onClick={() => {
                    setEditTarget(null);
                    setModalOpen(true);
                  }}
                  className="text-indigo-400 hover:text-indigo-300 text-sm"
                >
                  Create your first company →
                </button>
              </div>
            )}
          </div>

          {/* Bottom actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-2">
              {companies.length < 5 && (
                <button
                  onClick={() => {
                    setEditTarget(null);
                    setModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg font-medium transition-colors"
                >
                  <span className="text-lg leading-none">+</span>
                  Create Company
                </button>
              )}
            </div>

            {/* Keyboard hints */}
            <div className="flex items-center gap-3 text-zinc-600 text-xs">
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
                  Ctrl+Q
                </kbd>{" "}
                Sign out
              </span>
            </div>
          </div>

          {/* Company limit warning */}
          {companies.length >= 5 && (
            <div className="bg-amber-950/30 border border-amber-900/50 rounded-lg px-4 py-3">
              <p className="text-amber-400 text-sm">
                You've reached the 5-company limit. Delete a company to create a
                new one.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Shortcut bar */}
      <div className="border-t border-zinc-800/60 px-6 py-2.5 flex items-center gap-6 text-zinc-600 text-xs">
        <span className="text-zinc-500 font-medium">Gateway of SmartERP</span>
        <span>
          <kbd className="bg-zinc-900 border border-zinc-800 rounded px-1">
            F1
          </kbd>{" "}
          New Company
        </span>
        <span>
          <kbd className="bg-zinc-900 border border-zinc-800 rounded px-1">
            Ctrl+Q
          </kbd>{" "}
          Quit
        </span>
      </div>

      {/* Create / Edit Modal */}
      <CompanyFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditTarget(null);
        }}
        onSave={editTarget ? handleUpdate : handleCreate}
        initial={editTarget}
      />

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-white font-semibold">Delete company?</h3>
            <p className="text-zinc-400 text-sm">
              <span className="text-white">{deleteConfirm.name}</span> and all
              its data will be permanently removed. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="px-4 py-2 text-sm bg-red-700 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Format "2024-04-01 → 2025-03-31" as "FY 2024-25"
function formatFY(start, end) {
  if (!start || !end) return "";
  const s = new Date(start).getFullYear();
  const e = new Date(end).getFullYear();
  return `FY ${s}-${String(e).slice(-2)}`;
}
