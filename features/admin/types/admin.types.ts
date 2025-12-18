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

export type RequestStatus =
  | "new"
  | "pending"
  | "approved"
  | "rejected"
  | "sent-back";

export type ApprovalStage = "admin" | "advertiser" | "completed";

export interface Request {
  id: string;
  date: string;
  advertiserName: string;
  affiliateId: string;
  priority: string;
  offerId: string;
  offerName: string;
  clientId: string;
  clientName: string;
  creativeType: string;
  creativeCount: number;
  fromLinesCount: number;
  subjectLinesCount: number;
  status: RequestStatus;
  approvalStage: ApprovalStage;
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
