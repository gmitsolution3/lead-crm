"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  FolderKanban,
  Loader2,
  RotateCcw,
  Search,
  FilterX,
  ArrowUpDown,
  Calendar,
  Layers,
  Target,
  Plus,
} from "lucide-react";
import { SearchGroupCard } from "@/components/features/search-groups/SearchGroupCard";
import { SearchGroupSkeletonGrid } from "@/components/features/search-groups/SearchGroupSkeleton";
import { LeadFormModal } from "@/components/features/leads/LeadFormModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFetch } from "@/hooks";
import type { User, SearchGroup } from "@/types";

interface LeadsGroupDashboardProps {
  user?: User | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export default function LeadsGroupDashboard({
  user,
}: LeadsGroupDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialSearch = searchParams?.get("search") || "";
  const initialPage = Math.max(1, Number(searchParams?.get("page")) || 1);
  const initialLimit = Math.max(1, Number(searchParams?.get("limit")) || 12);
  const initialPotential = searchParams?.get("potential") || "all";
  const initialSize = searchParams?.get("size") || "all";
  const initialDateRange = searchParams?.get("dateRange") || "all";
  const initialSortBy = searchParams?.get("sortBy") || "newest";

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [potentialFilter, setPotentialFilter] = useState(initialPotential);
  const [sizeFilter, setSizeFilter] = useState(initialSize);
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [groupForAddLead, setGroupForAddLead] = useState<SearchGroup | null>(null);
  const [isGlobalAddLeadOpen, setIsGlobalAddLeadOpen] = useState(false);

  // Debounce search query so backend isn't spammed while typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync URL query params with current filter/pagination state
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (potentialFilter !== "all") params.set("potential", potentialFilter);
    if (sizeFilter !== "all") params.set("size", sizeFilter);
    if (dateRange !== "all") params.set("dateRange", dateRange);
    if (sortBy !== "newest") params.set("sortBy", sortBy);
    if (page > 1) params.set("page", String(page));
    if (limit !== 12) params.set("limit", String(limit));

    const qs = params.toString();
    const newUrl = qs ? `${pathname}?${qs}` : pathname;
    window.history.replaceState(null, "", newUrl);
  }, [
    debouncedSearch,
    potentialFilter,
    sizeFilter,
    dateRange,
    sortBy,
    page,
    limit,
    pathname,
  ]);

  // Query parameters for server-side search, filtering, and pagination
  const queryParams = useMemo(() => {
    return {
      page,
      limit,
      search: debouncedSearch || undefined,
      potentialFilter:
        potentialFilter !== "all" ? potentialFilter : undefined,
      sizeFilter: sizeFilter !== "all" ? sizeFilter : undefined,
      dateRange: dateRange !== "all" ? dateRange : undefined,
      sortBy: sortBy !== "newest" ? sortBy : undefined,
    };
  }, [
    page,
    limit,
    debouncedSearch,
    potentialFilter,
    sizeFilter,
    dateRange,
    sortBy,
  ]);

  // Colocated SWR fetch with server-side pagination & filters
  const {
    data: resData,
    isLoading,
    isFetching,
    refetch,
  } = useFetch<any>("/search-groups", queryParams);

  const groups: SearchGroup[] = useMemo(() => {
    const raw = resData?.data || resData;
    return Array.isArray(raw) ? raw : [];
  }, [resData]);

  // Pagination metadata from server
  const meta = useMemo(() => {
    if (resData?.meta) {
      return resData.meta;
    }
    return {
      page,
      limit,
      total: groups.length,
      totalPages: Math.max(1, Math.ceil(groups.length / limit)),
    };
  }, [resData, page, limit, groups.length]);

  const potentialClientsCount = useMemo(() => {
    return groups.reduce(
      (acc, g) => acc + (g.potentialCount ?? 0),
      0,
    );
  }, [groups]);

  const hasActiveFilters = Boolean(
    debouncedSearch ||
      searchQuery ||
      potentialFilter !== "all" ||
      sizeFilter !== "all" ||
      dateRange !== "all" ||
      sortBy !== "newest",
  );

  const handleResetFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setPotentialFilter("all");
    setSizeFilter("all");
    setDateRange("all");
    setSortBy("newest");
    setPage(1);
  };

  const handleSelectGroup = (queryOrId: string) => {
    router.push(`/leads/${encodeURIComponent(queryOrId)}`);
  };

  const isDataLoading = isLoading || isFetching;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Data Repository
            </span>
            <Badge variant="sage" className="text-[10px]">
              {meta.total} {meta.total === 1 ? "group" : "groups"}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-botanical-900">
            Lead Directory
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Browse and manage lead extraction groups captured by your
            browser extension. Click any group to view its leads.
          </p>
        </div>

        {/* Actions & Badges */}
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          {potentialClientsCount > 0 && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-terracotta-100 text-terracotta-900 border border-terracotta-200/90 shadow-2xs"
              title={`${potentialClientsCount} leads on this page do not have a website (ideal outreach targets)`}
            >
              <Target className="h-3.5 w-3.5 text-terracotta-600" />
              <span>{potentialClientsCount} Potential on this page</span>
            </span>
          )}

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-oatmeal-200/80 text-stone-700 border border-stone-200/80">
            <FolderKanban className="h-3.5 w-3.5 text-stone-500" />
            <span>{meta.total} Filtered Groups</span>
          </div>

          <Button
            size="sm"
            onClick={() => setIsGlobalAddLeadOpen(true)}
            className="text-xs h-9 bg-botanical-800 hover:bg-botanical-900 text-white gap-1.5 cursor-pointer rounded-xl shadow-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Lead</span>
          </Button>
        </div>
      </div>

      {/* Server-Side Controls & Filter Bar */}
      <div className="rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-4">
        {/* Top Row: Search and Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="w-full sm:max-w-md">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-1">
              Search Groups
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by query term or group ID..."
                className="h-9 pl-8 pr-8 text-xs bg-oatmeal-100/60 border-stone-200"
              />
              {isDataLoading && (
                <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400 animate-spin" />
              )}
            </div>
          </div>

          {/* Quick Counter Info */}
          <div className="flex items-center gap-2 text-xs font-medium text-stone-500 self-end sm:self-auto pt-2 sm:pt-4">
            {isDataLoading ? (
              <span className="flex items-center gap-1.5 text-sage-700">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Syncing groups...</span>
              </span>
            ) : (
              <span>
                Showing{" "}
                <strong className="text-botanical-900">
                  {meta.total === 0
                    ? 0
                    : (meta.page - 1) * meta.limit + 1}
                  -{Math.min(meta.page * meta.limit, meta.total)}
                </strong>{" "}
                of {meta.total} groups
              </span>
            )}
          </div>
        </div>

        {/* Bottom Row: Server-Side Filters with Clear Labels */}
        <div className="flex flex-wrap items-end gap-3 pt-3 border-t border-stone-200/70">
          {/* 1. Potential Clients Filter */}
          <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[210px]">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              Target Opportunity
            </label>
            <Select
              value={potentialFilter}
              onValueChange={(val) => {
                setPotentialFilter(val || "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs bg-oatmeal-100/60 border-stone-200 text-stone-700 rounded-xl">
                <div className="flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-terracotta-600 shrink-0" />
                  <SelectValue placeholder="Client Opportunity" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Opportunity: All Groups</SelectItem>
                <SelectItem value="has_potential">
                  Has Potential Clients (No Website)
                </SelectItem>
                <SelectItem value="high_potential">
                  High Opportunity (5+ Leads)
                </SelectItem>
                <SelectItem value="no_potential">
                  No Potential Clients (All Have Websites)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 2. Dataset Size Filter */}
          <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[170px]">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              Lead Volume
            </label>
            <Select
              value={sizeFilter}
              onValueChange={(val) => {
                setSizeFilter(val || "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs bg-oatmeal-100/60 border-stone-200 text-stone-700 rounded-xl">
                <div className="flex items-center gap-1.5">
                  <Layers className="h-3 w-3 text-botanical-700 shrink-0" />
                  <SelectValue placeholder="Group Size" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Volume: All Sizes</SelectItem>
                <SelectItem value="has_leads">Has Leads (&gt;0)</SelectItem>
                <SelectItem value="10_plus">10+ Leads</SelectItem>
                <SelectItem value="50_plus">50+ Leads</SelectItem>
                <SelectItem value="empty">Empty Groups (0 Leads)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 3. Extraction Recency Date Range */}
          <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[160px]">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              Extraction Date
            </label>
            <Select
              value={dateRange}
              onValueChange={(val) => {
                setDateRange(val || "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs bg-oatmeal-100/60 border-stone-200 text-stone-700 rounded-xl">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-sage-600 shrink-0" />
                  <SelectValue placeholder="Extraction Date" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Date: All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 4. Sort By Dropdown */}
          <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[210px]">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              Sort Order
            </label>
            <Select
              value={sortBy}
              onValueChange={(val) => {
                setSortBy(val || "newest");
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs bg-oatmeal-100/60 border-stone-200 text-stone-700 rounded-xl">
                <div className="flex items-center gap-1.5">
                  <ArrowUpDown className="h-3 w-3 text-stone-500 shrink-0" />
                  <SelectValue placeholder="Sort Groups" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">
                  Sort: Recently Extracted (Default)
                </SelectItem>
                <SelectItem value="most_leads">
                  Sort: Most Leads
                </SelectItem>
                <SelectItem value="least_leads">
                  Sort: Least Leads
                </SelectItem>
                <SelectItem value="most_potential">
                  Sort: Most Potential Clients
                </SelectItem>
                <SelectItem value="query_asc">
                  Sort: Query (A - Z)
                </SelectItem>
                <SelectItem value="query_desc">
                  Sort: Query (Z - A)
                </SelectItem>
                <SelectItem value="oldest">
                  Sort: Oldest Extracted
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <div className="ml-auto pb-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 text-xs text-stone-500 hover:text-stone-800 gap-1.5 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5 text-stone-400" />
                <span>Reset Filters</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Grid or Empty/Loading State */}
      {isDataLoading && groups.length === 0 ? (
        <SearchGroupSkeletonGrid count={limit > 6 ? 6 : limit} />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={hasActiveFilters ? FilterX : FolderKanban}
          title={
            hasActiveFilters
              ? "No Search Groups Match Your Filters"
              : "No Search Groups Found"
          }
          description={
            hasActiveFilters
              ? "We couldn't find any search query groups matching the selected criteria. Try adjusting or clearing your filters."
              : "Search groups are automatically created as the GM Lead Generator browser extension captures leads."
          }
          action={
            hasActiveFilters
              ? {
                  label: "Reset All Filters",
                  onClick: handleResetFilters,
                  icon: RotateCcw,
                }
              : undefined
          }
        />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {groups.map((group) => {
            const count =
              group.leadCount ??
              (Array.isArray(group.leads) ? group.leads.length : 0);

            const potentialCount =
              group.potentialCount ??
              (Array.isArray(group.leads)
                ? group.leads.filter((l) => !l.website).length
                : 0);

            return (
              <motion.div key={group.groupId} variants={itemVariants}>
                <SearchGroupCard
                  group={group}
                  leadCount={count}
                  potentialCount={potentialCount}
                  onFilterByGroup={handleSelectGroup}
                  onAddLead={(grp) => setGroupForAddLead(grp)}
                />
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Backend-Driven Reusable Pagination Controls */}
      <Pagination
        page={meta.page}
        totalPages={meta.totalPages}
        total={meta.total}
        limit={limit}
        pageSizeOptions={[6, 12, 24, 48]}
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        isLoading={isDataLoading}
        itemLabel="groups"
        variant="range"
        hideOnSinglePage={true}
      />

      {/* Add Single Lead Manually Modal */}
      <LeadFormModal
        isOpen={isGlobalAddLeadOpen || !!groupForAddLead}
        onClose={() => {
          setIsGlobalAddLeadOpen(false);
          setGroupForAddLead(null);
        }}
        targetGroup={groupForAddLead}
        searchGroups={groups}
        onSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
}
