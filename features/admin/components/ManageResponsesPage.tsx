/**
 * ManageResponsesPage - Admin's view of advertiser responses
 *
 * UNIFIED MODEL EXPLANATION:
 *
 * This page shows the SAME creative requests, but filtered for advertiser stage.
 * It displays requests that have been forwarded to advertisers.
 *
 * TABS BREAKDOWN:
 * - All: All requests currently with or completed by advertiser
 * - New: Awaiting advertiser review (status='pending', approvalStage='advertiser')
 * - Approved: Advertiser approved (status='approved', approvalStage='completed')
 * - Rejected: Advertiser rejected (status='rejected', approvalStage='advertiser')
 * - Sent Back: [EXCLUDED] These appear in /requests page instead
 *
 * KEY POINT:
 * - These are NOT separate "response" entities
 * - They are the SAME creative requests that admin approved
 * - They are now at the advertiser approval stage
 * - The advertiser is reviewing the SAME offer and creative details
 * - The advertiser's action updates the SAME record
 *
 * DATA SOURCE:
 * Filtered from the same creative_requests table where:
 * - approvalStage IN ('advertiser', 'completed')
 * - Excluding: status='sent-back' (those go to /requests "Sent Back" tab)
 */

"use client";

import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronRight,
  ListFilter,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getVariables } from "@/components/_variables/variables";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { RequestStatus } from "../types/admin.types";
import { useManageResponsesViewModel } from "../view-models/useManageResponsesViewModel";

import { RequestSection } from "./RequestSection";

type TabValue = "all" | Exclude<RequestStatus, "pending">;
type SortOption =
  | "date-desc"
  | "date-asc"
  | "priority-high"
  | "priority-low"
  | "advertiser-asc"
  | "advertiser-desc";
type PriorityFilter = "all" | "high" | "medium";

export function ManageResponsesPage() {
  const variables = getVariables();
  const { responses, isLoading, error } = useManageResponsesViewModel();

  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<
    "sortBy" | "priority" | null
  >(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const getPriorityValue = useCallback((priority: string): number => {
    const lowerPriority = priority.toLowerCase();
    if (lowerPriority.includes("high")) return 3;
    if (lowerPriority.includes("medium")) return 2;
    if (lowerPriority.includes("low")) return 1;
    return 0;
  }, []);

  const parseDate = useCallback((dateString: string): Date => {
    const months: Record<string, number> = {
      january: 0,
      february: 1,
      march: 2,
      april: 3,
      may: 4,
      june: 5,
      july: 6,
      august: 7,
      september: 8,
      october: 9,
      november: 10,
      december: 11,
    };

    const match = dateString.match(/(\d+)[a-z]*\s+(\w+)\s+(\d+)/i);
    if (match) {
      const day = parseInt(match[1]);
      const monthName = match[2].toLowerCase();
      const year = parseInt(match[3]);
      const month = months[monthName];

      if (month !== undefined) {
        return new Date(year, month, day);
      }
    }

    return new Date(dateString);
  }, []);

  const searchInText = useCallback((text: string, query: string): boolean => {
    return text.toLowerCase().includes(query.toLowerCase());
  }, []);

  const filteredAndSortedResponses = useMemo(() => {
    let filtered = [...responses];

    if (activeTab !== "all") {
      filtered = filtered.filter(
        (response) => response.status.toLowerCase() === activeTab
      );
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((response) =>
        response.priority.toLowerCase().includes(priorityFilter.toLowerCase())
      );
    }

    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.trim();
      filtered = filtered.filter((response) => {
        return (
          searchInText(response.date, query) ||
          searchInText(response.advertiserName, query) ||
          searchInText(response.affiliateId, query) ||
          searchInText(response.priority, query) ||
          searchInText(response.offerId, query) ||
          searchInText(response.offerName, query) ||
          searchInText(response.clientId, query) ||
          searchInText(response.clientName, query) ||
          searchInText(response.creativeType, query) ||
          searchInText(response.status, query)
        );
      });
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc": {
          const aDate = parseDate(a.date);
          const bDate = parseDate(b.date);
          return bDate.getTime() - aDate.getTime();
        }
        case "date-asc": {
          const aDate = parseDate(a.date);
          const bDate = parseDate(b.date);
          return aDate.getTime() - bDate.getTime();
        }
        case "priority-high": {
          const aPriority = getPriorityValue(a.priority);
          const bPriority = getPriorityValue(b.priority);
          if (bPriority !== aPriority) {
            return bPriority - aPriority;
          }
          return parseDate(b.date).getTime() - parseDate(a.date).getTime();
        }
        case "priority-low": {
          const aPriority = getPriorityValue(a.priority);
          const bPriority = getPriorityValue(b.priority);
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
          return parseDate(b.date).getTime() - parseDate(a.date).getTime();
        }
        case "advertiser-asc": {
          return (a.advertiserName || "").localeCompare(
            b.advertiserName || "",
            undefined,
            { sensitivity: "base" }
          );
        }
        case "advertiser-desc": {
          return (b.advertiserName || "").localeCompare(
            a.advertiserName || "",
            undefined,
            { sensitivity: "base" }
          );
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    responses,
    activeTab,
    debouncedSearchQuery,
    sortBy,
    priorityFilter,
    getPriorityValue,
    parseDate,
    searchInText,
  ]);

  const clearFilters = () => {
    setSortBy("date-desc");
    setPriorityFilter("all");
    setSearchQuery("");
  };

  const hasActiveFilters = useMemo(() => {
    return (
      sortBy !== "date-desc" || priorityFilter !== "all" || searchQuery.trim()
    );
  }, [sortBy, priorityFilter, searchQuery]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (sortBy !== "date-desc") count++;
    if (priorityFilter !== "all") count++;
    return count;
  }, [searchQuery, sortBy, priorityFilter]);

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabValue)}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Popover
              open={isFilterOpen}
              onOpenChange={(open) => {
                setIsFilterOpen(open);
                if (!open) {
                  setActiveCategory(null);
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 font-inter font-medium rounded-md border shadow-[0_2px_4px_0_rgba(0,0,0,0.1)]"
                  style={{
                    color: variables.colors.buttonOutlineTextColor,
                    borderColor: variables.colors.buttonOutlineBorderColor,
                    backgroundColor: variables.colors.cardBackground,
                  }}
                >
                  <ListFilter className="h-5 w-5" />
                  Filter
                  {activeFiltersCount > 0 && (
                    <span
                      className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full"
                      style={{
                        backgroundColor:
                          variables.colors.buttonDefaultBackgroundColor,
                        color: variables.colors.buttonDefaultTextColor,
                      }}
                    >
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className={`p-0 transition-all ${activeCategory ? "w-[500px]" : "w-[250px]"}`}
                align="start"
              >
                <div className="flex">
                  <div
                    className={`${activeCategory ? "w-1/2 border-r border-gray-200" : "w-full"} p-3`}
                  >
                    <button
                      onClick={() => setActiveCategory("sortBy")}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-md text-sm transition-colors ${
                        activeCategory === "sortBy"
                          ? "bg-gray-100 text-gray-900 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span>Sort By</span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => setActiveCategory("priority")}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-md text-sm transition-colors ${
                        activeCategory === "priority"
                          ? "bg-gray-100 text-gray-900 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span>Priority</span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>

                  {activeCategory && (
                    <div className="w-1/2 p-3">
                      {activeCategory === "sortBy" && (
                        <div className="space-y-1">
                          {[
                            {
                              value: "date-desc",
                              label: "Newest First",
                              icon: ArrowDownAZ,
                            },
                            {
                              value: "date-asc",
                              label: "Oldest First",
                              icon: ArrowUpAZ,
                            },
                            {
                              value: "priority-high",
                              label: "Priority: High to Medium",
                              icon: ArrowDownAZ,
                            },
                            {
                              value: "priority-low",
                              label: "Priority: Medium to High",
                              icon: ArrowUpAZ,
                            },
                            {
                              value: "advertiser-asc",
                              label: "Advertiser: A-Z",
                              icon: ArrowDownAZ,
                            },
                            {
                              value: "advertiser-desc",
                              label: "Advertiser: Z-A",
                              icon: ArrowUpAZ,
                            },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSortBy(option.value as SortOption);
                                setIsFilterOpen(false);
                                setActiveCategory(null);
                              }}
                              className={`w-full text-left px-4 py-2.5 rounded-md text-sm transition-colors flex items-center gap-2 ${
                                sortBy === option.value
                                  ? "bg-gray-100 text-gray-900 font-medium"
                                  : "text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              <option.icon className="h-4 w-4" />
                              <span>{option.label}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {activeCategory === "priority" && (
                        <div className="space-y-1">
                          {["all", "high", "medium"].map((priority) => (
                            <button
                              key={priority}
                              onClick={() => {
                                setPriorityFilter(priority as PriorityFilter);
                                setIsFilterOpen(false);
                                setActiveCategory(null);
                              }}
                              className={`w-full text-left px-4 py-2.5 rounded-md text-sm transition-colors ${
                                priorityFilter === priority
                                  ? "bg-gray-100 text-gray-900 font-medium"
                                  : "text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              {priority === "all"
                                ? "All Priorities"
                                : priority === "high"
                                  ? "High Priority"
                                  : "Medium Priority"}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {hasActiveFilters && (
                  <div className="border-t border-gray-200 p-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        clearFilters();
                        setIsFilterOpen(false);
                        setActiveCategory(null);
                      }}
                      className="w-full h-9 font-inter text-sm gap-2"
                      style={{
                        borderColor: variables.colors.inputBorderColor,
                        color: variables.colors.inputTextColor,
                        backgroundColor: variables.colors.cardBackground,
                      }}
                    >
                      <X className="h-4 w-4" />
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            <TabsList
              className="flex-1 grid grid-cols-5 h-auto p-1 gap-1"
              style={{ backgroundColor: variables.colors.inputBackgroundColor }}
            >
              <TabsTrigger
                value="all"
                className="h-10 px-4 rounded-md font-medium transition-all cursor-pointer"
                style={{
                  backgroundColor:
                    activeTab === "all"
                      ? variables.colors.buttonDefaultBackgroundColor
                      : "#FFFFFF",
                  color:
                    activeTab === "all"
                      ? variables.colors.buttonDefaultTextColor
                      : variables.colors.inputTextColor,
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== "all") {
                    e.currentTarget.style.backgroundColor = "#F3F4F6";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== "all") {
                    e.currentTarget.style.backgroundColor = "#FFFFFF";
                  }
                }}
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="new"
                className="h-10 px-4 rounded-md font-medium transition-all cursor-pointer"
                style={{
                  backgroundColor:
                    activeTab === "new"
                      ? variables.colors.buttonDefaultBackgroundColor
                      : "#FFFFFF",
                  color:
                    activeTab === "new"
                      ? variables.colors.buttonDefaultTextColor
                      : variables.colors.inputTextColor,
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== "new") {
                    e.currentTarget.style.backgroundColor = "#F3F4F6";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== "new") {
                    e.currentTarget.style.backgroundColor = "#FFFFFF";
                  }
                }}
              >
                New
              </TabsTrigger>
              <TabsTrigger
                value="approved"
                className="h-10 px-4 rounded-md font-medium transition-all cursor-pointer"
                style={{
                  backgroundColor:
                    activeTab === "approved"
                      ? variables.colors.buttonDefaultBackgroundColor
                      : "#FFFFFF",
                  color:
                    activeTab === "approved"
                      ? variables.colors.buttonDefaultTextColor
                      : variables.colors.inputTextColor,
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== "approved") {
                    e.currentTarget.style.backgroundColor = "#F3F4F6";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== "approved") {
                    e.currentTarget.style.backgroundColor = "#FFFFFF";
                  }
                }}
              >
                Approved
              </TabsTrigger>
              <TabsTrigger
                value="rejected"
                className="h-10 px-4 rounded-md font-medium transition-all cursor-pointer"
                style={{
                  backgroundColor:
                    activeTab === "rejected"
                      ? variables.colors.buttonDefaultBackgroundColor
                      : "#FFFFFF",
                  color:
                    activeTab === "rejected"
                      ? variables.colors.buttonDefaultTextColor
                      : variables.colors.inputTextColor,
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== "rejected") {
                    e.currentTarget.style.backgroundColor = "#F3F4F6";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== "rejected") {
                    e.currentTarget.style.backgroundColor = "#FFFFFF";
                  }
                }}
              >
                Rejected
              </TabsTrigger>
              <TabsTrigger
                value="sent-back"
                className="h-10 px-4 rounded-md font-medium transition-all cursor-pointer"
                style={{
                  backgroundColor:
                    activeTab === "sent-back"
                      ? variables.colors.buttonDefaultBackgroundColor
                      : "#FFFFFF",
                  color:
                    activeTab === "sent-back"
                      ? variables.colors.buttonDefaultTextColor
                      : variables.colors.inputTextColor,
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== "sent-back") {
                    e.currentTarget.style.backgroundColor = "#F3F4F6";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== "sent-back") {
                    e.currentTarget.style.backgroundColor = "#FFFFFF";
                  }
                }}
              >
                Sent Back
              </TabsTrigger>
            </TabsList>

            <div className="relative w-80">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                style={{ color: variables.colors.inputPlaceholderColor }}
              />
              <Input
                type="text"
                placeholder="Search responses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 font-inter"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderColor: variables.colors.inputBorderColor,
                  color: variables.colors.inputTextColor,
                }}
              />
            </div>
          </div>
        </div>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {filteredAndSortedResponses.length === 0 ? (
            <div className="flex items-center justify-center p-12 border border-dashed rounded-lg">
              <div className="text-muted-foreground">
                No responses found matching your criteria.
              </div>
            </div>
          ) : (
            <RequestSection
              requests={filteredAndSortedResponses}
              startIndex={0}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
