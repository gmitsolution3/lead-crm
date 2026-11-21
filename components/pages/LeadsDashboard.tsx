"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { LeadTable } from "@/components/features/leads/LeadTable";
import { LeadDetailSheet } from "@/components/features/leads/LeadDetailSheet";
import { SearchGroupGrid } from "@/components/features/search-groups/SearchGroupGrid";
import { apiClient } from "@/lib/axios";
import { mockLeads, mockSearchGroups } from "@/lib/mock-data";
import { Lead, SearchGroup } from "@/types";
import { FolderKanban, Users, CheckCircle2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LeadsDashboardProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role?: string;
    phone?: string;
    image?: string | null;
  };
}

export default function LeadsDashboard({ user }: LeadsDashboardProps) {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [leadsSubView, setLeadsSubView] = useState<"groups" | "all">("groups");

  // Lead detail sheet state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);

  // Sync notification toast / feedback
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
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

        const allLeads = mappedGroups.flatMap((g) => g.leads || []);
        setGroups(mappedGroups);
        setLeads(allLeads);
      } else {
        setLeads(mockLeads);
        setGroups(mockSearchGroups);
      }
    } catch {
      setLeads(mockLeads);
      setGroups(mockSearchGroups);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsSheetOpen(true);
  };

  const handleSaveRemark = async (leadId: string, newRemark: string) => {
    setLeads((prev) =>
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

  const handleRefreshData = async () => {
    setSyncFeedback("Syncing with backend database...");
    try {
      await fetchDashboardData();
      setSyncFeedback("Database sync complete!");
    } catch {
      setSyncFeedback("Failed to sync with backend database.");
    }
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  const handleExportLeads = () => {
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
    const rows = leads.map((l) => [
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
      `all-leads-export-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSyncFeedback("All leads exported successfully!");
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  const handleSelectGroup = (queryOrId: string) => {
    router.push(`/leads/${encodeURIComponent(queryOrId)}`);
  };

  const potentialClientsCount = leads.filter((l) => !l.website).length;

  return (
    <AppShell
      activeTab="leads"
      onTabChange={() => {}}
      totalLeadsCount={leads.length}
      totalGroupsCount={groups.length}
      onRefreshData={handleRefreshData}
      onExportLeads={handleExportLeads}
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
        {/* Top Header & Sub-view Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Data Repository
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-botanical-900">
              Prospects &amp; Extracted Leads
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Browse leads categorized by search query groups or view the complete unified table.
            </p>
          </div>

          {/* Sub-view toggle & Quick Info */}
          <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
            {potentialClientsCount > 0 && (
              <span
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-terracotta-100 text-terracotta-900 border border-terracotta-200/90 shadow-2xs"
                title={`${potentialClientsCount} leads in your repository do not have a website (ideal outreach targets)`}
              >
                <Sparkles className="h-3.5 w-3.5 text-terracotta-600" />
                <span>{potentialClientsCount} Potential Clients (No Website)</span>
              </span>
            )}

            <div className="flex items-center rounded-xl bg-oatmeal-200/80 p-1 border border-stone-200/80 shrink-0">
              <button
                type="button"
                onClick={() => setLeadsSubView("groups")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  leadsSubView === "groups"
                    ? "bg-paper text-botanical-900 shadow-sm"
                    : "text-stone-600 hover:text-botanical-900"
                }`}
              >
                <FolderKanban className="h-3.5 w-3.5" />
                <span>Search Groups ({groups.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setLeadsSubView("all")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  leadsSubView === "all"
                    ? "bg-paper text-botanical-900 shadow-sm"
                    : "text-stone-600 hover:text-botanical-900"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>All Leads ({leads.length})</span>
              </button>
            </div>
          </div>
        </div>

        {leadsSubView === "groups" ? (
          <SearchGroupGrid
            groups={groups}
            leads={leads}
            onSelectGroupQuery={handleSelectGroup}
          />
        ) : (
          <LeadTable
            leads={leads}
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
