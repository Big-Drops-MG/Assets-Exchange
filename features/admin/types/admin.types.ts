import { type LucideIcon } from "lucide-react";

export interface AdminStats {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: {
    trendTextValue: string;
    textValue: string;
    trendIconValue: LucideIcon;
  };
  historicalData?: Array<{
    label: string;
    value: number | string;
  }>;
}

export interface RecentRequest {
  id: string;
  advertiserName: string;
  publisherName: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  amount: number;
}

export interface AdminDashboardData {
  stats: AdminStats[];
}

export type ComparisonType =
  | "Today vs Yesterday"
  | "Today vs Last Week"
  | "Current Week vs Last Week"
  | "Current Month vs Last Month";

export type MetricType =
  | "Total Assets"
  | "New Requests"
  | "Approved Assets"
  | "Rejected Assets"
  | "Pending Approval";

export interface PerformanceChartDataPoint {
  label: string;
  current: number;
  previous: number;
}

export interface PerformanceChartData {
  data: PerformanceChartDataPoint[];
  comparisonType: ComparisonType;
  xAxisLabel: string;
}
