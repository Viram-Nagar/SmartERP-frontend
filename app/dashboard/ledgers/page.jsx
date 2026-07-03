"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { useCompany } from "@/context/CompanyContext";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import MasterTable from "@/components/masters/MasterTable";
import MasterDrawer from "@/components/masters/MasterDrawer";
import DeleteConfirm from "@/components/ui/DeleteConfirm";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const LEDGER_TYPES = [
  { value: "customer", label: "Customer", nature: "assets" },
  { value: "supplier", label: "Supplier", nature: "liabilities" },
  { value: "bank", label: "Bank", nature: "assets" },
  { value: "cash", label: "Cash", nature: "assets" },
  { value: "income", label: "Income", nature: "income" },
  { value: "expense", label: "Expense", nature: "expenses" },
  { value: "asset", label: "Asset", nature: "assets" },
  { value: "liability", label: "Liability", nature: "liabilities" },
];

const TYPE_COLORS = {
  customer: "bg-blue-950/50   text-blue-400   border-blue-900/50",
  supplier: "bg-orange-950/50 text-orange-400 border-orange-900/50",
  bank: "bg-cyan-950/50   text-cyan-400   border-cyan-900/50",
  cash: "bg-emerald-950/50 text-emerald-400 border-emerald-900/50",
  income: "bg-green-950/50  text-green-400  border-green-900/50",
  expense: "bg-red-950/50    text-red-400    border-red-900/50",
  asset: "bg-purple-950/50 text-purple-400 border-purple-900/50",
  liability: "bg-yellow-950/50 text-yellow-400 border-yellow-900/50",
};

const COLUMNS = [
  { key: "name", label: "Ledger Name", width: "w-48" },
  {
    key: "ledger_type",
    label: "Type",
    render: (v) => (
      <span
        className={`capitalize px-2 py-0.5 rounded-full text-xs font-medium border ${TYPE_COLORS[v] || ""}`}
      >
        {v}
      </span>
    ),
  },
  { key: "group_name", label: "Group" },
  {
    key: "current_balance",
    label: "Balance",
    render: (v, row) => (
      <span
        className={`font-mono text-sm ${row.balance_type === "Cr" ? "text-red-400" : "text-emerald-400"}`}
      >
        ₹
        {Math.abs(parseFloat(v || 0)).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        })}
        <span className="text-zinc-500 text-xs ml-1">{row.balance_type}</span>
      </span>
    ),
  },
  { key: "phone", label: "Phone", render: (v) => v || "—" },
  {
    key: "gst_number",
    label: "GSTIN",
    render: (v) =>
      v ? (
        <span className="font-mono text-xs">{v}</span>
      ) : (
        <span className="text-zinc-600">—</span>
      ),
  },
];

const EMPTY_FORM = {
  name: "",
  group_id: "",
  ledger_type: "customer",
  phone: "",
  email: "",
  address: "",
  gst_number: "",
  pan_number: "",
  opening_balance: "0",
  balance_type: "Dr",
};

export default function LedgersPage() {
  const { activeCompany } = useCompany();
  const [ledgers, setLedgers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const [ledgerRes, groupRes] = await Promise.all([
        api.get(`/ledgers?company_id=${activeCompany.id}`),
        api.get(`/groups?company_id=${activeCompany.id}`),
      ]);
      setLedgers(ledgerRes.data.ledgers);
      setFiltered(ledgerRes.data.ledgers);
      setGroups(groupRes.data.groups);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeCompany]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Filter by search + type
  useEffect(() => {
    let data = ledgers;
    if (typeFilter) data = data.filter((l) => l.ledger_type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.phone?.includes(q) ||
          l.gst_number?.toLowerCase().includes(q),
      );
    }
    setFiltered(data);
  }, [search, typeFilter, ledgers]);

  // Auto-select group based on ledger type
  const handleTypeChange = (type) => {
    const match = LEDGER_TYPES.find((t) => t.value === type);
    const defaultGroup = groups.find(
      (g) => g.nature === match?.nature && !g.parent_id,
    );
    setForm((p) => ({
      ...p,
      ledger_type: type,
      group_id: defaultGroup?.id || "",
    }));
  };

  const openNew = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setDrawerOpen(true);
  };

  const openEdit = (row) => {
    setEditTarget(row);
    setForm({
      name: row.name,
      group_id: row.group_id,
      ledger_type: row.ledger_type,
      phone: row.phone || "",
      email: row.email || "",
      address: row.address || "",
      gst_number: row.gst_number || "",
      pan_number: row.pan_number || "",
      opening_balance: String(row.opening_balance || 0),
      balance_type: row.balance_type || "Dr",
    });
    setFormError("");
    setDrawerOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Ledger name is required");
      return;
    }
    if (!form.group_id) {
      setFormError("Please select a group");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const payload = { ...form, company_id: activeCompany.id };
      if (editTarget) {
        const res = await api.put(`/ledgers/${editTarget.id}`, payload);
        setLedgers((prev) =>
          prev.map((l) =>
            l.id === editTarget.id
              ? {
                  ...res.data.ledger,
                  group_name: groups.find(
                    (g) => g.id === res.data.ledger.group_id,
                  )?.name,
                }
              : l,
          ),
        );
      } else {
        const res = await api.post("/ledgers", payload);
        const groupName = groups.find(
          (g) => g.id === res.data.ledger.group_id,
        )?.name;
        setLedgers((prev) => [
          ...prev,
          { ...res.data.ledger, group_name: groupName },
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
        `/ledgers/${deleteTarget.id}?company_id=${activeCompany.id}`,
      );
      setLedgers((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  useKeyboardShortcuts(
    [{ key: "l", alt: true, action: openNew }],
    !drawerOpen && !deleteTarget,
  );

  // Groups filtered by selected ledger type nature
  const selectedNature = LEDGER_TYPES.find(
    (t) => t.value === form.ledger_type,
  )?.nature;
  const filteredGroups = groups.filter((g) => g.nature === selectedNature);

  // Show/hide extra fields based on type
  const showPartyFields = ["customer", "supplier"].includes(form.ledger_type);
  const showBankFields = form.ledger_type === "bank";

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-xl font-semibold">Ledgers</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Account ledgers for your company
          </p>
        </div>
        <kbd className="text-zinc-600 text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1">
          Alt+L — New
        </kbd>
      </div>

      {/* Type filter tabs */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        <button
          onClick={() => setTypeFilter("")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!typeFilter ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700"}`}
        >
          All ({ledgers.length})
        </button>
        {LEDGER_TYPES.map((t) => {
          const count = ledgers.filter((l) => l.ledger_type === t.value).length;
          if (count === 0) return null;
          return (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${typeFilter === t.value ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700"}`}
            >
              {t.label} ({count})
            </button>
          );
        })}
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
        emptyMessage="No ledgers found"
      />

      {/* Drawer */}
      <MasterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editTarget ? "Alter Ledger" : "Create Ledger"}
        subtitle={
          editTarget
            ? `Editing: ${editTarget.name}`
            : "Add a new account ledger"
        }
        width="max-w-xl"
      >
        <form onSubmit={handleSave} className="space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-zinc-300 text-sm">
              Ledger Name <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Ramesh Traders, HDFC Bank"
              required
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500"
            />
          </div>

          {/* Ledger Type */}
          <div className="space-y-1.5">
            <Label className="text-zinc-300 text-sm">
              Ledger Type <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-4 gap-1.5">
              {LEDGER_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => handleTypeChange(t.value)}
                  className={`
                    py-2 rounded-lg border text-xs font-medium capitalize transition-colors
                    ${
                      form.ledger_type === t.value
                        ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                        : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white"
                    }
                  `}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Group */}
          <div className="space-y-1.5">
            <Label className="text-zinc-300 text-sm">
              Under (Group) <span className="text-red-500">*</span>
            </Label>
            <select
              value={form.group_id}
              onChange={(e) =>
                setForm((p) => ({ ...p, group_id: e.target.value }))
              }
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-indigo-500 focus:outline-none px-3 py-2 text-sm"
              required
            >
              <option value="">Select group</option>
              {filteredGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.parent_name ? `${g.parent_name} › ` : ""}
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Opening Balance */}
          <div className="space-y-1.5">
            <Label className="text-zinc-300 text-sm">Opening Balance</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={form.opening_balance}
                onChange={(e) =>
                  setForm((p) => ({ ...p, opening_balance: e.target.value }))
                }
                placeholder="0.00"
                step="0.01"
                className="flex-1 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500 font-mono"
              />
              <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
                {["Dr", "Cr"].map((bt) => (
                  <button
                    key={bt}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, balance_type: bt }))}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      form.balance_type === bt
                        ? bt === "Dr"
                          ? "bg-emerald-700 text-white"
                          : "bg-red-800 text-white"
                        : "bg-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {bt}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-zinc-600 text-xs">
              Dr = Debit (asset/expense) · Cr = Credit (liability/income)
            </p>
          </div>

          {/* Party fields */}
          {showPartyFields && (
            <div className="space-y-4 border-t border-zinc-800 pt-4">
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">
                Contact Details
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-zinc-300 text-sm">Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="+91 98765 43210"
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-300 text-sm">Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="contact@firm.com"
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-sm">Address</Label>
                <textarea
                  value={form.address}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, address: e.target.value }))
                  }
                  placeholder="Full address"
                  rows={2}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none px-3 py-2 text-sm resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-zinc-300 text-sm">GSTIN</Label>
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
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-300 text-sm">PAN</Label>
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
                </div>
              </div>
            </div>
          )}

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
                  : "Create ledger"}
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
