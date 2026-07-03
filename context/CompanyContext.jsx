"use client";

import { createContext, useContext, useState, useEffect } from "react";

const CompanyContext = createContext(null);

export function CompanyProvider({ children }) {
  const [activeCompany, setActiveCompany] = useState(null);

  // Persist selected company in sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("smarterp_company");
    if (stored) {
      try {
        setActiveCompany(JSON.parse(stored));
      } catch (_) {}
    }
  }, []);

  const selectCompany = (company) => {
    setActiveCompany(company);
    sessionStorage.setItem("smarterp_company", JSON.stringify(company));
  };

  const clearCompany = () => {
    setActiveCompany(null);
    sessionStorage.removeItem("smarterp_company");
  };

  return (
    <CompanyContext.Provider
      value={{ activeCompany, selectCompany, clearCompany }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used inside CompanyProvider");
  return ctx;
};
