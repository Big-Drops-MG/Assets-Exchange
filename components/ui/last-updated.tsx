"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export function LastUpdated() {
  const [time, setTime] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, "0");
      setTime(`${displayHours} : ${displayMinutes} ${ampm}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsUpdating(true);
    router.refresh();
    setTimeout(() => {
      setIsUpdating(false);
    }, 1000);
  };

  return (
    <Button variant="outline" onClick={handleRefresh} disabled={isUpdating}>
      <RefreshCw className={`size-4 ${isUpdating ? "animate-spin" : ""}`} />
      <span>{isUpdating ? "Updating..." : `Last Updated: ${time}`}</span>
    </Button>
  );
}
