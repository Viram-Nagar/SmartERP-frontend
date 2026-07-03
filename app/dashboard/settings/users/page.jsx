"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { useCompany } from "@/context/CompanyContext";
import { useRole } from "@/context/RoleContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField, FormRow } from "@/components/ui/FormField";

const ROLE_STYLES = {
  owner: "bg-indigo-950/40 text-indigo-400  border-indigo-900/50",
  accountant: "bg-cyan-950/40   text-cyan-400    border-cyan-900/50",
  viewer: "bg-zinc-800      text-zinc-400    border-zinc-700",
  admin: "bg-red-950/40    text-red-400     border-red-900/50",
};

const ROLE_DESCRIPTIONS = {
  owner: "Full access — can manage users, delete records, and export all data",
  accountant:
    "Can create/edit vouchers, masters, and export reports. Cannot delete.",
  viewer: "Read-only. Can view all data and reports but cannot make changes.",
};

export default function UsersPage() {
  const { activeCompany } = useCompany();
  const { can } = useRole();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "viewer",
    password: "",
  });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const fetchUsers = useCallback(async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const res = await api.get(`/users/company/${activeCompany.id}`);
      setUsers(res.data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeCompany]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      setFormError("Name and email required");
      return;
    }
    setSaving(true);
    setFormError("");
    setSuccess("");
    try {
      const res = await api.post("/users/invite", {
        ...form,
        company_id: activeCompany.id,
      });
      setSuccess(res.data.message);
      setForm({ name: "", email: "", role: "viewer", password: "" });
      fetchUsers();
      setTimeout(() => setInviteOpen(false), 1500);
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to invite");
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}/role`, {
        company_id: activeCompany.id,
        role: newRole,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, company_role: newRole } : u,
        ),
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update role");
    }
  };

  const handleRemove = async (userId, name) => {
    if (!confirm(`Remove ${name} from this company?`)) return;
    try {
      await api.delete(`/users/${userId}/company/${activeCompany.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove");
    }
  };

  if (!can("users:read"))
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <p className="text-red-400 text-lg">⛔ Access Denied</p>
          <p className="text-zinc-500 text-sm">
            Only owners and admins can manage users.
          </p>
        </div>
      </div>
    );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-semibold">User Management</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Manage who can access{" "}
            <span className="text-white">{activeCompany?.name}</span>
          </p>
        </div>
        {can("users:write") && (
          <button
            onClick={() => {
              setInviteOpen(true);
              setFormError("");
              setSuccess("");
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            + Invite User
          </button>
        )}
      </div>

      {/* Role legend */}
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(ROLE_DESCRIPTIONS).map(([role, desc]) => (
          <div
            key={role}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-1.5"
          >
            <span
              className={`capitalize px-2 py-0.5 rounded-full text-xs font-medium border ${ROLE_STYLES[role]}`}
            >
              {role}
            </span>
            <p className="text-zinc-500 text-xs leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-800">
          <p className="text-zinc-400 text-xs uppercase tracking-wider font-medium">
            {users.length} user{users.length !== 1 ? "s" : ""} with access
          </p>
        </div>
        <div className="divide-y divide-zinc-800/50">
          {loading ? (
            <div className="px-5 py-8 text-center text-zinc-500 text-sm">
              Loading...
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user.cu_id}
                className="flex items-center gap-4 px-5 py-4"
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-600/30 flex items-center justify-center shrink-0">
                  <span className="text-indigo-400 font-medium text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{user.name}</p>
                  <p className="text-zinc-500 text-xs">{user.email}</p>
                </div>

                {/* Role */}
                <div className="flex items-center gap-2">
                  {can("users:write") ? (
                    <select
                      value={user.company_role}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value)
                      }
                      className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="owner">Owner</option>
                      <option value="accountant">Accountant</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  ) : (
                    <span
                      className={`capitalize px-2 py-0.5 rounded-full text-xs font-medium border ${ROLE_STYLES[user.company_role] || ""}`}
                    >
                      {user.company_role}
                    </span>
                  )}
                </div>

                {/* Joined */}
                <p className="text-zinc-600 text-xs hidden md:block">
                  {new Date(user.joined_at).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>

                {/* Remove */}
                {can("users:delete") && (
                  <button
                    onClick={() => handleRemove(user.id, user.name)}
                    className="text-zinc-600 hover:text-red-400 transition-colors text-sm px-2 py-1 rounded hover:bg-red-950/20"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setInviteOpen(false)}
          />
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <h2 className="text-white font-semibold">Invite User</h2>
              <button
                onClick={() => setInviteOpen(false)}
                className="text-zinc-500 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleInvite} className="p-5 space-y-4">
              <FormRow>
                <FormField label="Full Name" required>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="Ravi Kumar"
                    required
                    autoFocus
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500"
                  />
                </FormField>
                <FormField label="Email" required>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="ravi@firm.com"
                    required
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500"
                  />
                </FormField>
              </FormRow>

              <FormField label="Role">
                <div className="grid grid-cols-3 gap-2">
                  {["owner", "accountant", "viewer"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, role: r }))}
                      className={`py-2 rounded-lg border text-xs capitalize font-medium transition-colors ${
                        form.role === r
                          ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                          : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <p className="text-zinc-600 text-xs mt-1">
                  {ROLE_DESCRIPTIONS[form.role]}
                </p>
              </FormField>

              <FormField
                label="Temporary Password"
                hint="Leave blank to auto-generate"
              >
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, password: e.target.value }))
                  }
                  placeholder="Min 8 characters (optional)"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500"
                />
              </FormField>

              {formError && (
                <div className="bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">
                  <p className="text-red-400 text-sm">{formError}</p>
                </div>
              )}
              {success && (
                <div className="bg-emerald-950/50 border border-emerald-800 rounded-lg px-3 py-2 flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <p className="text-emerald-400 text-sm">{success}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setInviteOpen(false)}
                  className="flex-1 text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  {saving ? "Inviting..." : "Invite User"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
