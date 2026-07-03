"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { useCompany } from "@/context/CompanyContext";

export function useInventory() {
  const { activeCompany } = useCompany();
  const [summary, setSummary] = useState(null);
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const [sumRes, itemsRes] = await Promise.all([
        api.get(`/inventory/summary?company_id=${activeCompany.id}`),
        api.get(`/inventory/stock-items?company_id=${activeCompany.id}`),
      ]);
      setSummary(sumRes.data);
      setStockItems(itemsRes.data.stockItems);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeCompany]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, stockItems, loading, refetch: fetchSummary };
}
