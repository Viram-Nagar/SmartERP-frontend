"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { useCompany } from "@/context/CompanyContext";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import MasterTable from "@/components/masters/MasterTable";
import MasterDrawer from "@/components/masters/MasterDrawer";
import DeleteConfirm from "@/components/ui/DeleteConfirm";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const DEFAULT_UNITS = [
  { name: "Pieces", symbol: "PCS" },
  { name: "Kilograms", symbol: "KG" },
  { name: "Grams", symbol: "GMS" },
  { name: "Litres", symbol: "LTR" },
  { name: "Millilitre", symbol: "ML" },
  { name: "Box", symbol: "BOX" },
  { name: "Dozen", symbol: "DOZ" },
  { name: "Metres", symbol: "MTR" },
  { name: "Numbers", symbol: "NOS" },
  { name: "Pairs", symbol: "PRS" },
  { name: "Quintal", symbol: "QTL" },
  { name: "Tons", symbol: "TON" },
];

const COLUMNS = [
  { key: "name", label: "Unit Name", width: "w-64" },
  {
    key: "symbol",
    label: "Symbol",
    render: (v) => (
      <span className="font-mono bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-sm text-indigo-300">
        {v}
      </span>
    ),
  },
];

const EMPTY = { name: "", symbol: "" };

export default function UnitsPage() {
  const { activeCompany } = useCompany();
  const [units, setUnits] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const fetchUnits = useCallback(async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const res = await api.get(`/units?company_id=${activeCompany.id}`);
      setUnits(res.data.units);
      setFiltered(res.data.units);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeCompany]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(units);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      units.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.symbol.toLowerCase().includes(q),
      ),
    );
  }, [search, units]);

  const openNew = () => {
    setEditTarget(null);
    setForm(EMPTY);
    setFormError("");
    setDrawerOpen(true);
  };

  const openEdit = (row) => {
    setEditTarget(row);
    setForm({ name: row.name, symbol: row.symbol });
    setFormError("");
    setDrawerOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.symbol.trim()) {
      setFormError("Both name and symbol are required");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (editTarget) {
        const res = await api.put(`/units/${editTarget.id}`, {
          ...form,
          company_id: activeCompany.id,
        });
        setUnits((prev) =>
          prev.map((u) => (u.id === editTarget.id ? res.data.unit : u)),
        );
      } else {
        const res = await api.post("/units", {
          ...form,
          company_id: activeCompany.id,
        });
        setUnits((prev) => [...prev, res.data.unit]);
      }
      setDrawerOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(
        `/units/${deleteTarget.id}?company_id=${activeCompany.id}`,
      );
      setUnits((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  // Seed all default units at once
  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const existing = units.map((u) => u.symbol);
      const toCreate = DEFAULT_UNITS.filter(
        (u) => !existing.includes(u.symbol),
      );
      await Promise.allSettled(
        toCreate.map((u) =>
          api.post("/units", { ...u, company_id: activeCompany.id }),
        ),
      );
      await fetchUnits();
    } catch (err) {
      console.error(err);
    } finally {
      setSeeding(false);
    }
  };

  useKeyboardShortcuts(
    [{ key: "u", alt: true, action: openNew }],
    !drawerOpen && !deleteTarget,
  );

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-xl font-semibold">Units of Measure</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Define how stock items are measured
          </p>
        </div>
        <kbd className="text-zinc-600 text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1">
          Alt+U — New
        </kbd>
      </div>

      <MasterTable
        columns={COLUMNS}
        data={filtered}
        loading={loading}
        onNew={openNew}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        searchValue={search}
        onSearch={setSearch}
        searchPlaceholder="Search units..."
        emptyMessage="No units defined yet"
        actions={[
          {
            label: seeding ? "Adding defaults..." : "⚡ Add Default Units",
            onClick: handleSeedDefaults,
            shortcut: "",
          },
        ]}
      />

      <MasterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editTarget ? "Edit Unit" : "Create Unit"}
        subtitle="Define a unit of measurement"
      >
        <form onSubmit={handleSave} className="space-y-5">
          <FormField label="Unit Name" required>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Kilograms"
              required
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500"
            />
          </FormField>

          <FormField
            label="Symbol"
            required
            hint="Short code used on invoices and reports"
          >
            <Input
              value={form.symbol}
              onChange={(e) =>
                setForm((p) => ({ ...p, symbol: e.target.value.toUpperCase() }))
              }
              placeholder="e.g. KG"
              maxLength={10}
              required
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500 uppercase font-mono"
            />
          </FormField>

          {/* Quick-pick defaults */}
          <div className="space-y-2">
            <p className="text-zinc-500 text-xs">Quick pick</p>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_UNITS.map((u) => (
                <button
                  key={u.symbol}
                  type="button"
                  onClick={() => setForm({ name: u.name, symbol: u.symbol })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-colors ${
                    form.symbol === u.symbol
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
                  }`}
                >
                  {u.symbol}
                </button>
              ))}
            </div>
          </div>

          {formError && (
            <div className="bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">
              <p className="text-red-400 text-sm">{formError}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDrawerOpen(false)}
              className="flex-1 text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              {saving
                ? "Saving..."
                : editTarget
                  ? "Save changes"
                  : "Create unit"}
            </Button>
          </div>
        </form>
      </MasterDrawer>

      <DeleteConfirm
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        name={deleteTarget?.name}
        loading={deleting}
      />
    </div>
  );
}
