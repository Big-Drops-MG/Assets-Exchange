"use client";

import { useEffect, useState } from "react";

import { getPerformanceChartData } from "../services/performance-chart.service";
import type {
  ComparisonType,
  PerformanceChartData,
} from "../types/admin.types";

export function usePerformanceChartViewModel(comparisonType: ComparisonType) {
  const [data, setData] = useState<PerformanceChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const chartData = await getPerformanceChartData(comparisonType);
        setData(chartData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load chart data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [comparisonType]);

  return {
    data,
    isLoading,
    error,
  };
}
