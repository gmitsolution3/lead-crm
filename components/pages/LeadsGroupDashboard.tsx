"use client";

import { SearchGroupCard } from "@/components/features/search-groups/SearchGroupCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { useFetch } from "@/hooks";
import type { User } from "@/types";
import { SearchGroup } from "@/types";
import { motion } from "framer-motion";
import {
  FolderKanban,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

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
    if (page > 1) params.set("page", String(page));
    if (limit !== 12) params.set("limit", String(limit));

    const qs = params.toString();
    const newUrl = qs ? `${pathname}?${qs}` : pathname;
    window.history.replaceState(null, "", newUrl);
  }, [debouncedSearch, page, limit, pathname]);

  // Query parameters for server-side search and pagination
  const queryParams = useMemo(() => {
    return {
      page,
      limit,
      search: debouncedSearch || undefined,
    };
  }, [page, limit, debouncedSearch]);

  // Colocated SWR fetch with server-side pagination & query search
  const {
    data: resData,
    isLoading,
    isFetching,
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

  const handleSelectGroup = (queryOrId: string) => {
    router.push(`/leads/${encodeURIComponent(queryOrId)}`);
  };

  const isDataLoading = isLoading || isFetching;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
            Leads Groups
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Browse and manage lead extraction groups captured by your
            browser extension. Click any group to view its leads.
          </p>
        </div>

        {/* Quick Badges */}
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          {potentialClientsCount > 0 && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-terracotta-100 text-terracotta-900 border border-terracotta-200/90 shadow-2xs"
              title={`${potentialClientsCount} leads on this page do not have a website (ideal outreach targets)`}
            >
              <Sparkles className="h-3.5 w-3.5 text-terracotta-600" />
              <span>{potentialClientsCount} Potential Clients</span>
            </span>
          )}

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-oatmeal-200/80 text-stone-700 border border-stone-200/80">
            <FolderKanban className="h-3.5 w-3.5 text-stone-500" />
            <span>{meta.total} Total Groups</span>
          </div>
        </div>
      </div>

      {/* Filter & Server-Side Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div>
          <h2 className="text-xl font-bold text-botanical-900">
            Search Groups
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Organized lead extraction queries executed from the
            browser extension
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search groups by query..."
              className="h-9 pl-8 pr-8 text-xs bg-oatmeal-100/60 border-stone-200"
            />
            {isDataLoading && (
              <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400 animate-spin" />
            )}
          </div>
        </div>
      </div>

      {/* Grid or Empty/Loading State */}
      {isDataLoading && groups.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl border border-stone-200 bg-[#FCFBF8] p-12 text-sm text-stone-500">
          <Loader2 className="h-5 w-5 animate-spin mr-2 text-botanical-700" />
          <span>Loading search groups from server...</span>
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-[#FCFBF8] p-12 text-center">
          <p className="text-base font-semibold text-botanical-900">
            {searchQuery
              ? `No search groups matching "${searchQuery}"`
              : "No search groups found"}
          </p>
          <p className="text-xs text-stone-500 mt-1">
            {searchQuery
              ? "Try adjusting your search query filter."
              : "Search groups will appear here as the browser extension captures leads."}
          </p>
        </div>
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
    </div>
  );
}
