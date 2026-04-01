"use client";

import { useCallback, useEffect, useState } from "react";

import { useBackgroundRefresh } from "@/features/admin/context/BackgroundRefreshContext";
import type { AdminDashboardData } from "@/features/admin/types/admin.types";

import { getAdvertiserDashboardData } from "../services/dashboard.client";

export function useAdvertiserDashboardViewModel() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setIsLoading(true);
      setError(null);
      const dashboardData = await getAdvertiserDashboardData();
      setData(dashboardData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const backgroundRefresh = useCallback(async () => {
    try {
      const dashboardData = await getAdvertiserDashboardData();
      setData(dashboardData);
    } catch {
      // silent fail
    }
  }, []);

  useBackgroundRefresh("advertiser-dashboard-stats", backgroundRefresh);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
  };
}
