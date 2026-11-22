"use client";

import { LeadDetailSheet } from "@/components/features/leads/LeadDetailSheet";
import { LeadFormModal } from "@/components/features/leads/LeadFormModal";
import { ExtensionSearchModal } from "@/components/features/leads/ExtensionSearchModal";
import { LeadNotesModal } from "@/components/features/leads/LeadNotesModal";
import { LeadPipelineModal } from "@/components/features/leads/LeadPipelineModal";
import { LeadTableSkeletonRows } from "@/components/features/leads/LeadTableSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DeleteConfirmModal } from "@/components/ui/delete-confirm-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
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
import { useDelete, useFetch, usePatch } from "@/hooks";
import { useSession } from "@/lib/auth-client";
import { isStatusTransitionAllowed } from "@/lib/lead-pipeline";
import { cn, formatShortDateTime } from "@/lib/utils";
import type { LeadPriority, LeadStatus, User } from "@/types";
import { Lead, SearchGroup } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  Ban,
  Calendar as CalendarIcon,
  CheckCircle2,
  CircleDot,
  Clock,
  Download,
  Equal,
  ExternalLink,
  Eye,
  Filter,
  FilterX,
  Flame,
  Globe,
  Loader2,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Phone,
  PhoneCall,
  Plus,
  Sparkles,
  RotateCcw,
  Search,
  Target,
  Trash2,
  Trophy,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

// ==========================================
// UI Badge Utilities (Placed outside component)
// ==========================================

export const getStatusBadge = (status?: LeadStatus) => {
  switch (status) {
    case "called":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs hover:bg-amber-200 transition-colors">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
          Called
        </span>
      );
    case "call_later":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-300 shadow-2xs hover:bg-blue-200 transition-colors">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
          Call Later
        </span>
      );
    case "interested":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs hover:bg-emerald-200 transition-colors">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
          Interested 🔥
        </span>
      );
    case "not_interested":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs hover:bg-rose-200 transition-colors">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
          Not Interested
        </span>
      );
    case "converted":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-900 border border-green-300 shadow-2xs hover:bg-green-200 transition-colors">
          <span className="h-1.5 w-1.5 rounded-full bg-green-700" />
          Converted 🎉
        </span>
      );
    case "invalid":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-200 text-zinc-700 border border-zinc-300 shadow-2xs hover:bg-zinc-300 transition-colors">
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
          Invalid
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-700 border border-stone-300 shadow-2xs hover:bg-stone-200 transition-colors">
          <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
          Uncontacted
        </span>
      );
  }
};

export const getPriorityBadge = (priority?: LeadPriority) => {
  switch (priority) {
    case "high":
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs hover:bg-rose-100 transition-colors">
          <ArrowUp className="h-2.5 w-2.5 text-rose-600 shrink-0" />
          <span>High</span>
        </span>
      );
    case "low":
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-600 border border-stone-200 shadow-2xs hover:bg-stone-200 transition-colors">
          <ArrowDown className="h-2.5 w-2.5 text-stone-500 shrink-0" />
          <span>Low</span>
        </span>
      );
    case "medium":
    default:
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs hover:bg-amber-100 transition-colors">
          <Equal className="h-2.5 w-2.5 text-amber-600 shrink-0" />
          <span>Med</span>
        </span>
      );
  }
};

export const getSourceBadge = (source: string) => {
  const s = source.toLowerCase();
  if (s.includes("google") || s.includes("maps")) {
    return (
      <Badge
        variant="sage"
        className="rounded-full px-2 py-0.2 text-[10px] font-medium"
      >
        {source}
      </Badge>
    );
  }
  if (s.includes("instagram") || s.includes("facebook")) {
    return (
      <Badge
        variant="terracotta"
        className="rounded-full px-2 py-0.2 text-[10px] font-medium"
      >
        {source}
      </Badge>
    );
  }
  if (s.includes("linkedin")) {
    return (
      <Badge
        variant="default"
        className="rounded-full px-2 py-0.2 text-[10px] font-medium"
      >
        {source}
      </Badge>
    );
  }
  return (
    <Badge
      variant="secondary"
      className="rounded-full px-2 py-0.2 text-[10px] font-medium"
    >
      {source}
    </Badge>
  );
};

interface LeadsDashboardProps {
  user?: User | null;
  groupId: string;
}

export default function LeadsDashboard({
  user,
  groupId,
}: LeadsDashboardProps) {
  const { data: session } = useSession();
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
  } = useFetch<any>(
    `/search-groups/${encodeURIComponent(decodedId)}`,
  );

  const group: SearchGroup | null = useMemo(() => {
    return groupRes?.data || groupRes || null;
  }, [groupRes]);

  const groupQuery = group?.query || decodedId;
  const targetGroupId = group?.groupId || decodedId;

  // 2. Table filters, search, sort, and pagination state initialized from URL query params
  const initialSearch = searchParams?.get("search") || "";
  const initialSource = searchParams?.get("source") || "all";
  const initialWebsite =
    (searchParams?.get("websiteFilter") as any) || "all";
  const initialStatus = searchParams?.get("status") || "all";
  const initialPriority = searchParams?.get("priority") || "all";
  const initialFollowUp = searchParams?.get("followUp") || "all";
  const initialAssignedTo = searchParams?.get("assignedTo") || "all";
  const initialSortBy =
    (searchParams?.get("sortBy") as any) || "default";
  const initialPage = Math.max(
    1,
    Number(searchParams?.get("page")) || 1,
  );
  const initialLimit = Math.max(
    1,
    Number(searchParams?.get("limit")) || 10,
  );

  const [tableSearch, setTableSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] =
    useState(initialSearch);
  const [sourceFilter, setSourceFilter] =
    useState<string>(initialSource);
  const [websiteFilter, setWebsiteFilter] = useState<
    "all" | "no-website" | "has-website"
  >(initialWebsite);
  const [statusFilter, setStatusFilter] =
    useState<string>(initialStatus);
  const [priorityFilter, setPriorityFilter] =
    useState<string>(initialPriority);
  const [followUpFilter, setFollowUpFilter] =
    useState<string>(initialFollowUp);
  const [assignedToFilter, setAssignedToFilter] =
    useState<string>(initialAssignedTo);
  const [sortBy, setSortBy] = useState<string>(initialSortBy);
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
    if (websiteFilter !== "all")
      params.set("websiteFilter", websiteFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (priorityFilter !== "all")
      params.set("priority", priorityFilter);
    if (followUpFilter !== "all")
      params.set("followUp", followUpFilter);
    if (assignedToFilter !== "all")
      params.set("assignedTo", assignedToFilter);
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
    statusFilter,
    priorityFilter,
    followUpFilter,
    assignedToFilter,
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
      status: statusFilter !== "all" ? statusFilter : undefined,
      priority: priorityFilter !== "all" ? priorityFilter : undefined,
      followUpFilter:
        followUpFilter !== "all" ? followUpFilter : undefined,
      assignedTo:
        assignedToFilter === "me"
          ? session?.user?.id || session?.user?.email
          : assignedToFilter !== "all"
            ? assignedToFilter
            : undefined,
      groupId: targetGroupId || undefined,
      sortBy: sortBy !== "default" ? sortBy : undefined,
    };
  }, [
    page,
    limit,
    debouncedSearch,
    sourceFilter,
    websiteFilter,
    statusFilter,
    priorityFilter,
    followUpFilter,
    assignedToFilter,
    session?.user?.id,
    session?.user?.email,
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
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    followUpFilter !== "all" ||
    assignedToFilter !== "all" ||
    debouncedSearch ||
    tableSearch ||
    sortBy !== "default",
  );

  const handleResetFilters = useCallback(() => {
    setSourceFilter("all");
    setWebsiteFilter("all");
    setStatusFilter("all");
    setPriorityFilter("all");
    setFollowUpFilter("all");
    setAssignedToFilter("all");
    setTableSearch("");
    setSortBy("default");
    setPage(1);
  }, []);

  // Mutation hook for lead updates with automatic cache invalidation
  const { mutateAsync: updateLeadMutation } = usePatch("/leads", {
    invalidateQueries: [["/search-groups"], ["/leads"]],
  });

  // Quick 1-click status change from table row
  const handleQuickStatusChange = async (
    leadId: string,
    newStatus: LeadStatus,
  ) => {
    const currentLead = leads.find((l) => l.leadId === leadId);
    if (
      currentLead &&
      !isStatusTransitionAllowed(currentLead.status, newStatus)
    ) {
      setSyncFeedback(
        `Cannot change status from "${(currentLead.status || "uncontacted").replace("_", " ")}" to "${newStatus.replace("_", " ")}"`,
      );
      setTimeout(() => setSyncFeedback(null), 3500);
      return;
    }

    try {
      await updateLeadMutation({
        id: leadId,
        data: {
          status: newStatus,
          groupId: targetGroupId,
          updatedBy: session?.user
            ? {
                userId: session.user.id,
                name: session.user.name,
                email: session.user.email,
              }
            : undefined,
        },
      });
      refetchLeads();
      setSyncFeedback(
        `Status updated to "${newStatus.replace("_", " ")}"`,
      );
      setTimeout(() => setSyncFeedback(null), 2500);
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Quick 1-click priority change from table row
  const handleQuickPriorityChange = async (
    leadId: string,
    newPriority: LeadPriority,
  ) => {
    try {
      await updateLeadMutation({
        id: leadId,
        data: {
          priority: newPriority,
          groupId: targetGroupId,
          updatedBy: session?.user
            ? {
                userId: session.user.id,
                name: session.user.name,
                email: session.user.email,
              }
            : undefined,
        },
      });
      refetchLeads();
      setSyncFeedback(
        `Priority updated to "${newPriority.charAt(0).toUpperCase() + newPriority.slice(1)}"`,
      );
      setTimeout(() => setSyncFeedback(null), 2500);
    } catch (err) {
      console.error("Failed to update priority:", err);
    }
  };

  const [activeFollowUpLeadId, setActiveFollowUpLeadId] = useState<
    string | null
  >(null);
  const [activeFollowUpTime, setActiveFollowUpTime] =
    useState<string>("10:00");

  const handleQuickFollowUpChange = async (
    leadId: string,
    newFollowUpDate: number | null,
  ) => {
    setActiveFollowUpLeadId(null);
    try {
      await updateLeadMutation({
        id: leadId,
        data: {
          followUpDate: newFollowUpDate,
          groupId: targetGroupId,
          updatedBy: session?.user
            ? {
                userId: session.user.id,
                name: session.user.name,
                email: session.user.email,
              }
            : undefined,
        },
      });
      refetchLeads();
      setSyncFeedback(
        newFollowUpDate
          ? `Follow-up set to ${formatShortDateTime(newFollowUpDate)}`
          : "Follow-up date cleared",
      );
      setTimeout(() => setSyncFeedback(null), 2500);
    } catch (err) {
      console.error("Failed to update follow-up date:", err);
    }
  };

  const handleQuickPresetDate = (
    leadId: string,
    daysFromNow: number,
  ) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysFromNow);
    const [h, m] = activeFollowUpTime.split(":").map(Number);
    targetDate.setHours(isNaN(h) ? 10 : h, isNaN(m) ? 0 : m, 0, 0);
    handleQuickFollowUpChange(leadId, targetDate.getTime());
  };

  // Separate Modal states: View Details, Pipeline & Status, Activity & Notes
  const [selectedLeadForView, setSelectedLeadForView] =
    useState<Lead | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [selectedLeadForPipeline, setSelectedLeadForPipeline] =
    useState<Lead | null>(null);
  const [isPipelineModalOpen, setIsPipelineModalOpen] =
    useState(false);

  const [selectedLeadForNotes, setSelectedLeadForNotes] =
    useState<Lead | null>(null);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);

  // Delete lead state & mutation
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleteLeadModalOpen, setIsDeleteLeadModalOpen] =
    useState(false);
  const {
    mutateAsync: deleteLeadMutation,
    isPending: isDeletingLead,
  } = useDelete("/leads", {
    invalidateQueries: [["/leads"], ["/search-groups"]],
  });

  // Delete group state & mutation
  const [isDeleteGroupModalOpen, setIsDeleteGroupModalOpen] =
    useState(false);
  const [isExtractModalOpen, setIsExtractModalOpen] = useState(false);
  const {
    mutateAsync: deleteGroupMutation,
    isPending: isDeletingGroup,
  } = useDelete("/search-groups", {
    invalidateQueries: [["/search-groups"], ["/leads"]],
  });

  const [syncFeedback, setSyncFeedback] = useState<string | null>(
    null,
  );

  const handleOpenViewDetails = (lead: Lead) => {
    setSelectedLeadForView(lead);
    setIsViewModalOpen(true);
  };

  const handleOpenPipeline = (lead: Lead) => {
    setSelectedLeadForPipeline(lead);
    setIsPipelineModalOpen(true);
  };

  const handleOpenNotes = (lead: Lead) => {
    setSelectedLeadForNotes(lead);
    setIsNotesModalOpen(true);
  };

  const handleConfirmDeleteLead = async () => {
    if (!leadToDelete) return;
    try {
      await deleteLeadMutation(leadToDelete.leadId);
      setIsDeleteLeadModalOpen(false);
      setLeadToDelete(null);
      refetchLeads();
      refetchGroup();
      setSyncFeedback("Lead deleted successfully");
      setTimeout(() => setSyncFeedback(null), 3000);
    } catch (err) {
      console.error("Failed to delete lead:", err);
    }
  };

  const handleConfirmDeleteGroup = async () => {
    try {
      await deleteGroupMutation(targetGroupId);
      setIsDeleteGroupModalOpen(false);
      router.push("/leads");
    } catch (err) {
      console.error("Failed to delete search group:", err);
    }
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

  const handleExportCSV = useCallback(() => {
    const leadsToExport: Lead[] = group?.leads || leads || [];
    if (leadsToExport.length === 0) return;

    const headers = [
      "Lead ID",
      "Name",
      "Status",
      "Priority",
      "Follow-Up Date",
      "Deal Value",
      "Dealt By",
      "Calls Made",
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
      "Latest Activity Note",
      "Created At",
    ];

    const rows = leadsToExport.map((l) => [
      `"${l.leadId}"`,
      `"${(l.name || "").replace(/"/g, '""')}"`,
      `"${l.status || "uncontacted"}"`,
      `"${l.priority || "medium"}"`,
      `"${l.followUpDate ? new Date(l.followUpDate).toISOString().slice(0, 10) : ""}"`,
      `"${l.dealValue || 0}"`,
      `"${(l.assignedTo?.name || l.lastContactedBy?.name || "").replace(/"/g, '""')}"`,
      `"${l.callCount || 0}"`,
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
      `"${((l.notes && l.notes.length > 0 ? l.notes[l.notes.length - 1].content : "") || "").replace(/"/g, '""')}"`,
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
            {meta.interestedCount !== undefined &&
              meta.interestedCount > 0 && (
                <Badge
                  variant="default"
                  className="text-[10px] gap-1 font-semibold bg-emerald-100 text-emerald-800 border-emerald-300"
                >
                  🔥 {meta.interestedCount} Interested
                </Badge>
              )}
            {meta.overdueCount !== undefined &&
              meta.overdueCount > 0 && (
                <Badge
                  variant="terracotta"
                  className="text-[10px] gap-1 font-semibold bg-rose-100 text-rose-800 border-rose-300 animate-pulse"
                >
                  ⚠️ {meta.overdueCount} Overdue Follow-up
                </Badge>
              )}
            {meta.convertedCount !== undefined &&
              meta.convertedCount > 0 && (
                <Badge
                  variant="default"
                  className="text-[10px] gap-1 font-semibold bg-green-100 text-green-900 border-green-300"
                >
                  🎉 {meta.convertedCount} Converted
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

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExtractModalOpen(true)}
            className="text-xs h-9 text-botanical-800 border-stone-300 hover:border-botanical-600 gap-1.5 cursor-pointer rounded-xl bg-paper"
            title="Launch search extraction for this query in Chrome extension"
          >
            <Sparkles className="h-3.5 w-3.5 text-terracotta-600" />
            <span>Extract More Leads</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteGroupModalOpen(true)}
            className="text-xs h-9 text-rose-700 hover:text-rose-800 hover:bg-rose-50 border-rose-200/90 gap-1.5 cursor-pointer rounded-xl"
            title="Delete this search group and all its leads"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-600" />
            <span>Delete Group</span>
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

          <Button
            size="sm"
            onClick={() => setIsAddLeadOpen(true)}
            className="text-xs h-9 bg-botanical-800 hover:bg-botanical-900 text-white gap-1.5 cursor-pointer rounded-xl shadow-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Lead</span>
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

            {/* 2. Outreach Status Filter */}
            <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[150px]">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                Outreach Status
              </label>
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val || "all");
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-oatmeal-100/60 border-stone-200 text-stone-700 rounded-xl">
                  <SelectValue placeholder="Status: All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Status: All</SelectItem>
                  <SelectItem value="uncontacted">
                    🔵 Uncontacted
                  </SelectItem>
                  <SelectItem value="called">📞 Called</SelectItem>
                  <SelectItem value="call_later">
                    ⏰ Call Later
                  </SelectItem>
                  <SelectItem value="interested">
                    🔥 Interested
                  </SelectItem>
                  <SelectItem value="not_interested">
                    🚫 Not Interested
                  </SelectItem>
                  <SelectItem value="converted">
                    🎉 Converted
                  </SelectItem>
                  <SelectItem value="invalid">❌ Invalid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 3. Priority Filter */}
            <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[130px]">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                Priority
              </label>
              <Select
                value={priorityFilter}
                onValueChange={(val) => {
                  setPriorityFilter(val || "all");
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-oatmeal-100/60 border-stone-200 text-stone-700 rounded-xl">
                  <SelectValue placeholder="Priority: All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Priority: All</SelectItem>
                  <SelectItem value="high">
                    🔥 High Priority
                  </SelectItem>
                  <SelectItem value="medium">⚡ Medium</SelectItem>
                  <SelectItem value="low">❄️ Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 4. Follow-Up Schedule Filter */}
            <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[150px]">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                Follow-Up Schedule
              </label>
              <Select
                value={followUpFilter}
                onValueChange={(val) => {
                  setFollowUpFilter(val || "all");
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-oatmeal-100/60 border-stone-200 text-stone-700 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="h-3 w-3 text-stone-500 shrink-0" />
                    <SelectValue placeholder="Follow-Up: All" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Follow-Up: All</SelectItem>
                  <SelectItem value="overdue">
                    ⚠️ Overdue Follow-ups
                  </SelectItem>
                  <SelectItem value="today">📅 Due Today</SelectItem>
                  <SelectItem value="upcoming">
                    ⏳ Upcoming
                  </SelectItem>
                  <SelectItem value="has-followup">
                    📌 Has Follow-up Set
                  </SelectItem>
                  <SelectItem value="no-followup">
                    No Follow-up
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 5. Dealt By Filter */}
            <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[130px]">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                Dealt By
              </label>
              <Select
                value={assignedToFilter}
                onValueChange={(val) => {
                  setAssignedToFilter(val || "all");
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-oatmeal-100/60 border-stone-200 text-stone-700 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="h-3 w-3 text-stone-500 shrink-0" />
                    <SelectValue placeholder="Dealt By: All" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Dealt By: All</SelectItem>
                  <SelectItem value="me">Assigned to Me</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 6. Platform Source Filter */}
            <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[150px]">
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
                  <SelectItem value="all">
                    Source: All Platforms
                  </SelectItem>
                  {uniqueSources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 7. Sort Order */}
            <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[190px]">
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
                  <SelectItem value="followup_asc">
                    Follow-Up (Soonest First)
                  </SelectItem>
                  <SelectItem value="priority_desc">
                    Priority (High to Low)
                  </SelectItem>
                  <SelectItem value="deal_desc">
                    Deal Value (High to Low)
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
        <div className="rounded-2xl border border-stone-200/90 bg-[#FCFBF8] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-x-auto scrollbar-thin scrollbar-thumb-stone-300 scrollbar-track-stone-100">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-stone-200 bg-oatmeal-200/60 hover:bg-oatmeal-200/60">
                <TableHead className="min-w-[220px] h-12 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-stone-600">
                  Lead / Business
                </TableHead>
                <TableHead className="w-[130px] h-12 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-stone-600">
                  Status
                </TableHead>
                <TableHead className="min-w-[170px] h-12 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-stone-600">
                  Contact Coordinates
                </TableHead>
                <TableHead className="min-w-[160px] h-12 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-stone-600">
                  Priority & Follow-Up
                </TableHead>
                <TableHead className="w-[130px] h-12 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-stone-600">
                  Dealt By
                </TableHead>
                <TableHead className="min-w-[150px] h-12 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-stone-600">
                  Website / Opportunity
                </TableHead>
                <TableHead className="w-[60px] h-12 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-stone-600 text-center">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && leads.length === 0 ? (
                <LeadTableSkeletonRows
                  rows={limit > 10 ? 10 : limit}
                />
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="p-8 sm:p-12 text-center"
                  >
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
                      onClick={() => handleOpenViewDetails(lead)}
                      className={`cursor-pointer transition-colors border-b border-stone-200/60 ${
                        isEven ? "bg-oatmeal-100/40" : "bg-paper"
                      } hover:bg-sage-100/50`}
                    >
                      {/* Name & Source Column */}
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
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] text-stone-400 truncate max-w-[140px]">
                                {lead.address || "No address"}
                              </span>
                              <span className="text-stone-300">
                                •
                              </span>
                              {getSourceBadge(lead.source)}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Status Column with Inline Quick Dropdown */}
                      <TableCell
                        className="px-4 py-3.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <button
                                type="button"
                                className="outline-none cursor-pointer focus:ring-1 focus:ring-botanical-500 rounded-full"
                              >
                                {getStatusBadge(lead.status)}
                              </button>
                            }
                          />
                          <DropdownMenuContent
                            align="start"
                            className="w-52 p-1"
                          >
                            <DropdownMenuItem
                              disabled={
                                !isStatusTransitionAllowed(
                                  lead.status,
                                  "uncontacted",
                                )
                              }
                              onClick={() =>
                                handleQuickStatusChange(
                                  lead.leadId,
                                  "uncontacted",
                                )
                              }
                              className={
                                !isStatusTransitionAllowed(
                                  lead.status,
                                  "uncontacted",
                                )
                                  ? "opacity-40 cursor-not-allowed text-stone-400 gap-2 text-xs"
                                  : "gap-2 cursor-pointer text-xs"
                              }
                            >
                              <CircleDot className="h-3.5 w-3.5 text-stone-500 shrink-0" />
                              <span>Uncontacted (New)</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={
                                !isStatusTransitionAllowed(
                                  lead.status,
                                  "called",
                                )
                              }
                              onClick={() =>
                                handleQuickStatusChange(
                                  lead.leadId,
                                  "called",
                                )
                              }
                              className={
                                !isStatusTransitionAllowed(
                                  lead.status,
                                  "called",
                                )
                                  ? "opacity-40 cursor-not-allowed text-stone-400 gap-2 text-xs"
                                  : "gap-2 cursor-pointer text-xs"
                              }
                            >
                              <PhoneCall className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                              <span>Called (Attempted)</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={
                                !isStatusTransitionAllowed(
                                  lead.status,
                                  "call_later",
                                )
                              }
                              onClick={() =>
                                handleQuickStatusChange(
                                  lead.leadId,
                                  "call_later",
                                )
                              }
                              className={
                                !isStatusTransitionAllowed(
                                  lead.status,
                                  "call_later",
                                )
                                  ? "opacity-40 cursor-not-allowed text-stone-400 gap-2 text-xs"
                                  : "gap-2 cursor-pointer text-xs"
                              }
                            >
                              <Clock className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                              <span>Call Later</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={
                                !isStatusTransitionAllowed(
                                  lead.status,
                                  "interested",
                                )
                              }
                              onClick={() =>
                                handleQuickStatusChange(
                                  lead.leadId,
                                  "interested",
                                )
                              }
                              className={
                                !isStatusTransitionAllowed(
                                  lead.status,
                                  "interested",
                                )
                                  ? "opacity-40 cursor-not-allowed text-stone-400 gap-2 text-xs"
                                  : "gap-2 cursor-pointer text-xs"
                              }
                            >
                              <Flame className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                              <span>Interested (Hot)</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={
                                !isStatusTransitionAllowed(
                                  lead.status,
                                  "not_interested",
                                )
                              }
                              onClick={() =>
                                handleQuickStatusChange(
                                  lead.leadId,
                                  "not_interested",
                                )
                              }
                              className={
                                !isStatusTransitionAllowed(
                                  lead.status,
                                  "not_interested",
                                )
                                  ? "opacity-40 cursor-not-allowed text-stone-400 gap-2 text-xs"
                                  : "gap-2 cursor-pointer text-xs"
                              }
                            >
                              <UserX className="h-3.5 w-3.5 text-stone-500 shrink-0" />
                              <span>Not Interested</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={
                                !isStatusTransitionAllowed(
                                  lead.status,
                                  "converted",
                                )
                              }
                              onClick={() =>
                                handleQuickStatusChange(
                                  lead.leadId,
                                  "converted",
                                )
                              }
                              className={
                                !isStatusTransitionAllowed(
                                  lead.status,
                                  "converted",
                                )
                                  ? "opacity-40 cursor-not-allowed text-stone-400 gap-2 text-xs"
                                  : "gap-2 cursor-pointer text-xs"
                              }
                            >
                              <Trophy className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                              <span>Converted (Won)</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={
                                !isStatusTransitionAllowed(
                                  lead.status,
                                  "invalid",
                                )
                              }
                              onClick={() =>
                                handleQuickStatusChange(
                                  lead.leadId,
                                  "invalid",
                                )
                              }
                              className={
                                !isStatusTransitionAllowed(
                                  lead.status,
                                  "invalid",
                                )
                                  ? "opacity-40 cursor-not-allowed text-stone-400 gap-2 text-xs"
                                  : "gap-2 cursor-pointer text-xs"
                              }
                            >
                              <Ban className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                              <span>Invalid / Dead</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>

                      {/* Contact Stack (Email / Phone) */}
                      <TableCell className="px-4 py-3.5">
                        <div className="flex flex-col space-y-1 text-xs">
                          {lead.email ? (
                            <div className="flex items-center gap-1.5 text-stone-700 font-medium truncate max-w-[170px]">
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

                      {/* Priority & Follow-Up with Direct Calendar Popover */}
                      <TableCell
                        className="px-4 py-3.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex flex-col gap-1 text-xs">
                          <div className="flex items-center gap-1.5">
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <button
                                    type="button"
                                    className="cursor-pointer focus:outline-none focus:ring-1 focus:ring-botanical-500/40 rounded transition-transform active:scale-95"
                                    title="Click to change Priority"
                                  >
                                    {getPriorityBadge(lead.priority)}
                                  </button>
                                }
                              />
                              <DropdownMenuContent
                                align="start"
                                className="w-32 p-1 bg-[#FCFBF8] border-stone-200 shadow-md text-xs"
                              >
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleQuickPriorityChange(
                                      lead.leadId,
                                      "high",
                                    )
                                  }
                                  className="gap-2 cursor-pointer font-medium text-rose-700 hover:bg-rose-50"
                                >
                                  <ArrowUp className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                                  <span>High</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleQuickPriorityChange(
                                      lead.leadId,
                                      "medium",
                                    )
                                  }
                                  className="gap-2 cursor-pointer font-medium text-amber-800 hover:bg-amber-50"
                                >
                                  <Equal className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                  <span>Medium</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleQuickPriorityChange(
                                      lead.leadId,
                                      "low",
                                    )
                                  }
                                  className="gap-2 cursor-pointer font-medium text-stone-700 hover:bg-stone-100"
                                >
                                  <ArrowDown className="h-3.5 w-3.5 text-stone-500 shrink-0" />
                                  <span>Low</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            {lead.dealValue ? (
                              <span className="text-[10px] font-bold text-botanical-800 bg-sage-100/80 px-1.5 py-0.2 rounded">
                                ${lead.dealValue}
                              </span>
                            ) : null}
                          </div>

                          {/* Quick Follow-Up Calendar Popover */}
                          <Popover
                            open={
                              activeFollowUpLeadId === lead.leadId
                            }
                            onOpenChange={(open) => {
                              if (open) {
                                setActiveFollowUpLeadId(lead.leadId);
                                if (lead.followUpDate) {
                                  const d = new Date(
                                    lead.followUpDate,
                                  );
                                  const hh = String(
                                    d.getHours(),
                                  ).padStart(2, "0");
                                  const mm = String(
                                    d.getMinutes(),
                                  ).padStart(2, "0");
                                  setActiveFollowUpTime(
                                    `${hh}:${mm}`,
                                  );
                                } else {
                                  setActiveFollowUpTime("10:00");
                                }
                              } else {
                                setActiveFollowUpLeadId(null);
                              }
                            }}
                          >
                            <PopoverTrigger
                              render={
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1.5 text-[11px] rounded-md px-1.5 py-0.5 -ml-1 text-stone-600 hover:text-botanical-900 hover:bg-oatmeal-200/70 transition-colors cursor-pointer group text-left border border-transparent hover:border-stone-200/70"
                                  title="Click to update follow-up date and time"
                                >
                                  <CalendarIcon className="h-3 w-3 text-stone-400 group-hover:text-botanical-700 shrink-0" />
                                  {lead.followUpDate ? (
                                    lead.followUpDate < Date.now() &&
                                    ![
                                      "converted",
                                      "not_interested",
                                      "invalid",
                                    ].includes(lead.status || "") ? (
                                      <span className="font-bold text-terracotta-700 bg-terracotta-100 px-1.5 py-0.2 rounded">
                                        Overdue:{" "}
                                        {formatShortDateTime(
                                          lead.followUpDate,
                                        )}
                                      </span>
                                    ) : (
                                      <span className="font-medium text-stone-700 group-hover:text-botanical-900">
                                        {formatShortDateTime(
                                          lead.followUpDate,
                                        )}
                                      </span>
                                    )
                                  ) : (
                                    <span className="text-stone-400 italic group-hover:text-botanical-700">
                                      + Set follow-up
                                    </span>
                                  )}
                                </button>
                              }
                            />
                            <PopoverContent
                              align="start"
                              sideOffset={4}
                              className="p-3 w-auto bg-[#FCFBF8] border border-stone-200/90 rounded-2xl shadow-xl max-w-xs"
                            >
                              <div className="space-y-3">
                                <div className="flex items-center justify-between border-b border-stone-100 pb-2 px-1">
                                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                                    Set Follow-Up
                                  </span>
                                  {lead.followUpDate && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleQuickFollowUpChange(
                                          lead.leadId,
                                          null,
                                        )
                                      }
                                      className="text-[11px] text-terracotta-700 hover:text-terracotta-900 hover:underline font-semibold cursor-pointer"
                                    >
                                      Clear Date
                                    </button>
                                  )}
                                </div>

                                {/* Quick Presets inside Popover */}
                                <div className="flex items-center gap-1 px-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleQuickPresetDate(
                                        lead.leadId,
                                        1,
                                      )
                                    }
                                    className="text-[10px] px-2 py-0.5 rounded-lg bg-oatmeal-100/90 hover:bg-oatmeal-200 text-stone-700 hover:text-botanical-900 font-semibold border border-stone-200/60 transition-colors cursor-pointer"
                                  >
                                    Tomorrow
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleQuickPresetDate(
                                        lead.leadId,
                                        3,
                                      )
                                    }
                                    className="text-[10px] px-2 py-0.5 rounded-lg bg-oatmeal-100/90 hover:bg-oatmeal-200 text-stone-700 hover:text-botanical-900 font-semibold border border-stone-200/60 transition-colors cursor-pointer"
                                  >
                                    In 3 Days
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleQuickPresetDate(
                                        lead.leadId,
                                        7,
                                      )
                                    }
                                    className="text-[10px] px-2 py-0.5 rounded-lg bg-oatmeal-100/90 hover:bg-oatmeal-200 text-stone-700 hover:text-botanical-900 font-semibold border border-stone-200/60 transition-colors cursor-pointer"
                                  >
                                    Next Week
                                  </button>
                                </div>

                                <Calendar
                                  mode="single"
                                  selected={
                                    lead.followUpDate
                                      ? new Date(lead.followUpDate)
                                      : undefined
                                  }
                                  onSelect={(date) => {
                                    if (date) {
                                      const [h, m] =
                                        activeFollowUpTime
                                          .split(":")
                                          .map(Number);
                                      const combined = new Date(date);
                                      combined.setHours(
                                        isNaN(h) ? 10 : h,
                                        isNaN(m) ? 0 : m,
                                        0,
                                        0,
                                      );
                                      handleQuickFollowUpChange(
                                        lead.leadId,
                                        combined.getTime(),
                                      );
                                    } else {
                                      handleQuickFollowUpChange(
                                        lead.leadId,
                                        null,
                                      );
                                    }
                                  }}
                                  disabled={(date) => {
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    return date < today;
                                  }}
                                  autoFocus
                                />

                                {/* Time of Follow-Up in Table Popover */}
                                <div className="pt-2.5 border-t border-stone-100 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-xs text-stone-700 font-semibold">
                                      <Clock className="h-3.5 w-3.5 text-botanical-700" />
                                      <span>Call Time</span>
                                    </div>
                                    <input
                                      type="time"
                                      value={activeFollowUpTime}
                                      onChange={(e) => {
                                        const newTime =
                                          e.target.value;
                                        setActiveFollowUpTime(
                                          newTime,
                                        );
                                        if (lead.followUpDate) {
                                          const [h, m] = newTime
                                            .split(":")
                                            .map(Number);
                                          const updated = new Date(
                                            lead.followUpDate,
                                          );
                                          updated.setHours(
                                            isNaN(h) ? 10 : h,
                                            isNaN(m) ? 0 : m,
                                            0,
                                            0,
                                          );
                                          handleQuickFollowUpChange(
                                            lead.leadId,
                                            updated.getTime(),
                                          );
                                        }
                                      }}
                                      className="h-8 px-2.5 rounded-lg border border-stone-300 bg-paper text-xs font-semibold text-stone-800 focus:outline-none focus:ring-1 focus:ring-botanical-500"
                                    />
                                  </div>

                                  {/* Quick Time Slots */}
                                  <div className="flex items-center justify-between gap-1 pt-0.5">
                                    {[
                                      "09:30",
                                      "11:00",
                                      "14:30",
                                      "16:00",
                                    ].map((slot) => {
                                      const [h, m] = slot
                                        .split(":")
                                        .map(Number);
                                      const label = `${h > 12 ? h - 12 : h}:${m === 0 ? "00" : m} ${h >= 12 ? "PM" : "AM"}`;
                                      return (
                                        <button
                                          key={slot}
                                          type="button"
                                          onClick={() => {
                                            setActiveFollowUpTime(
                                              slot,
                                            );
                                            if (lead.followUpDate) {
                                              const updated =
                                                new Date(
                                                  lead.followUpDate,
                                                );
                                              updated.setHours(
                                                h,
                                                m,
                                                0,
                                                0,
                                              );
                                              handleQuickFollowUpChange(
                                                lead.leadId,
                                                updated.getTime(),
                                              );
                                            }
                                          }}
                                          className={cn(
                                            "text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer font-medium",
                                            activeFollowUpTime ===
                                              slot
                                              ? "bg-botanical-800 text-white border-botanical-900 font-bold shadow-2xs"
                                              : "bg-oatmeal-100 border-stone-200/80 text-stone-600 hover:bg-oatmeal-200",
                                          )}
                                        >
                                          {label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </TableCell>

                      {/* Dealt By Column */}
                      <TableCell className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-botanical-100 text-botanical-800 text-[10px] font-bold shrink-0">
                            {lead.assignedTo?.name
                              ? lead.assignedTo.name
                                  .charAt(0)
                                  .toUpperCase()
                              : lead.lastContactedBy?.name
                                ? lead.lastContactedBy.name
                                    .charAt(0)
                                    .toUpperCase()
                                : "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-stone-800 truncate max-w-[100px]">
                              {lead.assignedTo?.name ||
                                lead.lastContactedBy?.name ||
                                "Unassigned"}
                            </p>
                            {lead.callCount && lead.callCount > 0 ? (
                              <p className="text-[10px] text-stone-400">
                                {lead.callCount}{" "}
                                {lead.callCount === 1
                                  ? "call"
                                  : "calls"}
                              </p>
                            ) : null}
                          </div>
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
                            className="inline-flex items-center gap-1.5 text-xs text-botanical-800 hover:text-botanical-600 hover:underline max-w-[130px] truncate"
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
                            <span className="inline-flex items-center gap-1 rounded-full bg-terracotta-100/90 border border-terracotta-300/80 px-2 py-0.5 text-[10px] font-semibold text-terracotta-800 shadow-2xs whitespace-nowrap">
                              <Target className="h-2.5 w-2.5 text-terracotta-600 shrink-0" />
                              Potential Client
                            </span>
                            <span className="text-[10px] text-stone-400 italic pl-1">
                              No website
                            </span>
                          </div>
                        )}
                      </TableCell>

                      {/* Actions Menu Column */}
                      <TableCell
                        className="px-3 py-3.5 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <button
                                type="button"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-200/70 transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-botanical-500 mx-auto"
                                title="Lead options"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            }
                          />
                          <DropdownMenuContent
                            align="end"
                            className="w-52 p-1 text-xs"
                          >
                            <DropdownMenuItem
                              onClick={() =>
                                handleOpenViewDetails(lead)
                              }
                              className="gap-2 cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5 text-stone-500" />
                              <span>View Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenPipeline(lead)}
                              className="gap-2 cursor-pointer font-semibold text-botanical-900"
                            >
                              <Target className="h-3.5 w-3.5 text-botanical-700" />
                              <span>Update Pipeline & Status</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenNotes(lead)}
                              className="gap-2 cursor-pointer"
                            >
                              <MessageSquare className="h-3.5 w-3.5 text-stone-600" />
                              <span>
                                Activity & Notes (
                                {lead.notes?.length || 0})
                              </span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setLeadToDelete(lead);
                                setIsDeleteLeadModalOpen(true);
                              }}
                              className="gap-2 cursor-pointer text-rose-700 hover:text-rose-800 hover:bg-rose-50 font-medium"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                              <span>Delete Lead</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

      {/* Pure Read-Only Lead Detail Sheet */}
      <LeadDetailSheet
        lead={selectedLeadForView}
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        onDeleteLead={(lead) => {
          setIsViewModalOpen(false);
          setLeadToDelete(lead);
          setIsDeleteLeadModalOpen(true);
        }}
      />

      {/* Lead Pipeline & Qualification Modal */}
      <LeadPipelineModal
        lead={selectedLeadForPipeline}
        isOpen={isPipelineModalOpen}
        onClose={() => setIsPipelineModalOpen(false)}
        onLeadUpdated={(updated) => {
          setSelectedLeadForPipeline(updated);
          refetchLeads();
          refetchGroup();
        }}
      />

      {/* Lead Activity & Notes Modal */}
      <LeadNotesModal
        lead={selectedLeadForNotes}
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)}
        onLeadUpdated={(updated) => {
          setSelectedLeadForNotes(updated);
          refetchLeads();
        }}
      />

      {/* Add Single Lead Manually Modal */}
      <LeadFormModal
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        targetGroup={
          group || { groupId: targetGroupId, query: groupQuery }
        }
        onSuccess={() => {
          refetchLeads();
          refetchGroup();
          setSyncFeedback("Lead successfully added to this group!");
          setTimeout(() => setSyncFeedback(null), 3000);
        }}
      />

      {/* Delete Lead Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteLeadModalOpen}
        onClose={() => {
          if (!isDeletingLead) {
            setIsDeleteLeadModalOpen(false);
            setLeadToDelete(null);
          }
        }}
        onConfirm={handleConfirmDeleteLead}
        title="Delete Lead"
        description="Are you sure you want to delete this lead? All associated contact information, pipeline status, and activity conversation notes will be permanently removed."
        itemName={leadToDelete?.name}
        isDeleting={isDeletingLead}
      />

      {/* Delete Search Group Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteGroupModalOpen}
        onClose={() => {
          if (!isDeletingGroup) {
            setIsDeleteGroupModalOpen(false);
          }
        }}
        onConfirm={handleConfirmDeleteGroup}
        title="Delete Search Group"
        description="Are you sure you want to delete this entire search group? This will permanently delete the search group along with all leads collected within it."
        itemName={groupQuery}
        requireConfirmationWord="CONFIRM"
        warningNote="Warning: All leads belonging to this search group will be permanently deleted."
        isDeleting={isDeletingGroup}
      />

      {/* Extension Search Automation Modal */}
      <ExtensionSearchModal
        isOpen={isExtractModalOpen}
        onClose={() => setIsExtractModalOpen(false)}
        initialQuery={groupQuery || ""}
      />
    </div>
  );
}
