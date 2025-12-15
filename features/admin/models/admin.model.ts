import {
  Box,
  MailPlus,
  MailCheck,
  MailX,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

import type { AdminDashboardData, AdminStats } from "../types/admin.types";

export const dummyAdminStats: AdminStats[] = [
  {
    title: "Total Assets",
    value: 1263,
    icon: Box,
    trend: {
      trendTextValue: "Today",
      textValue: "43%",
      trendIconValue: TrendingUp,
    },
    historicalData: [
      { label: "Yesterday", value: "400" },
      { label: "Current Month", value: "25k" },
      { label: "Last Month", value: "10.8k" },
    ],
  },
  {
    title: "New Requests",
    value: 201,
    icon: MailPlus,
    trend: {
      trendTextValue: "Today",
      textValue: "13%",
      trendIconValue: TrendingDown,
    },
    historicalData: [
      { label: "Yesterday", value: "400" },
      { label: "Current Month", value: "25k" },
      { label: "Last Month", value: "10.8k" },
    ],
  },
  {
    title: "Approved Assets",
    value: 552,
    icon: MailCheck,
    trend: {
      trendTextValue: "Today",
      textValue: "20%",
      trendIconValue: TrendingUp,
    },
    historicalData: [
      { label: "Yesterday", value: "400" },
      { label: "Current Month", value: "25k" },
      { label: "Last Month", value: "10.8k" },
    ],
  },
  {
    title: "Rejected Assets",
    value: 210,
    icon: MailX,
    trend: {
      trendTextValue: "Today",
      textValue: "12%",
      trendIconValue: TrendingDown,
    },
    historicalData: [
      { label: "Yesterday", value: "400" },
      { label: "Current Month", value: "25k" },
      { label: "Last Month", value: "10.8k" },
    ],
  },
  {
    title: "Pending Approval",
    value: 300,
    icon: Clock,
    trend: {
      trendTextValue: "Today",
      textValue: "43%",
      trendIconValue: TrendingUp,
    },
    historicalData: [
      { label: "Yesterday", value: "400" },
      { label: "Current Month", value: "25k" },
      { label: "Last Month", value: "10.8k" },
    ],
  },
];

export const dummyAdminDashboardData: AdminDashboardData = {
  stats: dummyAdminStats,
};
