"use client";

import { LeadDetailSheet } from "@/components/features/leads/LeadDetailSheet";
import { LeadTableSkeletonRows } from "@/components/features/leads/LeadTableSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  WhatsAppIcon,
} from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
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
import { useFetch, usePatch } from "@/hooks";
import { formatDate } from "@/lib/utils";
import type { User } from "@/types";
import { Lead, SearchGroup } from "@/types";
import { LeadFormModal } from "@/components/features/leads/LeadFormModal";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpDown,
  CheckCircle2,
  Download,
  ExternalLink,
  Filter,
  FilterX,
  Globe,
  Loader2,
  Mail,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Target,
  Users,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

interface LeadsDashboardProps {
  user?: User | null;
  groupId: string;
}

export default function LeadsDashboard({
  user,
  groupId,
}: LeadsDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const decodedId = decodeURIComponent(groupId || "");
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);

  // 1. Fetch search group metadata & DB-computed metrics
  const {
    data: groupRes,
    isLoading: groupLoading,
    refetch: refetchGroup,
  } = useFetch<any>(`/search-groups/${encodeURIComponent(decodedId)}`);

  const group: SearchGroup | null = useMemo(() => {
    return groupRes?.data || groupRes || null;
  }, [groupRes]);

  const groupQuery = group?.query || decodedId;
  const targetGroupId = group?.groupId || decodedId;

  // 2. Table filters, search, sort, and pagination state initialized from URL query params
  const initialSearch = searchParams?.get("search") || "";
  const initialSource = searchParams?.get("source") || "all";
  const initialWebsite = (searchParams?.get("websiteFilter") as any) || "all";
  const initialSortBy = (searchParams?.get("sortBy") as any) || "default";
  const initialPage = Math.max(1, Number(searchParams?.get("page")) || 1);
  const initialLimit = Math.max(1, Number(searchParams?.get("limit")) || 10);

  const [tableSearch, setTableSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [sourceFilter, setSourceFilter] = useState<string>(initialSource);
  const [websiteFilter, setWebsiteFilter] = useState<
    "all" | "no-website" | "has-website"
  >(initialWebsite);
  const [sortBy, setSortBy] = useState<
    "default" | "newest" | "oldest" | "name_asc" | "name_desc"
  >(initialSortBy);
  const [page, setPage] = useState<number>(initialPage);
  const [limit, setLimit] = useState<number>(initialLimit);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(tableSearch.trim());
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [tableSearch]);

  // Sync URL query params with current filter/pagination state
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (sourceFilter !== "all") params.set("source", sourceFilter);
    if (websiteFilter !== "all") params.set("websiteFilter", websiteFilter);
    if (sortBy !== "default") params.set("sortBy", sortBy);
    if (page > 1) params.set("page", String(page));
    if (limit !== 10) params.set("limit", String(limit));

    const qs = params.toString();
    const newUrl = qs ? `${pathname}?${qs}` : pathname;
    window.history.replaceState(null, "", newUrl);
  }, [
    debouncedSearch,
    sourceFilter,
    websiteFilter,
    sortBy,
    page,
    limit,
    pathname,
  ]);

  // Query parameters for server-side leads fetch
  const queryParams = useMemo(() => {
    return {
      page,
      limit,
      search: debouncedSearch || undefined,
      source: sourceFilter !== "all" ? sourceFilter : undefined,
      websiteFilter:
        websiteFilter !== "all" ? websiteFilter : undefined,
      groupId: targetGroupId || undefined,
      sortBy: sortBy !== "default" ? sortBy : undefined,
    };
  }, [
    page,
    limit,
    debouncedSearch,
    sourceFilter,
    websiteFilter,
    targetGroupId,
    sortBy,
  ]);

  // Fetch paginated & filtered leads directly from backend
  const {
    data: leadsRes,
    isLoading: isLeadsLoading,
    isFetching,
    refetch: refetchLeads,
  } = useFetch<any>("/leads", queryParams);

  const leads: Lead[] = useMemo(() => {
    const items = leadsRes?.data;
    return Array.isArray(items) ? items : [];
  }, [leadsRes]);

  const meta = useMemo(() => {
    if (leadsRes?.meta) {
      return leadsRes.meta;
    }
    return {
      page,
      limit,
      total: leads.length,
      totalPages: Math.max(1, Math.ceil(leads.length / limit)),
      totalAll: group?.leadCount ?? leads.length,
      noWebsiteCount: group?.potentialCount ?? 0,
      hasWebsiteCount: Math.max(
        0,
        (group?.leadCount ?? leads.length) -
          (group?.potentialCount ?? 0),
      ),
    };
  }, [leadsRes, page, limit, leads.length, group]);

  const loading = isLeadsLoading || isFetching || groupLoading;

  const hasActiveFilters = Boolean(
    sourceFilter !== "all" ||
    websiteFilter !== "all" ||
    debouncedSearch ||
    tableSearch ||
    sortBy !== "default"
  );

  const handleResetFilters = useCallback(() => {
    setSourceFilter("all");
    setWebsiteFilter("all");
    setTableSearch("");
    setSortBy("default");
    setPage(1);
  }, []);

  // Reusable SWR mutation for remark saving with automatic cache invalidation
  const { mutateAsync: patchLeadRemark } = usePatch("/leads", {
    invalidateQueries: [["/search-groups"], ["/leads"]],
  });

  // Lead detail sheet state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(
    null,
  );

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsSheetOpen(true);
  };

  const handleSaveRemark = async (
    leadId: string,
    newRemark: string,
  ) => {
    if (selectedLead && selectedLead.leadId === leadId) {
      setSelectedLead((prev) =>
        prev
          ? {
              ...prev,
              remark: newRemark,
              updatedAt: new Date().toISOString(),
            }
          : null,
      );
    }

    try {
      await patchLeadRemark({
        id: `${encodeURIComponent(leadId)}/remark`,
        data: { remark: newRemark, groupId: targetGroupId },
      });
      setSyncFeedback("Remark saved successfully!");
    } catch {
      setSyncFeedback("Local remark updated (Offline mode)");
    }
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  // Unique sources for filter dropdown
  const uniqueSources = useMemo(() => {
    const set = new Set<string>([
      "Google Maps",
      "Facebook",
      "LinkedIn",
    ]);
    leads.forEach((l) => set.add(l.source));
    return Array.from(set);
  }, [leads]);

  const getSourceBadge = (source: string) => {
    const s = source.toLowerCase();
    if (s.includes("google") || s.includes("maps")) {
      return (
        <Badge
          variant="sage"
          className="rounded-full px-2.5 py-0.5 text-xs font-medium"
        >
          {source}
        </Badge>
      );
    }
    if (s.includes("instagram") || s.includes("facebook")) {
      return (
        <Badge
          variant="terracotta"
          className="rounded-full px-2.5 py-0.5 text-xs font-medium"
        >
          {source}
        </Badge>
      );
    }
    if (s.includes("linkedin")) {
      return (
        <Badge
          variant="default"
          className="rounded-full px-2.5 py-0.5 text-xs font-medium"
        >
          {source}
        </Badge>
      );
    }
    return (
      <Badge
        variant="secondary"
        className="rounded-full px-2.5 py-0.5 text-xs font-medium"
      >
        {source}
      </Badge>
    );
  };

  const handleExportCSV = useCallback(() => {
    const leadsToExport: Lead[] = group?.leads || leads || [];
    if (leadsToExport.length === 0) return;

    const headers = [
      "Lead ID",
      "Name",
      "Phone",
      "Email",
      "Website",
      "Potential Client",
      "Source",
      "Search Query",
      "Address",
      "WhatsApp",
      "Instagram",
      "LinkedIn",
      "Remark",
      "Created At",
    ];

    const rows = leadsToExport.map((l) => [
      `"${l.leadId}"`,
      `"${(l.name || "").replace(/"/g, '""')}"`,
      `"${l.phone || ""}"`,
      `"${l.email || ""}"`,
      `"${l.website || ""}"`,
      `"${!l.website ? "Yes (No Website)" : "No"}"`,
      `"${l.source || ""}"`,
      `"${(l.searchQuery || groupQuery).replace(/"/g, '""')}"`,
      `"${(l.address || "").replace(/"/g, '""')}"`,
      `"${l.whatsapp || ""}"`,
      `"${l.instagram || ""}"`,
      `"${l.linkedin || ""}"`,
      `"${(l.remark || "").replace(/"/g, '""')}"`,
      `"${l.createdAt}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `leads-${groupQuery.replace(/[^a-zA-Z0-9]/g, "_")}-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSyncFeedback("Search group leads exported as CSV!");
    setTimeout(() => setSyncFeedback(null), 4000);
  }, [group?.leads, leads, groupQuery]);

  const totalLeadsCount = group?.leadCount ?? meta.total;
  const potentialCount = group?.potentialCount ?? 0;

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      <AnimatePresence>
        {syncFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-8 z-50 rounded-xl bg-botanical-800 text-paper px-4 py-2.5 shadow-paper-lg border border-botanical-600 text-xs font-medium flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4 text-sage-300" />
            <span>{syncFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 pt-1">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/leads")}
            className="-ml-2 mb-2 text-xs text-stone-600 hover:text-botanical-900 hover:bg-oatmeal-200/60 gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Lead Directory</span>
          </Button>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Search Group Dataset
            </span>
            <Badge variant="sage" className="text-[10px]">
              {totalLeadsCount}{" "}
              {totalLeadsCount === 1 ? "lead" : "leads"}
            </Badge>
            {potentialCount > 0 && (
              <Badge
                variant="terracotta"
                className="text-[10px] gap-1 font-semibold bg-terracotta-100 text-terracotta-800 border-terracotta-200"
                title={`${potentialCount} businesses in this group without a website`}
              >
                <Target className="h-2.5 w-2.5 text-terracotta-600" />
                {potentialCount} Potential{" "}
                {potentialCount === 1 ? "Client" : "Clients"} (No
                Website)
              </Badge>
            )}
            {group?.groupId && (
              <span className="text-xs text-stone-400 bg-oatmeal-200/70 px-2 py-0.5 rounded-md">
                {group.groupId}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-botanical-900">
            &ldquo;{groupQuery}&rdquo;
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Extracted leads collected under this search query from
            your browser extension.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            size="sm"
            onClick={() => setIsAddLeadOpen(true)}
            className="text-xs h-9 bg-botanical-800 hover:bg-botanical-900 text-paper gap-1.5 cursor-pointer rounded-xl shadow-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Lead</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={totalLeadsCount === 0}
            className="text-xs h-9 text-botanical-800 border-stone-300 gap-1.5 cursor-pointer rounded-xl disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5 text-sage-600" />
            <span>Export Group CSV</span>
          </Button>
        </div>
      </div>

      {/* Leads Table Controls & Content */}
      <div className="space-y-4">
        {/* Table Toolbar */}
        <div className="rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-4">
          {/* Top Row: Search Input and Status Counter */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="w-full sm:max-w-md">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-1">
                Search Leads
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                <Input
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Search by business name, phone, email, or address..."
                  className="h-9 pl-8 text-xs bg-oatmeal-100/60 border-stone-200"
                />
              </div>
            </div>

            {/* Status counter indicator */}
            <div className="flex items-center gap-2 text-xs font-medium text-stone-500 self-end sm:self-auto pt-2 sm:pt-4">
              {loading ? (
                <span className="flex items-center gap-1.5 text-sage-600">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Loading leads...</span>
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
                  of {meta.total} leads
                </span>
              )}
            </div>
          </div>

          {/* Bottom Row: Labeled Filters */}
          <div className="flex flex-wrap items-end gap-3 pt-3 border-t border-stone-200/70">
            {/* 1. Website Status / Opportunity Quick Tabs */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                Website Opportunity
              </label>
              <div className="flex items-center rounded-xl bg-oatmeal-200/70 p-1 border border-stone-200/80">
                <button
                  type="button"
                  onClick={() => {
                    setWebsiteFilter("all");
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    websiteFilter === "all"
                      ? "bg-paper text-botanical-900 shadow-xs"
                      : "text-stone-600 hover:text-botanical-900"
                  }`}
                >
                  All ({meta.totalAll ?? meta.total})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWebsiteFilter("no-website");
                    setPage(1);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    websiteFilter === "no-website"
                      ? "bg-terracotta-100 text-terracotta-900 shadow-xs border border-terracotta-300"
                      : "text-terracotta-700 hover:bg-terracotta-50/80"
                  }`}
                  title="Businesses without a website are prime potential clients"
                >
                  <Target className="h-3.5 w-3.5 text-terracotta-600" />
                  <span>
                    Potential Clients ({meta.noWebsiteCount ?? 0})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWebsiteFilter("has-website");
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    websiteFilter === "has-website"
                      ? "bg-paper text-botanical-900 shadow-xs"
                      : "text-stone-600 hover:text-botanical-900"
                  }`}
                >
                  With Website ({meta.hasWebsiteCount ?? 0})
                </button>
              </div>
            </div>

            {/* 2. Platform Source Filter */}
            <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[180px]">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                Platform Source
              </label>
              <Select
                value={sourceFilter}
                onValueChange={(val) => {
                  setSourceFilter(val || "all");
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-oatmeal-100/60 border-stone-200 text-stone-700 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <Filter className="h-3 w-3 text-botanical-700 shrink-0" />
                    <SelectValue placeholder="Lead Source" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Source: All Platforms</SelectItem>
                  {uniqueSources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 3. Sort Order */}
            <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[210px]">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                Sort Order
              </label>
              <Select
                value={sortBy}
                onValueChange={(val) => {
                  setSortBy(val || "default");
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-oatmeal-100/60 border-stone-200 text-stone-700 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <ArrowUpDown className="h-3 w-3 text-stone-500 shrink-0" />
                    <SelectValue placeholder="Sort Order" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">
                    Default (Source Priority)
                  </SelectItem>
                  <SelectItem value="newest">
                    Newest Captured First
                  </SelectItem>
                  <SelectItem value="oldest">
                    Oldest Captured First
                  </SelectItem>
                  <SelectItem value="name_asc">
                    Business Name (A - Z)
                  </SelectItem>
                  <SelectItem value="name_desc">
                    Business Name (Z - A)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset button if filtered */}
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

        {/* Warm-toned Zebra Striped Table Card */}
        <div className="rounded-2xl border border-stone-200/90 bg-[#FCFBF8] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-stone-200 bg-oatmeal-200/60 hover:bg-oatmeal-200/60">
                <TableHead className="w-[260px] h-12 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-stone-600">
                  Lead / Business Name
                </TableHead>
                <TableHead className="w-[200px] h-12 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-stone-600">
                  Contact Info
                </TableHead>
                <TableHead className="w-[180px] h-12 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-stone-600">
                  Website / Status
                </TableHead>
                <TableHead className="w-[130px] h-12 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-stone-600">
                  Source
                </TableHead>
                <TableHead className="w-[200px] h-12 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-stone-600">
                  Search Query
                </TableHead>
                <TableHead className="w-[140px] h-12 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-stone-600 text-center">
                  Social Links
                </TableHead>
                <TableHead className="w-[90px] h-12 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-stone-600 text-right">
                  Added
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && leads.length === 0 ? (
                <LeadTableSkeletonRows rows={limit > 10 ? 10 : limit} />
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-8 sm:p-12 text-center">
                    <EmptyState
                      compact
                      icon={hasActiveFilters ? FilterX : Users}
                      title={
                        hasActiveFilters
                          ? "No Leads Match the Selected Filters"
                          : "No Leads Captured in This Group"
                      }
                      description={
                        hasActiveFilters
                          ? "Try clearing or relaxing your search query and filters to see more results."
                          : "Capture leads from Google Maps or other sources using the browser extension to populate this group."
                      }
                      action={
                        hasActiveFilters
                          ? {
                              label: "Reset All Filters",
                              onClick: handleResetFilters,
                              icon: RotateCcw,
                            }
                          : {
                              label: "Add Lead Manually",
                              onClick: () => setIsAddLeadOpen(true),
                              icon: Plus,
                            }
                      }
                      className="border-0 bg-transparent p-0"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead, index) => {
                  const isEven = index % 2 === 1;
                  return (
                    <TableRow
                      key={lead.leadId}
                      onClick={() => handleSelectLead(lead)}
                      className={`cursor-pointer transition-colors border-b border-stone-200/60 ${
                        isEven ? "bg-oatmeal-100/40" : "bg-paper"
                      } hover:bg-sage-100/50`}
                    >
                      {/* Name Column */}
                      <TableCell className="px-4 py-3.5 font-medium">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-sm shadow-sm ${
                              !lead.website
                                ? "bg-terracotta-100 text-terracotta-900 border border-terracotta-200"
                                : "bg-sage-200/80 text-botanical-900"
                            }`}
                          >
                            {lead.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-botanical-900 truncate hover:text-botanical-700 transition-colors">
                              {lead.name}
                            </p>
                            <p className="text-[11px] text-stone-400 truncate max-w-[200px]">
                              {lead.address || "No address"}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Contact Stack (Email / Phone) */}
                      <TableCell className="px-4 py-3.5">
                        <div className="flex flex-col space-y-1 text-xs">
                          {lead.email ? (
                            <div className="flex items-center gap-1.5 text-stone-700 font-medium truncate max-w-[200px]">
                              <Mail className="h-3 w-3 text-sage-600 shrink-0" />
                              <span className="truncate">
                                {lead.email}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-stone-400 italic">
                              No email
                            </span>
                          )}

                          {lead.phone ? (
                            <div className="flex items-center gap-1.5 text-stone-600 text-[11px] truncate">
                              <Phone className="h-3 w-3 text-stone-400 shrink-0" />
                              <span>{lead.phone}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-stone-400 italic">
                              No phone
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Website / Opportunity Status */}
                      <TableCell className="px-4 py-3.5">
                        {lead.website ? (
                          <a
                            href={
                              lead.website.startsWith("http")
                                ? lead.website
                                : `https://${lead.website}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 text-xs text-botanical-800 hover:text-botanical-600 hover:underline max-w-[160px] truncate"
                            title={lead.website}
                          >
                            <Globe className="h-3.5 w-3.5 text-sage-600 shrink-0" />
                            <span className="truncate">
                              {lead.website.replace(
                                /^https?:\/\/(www\.)?/,
                                "",
                              )}
                            </span>
                            <ExternalLink className="h-2.5 w-2.5 text-stone-400 shrink-0" />
                          </a>
                        ) : (
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="inline-flex items-center gap-1 rounded-full bg-terracotta-100/90 border border-terracotta-300/80 px-2.5 py-0.5 text-[10px] font-semibold text-terracotta-800 shadow-2xs whitespace-nowrap">
                              <Target className="h-2.5 w-2.5 text-terracotta-600 shrink-0" />
                              Potential Client
                            </span>
                            <span className="text-[10px] text-stone-400 italic pl-1">
                              No website
                            </span>
                          </div>
                        )}
                      </TableCell>

                      {/* Source Badge */}
                      <TableCell className="px-4 py-3.5">
                        {getSourceBadge(lead.source)}
                      </TableCell>

                      {/* Search Query */}
                      <TableCell className="px-4 py-3.5">
                        <span className="inline-block max-w-[200px] truncate text-xs text-stone-600 rounded-md bg-oatmeal-200/60 px-2 py-1">
                          {lead.searchQuery}
                        </span>
                      </TableCell>

                      {/* Social Links */}
                      <TableCell className="px-4 py-3.5">
                        <div
                          className="flex items-center justify-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* WhatsApp */}
                          {lead.whatsapp ? (
                            <a
                              href={`https://wa.me/${lead.whatsapp.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <WhatsAppIcon className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-300">
                              <WhatsAppIcon className="h-3.5 w-3.5 opacity-30" />
                            </span>
                          )}

                          {/* Instagram */}
                          {lead.instagram ? (
                            <a
                              href={lead.instagram}
                              target="_blank"
                              rel="noreferrer"
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-terracotta-50 text-terracotta-700 hover:bg-terracotta-100 transition-colors"
                              title="Open Instagram"
                            >
                              <InstagramIcon className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-300">
                              <InstagramIcon className="h-3.5 w-3.5 opacity-30" />
                            </span>
                          )}

                          {/* LinkedIn */}
                          {lead.linkedin ? (
                            <a
                              href={lead.linkedin}
                              target="_blank"
                              rel="noreferrer"
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-botanical-50 text-botanical-800 hover:bg-botanical-100 transition-colors"
                              title="Open LinkedIn"
                            >
                              <LinkedinIcon className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-300">
                              <LinkedinIcon className="h-3.5 w-3.5 opacity-30" />
                            </span>
                          )}

                          {/* Facebook */}
                          {lead.facebook ? (
                            <a
                              href={lead.facebook}
                              target="_blank"
                              rel="noreferrer"
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
                              title="Open Facebook"
                            >
                              <FacebookIcon className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-300">
                              <FacebookIcon className="h-3.5 w-3.5 opacity-30" />
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="px-4 py-3.5 text-right text-xs text-stone-400">
                        {formatDate(lead.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Backend-Driven Reusable Pagination Controls */}
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          total={meta.total}
          limit={limit}
          pageSizeOptions={[10, 20, 50]}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          isLoading={loading}
          itemLabel="leads"
          limitLabel="Rows per page:"
          variant="page-of"
        />
      </div>

      {/* Slide-out Physical Paper Lead Detail Sheet */}
      <LeadDetailSheet
        lead={selectedLead}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSaveRemark={handleSaveRemark}
      />

      {/* Add Single Lead Manually Modal */}
      <LeadFormModal
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        targetGroup={group || { groupId: targetGroupId, query: groupQuery }}
        onSuccess={() => {
          refetchLeads();
          refetchGroup();
          setSyncFeedback("Lead successfully added to this group!");
          setTimeout(() => setSyncFeedback(null), 3000);
        }}
      />
    </div>
  );
}
