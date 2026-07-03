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

const NATURES = ["assets", "liabilities", "income", "expenses"];

const COLUMNS = [
  { key: "name", label: "Group Name", width: "w-64" },
  {
    key: "nature",
    label: "Nature",
    render: (v) => (
      <span
        className={`capitalize px-2 py-0.5 rounded-full text-xs font-medium ${
          v === "assets"
            ? "bg-emerald-950/50 text-emerald-400 border border-emerald-900/50"
            : v === "liabilities"
              ? "bg-red-950/50    text-red-400    border border-red-900/50"
              : v === "income"
                ? "bg-blue-950/50   text-blue-400   border border-blue-900/50"
                : "bg-amber-950/50  text-amber-400  border border-amber-900/50"
        }`}
      >
        {v}
      </span>
    ),
  },
  {
    key: "parent_name",
    label: "Under",
    render: (v) => v || <span className="text-zinc-600">Primary</span>,
  },
  {
    key: "is_system",
    label: "Type",
    render: (v) =>
      v ? (
        <span className="text-zinc-500 text-xs">System</span>
      ) : (
        <span className="text-indigo-400 text-xs">Custom</span>
      ),
  },
];

const EMPTY = { name: "", nature: "assets", parent_id: "" };

export default function GroupsPage() {
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
      const res = await api.get(`/groups?company_id=${activeCompany.id}`);
      setGroups(res.data.groups);
      setFiltered(res.data.groups);
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
    setFiltered(
      groups.filter(
        (g) => g.name.toLowerCase().includes(q) || g.nature.includes(q),
      ),
    );
  }, [search, groups]);

  const openNew = () => {
    setEditTarget(null);
    setForm(EMPTY);
    setFormError("");
    setDrawerOpen(true);
  };

  const openEdit = (row) => {
    if (row.is_system) return; // system groups are read-only
    setEditTarget(row);
    setForm({
      name: row.name,
      nature: row.nature,
      parent_id: row.parent_id || "",
    });
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
        const res = await api.put(`/groups/${editTarget.id}`, {
          ...form,
          company_id: activeCompany.id,
        });
        setGroups((prev) =>
          prev.map((g) => (g.id === editTarget.id ? res.data.group : g)),
        );
      } else {
        const res = await api.post("/groups", {
          ...form,
          company_id: activeCompany.id,
        });
        setGroups((prev) => [...prev, res.data.group]);
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
        `/groups/${deleteTarget.id}?company_id=${activeCompany.id}`,
      );
      setGroups((prev) => prev.filter((g) => g.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts(
    [{ key: "g", alt: true, action: openNew }],
    !drawerOpen && !deleteTarget,
  );

  // Parent group options (only top-level same-nature groups)
  const parentOptions = groups.filter(
    (g) => !g.parent_id && (!editTarget || g.id !== editTarget.id),
  );

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-xl font-semibold">Groups</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Chart of accounts structure
          </p>
        </div>
        <kbd className="text-zinc-600 text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1">
          Alt+G — New
        </kbd>
      </div>

      <MasterTable
        columns={COLUMNS}
        data={filtered}
        loading={loading}
        onNew={openNew}
        onEdit={openEdit}
        onDelete={(row) => !row.is_system && setDeleteTarget(row)}
        searchValue={search}
        onSearch={setSearch}
        searchPlaceholder="Search groups..."
        emptyMessage="No groups found"
      />

      {/* Create / Edit Drawer */}
      <MasterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editTarget ? "Alter Group" : "Create Group"}
        subtitle={
          editTarget ? `Editing: ${editTarget.name}` : "Add a new account group"
        }
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-zinc-300 text-sm">
              Group Name <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Office Expenses"
              required
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-zinc-300 text-sm">
              Nature <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {NATURES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() =>
                    setForm((p) => ({ ...p, nature: n, parent_id: "" }))
                  }
                  className={`
                    py-2.5 rounded-lg border text-sm capitalize font-medium transition-colors
                    ${
                      form.nature === n
                        ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                        : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
                    }
                  `}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-zinc-300 text-sm">
              Under (Parent Group)
            </Label>
            <select
              value={form.parent_id}
              onChange={(e) =>
                setForm((p) => ({ ...p, parent_id: e.target.value }))
              }
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-indigo-500 focus:outline-none px-3 py-2 text-sm"
            >
              <option value="">Primary (No parent)</option>
              {parentOptions
                .filter((g) => g.nature === form.nature)
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
            </select>
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
                  : "Create group"}
            </Button>
          </div>

          <p className="text-center text-zinc-600 text-xs">
            <kbd className="bg-zinc-800 border border-zinc-700 rounded px-1">
              Enter
            </kbd>{" "}
            to save ·{" "}
            <kbd className="bg-zinc-800 border border-zinc-700 rounded px-1">
              Esc
            </kbd>{" "}
            to cancel
          </p>
        </form>
      </MasterDrawer>

      {/* Delete Confirm */}
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
