"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { useCompany } from "@/context/CompanyContext";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import MasterTable from "@/components/masters/MasterTable";
import MasterDrawer from "@/components/masters/MasterDrawer";
import DeleteConfirm from "@/components/ui/DeleteConfirm";
import { FormField, FormRow, FormSection } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/gst";

const COLUMNS = [
  { key: "name", label: "Supplier Name", width: "w-48" },
  { key: "phone", label: "Phone", render: (v) => v || "—" },
  {
    key: "gst_number",
    label: "GSTIN",
    render: (v) =>
      v ? (
        <span className="font-mono text-xs text-zinc-400">{v}</span>
      ) : (
        <span className="text-zinc-600">—</span>
      ),
  },
  {
    key: "pan_number",
    label: "PAN",
    render: (v) =>
      v ? (
        <span className="font-mono text-xs text-zinc-400">{v}</span>
      ) : (
        <span className="text-zinc-600">—</span>
      ),
  },
  {
    key: "purchase_count",
    label: "Purchases",
    render: (v) => (
      <span className="bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-xs font-mono text-zinc-300">
        {v || 0}
      </span>
    ),
  },
  {
    key: "current_balance",
    label: "Payable",
    render: (v, row) => {
      const amt = Math.abs(parseFloat(v || 0));
      return (
        <span
          className={`font-mono text-sm ${amt > 0 ? "text-amber-400" : "text-zinc-500"}`}
        >
          {amt > 0 ? formatINR(amt) : "—"}
          {amt > 0 && (
            <span className="text-zinc-500 text-xs ml-1">
              {row.balance_type}
            </span>
          )}
        </span>
      );
    },
  },
];

const EMPTY = {
  name: "",
  phone: "",
  email: "",
  gst_number: "",
  pan_number: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
};

export default function SuppliersPage() {
  const { activeCompany } = useCompany();

  const [suppliers, setSuppliers] = useState([]);
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

  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const fetchSuppliers = useCallback(async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const res = await api.get(`/suppliers?company_id=${activeCompany.id}`);
      setSuppliers(res.data.suppliers);
      setFiltered(res.data.suppliers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeCompany]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(suppliers);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      suppliers.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.phone?.includes(q) ||
          s.gst_number?.toLowerCase().includes(q),
      ),
    );
  }, [search, suppliers]);

  const openNew = () => {
    setEditTarget(null);
    setForm(EMPTY);
    setFormError("");
    setDrawerOpen(true);
  };
  const openEdit = (row) => {
    setEditTarget(row);
    setForm({
      name: row.name,
      phone: row.phone || "",
      email: row.email || "",
      gst_number: row.gst_number || "",
      pan_number: row.pan_number || "",
      address: row.address || "",
      city: row.city || "",
      state: row.state || "",
      pincode: row.pincode || "",
    });
    setFormError("");
    setDrawerOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Supplier name is required");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (editTarget) {
        const res = await api.put(`/suppliers/${editTarget.id}`, {
          ...form,
          company_id: activeCompany.id,
        });
        setSuppliers((prev) =>
          prev.map((s) =>
            s.id === editTarget.id ? { ...s, ...res.data.supplier } : s,
          ),
        );
      } else {
        const res = await api.post("/suppliers", {
          ...form,
          company_id: activeCompany.id,
        });
        setSuppliers((prev) => [
          ...prev,
          { ...res.data.supplier, purchase_count: 0 },
        ]);
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
        `/suppliers/${deleteTarget.id}?company_id=${activeCompany.id}`,
      );
      setSuppliers((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.response?.data?.message || "Cannot delete supplier");
    } finally {
      setDeleting(false);
    }
  };

  useKeyboardShortcuts(
    [{ key: "s", ctrl: true, action: openNew }],
    !drawerOpen && !deleteTarget,
  );

  const totalPayable = suppliers.reduce((s, sup) => {
    const bal = parseFloat(sup.current_balance || 0);
    return s + (sup.balance_type === "Cr" ? bal : 0);
  }, 0);

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-white text-xl font-semibold">Suppliers</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            {suppliers.length} suppliers · Total payable:{" "}
            <span className="text-amber-400 font-mono">
              {formatINR(totalPayable)}
            </span>
          </p>
        </div>
        <kbd className="text-zinc-600 text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1">
          Ctrl+S — New
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
        searchPlaceholder="Search by name, phone, GSTIN..."
        emptyMessage="No suppliers yet"
      />

      <MasterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editTarget ? "Edit Supplier" : "Create Supplier"}
        subtitle={
          editTarget
            ? `Editing: ${editTarget.name}`
            : "A ledger is auto-created under Sundry Creditors"
        }
        width="max-w-xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <FormField label="Supplier Name" required>
            <Input
              value={form.name}
              onChange={f("name")}
              placeholder="ABC Distributors"
              required
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500"
            />
          </FormField>

          <FormRow>
            <FormField label="Phone">
              <Input
                value={form.phone}
                onChange={f("phone")}
                placeholder="+91 98765 43210"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500"
              />
            </FormField>
            <FormField label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={f("email")}
                placeholder="supplier@email.com"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500"
              />
            </FormField>
          </FormRow>

          <FormRow>
            <FormField label="GSTIN">
              <Input
                value={form.gst_number}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    gst_number: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500 uppercase font-mono"
              />
            </FormField>
            <FormField label="PAN">
              <Input
                value={form.pan_number}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    pan_number: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="AAAAA0000A"
                maxLength={10}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500 uppercase font-mono"
              />
            </FormField>
          </FormRow>

          <FormSection title="Address">
            <FormField label="Address">
              <textarea
                value={form.address}
                onChange={f("address")}
                placeholder="Street address"
                rows={2}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none px-3 py-2 text-sm resize-none"
              />
            </FormField>
            <FormRow cols={3}>
              <FormField label="City">
                <Input
                  value={form.city}
                  onChange={f("city")}
                  placeholder="Delhi"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500"
                />
              </FormField>
              <FormField label="State">
                <Input
                  value={form.state}
                  onChange={f("state")}
                  placeholder="Delhi"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500"
                />
              </FormField>
              <FormField label="Pincode">
                <Input
                  value={form.pincode}
                  onChange={f("pincode")}
                  placeholder="110001"
                  maxLength={6}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500 font-mono"
                />
              </FormField>
            </FormRow>
          </FormSection>

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
                  : "Create supplier"}
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
