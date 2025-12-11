import { getPerformanceChartDataByType } from "../models/performance-chart.model";
import type {
  ComparisonType,
  PerformanceChartData,
} from "../types/admin.types";

export async function getPerformanceChartData(
  comparisonType: ComparisonType
): Promise<PerformanceChartData> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return getPerformanceChartDataByType(comparisonType);
}
