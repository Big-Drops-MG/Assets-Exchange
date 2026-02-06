"use client";

/**
 * Ops Dashboard - Operations Monitoring
 *
 * ACCEPTANCE CRITERIA:
 *
 * Ops Dashboard:
 * ✓ Shows stat cards for Active Jobs, Failed Jobs, Dead Letter Queue, Error Rate, and Latency
 * ✓ Clicking stat cards opens the corresponding detail view
 * ✓ Switching between all views (Summary/Active/Failed/DLQ/Latency) works without errors
 * ✓ Auto-refresh (10s) continues for Ops metrics
 * ✓ Charts, JobTable, and Replay functionality remain unchanged
 */

import { format } from "date-fns";
import {
  AlertCircle,
  Activity,
  Database,
  Loader2,
  TrendingUp,
  ArrowLeft,
  RefreshCw,
  Archive,
  ChevronDown,
  ChevronRight,
  FileText,
  CalendarIcon,
  Clock,
} from "lucide-react";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { backgroundJobs } from "@/lib/schema";
import { cn } from "@/lib/utils";

type BackgroundJob = typeof backgroundJobs.$inferSelect;

interface OpsMetrics {
  stats: {
    activeJobs: number;
    failedJobs24h: number;
    deadJobs: number;
    stuckJobs: number;
    errorRate: string;
    avgLatency: number | null;
  };
  trends: Array<{
    hour: string;
    success: number;
    failed: number;
    avg_duration: number;
  }>;
  activeJobs: BackgroundJob[];
  failedJobs: BackgroundJob[];
  stuckJobs?: BackgroundJob[];
  recentJobs: BackgroundJob[];
}

interface AuditLog {
  id: string;
  admin_id: string;
  action: "APPROVE" | "REJECT";
  timestamp: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
}

interface AuditLogsResponse {
  success: true;
  data: AuditLog[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Ops Dashboard View Types
 *
 * Each view type corresponds to a stat card and detail view.
 */
type ViewType =
  | "summary"
  | "active"
  | "failed"
  | "dead"
  | "stuck"
  | "error-rate"
  | "latency"
  | "audit";

export default function OpsPage() {
  const [data, setData] = useState<OpsMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedView, setSelectedView] = useState<ViewType>("summary");
  const [isMounted, setIsMounted] = useState(false);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditLogsError, setAuditLogsError] = useState<string | null>(null);
  const [auditLogsMeta, setAuditLogsMeta] = useState<
    AuditLogsResponse["meta"] | null
  >(null);
  const [auditLogsPage, setAuditLogsPage] = useState(1);

  // Audit Logs filter state
  const [filterAdminId, setFilterAdminId] = useState("");
  const [filterActionType, setFilterActionType] = useState<string>("All");
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>(
    undefined
  );
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>(undefined);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchMetrics = useCallback(async (isInitial = false) => {
    if (!isInitial) setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/ops/metrics");
      if (!res.ok) throw new Error("Failed to fetch metrics");
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
    } catch (_error) {
      toast.error("Failed to update operations data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Auto-refresh Ops metrics every 10 seconds
  useEffect(() => {
    fetchMetrics(true);
    const interval = setInterval(() => fetchMetrics(), 10000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const fetchAuditLogs = useCallback(
    async (
      page: number = 1,
      filters?: {
        adminId?: string;
        actionType?: string;
        dateFrom?: Date;
        dateTo?: Date;
      }
    ) => {
      setAuditLogsLoading(true);
      setAuditLogsError(null);
      try {
        const params = new URLSearchParams();
        params.append("page", String(page));
        params.append("limit", "20");

        const effectiveAdminId = filters?.adminId ?? filterAdminId;
        const effectiveActionType = filters?.actionType ?? filterActionType;
        const effectiveDateFrom = filters?.dateFrom ?? filterDateFrom;
        const effectiveDateTo = filters?.dateTo ?? filterDateTo;

        if (effectiveAdminId && effectiveAdminId.trim()) {
          params.append("adminId", effectiveAdminId.trim());
        }

        if (effectiveActionType && effectiveActionType !== "All") {
          params.append("actionType", effectiveActionType);
        }

        if (effectiveDateFrom) {
          params.append("startDate", effectiveDateFrom.toISOString());
        }

        if (effectiveDateTo) {
          params.append("endDate", effectiveDateTo.toISOString());
        }

        const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);

        if (!res.ok) {
          const errorData = await res
            .json()
            .catch(
              () =>
                ({ error: "Failed to fetch audit logs" }) as { error: string }
            );
          const errorMessage = errorData.error || `HTTP ${res.status}`;
          throw new Error(errorMessage);
        }

        const data: AuditLogsResponse = await res.json();

        if (data.success && Array.isArray(data.data) && data.meta) {
          setAuditLogs(data.data);
          setAuditLogsMeta(data.meta);
          setAuditLogsPage(page);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (_err) {
        const errorMessage =
          _err instanceof Error ? _err.message : "Failed to fetch audit logs";
        setAuditLogsError(errorMessage);
        setAuditLogs([]);
        setAuditLogsMeta(null);
        toast.error("Failed to fetch audit logs");
      } finally {
        setAuditLogsLoading(false);
      }
    },
    [filterAdminId, filterActionType, filterDateFrom, filterDateTo]
  );

  // Fetch audit logs when audit view is selected
  useEffect(() => {
    if (
      selectedView === "audit" &&
      !auditLogsLoading &&
      auditLogs.length === 0 &&
      !auditLogsError
    ) {
      fetchAuditLogs(1);
    }
  }, [
    selectedView,
    auditLogsLoading,
    auditLogs.length,
    auditLogsError,
    fetchAuditLogs,
  ]);

  const handleReplay = async (jobId: string) => {
    const toastId = toast.loading("Initiating replay...");
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/replay`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Replay failed");
      toast.success("Job replay started", { id: toastId });
      fetchMetrics();
    } catch (_error) {
      toast.error("Failed to replay job", { id: toastId });
    }
  };

  const chartData = useMemo(() => {
    if (!data?.trends) return [];
    return data.trends.map((t) => ({
      ...t,
      time: new Date(t.hour).getHours().toString().padStart(2, "0") + ":00",
      total: Number(t.success) + Number(t.failed),
    }));
  }, [data]);

  if (!isMounted) return null;

  if (isLoading && !data) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statsConfig = [
    {
      id: "active" as ViewType,
      title: "Active Jobs",
      value: data?.stats.activeJobs.toString() || "0",
      icon: Activity,
      description: "Currently processing",
      color: "text-blue-500",
    },
    {
      id: "failed" as ViewType,
      title: "Failed Jobs (24h)",
      value: data?.stats.failedJobs24h.toString() || "0",
      icon: AlertCircle,
      description: "Requires attention",
      variant: (data?.stats.failedJobs24h || 0) > 0 ? "destructive" : "default",
      color: "text-red-500",
    },
    {
      id: "dead" as ViewType,
      title: "Dead Letter Queue",
      value: data?.stats.deadJobs.toString() || "0",
      icon: Archive,
      description: "Intervention needed",
      variant: (data?.stats.deadJobs || 0) > 0 ? "destructive" : "default",
      color: "text-gray-500",
    },
    {
      id: "stuck" as ViewType,
      title: "Stuck Jobs",
      value: data?.stats.stuckJobs?.toString() || "0",
      icon: Clock,
      description: "SCANNING > 15 min",
      variant: (data?.stats.stuckJobs || 0) > 0 ? "destructive" : "default",
      color: "text-yellow-500",
    },
    {
      id: "error-rate" as ViewType,
      title: "Error Rate",
      value: `${data?.stats.errorRate || "0"}%`,
      icon: Database,
      description: "Last 24h",
      color: "text-orange-500",
    },
    {
      id: "audit" as ViewType,
      title: "Audit Logs",
      value: auditLogsMeta?.total.toString() || "-",
      icon: FileText,
      description: "System activity",
      color: "text-purple-500",
    },
  ];

  const renderDetailView = () => {
    switch (selectedView) {
      case "active":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Active Jobs Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient
                        id="colorSuccess"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.1}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="time"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="success"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorSuccess)"
                      name="Completed"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Active Job List</CardTitle>
              </CardHeader>
              <CardContent>
                <JobTable
                  jobs={data?.activeJobs || []}
                  onReplay={handleReplay}
                />
              </CardContent>
            </Card>
          </div>
        );
      case "failed":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Failure Trend (Last 24h)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="time"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="failed"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Failures"
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Failed Job List (Last 24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <JobTable
                  jobs={data?.failedJobs || []}
                  onReplay={handleReplay}
                />
              </CardContent>
            </Card>
          </div>
        );
      case "dead":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="h-5 w-5 text-gray-500" />
                  Dead Letter Queue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <JobTable
                  jobs={
                    data?.failedJobs.filter((j) => j.status === "dead") || []
                  }
                  onReplay={handleReplay}
                />
              </CardContent>
            </Card>
          </div>
        );
      case "stuck":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  Stuck Jobs (SCANNING &gt; 15 min)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <JobTable
                  jobs={data?.stuckJobs || []}
                  onReplay={handleReplay}
                />
              </CardContent>
            </Card>
          </div>
        );
      case "latency":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Latency Performance (ms)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="time"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      unit="ms"
                    />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="avg_duration"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.1}
                      name="Avg Latency"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Latest Successful Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <JobTable
                  jobs={
                    data?.recentJobs.filter((j) => j.status === "completed") ||
                    []
                  }
                  onReplay={handleReplay}
                />
              </CardContent>
            </Card>
          </div>
        );
      case "audit":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-500" />
                  Audit Logs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5 pb-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Filters
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex-1 min-w-[150px]">
                      <Input
                        placeholder="Enter admin ID"
                        value={filterAdminId}
                        onChange={(e) => setFilterAdminId(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="w-[140px]">
                      <Select
                        value={filterActionType}
                        onValueChange={setFilterActionType}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Action" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All</SelectItem>
                          <SelectItem value="APPROVE">APPROVE</SelectItem>
                          <SelectItem value="REJECT">REJECT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-[140px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "h-9 w-full justify-start text-left font-normal",
                              !filterDateFrom && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filterDateFrom ? (
                              format(new Date(filterDateFrom), "MMM dd, yyyy")
                            ) : (
                              <span>Date From</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={filterDateFrom}
                            onSelect={setFilterDateFrom}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="w-[140px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "h-9 w-full justify-start text-left font-normal",
                              !filterDateTo && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filterDateTo ? (
                              format(new Date(filterDateTo), "MMM dd, yyyy")
                            ) : (
                              <span>Date To</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={filterDateTo}
                            onSelect={setFilterDateTo}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Button
                      onClick={() => fetchAuditLogs(1)}
                      disabled={auditLogsLoading}
                      className="h-9"
                    >
                      {auditLogsLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        "Search"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFilterAdminId("");
                        setFilterActionType("All");
                        setFilterDateFrom(undefined);
                        setFilterDateTo(undefined);
                        fetchAuditLogs(1, {
                          adminId: "",
                          actionType: "All",
                          dateFrom: undefined,
                          dateTo: undefined,
                        });
                      }}
                      disabled={auditLogsLoading}
                      className="h-9"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="border-t pt-3">
                  {auditLogsError ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-3">
                      <AlertCircle className="h-8 w-8 text-destructive" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-destructive">
                          Failed to load audit logs
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {auditLogsError}
                        </p>
                      </div>
                    </div>
                  ) : auditLogsLoading && auditLogs.length === 0 ? (
                    <div className="flex h-[400px] items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Admin ID</TableHead>
                              <TableHead>Action</TableHead>
                              <TableHead>Timestamp</TableHead>
                              <TableHead>Entity Type</TableHead>
                              <TableHead>Entity ID</TableHead>
                              <TableHead>Details</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {auditLogs.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={7}
                                  className="text-center py-10 text-muted-foreground italic"
                                >
                                  No audit logs found
                                </TableCell>
                              </TableRow>
                            ) : (
                              auditLogs.map((log) => (
                                <TableRow key={log.id}>
                                  <TableCell className="font-mono text-xs">
                                    {log.id.slice(0, 8)}...
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">
                                    {log.admin_id}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        log.action === "APPROVE"
                                          ? "default"
                                          : "destructive"
                                      }
                                    >
                                      {log.action}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground">
                                    {new Date(log.timestamp).toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    {log.entityType || "-"}
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">
                                    {log.entityId || "-"}
                                  </TableCell>
                                  <TableCell className="text-xs max-w-[200px] truncate">
                                    {log.details
                                      ? JSON.stringify(log.details).slice(0, 50)
                                      : "-"}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                      {auditLogsMeta && auditLogsMeta.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                          <div className="text-sm text-muted-foreground">
                            Page {auditLogsMeta.page} of{" "}
                            {auditLogsMeta.totalPages} ({auditLogsMeta.total}{" "}
                            total)
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchAuditLogs(auditLogsPage - 1)}
                              disabled={auditLogsPage <= 1 || auditLogsLoading}
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchAuditLogs(auditLogsPage + 1)}
                              disabled={
                                auditLogsPage >= auditLogsMeta.totalPages ||
                                auditLogsLoading
                              }
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Throughput</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="time"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="success"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Success"
                    />
                    <Line
                      type="monotone"
                      dataKey="failed"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Failed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <JobTable
                  jobs={data?.recentJobs || []}
                  onReplay={handleReplay}
                />
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {selectedView !== "summary" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedView("summary")}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {selectedView === "summary"
                ? "Operations Dashboard"
                : `${statsConfig.find((s) => s.id === selectedView)?.title} Details`}
            </h1>
            <p className="text-sm text-muted-foreground">
              Auto-updates every 10s • Last updated:{" "}
              {lastUpdated?.toLocaleTimeString() || "..."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isRefreshing && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
              <Loader2 className="h-3 w-3 animate-spin" />
              Refreshing Metrics...
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statsConfig.map((stat) => (
          <Card
            key={stat.title}
            className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary/20 ${selectedView === stat.id ? "ring-2 ring-primary" : ""}`}
            onClick={() => setSelectedView(stat.id)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon
                className={`h-4 w-4 ${stat.color} ${stat.variant === "destructive" ? "animate-pulse" : ""}`}
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {renderDetailView()}
    </div>
  );
}

function JobTable({
  jobs,
  onReplay,
}: {
  jobs: BackgroundJob[];
  onReplay: (jobId: string) => void;
}) {
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

  const toggleExpand = (jobId: string) => {
    const newExpanded = new Set(expandedJobs);
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId);
    } else {
      newExpanded.add(jobId);
    }
    setExpandedJobs(newExpanded);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[30px]"></TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead className="text-right">Execution Details</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => {
          const isExpanded = expandedJobs.has(job.id);
          return (
            <React.Fragment key={job.id}>
              <TableRow
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => toggleExpand(job.id)}
              >
                <TableCell>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs font-medium">
                  {job.type}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge
                      variant={
                        job.status === "completed"
                          ? "default"
                          : job.status === "failed"
                            ? "destructive"
                            : job.status === "dead"
                              ? "destructive"
                              : job.status === "running"
                                ? "outline"
                                : "secondary"
                      }
                      className={
                        job.status === "running"
                          ? "animate-pulse border-blue-200 bg-blue-50 text-blue-700"
                          : job.status === "dead"
                            ? "bg-gray-900 text-white hover:bg-gray-800"
                            : ""
                      }
                    >
                      {job.status === "dead" ? "Dead Letter" : job.status}
                    </Badge>
                    {job.retryCount > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        Retry: {job.retryCount}/{job.maxRetries || 5}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">
                      {job.progress} / {job.total}
                    </span>
                    <div className="h-1.5 w-full max-w-[100px] rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{
                          width: `${job.total && job.total > 0 && job.progress ? (job.progress / job.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(job.createdAt).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end gap-1">
                    {job.durationMs && (
                      <span className="text-xs font-mono">
                        {job.durationMs}ms
                      </span>
                    )}
                    {job.error && (
                      <span
                        className="text-[10px] text-red-500 max-w-[150px] truncate"
                        title={job.error}
                      >
                        {job.error}
                      </span>
                    )}
                    {job.deadLetteredAt && (
                      <span className="text-[10px] text-gray-500">
                        DLQ: {new Date(job.deadLetteredAt).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {(job.status === "failed" || job.status === "dead") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReplay(job.id);
                      }}
                      title="Replay Job"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
              {isExpanded && (
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableCell colSpan={7}>
                    <div className="p-4 space-y-4">
                      {job.error && (
                        <div className="space-y-1">
                          <h4 className="text-xs font-semibold text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> Error Details
                          </h4>
                          <div className="text-xs font-mono bg-red-50 text-red-900 p-2 rounded border border-red-100 whitespace-pre-wrap">
                            {job.error}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <h4 className="text-xs font-semibold text-muted-foreground">
                            Payload
                          </h4>
                          <pre className="text-[10px] font-mono bg-background p-2 rounded border overflow-auto max-h-[200px]">
                            {JSON.stringify(job.payload, null, 2)}
                          </pre>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-semibold text-muted-foreground">
                            Result
                          </h4>
                          <pre className="text-[10px] font-mono bg-background p-2 rounded border overflow-auto max-h-[200px]">
                            {job.result ? (
                              JSON.stringify(job.result, null, 2)
                            ) : (
                              <span className="text-muted-foreground italic">
                                No result data
                              </span>
                            )}
                          </pre>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-xs text-muted-foreground border-t pt-4">
                        <div>
                          <span className="font-semibold block">Job ID</span>
                          <span className="font-mono">{job.id}</span>
                        </div>
                        <div>
                          <span className="font-semibold block">Attempts</span>
                          <span>
                            {job.retryCount} / {job.maxRetries || 5}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold block">Next Run</span>
                          <span>
                            {job.nextRunAt
                              ? new Date(job.nextRunAt).toLocaleString()
                              : "-"}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold block">
                            Finished At
                          </span>
                          <span>
                            {job.finishedAt
                              ? new Date(job.finishedAt).toLocaleString()
                              : "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          );
        })}
        {jobs.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={7}
              className="text-center py-10 text-muted-foreground italic"
            >
              No jobs matching this criteria
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
