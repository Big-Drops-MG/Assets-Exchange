import {
  ClipboardList,
  FileX,
  CheckCircle2,
  XCircle,
  DollarSign,
} from "lucide-react";

import type { AdminDashboardData, AdminStats } from "../types/admin.types";

export const dummyAdminStats: AdminStats[] = [
  {
    title: "Total Requests",
    value: 1247,
    description: "All time requests",
    icon: ClipboardList,
    trend: { value: 12, isPositive: true },
  },
  {
    title: "Pending Requests",
    value: 23,
    description: "Awaiting approval",
    icon: FileX,
  },
  {
    title: "Approved Requests",
    value: 1156,
    description: "Successfully approved",
    icon: CheckCircle2,
    trend: { value: 8, isPositive: true },
  },
  {
    title: "Rejected Requests",
    value: 68,
    description: "Declined requests",
    icon: XCircle,
    trend: { value: -3, isPositive: false },
  },
  {
    title: "Total Revenue",
    value: 125000,
    description: "All time revenue",
    icon: DollarSign,
    trend: { value: 15, isPositive: true },
  },
];

export const dummyAdminDashboardData: AdminDashboardData = {
  stats: dummyAdminStats,
};
