import { type LucideIcon } from "lucide-react";

export interface AdminStats {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
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
