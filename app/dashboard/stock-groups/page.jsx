"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { useCompany } from "@/context/CompanyContext";
import MasterTable from "@/components/masters/MasterTable";
import MasterDrawer from "@/components/masters/MasterDrawer";
import DeleteConfirm from "@/components/ui/DeleteConfirm";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const COLUMNS = [
  { key: "name", label: "Group Name", width: "w-48" },
  {
    key: "parent_name",
    label: "Under",
    render: (v) => v || <span className="text-zinc-600">Primary</span>,
  },
  {
    key: "item_count",
    label: "Items",
    render: (v) => (
      <span className="bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-300 font-mono">
        {v}
      </span>
    ),
  },
];

const EMPTY = { name: "", parent_id: "" };

export default function StockGroupsPage() {
  const { activeCompany } = useCompany();
  const [groups, setGroups] = useState([]);
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

  const fetchGroups = useCallback(async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const res = await api.get(`/stock-groups?company_id=${activeCompany.id}`);
      setGroups(res.data.stockGroups);
      setFiltered(res.data.stockGroups);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeCompany]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(groups);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(groups.filter((g) => g.name.toLowerCase().includes(q)));
  }, [search, groups]);

  const openNew = () => {
    setEditTarget(null);
    setForm(EMPTY);
    setFormError("");
    setDrawerOpen(true);
  };
  const openEdit = (row) => {
    setEditTarget(row);
    setForm({ name: row.name, parent_id: row.parent_id || "" });
    setFormError("");
    setDrawerOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Group name is required");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (editTarget) {
        const res = await api.put(`/stock-groups/${editTarget.id}`, {
          ...form,
          company_id: activeCompany.id,
        });
        setGroups((prev) =>
          prev.map((g) =>
            g.id === editTarget.id
              ? { ...res.data.stockGroup, item_count: g.item_count }
              : g,
          ),
        );
      } else {
        const res = await api.post("/stock-groups", {
          ...form,
          company_id: activeCompany.id,
        });
        setGroups((prev) => [
          ...prev,
          { ...res.data.stockGroup, item_count: 0 },
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
        `/stock-groups/${deleteTarget.id}?company_id=${activeCompany.id}`,
      );
      setGroups((prev) => prev.filter((g) => g.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const parentOptions = groups.filter(
    (g) => !g.parent_id && (!editTarget || g.id !== editTarget.id),
  );

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-xl font-semibold">Stock Groups</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Categorise your inventory items
          </p>
        </div>
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
        searchPlaceholder="Search groups..."
        emptyMessage="No stock groups yet"
      />

      <MasterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editTarget ? "Edit Stock Group" : "Create Stock Group"}
      >
        <form onSubmit={handleSave} className="space-y-5">
          <FormField label="Group Name" required>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Electronics"
              required
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500"
            />
          </FormField>

          <FormField
            label="Under (Parent Group)"
            hint="Leave blank to make this a top-level group"
          >
            <select
              value={form.parent_id}
              onChange={(e) =>
                setForm((p) => ({ ...p, parent_id: e.target.value }))
              }
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-indigo-500 focus:outline-none px-3 py-2 text-sm"
            >
              <option value="">Primary (No parent)</option>
              {parentOptions.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </FormField>

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
                  : "Create group"}
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
