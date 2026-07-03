"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Puducherry",
  "Chandigarh",
];

const EMPTY_FORM = {
  name: "",
  address: "",
  gst_number: "",
  state: "",
  phone: "",
  email: "",
  financial_year_start: "",
  financial_year_end: "",
  currency: "INR",
};

export default function CompanyFormModal({
  open,
  onClose,
  onSave,
  initial = null,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({
          name: initial.name || "",
          address: initial.address || "",
          gst_number: initial.gst_number || "",
          state: initial.state || "",
          phone: initial.phone || "",
          email: initial.email || "",
          financial_year_start:
            initial.financial_year_start?.split("T")[0] || "",
          financial_year_end: initial.financial_year_end?.split("T")[0] || "",
          currency: initial.currency || "INR",
        });
      } else {
        // Default financial year: April 1 this year → March 31 next year
        const now = new Date();
        const fyStart =
          now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
        setForm({
          ...EMPTY_FORM,
          financial_year_start: `${fyStart}-04-01`,
          financial_year_end: `${fyStart + 1}-03-31`,
        });
      }
      setError("");
    }
  }, [open, initial]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Company name is required");
      return;
    }
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save company");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-white font-semibold text-lg">
              {initial ? "Alter Company" : "Create Company"}
            </h2>
            <p className="text-zinc-500 text-xs mt-0.5">
              {initial
                ? "Update company information"
                : "Fill in your business details"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Company Name */}
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">
                Company Name <span className="text-red-500">*</span>
              </Label>
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Acme Traders Pvt Ltd"
                autoFocus
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500"
              />
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">Address</Label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="123, Business Park, City - 400001"
                rows={2}
                className="w-full rounded-md bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 px-3 py-2 text-sm resize-none"
              />
            </div>

            {/* GST + State row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-sm">GST Number</Label>
                <Input
                  name="gst_number"
                  value={form.gst_number}
                  onChange={handleChange}
                  placeholder="22AAAAA0000A1Z5"
                  maxLength={15}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500 uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-sm">State</Label>
                <select
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  className="w-full rounded-md bg-zinc-800 border border-zinc-700 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 px-3 py-2 text-sm"
                >
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Phone + Email row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-sm">Phone</Label>
                <Input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-sm">Email</Label>
                <Input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="info@company.com"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Financial Year row */}
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">
                Financial Year <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-zinc-500 text-xs mb-1">Start date</p>
                  <Input
                    name="financial_year_start"
                    type="date"
                    value={form.financial_year_start}
                    onChange={handleChange}
                    required
                    className="bg-zinc-800 border-zinc-700 text-white focus:border-indigo-500"
                  />
                </div>
                <div>
                  <p className="text-zinc-500 text-xs mb-1">End date</p>
                  <Input
                    name="financial_year_end"
                    type="date"
                    value={form.financial_year_end}
                    onChange={handleChange}
                    required
                    className="bg-zinc-800 border-zinc-700 text-white focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-950/50 border border-red-900 rounded-md px-3 py-2">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950/50">
            <p className="text-zinc-600 text-xs">
              <kbd className="bg-zinc-800 border border-zinc-700 rounded px-1 text-zinc-400">
                Enter
              </kbd>{" "}
              to save ·{" "}
              <kbd className="bg-zinc-800 border border-zinc-700 rounded px-1 text-zinc-400">
                Esc
              </kbd>{" "}
              to cancel
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                {loading
                  ? "Saving..."
                  : initial
                    ? "Save changes"
                    : "Create company"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
