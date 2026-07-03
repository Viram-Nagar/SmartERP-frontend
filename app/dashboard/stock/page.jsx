"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { useCompany } from "@/context/CompanyContext";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import MasterTable from "@/components/masters/MasterTable";
import MasterDrawer from "@/components/masters/MasterDrawer";
import DeleteConfirm from "@/components/ui/DeleteConfirm";
import {
  FormField,
  FormRow,
  FormSection,
  SelectField,
} from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const GST_RATES = [0, 0.1, 0.25, 1, 1.5, 3, 5, 7.5, 12, 18, 28];

const COLUMNS = [
  { key: "name", label: "Item Name", width: "w-48" },
  {
    key: "sku",
    label: "SKU",
    render: (v) =>
      v ? (
        <span className="font-mono text-xs text-zinc-400">{v}</span>
      ) : (
        <span className="text-zinc-600">—</span>
      ),
  },
  { key: "group_name", label: "Group", render: (v) => v || "—" },
  {
    key: "current_qty",
    label: "Stock",
    render: (v, row) => {
      const qty = parseFloat(v || 0);
      const alert = parseFloat(row.low_stock_alert || 0);
      const isLow = alert > 0 && qty <= alert;
      return (
        <span
          className={`font-mono text-sm flex items-center gap-1.5 ${isLow ? "text-red-400" : "text-white"}`}
        >
          {qty.toLocaleString("en-IN", { maximumFractionDigits: 3 })}
          <span className="text-zinc-500 text-xs">{row.unit_symbol || ""}</span>
          {isLow && (
            <span className="bg-red-950/50 border border-red-900/50 text-red-400 text-[10px] rounded px-1 py-0.5">
              Low
            </span>
          )}
        </span>
      );
    },
  },
  {
    key: "selling_price",
    label: "Sale Price",
    render: (v) => (
      <span className="font-mono text-sm text-emerald-400">
        ₹
        {parseFloat(v || 0).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        })}
      </span>
    ),
  },
  {
    key: "purchase_price",
    label: "Cost Price",
    render: (v) => (
      <span className="font-mono text-sm text-zinc-400">
        ₹
        {parseFloat(v || 0).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        })}
      </span>
    ),
  },
  {
    key: "gst_rate",
    label: "GST%",
    render: (v) => (
      <span className="text-xs bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-zinc-300 font-mono">
        {v}%
      </span>
    ),
  },
  {
    key: "hsn_code",
    label: "HSN",
    render: (v) =>
      v ? (
        <span className="font-mono text-xs text-zinc-400">{v}</span>
      ) : (
        <span className="text-zinc-600">—</span>
      ),
  },
];

const EMPTY_FORM = {
  name: "",
  sku: "",
  description: "",
  stock_group_id: "",
  unit_id: "",
  purchase_price: "",
  selling_price: "",
  opening_qty: "0",
  low_stock_alert: "0",
  gst_rate: "18",
  hsn_code: "",
};

export default function StockPage() {
  const { activeCompany } = useCompany();

  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [stockGroups, setStockGroups] = useState([]);
  const [units, setUnits] = useState([]);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const fetchAll = useCallback(async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const [itemRes, groupRes, unitRes] = await Promise.all([
        api.get(`/stock-items?company_id=${activeCompany.id}`),
        api.get(`/stock-groups?company_id=${activeCompany.id}`),
        api.get(`/units?company_id=${activeCompany.id}`),
      ]);
      setItems(itemRes.data.stockItems);
      setFiltered(itemRes.data.stockItems);
      setStockGroups(groupRes.data.stockGroups);
      setUnits(unitRes.data.units);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeCompany]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Filter
  useEffect(() => {
    let data = items;
    if (groupFilter)
      data = data.filter((i) => i.stock_group_id === groupFilter);
    if (lowStockOnly)
      data = data.filter((i) => {
        const qty = parseFloat(i.current_qty || 0);
        const alert = parseFloat(i.low_stock_alert || 0);
        return alert > 0 && qty <= alert;
      });
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.sku?.toLowerCase().includes(q) ||
          i.hsn_code?.includes(q),
      );
    }
    setFiltered(data);
  }, [search, groupFilter, lowStockOnly, items]);

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
      sku: row.sku || "",
      description: row.description || "",
      stock_group_id: row.stock_group_id || "",
      unit_id: row.unit_id || "",
      purchase_price: String(row.purchase_price || ""),
      selling_price: String(row.selling_price || ""),
      opening_qty: String(row.opening_qty || 0),
      low_stock_alert: String(row.low_stock_alert || 0),
      gst_rate: String(row.gst_rate || 18),
      hsn_code: row.hsn_code || "",
    });
    setFormError("");
    setDrawerOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Item name is required");
      return;
    }
    if (!form.selling_price) {
      setFormError("Selling price is required");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const payload = { ...form, company_id: activeCompany.id };
      if (editTarget) {
        const res = await api.put(`/stock-items/${editTarget.id}`, payload);
        setItems((prev) =>
          prev.map((i) =>
            i.id === editTarget.id
              ? {
                  ...res.data.stockItem,
                  group_name: stockGroups.find(
                    (g) => g.id === res.data.stockItem.stock_group_id,
                  )?.name,
                  unit_symbol: units.find(
                    (u) => u.id === res.data.stockItem.unit_id,
                  )?.symbol,
                }
              : i,
          ),
        );
      } else {
        const res = await api.post("/stock-items", payload);
        setItems((prev) => [
          ...prev,
          {
            ...res.data.stockItem,
            group_name: stockGroups.find(
              (g) => g.id === res.data.stockItem.stock_group_id,
            )?.name,
            unit_symbol: units.find((u) => u.id === res.data.stockItem.unit_id)
              ?.symbol,
          },
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
        `/stock-items/${deleteTarget.id}?company_id=${activeCompany.id}`,
      );
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  useKeyboardShortcuts(
    [
      { key: "s", alt: true, action: openNew },
      { key: "n", ctrl: true, action: openNew },
    ],
    !drawerOpen && !deleteTarget,
  );

  const lowStockCount = items.filter((i) => {
    const qty = parseFloat(i.current_qty || 0);
    const alert = parseFloat(i.low_stock_alert || 0);
    return alert > 0 && qty <= alert;
  }).length;

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-white text-xl font-semibold">Stock Items</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Products and inventory items
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lowStockCount > 0 && (
            <button
              onClick={() => setLowStockOnly((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                lowStockOnly
                  ? "bg-red-900/30 border-red-700 text-red-400"
                  : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white"
              }`}
            >
              ⚠ {lowStockCount} Low Stock
            </button>
          )}
          <kbd className="text-zinc-600 text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1">
            Alt+S — New
          </kbd>
        </div>
      </div>

      {/* Group filter */}
      {stockGroups.length > 0 && (
        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
          <button
            onClick={() => setGroupFilter("")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!groupFilter ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700"}`}
          >
            All
          </button>
          {stockGroups.map((g) => (
            <button
              key={g.id}
              onClick={() => setGroupFilter(g.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${groupFilter === g.id ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700"}`}
            >
              {g.name} ({g.item_count})
            </button>
          ))}
        </div>
      )}

      <MasterTable
        columns={COLUMNS}
        data={filtered}
        loading={loading}
        onNew={openNew}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        searchValue={search}
        onSearch={setSearch}
        searchPlaceholder="Search by name, SKU, HSN..."
        emptyMessage="No stock items yet"
      />

      {/* Drawer */}
      <MasterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editTarget ? "Alter Stock Item" : "Create Stock Item"}
        subtitle={
          editTarget
            ? `Editing: ${editTarget.name}`
            : "Add a new product or inventory item"
        }
        width="max-w-xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Basic Info */}
          <FormField label="Item Name" required>
            <Input
              value={form.name}
              onChange={f("name")}
              placeholder="e.g. Laptop Dell Inspiron 15"
              required
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500"
            />
          </FormField>

          <FormRow>
            <FormField label="SKU / Item Code">
              <Input
                value={form.sku}
                onChange={f("sku")}
                placeholder="DELL-INS-15"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500 font-mono"
              />
            </FormField>
            <FormField label="HSN Code" hint="For GST invoices">
              <Input
                value={form.hsn_code}
                onChange={f("hsn_code")}
                placeholder="84713000"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500 font-mono"
              />
            </FormField>
          </FormRow>

          <FormRow>
            <FormField label="Stock Group">
              <SelectField
                value={form.stock_group_id}
                onChange={f("stock_group_id")}
                placeholder="Select group"
                options={stockGroups.map((g) => ({
                  value: g.id,
                  label: g.name,
                }))}
              />
            </FormField>
            <FormField label="Unit of Measure">
              <SelectField
                value={form.unit_id}
                onChange={f("unit_id")}
                placeholder="Select unit"
                options={units.map((u) => ({
                  value: u.id,
                  label: `${u.name} (${u.symbol})`,
                }))}
              />
            </FormField>
          </FormRow>

          {/* Pricing */}
          <FormSection title="Pricing">
            <FormRow>
              <FormField label="Purchase / Cost Price" required>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                    ₹
                  </span>
                  <Input
                    type="number"
                    value={form.purchase_price}
                    onChange={f("purchase_price")}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="bg-zinc-800 border-zinc-700 text-white pl-7 placeholder:text-zinc-500 focus:border-indigo-500 font-mono"
                  />
                </div>
              </FormField>
              <FormField label="Selling Price" required>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                    ₹
                  </span>
                  <Input
                    type="number"
                    value={form.selling_price}
                    onChange={f("selling_price")}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                    className="bg-zinc-800 border-zinc-700 text-white pl-7 placeholder:text-zinc-500 focus:border-indigo-500 font-mono"
                  />
                </div>
              </FormField>
            </FormRow>

            {/* GST Rate */}
            <FormField label="GST Rate">
              <div className="flex flex-wrap gap-1.5">
                {GST_RATES.map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() =>
                      setForm((p) => ({ ...p, gst_rate: String(rate) }))
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-colors ${
                      parseFloat(form.gst_rate) === rate
                        ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                        : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </FormField>
          </FormSection>

          {/* Stock */}
          <FormSection title="Stock Settings">
            <FormRow>
              <FormField
                label={
                  editTarget ? "Opening Qty (read-only)" : "Opening Quantity"
                }
                hint={
                  editTarget
                    ? "Use inventory adjustment to change stock"
                    : "Stock on hand today"
                }
              >
                <Input
                  type="number"
                  value={form.opening_qty}
                  onChange={f("opening_qty")}
                  placeholder="0"
                  step="0.001"
                  min="0"
                  disabled={!!editTarget}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500 font-mono disabled:opacity-40"
                />
              </FormField>
              <FormField
                label="Low Stock Alert"
                hint="Alert when qty falls to or below this"
              >
                <Input
                  type="number"
                  value={form.low_stock_alert}
                  onChange={f("low_stock_alert")}
                  placeholder="0"
                  step="0.001"
                  min="0"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500 font-mono"
                />
              </FormField>
            </FormRow>
          </FormSection>

          {/* Margin preview */}
          {form.purchase_price && form.selling_price && (
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3">
              <p className="text-zinc-500 text-xs mb-2">Margin preview</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-zinc-400">
                  Margin:{" "}
                  <span
                    className={`font-mono font-medium ${
                      parseFloat(form.selling_price) >
                      parseFloat(form.purchase_price)
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    ₹
                    {(
                      parseFloat(form.selling_price) -
                      parseFloat(form.purchase_price)
                    ).toFixed(2)}
                  </span>
                </span>
                <span className="text-zinc-400">
                  {parseFloat(form.purchase_price) > 0
                    ? `${(((parseFloat(form.selling_price) - parseFloat(form.purchase_price)) / parseFloat(form.purchase_price)) * 100).toFixed(1)}%`
                    : "—"}
                </span>
                {parseFloat(form.gst_rate) > 0 && (
                  <span className="text-zinc-400">
                    GST:{" "}
                    <span className="text-indigo-400 font-mono">
                      ₹
                      {(
                        (parseFloat(form.selling_price) *
                          parseFloat(form.gst_rate)) /
                        100
                      ).toFixed(2)}
                    </span>
                  </span>
                )}
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
                  : "Create item"}
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
