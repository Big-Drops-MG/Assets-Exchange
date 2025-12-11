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
