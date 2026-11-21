"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { LeadTable } from "@/components/features/leads/LeadTable";
import { LeadDetailSheet } from "@/components/features/leads/LeadDetailSheet";
import { apiClient } from "@/lib/axios";
import { mockLeads, mockSearchGroups } from "@/lib/mock-data";
import { Lead, SearchGroup } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GroupLeadsDashboardProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role?: string;
    phone?: string;
    image?: string | null;
  };
  groupId: string;
}

export default function GroupLeadsDashboard({
  user,
  groupId,
}: GroupLeadsDashboardProps) {
  const router = useRouter();
  const decodedId = decodeURIComponent(groupId || "");
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Lead detail sheet state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);

  // Sync notification toast / feedback
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<any>("/search-groups");
      const searchGroups = res.data?.data || res.data || [];
      if (Array.isArray(searchGroups) && searchGroups.length > 0) {
        const mappedGroups: SearchGroup[] = searchGroups.map((g: any) => ({
          id: g.id || g._id || g.groupId,
          groupId: g.groupId || g.id,
          query: g.query,
          createdAt: g.createdAt || new Date().toISOString(),
          updatedAt: g.updatedAt || new Date().toISOString(),
          leads: Array.isArray(g.leads)
            ? g.leads.map((l: any) => ({
                id: l.id || l._id || l.leadId,
                leadId: l.leadId || l.id,
                groupId: g.groupId || g.id,
                name: l.name || "Unknown Company",
                phone: l.phone || null,
                email: l.email || null,
                website: l.website || null,
                facebook: l.facebook || null,
                instagram: l.instagram || null,
                linkedin: l.linkedin || null,
                whatsapp: l.whatsapp || null,
                address: l.address || "",
                searchQuery: g.query,
                source: l.source || "Google Maps",
                remark: l.remark || "",
                createdAt: l.createdAt || g.createdAt || new Date().toISOString(),
                updatedAt: l.updatedAt || g.updatedAt || new Date().toISOString(),
              }))
            : [],
        }));

        const leadsList = mappedGroups.flatMap((g) => g.leads || []);
        setGroups(mappedGroups);
        setAllLeads(leadsList);
      } else {
        setAllLeads(mockLeads);
        setGroups(mockSearchGroups);
      }
    } catch {
      setAllLeads(mockLeads);
      setGroups(mockSearchGroups);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Find the target group matching groupId or query
  const targetGroup = groups.find(
    (g) =>
      g.groupId?.toLowerCase() === decodedId.toLowerCase() ||
      g.query?.toLowerCase() === decodedId.toLowerCase()
  );

  const groupQuery = targetGroup ? targetGroup.query : decodedId;

  // Filter leads that belong to this group
  const groupLeads = allLeads.filter((l) => {
    if (targetGroup) {
      return (
        l.groupId === targetGroup.groupId ||
        l.searchQuery.toLowerCase() === targetGroup.query.toLowerCase()
      );
    }
    return (
      l.groupId?.toLowerCase() === decodedId.toLowerCase() ||
      l.searchQuery?.toLowerCase() === decodedId.toLowerCase()
    );
  });

  const potentialCount = groupLeads.filter((l) => !l.website).length;

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsSheetOpen(true);
  };

  const handleSaveRemark = async (leadId: string, newRemark: string) => {
    setAllLeads((prev) =>
      prev.map((l) =>
        l.leadId === leadId
          ? {
              ...l,
              remark: newRemark,
              updatedAt: new Date().toISOString(),
            }
          : l
      )
    );
    if (selectedLead && selectedLead.leadId === leadId) {
      setSelectedLead((prev) =>
        prev
          ? {
              ...prev,
              remark: newRemark,
              updatedAt: new Date().toISOString(),
            }
          : null
      );
    }

    try {
      await apiClient.patch(`/leads/${encodeURIComponent(leadId)}/remark`, {
        remark: newRemark,
      });
      setSyncFeedback("Remark saved successfully!");
    } catch {
      setSyncFeedback("Local remark updated (Offline mode)");
    }
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  const handleExportGroupLeads = () => {
    const headers = [
      "Lead ID",
      "Name",
      "Source",
      "Email",
      "Phone",
      "Website",
      "Search Query",
      "Address",
    ];
    const rows = groupLeads.map((l) => [
      l.leadId,
      `"${l.name.replace(/"/g, '""')}"`,
      l.source,
      l.email || "",
      l.phone || "",
      l.website || "",
      `"${l.searchQuery.replace(/"/g, '""')}"`,
      `"${(l.address || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `group-leads-${groupQuery.replace(/[^a-zA-Z0-9]/g, "_")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSyncFeedback("Search group leads exported as CSV!");
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  return (
    <AppShell
      activeTab="leads"
      onTabChange={() => {}}
      totalLeadsCount={allLeads.length}
      totalGroupsCount={groups.length}
      onRefreshData={fetchDashboardData}
      selectedGroupQuery={groupQuery}
      onClearGroupFilter={() => router.push("/leads")}
      onExportLeads={handleExportGroupLeads}
    >
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

      <div className="space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/leads")}
              className="-ml-2 mb-2 text-xs text-stone-600 hover:text-botanical-900 hover:bg-oatmeal-200/60 gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Search Groups</span>
            </Button>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Search Group Dataset
              </span>
              <Badge variant="sage" className="text-[10px]">
                {groupLeads.length} {groupLeads.length === 1 ? "lead" : "leads"}
              </Badge>
              {potentialCount > 0 && (
                <Badge
                  variant="terracotta"
                  className="text-[10px] gap-1 font-semibold bg-terracotta-100 text-terracotta-800 border-terracotta-200"
                  title={`${potentialCount} businesses in this group without a website`}
                >
                  <Sparkles className="h-2.5 w-2.5 text-terracotta-600" />
                  {potentialCount} Potential {potentialCount === 1 ? "Client" : "Clients"} (No Website)
                </Badge>
              )}
              {targetGroup && (
                <span className="text-xs text-stone-400 bg-oatmeal-200/70 px-2 py-0.5 rounded-md">
                  {targetGroup.groupId}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-botanical-900">
              &ldquo;{groupQuery}&rdquo;
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Extracted leads collected under this search query from your browser extension.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportGroupLeads}
              disabled={groupLeads.length === 0}
              className="text-xs h-9 text-botanical-800 border-stone-300 gap-1.5 cursor-pointer rounded-xl"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Group CSV</span>
            </Button>
          </div>
        </div>

        {/* Leads Table for this group */}
        {loading ? (
          <div className="flex items-center justify-center p-12 text-sm text-stone-500">
            Loading leads for &ldquo;{groupQuery}&rdquo;...
          </div>
        ) : groupLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-stone-200 bg-[#FCFBF8] p-12 text-center">
            <AlertCircle className="h-8 w-8 text-stone-400 mb-2" />
            <h3 className="text-sm font-semibold text-botanical-900">No leads found in this group</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm">
              Either extraction is still running, or no records were returned for &ldquo;{groupQuery}&rdquo;.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/leads")}
              className="mt-4 text-xs"
            >
              Return to All Search Groups
            </Button>
          </div>
        ) : (
          <LeadTable
            groupId={targetGroup?.groupId || groupQuery}
            selectedGroupQuery={groupQuery}
            leads={groupLeads}
            onSelectLead={handleSelectLead}
          />
        )}
      </div>

      {/* Slide-out Physical Paper Lead Detail Sheet */}
      <LeadDetailSheet
        lead={selectedLead}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSaveRemark={handleSaveRemark}
      />
    </AppShell>
  );
}
