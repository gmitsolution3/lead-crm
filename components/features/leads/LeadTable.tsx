"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  WhatsAppIcon,
} from "@/components/ui/icons";

interface LeadTableProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  externalSearch?: string;
  selectedGroupQuery?: string | null;
  onClearGroupFilter?: () => void;
}

export function LeadTable({
  leads,
  onSelectLead,
  externalSearch = "",
  selectedGroupQuery,
  onClearGroupFilter,
}: LeadTableProps) {
  const [tableSearch, setTableSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [websiteFilter, setWebsiteFilter] = useState<"all" | "no-website" | "has-website">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name_asc" | "name_desc">("newest");

  // Counts for quick filter
  const noWebsiteCount = useMemo(() => leads.filter((l) => !l.website).length, [leads]);
  const hasWebsiteCount = useMemo(() => leads.filter((l) => Boolean(l.website)).length, [leads]);

  // Effective search combines table internal search and external global search
  const effectiveSearch = (tableSearch || externalSearch).trim().toLowerCase();

  // Filter and Sort leads
  const filteredLeads = useMemo(() => {
    return leads
      .filter((lead) => {
        // Website / Potential Client filter
        if (websiteFilter === "no-website" && lead.website) {
          return false;
        }
        if (websiteFilter === "has-website" && !lead.website) {
          return false;
        }

        // Source filter
        if (sourceFilter !== "all" && lead.source.toLowerCase() !== sourceFilter.toLowerCase()) {
          return false;
        }

        // Group filter if passed
        if (selectedGroupQuery && lead.searchQuery !== selectedGroupQuery) {
          return false;
        }

        // Search text matching
        if (!effectiveSearch) return true;

        return (
          lead.name.toLowerCase().includes(effectiveSearch) ||
          lead.email?.toLowerCase().includes(effectiveSearch) ||
          lead.phone?.toLowerCase().includes(effectiveSearch) ||
          lead.website?.toLowerCase().includes(effectiveSearch) ||
          lead.searchQuery?.toLowerCase().includes(effectiveSearch) ||
          lead.address?.toLowerCase().includes(effectiveSearch) ||
          lead.remark?.toLowerCase().includes(effectiveSearch)
        );
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === "name_asc") {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === "name_desc") {
          return b.name.localeCompare(a.name);
        }
        return 0;
      });
  }, [leads, websiteFilter, sourceFilter, selectedGroupQuery, effectiveSearch, sortBy]);

  // Unique sources for filter dropdown
  const uniqueSources = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => set.add(l.source));
    return Array.from(set);
  }, [leads]);

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

    const rows = filteredLeads.map((l) => [
      `"${l.leadId}"`,
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.phone}"`,
      `"${l.email}"`,
      `"${l.website || ""}"`,
      `"${!l.website ? "Yes (No Website)" : "No"}"`,
      `"${l.source}"`,
      `"${l.searchQuery.replace(/"/g, '""')}"`,
      `"${l.address.replace(/"/g, '""')}"`,
      `"${l.whatsapp}"`,
      `"${l.instagram}"`,
      `"${l.linkedin}"`,
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

  return (
    <div className="space-y-4">
      {/* Table Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Internal search */}
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
            <Input
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Filter current view..."
              className="h-9 pl-8 text-xs bg-oatmeal-100/60 border-stone-200"
            />
          </div>

          {/* Quick Filter: All vs Potential Clients (No Website) */}
          <div className="flex items-center rounded-xl bg-oatmeal-200/70 p-1 border border-stone-200/80">
            <button
              type="button"
              onClick={() => setWebsiteFilter("all")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                websiteFilter === "all"
                  ? "bg-paper text-botanical-900 shadow-xs"
                  : "text-stone-600 hover:text-botanical-900"
              }`}
            >
              All ({leads.length})
            </button>
            <button
              type="button"
              onClick={() => setWebsiteFilter("no-website")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                websiteFilter === "no-website"
                  ? "bg-terracotta-100 text-terracotta-900 shadow-xs border border-terracotta-300"
                  : "text-terracotta-700 hover:bg-terracotta-50/80"
              }`}
              title="Leads without website are prime potential clients"
            >
              <Sparkles className="h-3 w-3 text-terracotta-600" />
              <span>Potential Clients ({noWebsiteCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setWebsiteFilter("has-website")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                websiteFilter === "has-website"
                  ? "bg-paper text-botanical-900 shadow-xs"
                  : "text-stone-600 hover:text-botanical-900"
              }`}
            >
              With Website ({hasWebsiteCount})
            </button>
          </div>

          {/* Source filter */}
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
              <DropdownMenuItem onClick={() => setSourceFilter("all")}>
                All Sources
              </DropdownMenuItem>
              {uniqueSources.map((source) => (
                <DropdownMenuItem key={source} onClick={() => setSourceFilter(source)}>
                  {source}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort order */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs text-stone-700 border-stone-200 cursor-pointer" />
              }
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-botanical-700" />
              <span>
                Sort:{" "}
                {sortBy === "newest"
                  ? "Newest"
                  : sortBy === "oldest"
                  ? "Oldest"
                  : sortBy === "name_asc"
                  ? "Name (A-Z)"
                  : "Name (Z-A)"}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuItem onClick={() => setSortBy("newest")}>
                Newest First
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                Oldest First
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("name_asc")}>
                Name (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("name_desc")}>
                Name (Z-A)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Reset button if filtered */}
          {(sourceFilter !== "all" || websiteFilter !== "all" || tableSearch || selectedGroupQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSourceFilter("all");
                setWebsiteFilter("all");
                setTableSearch("");
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
            Showing <strong className="text-botanical-900">{filteredLeads.length}</strong> of {leads.length} leads
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
            {filteredLeads.length === 0 ? (
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
              filteredLeads.map((lead, index) => {
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
                          <span className="inline-flex items-center gap-1 rounded-full bg-terracotta-100/90 border border-terracotta-300/80 px-2 py-0.5 text-[10px] font-semibold text-terracotta-800 shadow-2xs whitespace-nowrap">
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
                      <span className="inline-block max-w-[220px] truncate text-xs text-stone-600 rounded-md bg-oatmeal-200/60 px-2 py-1">
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
    </div>
  );
}
