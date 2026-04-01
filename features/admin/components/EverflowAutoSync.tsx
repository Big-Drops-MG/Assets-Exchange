"use client";

import { usePathname } from "next/navigation";
import { useCallback } from "react";

import { useBackgroundRefresh } from "@/features/admin/context/BackgroundRefreshContext";
import { useGlobalSync } from "@/features/admin/context/GlobalSyncContext";

export function EverflowAutoSync() {
  const { offers, advertisers, startSync } = useGlobalSync();
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;

  const syncOffers = useCallback(async () => {
    if (!isAdminRoute || offers.active) return;
    try {
      await startSync("everflow_sync");
    } catch {
      // silent fail
    }
  }, [isAdminRoute, offers.active, startSync]);

  const syncAdvertisers = useCallback(async () => {
    if (!isAdminRoute || advertisers.active) return;
    try {
      await startSync("everflow_sync_advertisers");
    } catch {
      // silent fail
    }
  }, [isAdminRoute, advertisers.active, startSync]);

  useBackgroundRefresh("everflow-offers-sync", syncOffers);
  useBackgroundRefresh("everflow-advertisers-sync", syncAdvertisers);

  return null;
}
