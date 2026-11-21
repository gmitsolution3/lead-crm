"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Lead } from "@/types";
import { formatDate } from "@/lib/utils";
import { useFetch } from "@/hooks";
import {
  Mail,
  Phone,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Sparkles,
  Globe,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  WhatsAppIcon,
} from "@/components/ui/icons";

interface LeadTableProps {
  leads?: Lead[];
  groupId?: string;
  onSelectLead: (lead: Lead) => void;
  externalSearch?: string;
  selectedGroupQuery?: string | null;
  onClearGroupFilter?: () => void;
}

function generatePageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | "...")[] = [];
  pages.push(1);
  if (current > 3) {
    pages.push("...");
  }
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (current < total - 2) {
    pages.push("...");
  }
  pages.push(total);
  return pages;
}

export function LeadTable({
  leads = [],
  groupId,
  onSelectLead,
  externalSearch = "",
  selectedGroupQuery,
  onClearGroupFilter,
}: LeadTableProps) {
  const [tableSearch, setTableSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [websiteFilter, setWebsiteFilter] = useState<"all" | "no-website" | "has-website">("all");
  const [sortBy, setSortBy] = useState<"default" | "newest" | "oldest" | "name_asc" | "name_desc">("default");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // Debounce search input so backend isn't spammed while typing
  const effectiveSearch = (tableSearch || externalSearch).trim();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(effectiveSearch);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [effectiveSearch]);

  const targetGroup = (groupId || selectedGroupQuery || "").trim();

  // Query parameters for the reusable SWR useFetch hook
  const queryParams = useMemo(() => {
    return {
      page,
      limit,
      search: debouncedSearch || undefined,
      source: sourceFilter !== "all" ? sourceFilter : undefined,
      websiteFilter: websiteFilter !== "all" ? websiteFilter : undefined,
      groupId: targetGroup || undefined,
      sortBy: sortBy !== "default" ? sortBy : undefined,
    };
  }, [page, limit, debouncedSearch, sourceFilter, websiteFilter, targetGroup, sortBy]);

  // Fetch paginated & filtered leads using reusable SWR useFetch hook
  const {
    data: resData,
    isLoading: isQueryLoading,
    isFetching,
  } = useFetch<any>("/leads", queryParams);

  // Server-side loaded leads with fallback to props
  const serverLeads = useMemo<Lead[]>(() => {
    const items = resData?.data;
    if (Array.isArray(items)) {
      return items;
    }
    // Offline / props fallback
    if (leads.length > 0) {
      const filtered = leads.filter((l) => {
        if (targetGroup && l.groupId !== targetGroup && l.searchQuery !== targetGroup) return false;
        if (sourceFilter !== "all" && l.source.toLowerCase() !== sourceFilter.toLowerCase()) return false;
        if (websiteFilter === "no-website" && l.website) return false;
        if (websiteFilter === "has-website" && !l.website) return false;
        if (debouncedSearch) {
          const s = debouncedSearch.toLowerCase();
          return (
            l.name.toLowerCase().includes(s) ||
            l.phone?.toLowerCase().includes(s) ||
            l.email?.toLowerCase().includes(s) ||
            l.website?.toLowerCase().includes(s) ||
            l.address?.toLowerCase().includes(s)
          );
        }
        return true;
      });

      const skip = (page - 1) * limit;
      return filtered.slice(skip, skip + limit);
    }
    return [];
  }, [resData, leads, targetGroup, sourceFilter, websiteFilter, debouncedSearch, page, limit]);

  // Pagination metadata from SWR cache or computed fallback
  const meta = useMemo(() => {
    if (resData?.meta) {
      return resData.meta;
    }
    const filtered = leads.filter((l) => {
      if (targetGroup && l.groupId !== targetGroup && l.searchQuery !== targetGroup) return false;
      if (sourceFilter !== "all" && l.source.toLowerCase() !== sourceFilter.toLowerCase()) return false;
      if (websiteFilter === "no-website" && l.website) return false;
      if (websiteFilter === "has-website" && !l.website) return false;
      if (debouncedSearch) {
        const s = debouncedSearch.toLowerCase();
        return (
          l.name.toLowerCase().includes(s) ||
          l.phone?.toLowerCase().includes(s) ||
          l.email?.toLowerCase().includes(s) ||
          l.website?.toLowerCase().includes(s) ||
          l.address?.toLowerCase().includes(s)
        );
      }
      return true;
    });

    const total = filtered.length;
    return {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      totalAll: leads.length,
      noWebsiteCount: leads.filter((l) => !l.website).length,
      hasWebsiteCount: leads.filter((l) => Boolean(l.website)).length,
    };
  }, [resData, leads, targetGroup, sourceFilter, websiteFilter, debouncedSearch, page, limit]);

  const loading = isQueryLoading || isFetching;

  // Unique sources for filter dropdown
  const uniqueSources = useMemo(() => {
    const set = new Set<string>(["Google Maps", "Facebook", "LinkedIn"]);
    leads.forEach((l) => set.add(l.source));
    serverLeads.forEach((l) => set.add(l.source));
    return Array.from(set);
  }, [leads, serverLeads]);

  const getSourceBadge = (source: string) => {
    const s = source.toLowerCase();
    if (s.includes("google") || s.includes("maps")) {
      return (
        <Badge variant="sage" className="rounded-full px-2.5 py-0.5 text-xs font-medium">
          {source}
        </Badge>
      );
    }
    if (s.includes("instagram") || s.includes("facebook")) {
      return (
        <Badge variant="terracotta" className="rounded-full px-2.5 py-0.5 text-xs font-medium">
          {source}
        </Badge>
      );
    }
    if (s.includes("linkedin")) {
      return (
        <Badge variant="default" className="rounded-full px-2.5 py-0.5 text-xs font-medium">
          {source}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs font-medium">
        {source}
      </Badge>
    );
  };

  const exportCSV = () => {
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

    const rows = serverLeads.map((l) => [
      `"${l.leadId}"`,
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.phone || ""}"`,
      `"${l.email || ""}"`,
      `"${l.website || ""}"`,
      `"${!l.website ? "Yes (No Website)" : "No"}"`,
      `"${l.source}"`,
      `"${l.searchQuery.replace(/"/g, '""')}"`,
      `"${(l.address || "").replace(/"/g, '""')}"`,
      `"${l.whatsapp || ""}"`,
      `"${l.instagram || ""}"`,
      `"${l.linkedin || ""}"`,
      `"${(l.remark || "").replace(/"/g, '""')}"`,
      `"${l.createdAt}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startRecord = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const endRecord = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="space-y-4">
      {/* Table Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Backend-driven Search */}
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
            <Input
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Search leads in database..."
              className="h-9 pl-8 text-xs bg-oatmeal-100/60 border-stone-200"
            />
          </div>

          {/* Backend Quick Filter: All vs Potential Clients (No Website) */}
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
              title="Leads without website are prime potential clients"
            >
              <Sparkles className="h-3 w-3 text-terracotta-600" />
              <span>Potential Clients ({meta.noWebsiteCount ?? 0})</span>
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

          {/* Backend Source filter */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs text-stone-700 border-stone-200 cursor-pointer" />
              }
            >
              <Filter className="h-3.5 w-3.5 text-botanical-700" />
              <span>Source: {sourceFilter === "all" ? "All" : sourceFilter}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuItem onClick={() => { setSourceFilter("all"); setPage(1); }}>
                All Sources
              </DropdownMenuItem>
              {uniqueSources.map((source) => (
                <DropdownMenuItem key={source} onClick={() => { setSourceFilter(source); setPage(1); }}>
                  {source}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Backend Sort order */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs text-stone-700 border-stone-200 cursor-pointer" />
              }
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-botanical-700" />
              <span>
                Sort:{" "}
                {sortBy === "default"
                  ? "Default (Source Priority)"
                  : sortBy === "newest"
                  ? "Newest"
                  : sortBy === "oldest"
                  ? "Oldest"
                  : sortBy === "name_asc"
                  ? "Name (A-Z)"
                  : "Name (Z-A)"}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => { setSortBy("default"); setPage(1); }}>
                Default (Source Priority)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy("newest"); setPage(1); }}>
                Newest First
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy("oldest"); setPage(1); }}>
                Oldest First
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy("name_asc"); setPage(1); }}>
                Name (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy("name_desc"); setPage(1); }}>
                Name (Z-A)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Reset button if filtered */}
          {(sourceFilter !== "all" || websiteFilter !== "all" || tableSearch || selectedGroupQuery || sortBy !== "default") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSourceFilter("all");
                setWebsiteFilter("all");
                setTableSearch("");
                setSortBy("default");
                setPage(1);
                onClearGroupFilter?.();
              }}
              className="h-9 text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
            >
              Reset Filters
            </Button>
          )}
        </div>

        {/* Right side actions: Count & Export */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200">
          <span className="text-xs font-medium text-stone-500">
            {loading ? (
              <span className="flex items-center gap-1.5 text-sage-600">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Loading...</span>
              </span>
            ) : (
              <>
                Showing <strong className="text-botanical-900">{startRecord}-{endRecord}</strong> of {meta.total} leads
              </>
            )}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            className="h-9 gap-1.5 text-xs border-stone-200 text-stone-700 hover:text-botanical-900 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-sage-600" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Warm-toned Zebra Striped Table Card */}
      <div className="rounded-2xl border border-stone-200/90 bg-[#FCFBF8] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-stone-200 bg-oatmeal-200/60 hover:bg-oatmeal-200/60">
              <TableHead className="w-[260px]">Lead / Business Name</TableHead>
              <TableHead className="w-[200px]">Contact Info</TableHead>
              <TableHead className="w-[180px]">Website / Status</TableHead>
              <TableHead className="w-[130px]">Source</TableHead>
              <TableHead className="w-[200px]">Search Query</TableHead>
              <TableHead className="w-[140px] text-center">Social Links</TableHead>
              <TableHead className="w-[90px] text-right">Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && serverLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-44 text-center">
                  <div className="flex flex-col items-center justify-center text-stone-500 gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-botanical-700" />
                    <p className="text-sm font-semibold text-botanical-900">
                      Loading leads from database...
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : serverLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-44 text-center">
                  <div className="flex flex-col items-center justify-center text-stone-500">
                    <p className="text-base font-semibold text-botanical-900">
                      No leads match your current filter
                    </p>
                    <p className="text-xs text-stone-400 mt-1">
                      Try adjusting the search query, website filter, or resetting source filters.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              serverLeads.map((lead, index) => {
                const isEven = index % 2 === 1;
                return (
                  <TableRow
                    key={lead.leadId}
                    onClick={() => onSelectLead(lead)}
                    className={`cursor-pointer transition-colors border-b border-stone-200/60 ${
                      isEven ? "bg-oatmeal-100/40" : "bg-paper"
                    } hover:bg-sage-100/50`}
                  >
                    {/* Name Column */}
                    <TableCell className="font-medium">
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
                    <TableCell>
                      <div className="flex flex-col space-y-1 text-xs">
                        {lead.email ? (
                          <div className="flex items-center gap-1.5 text-stone-700 font-medium truncate max-w-[200px]">
                            <Mail className="h-3 w-3 text-sage-600 shrink-0" />
                            <span className="truncate">{lead.email}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-stone-400 italic">No email</span>
                        )}

                        {lead.phone ? (
                          <div className="flex items-center gap-1.5 text-stone-600 text-[11px] truncate">
                            <Phone className="h-3 w-3 text-stone-400 shrink-0" />
                            <span>{lead.phone}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-stone-400 italic">No phone</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Website / Opportunity Status */}
                    <TableCell>
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
                            {lead.website.replace(/^https?:\/\/(www\.)?/, "")}
                          </span>
                          <ExternalLink className="h-2.5 w-2.5 text-stone-400 shrink-0" />
                        </a>
                      ) : (
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-terracotta-100/90 border border-terracotta-300/80 px-2.5 py-0.5 text-[10px] font-semibold text-terracotta-800 shadow-2xs whitespace-nowrap">
                            <Sparkles className="h-2.5 w-2.5 text-terracotta-600 shrink-0" />
                            Potential Client
                          </span>
                          <span className="text-[10px] text-stone-400 italic pl-1">
                            No website
                          </span>
                        </div>
                      )}
                    </TableCell>

                    {/* Source Badge */}
                    <TableCell>
                      {getSourceBadge(lead.source)}
                    </TableCell>

                    {/* Search Query */}
                    <TableCell>
                      <span className="inline-block max-w-[200px] truncate text-xs text-stone-600 rounded-md bg-oatmeal-200/60 px-2 py-1">
                        {lead.searchQuery}
                      </span>
                    </TableCell>

                    {/* Social Links (Small Lucide Icons) */}
                    <TableCell>
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
                    <TableCell className="text-right text-xs text-stone-400">
                      {formatDate(lead.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Backend-Driven Pagination Controls */}
      <div className="flex flex-col gap-3 rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:flex-row sm:items-center sm:justify-between text-xs text-stone-600">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="h-8 rounded-lg border border-stone-200 bg-paper px-2 text-xs text-botanical-900 focus:outline-none focus:ring-1 focus:ring-botanical-600 cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span className="text-stone-400 ml-2">
            Page <strong className="text-botanical-900">{meta.page}</strong> of{" "}
            <strong className="text-botanical-900">{meta.totalPages}</strong> ({meta.total} total leads)
          </span>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(1)}
            disabled={page <= 1 || loading}
            className="h-8 w-8 p-0 border-stone-200 cursor-pointer disabled:opacity-40"
            title="First Page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="h-8 gap-1 px-2.5 border-stone-200 cursor-pointer disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Prev</span>
          </Button>

          {/* Page Number Pills */}
          <div className="flex items-center gap-1 px-1">
            {generatePageNumbers(meta.page, meta.totalPages).map((p, idx) =>
              p === "..." ? (
                <span key={`ellipsis-${idx}`} className="px-1 text-stone-400">
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(Number(p))}
                  disabled={loading}
                  className={`h-8 w-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    page === p
                      ? "bg-botanical-800 text-paper shadow-2xs"
                      : "text-stone-700 hover:bg-oatmeal-200/80 border border-stone-200/60"
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page >= meta.totalPages || loading}
            className="h-8 gap-1 px-2.5 border-stone-200 cursor-pointer disabled:opacity-40"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(meta.totalPages)}
            disabled={page >= meta.totalPages || loading}
            className="h-8 w-8 p-0 border-stone-200 cursor-pointer disabled:opacity-40"
            title="Last Page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
