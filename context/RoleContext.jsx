"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "@/lib/api";
import { useCompany } from "./CompanyContext";

const RoleContext = createContext(null);

export function RoleProvider({ children }) {
  const { activeCompany } = useCompany();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    if (!activeCompany) {
      setRole(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get(
        `/users/me/role?company_id=${activeCompany.id}`,
      );
      setRole(res.data);
    } catch {
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, [activeCompany]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  const can = useCallback(
    (permission) => {
      if (!role) return false;
      const PERMISSIONS = {
        "company:write": ["admin", "owner"],
        "ledger:write": ["admin", "owner", "accountant"],
        "ledger:delete": ["admin", "owner"],
        "voucher:write": ["admin", "owner", "accountant"],
        "voucher:cancel": ["admin", "owner"],
        "stock:write": ["admin", "owner", "accountant"],
        "inventory:write": ["admin", "owner", "accountant"],
        "invoice:write": ["admin", "owner", "accountant"],
        "reports:export": ["admin", "owner", "accountant"],
        "users:read": ["admin", "owner"],
        "users:write": ["admin", "owner"],
        "audit:read": ["admin", "owner"],
      };
      const allowed = PERMISSIONS[permission] || [
        "admin",
        "owner",
        "accountant",
        "viewer",
      ];
      return allowed.includes(role.effectiveRole);
    },
    [role],
  );

  return (
    <RoleContext.Provider value={{ role, loading, can, refetch: fetchRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export const useRole = () => {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside RoleProvider");
  return ctx;
};
