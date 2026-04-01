"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";

import { getVariables } from "@/components/_variables/variables";
import { Button } from "@/components/ui/button";
import { useBackgroundRefreshTrigger } from "@/features/admin/context/BackgroundRefreshContext";

export function dispatchDashboardRefresh() {
  window.dispatchEvent(new CustomEvent("dashboard-refresh"));
}

function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, "0");
  return `${displayHours} : ${displayMinutes} ${ampm}`;
}

export function LastUpdated() {
  const [time, setTime] = useState<string>(() => getCurrentTime());
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const variables = getVariables();
  const triggerRefresh = useBackgroundRefreshTrigger();

  useEffect(() => {
    const handler = () => setTime(getCurrentTime());
    window.addEventListener("background-refresh-complete", handler);
    return () =>
      window.removeEventListener("background-refresh-complete", handler);
  }, []);

  const handleRefresh = () => {
    dispatchDashboardRefresh();
    if (triggerRefresh) void triggerRefresh();
    startTransition(() => {
      router.refresh();
    });
    setTime(getCurrentTime());
  };

  return (
    <Button
      variant="outline"
      className=" p-4 lg:p-4.5 xl:p-5.5"
      onClick={handleRefresh}
      disabled={isPending}
    >
      <RefreshCw
        className={`size-4 xl:size-4.5 font-inter text-xs lg:text-[0.8rem] xl:text-[0.9rem] font-medium ${isPending ? "animate-spin" : ""}`}
        style={{
          color: variables.colors.headerIconColor,
        }}
      />
      <span className="font-inter text-xs lg:text-[0.8rem] xl:text-[0.9rem] font-medium">
        {isPending ? "Updating..." : `Last Updated: ${time}`}
      </span>
    </Button>
  );
}
