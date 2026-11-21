"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { LeadMetricCards } from "@/components/features/leads/LeadMetricCards";
import { RecentActivityFeed } from "@/components/features/leads/RecentActivityFeed";
import { LeadTable } from "@/components/features/leads/LeadTable";
import { LeadDetailSheet } from "@/components/features/leads/LeadDetailSheet";
import { apiClient } from "@/lib/axios";
import {
  mockLeads,
  mockSearchGroups,
  mockRecentActivities,
  ActivityEvent,
} from "@/lib/mock-data";
import { Lead, SearchGroup } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Sprout,
  PieChart,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface OverviewDashboardProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role?: string;
    phone?: string;
    image?: string | null;
  };
}

export default function OverviewDashboard({ user }: OverviewDashboardProps) {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);

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

        const recentActs: ActivityEvent[] = allLeads.slice(0, 10).map((l, i) => ({
          id: `act-${l.leadId || i}`,
          leadName: l.name,
          searchQuery: l.searchQuery,
          timestamp: l.createdAt,
          action: "captured",
          source: l.source,
        }));
        setActivities(recentActs);
      } else {
        setLeads(mockLeads);
        setGroups(mockSearchGroups);
        setActivities(mockRecentActivities);
      }
    } catch {
      setLeads(mockLeads);
      setGroups(mockSearchGroups);
      setActivities(mockRecentActivities);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsSheetOpen(true);
  };

  const handleSelectLeadByName = (leadName: string) => {
    const found = leads.find(
      (l) => l.name.toLowerCase() === leadName.toLowerCase()
    );
    if (found) {
      setSelectedLead(found);
      setIsSheetOpen(true);
    }
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
      setSyncFeedback("Remark synced to MongoDB database!");
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
      `leads-export-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSyncFeedback("Lead dataset successfully exported as CSV!");
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  // Calculations for metrics
  const totalLeads = leads.length;
  const totalGroupsCount = groups.length;
  const potentialCount = leads.filter((l) => !l.website).length;
  const verifiedCount = leads.filter(
    (l) => Boolean(l.phone) && Boolean(l.email)
  ).length;
  const conversionRate = Math.round(
    (verifiedCount / (totalLeads || 1)) * 100
  );

  return (
    <AppShell
      activeTab="overview"
      onTabChange={() => {}}
      totalLeadsCount={totalLeads}
      totalGroupsCount={totalGroupsCount}
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

      <div className="space-y-8">
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Admin Console &bull; Real-time Scraper Ingestion
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-botanical-900">
              Scraping Operations
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Continuous lead harvesting from Google Maps, LinkedIn &amp; Facebook.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            <Button
              variant="outline"
              onClick={() => router.push("/leads")}
              className="border-stone-300 text-stone-800 hover:bg-oatmeal-200/60 rounded-xl gap-2 text-xs h-10 px-4 cursor-pointer"
            >
              <span>Explore Leads Directory</span>
              <ArrowRight className="h-3.5 w-3.5 text-stone-500" />
            </Button>
          </div>
        </div>

        {/* Metric Cards Top Row */}
        <LeadMetricCards
          totalLeads={totalLeads}
          totalGroups={totalGroupsCount}
          conversionRate={conversionRate}
          potentialClients={potentialCount}
        />

        {/* Split Row: Activity Stream + Extraction Channels breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity Feed (Left 2 cols) */}
          <div className="lg:col-span-2">
            <RecentActivityFeed
              activities={activities}
              onSelectLeadByName={handleSelectLeadByName}
            />
          </div>

          {/* Source Distribution Card (Right 1 col) */}
          <div className="space-y-6">
            <Card className="border border-stone-200/90 bg-[#FCFBF8] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-base font-semibold text-botanical-900 flex items-center justify-between">
                  <span>Source Channels</span>
                  <PieChart className="h-4 w-4 text-sage-600" />
                </CardTitle>
                <p className="text-xs text-stone-500">
                  Distribution of leads captured by platform
                </p>
              </CardHeader>

              <CardContent className="p-0 space-y-3">
                {[
                  {
                    source: "Google Maps",
                    count: leads.filter((l) => l.source.includes("Google")).length,
                    color: "bg-botanical-700",
                  },
                  {
                    source: "Instagram",
                    count: leads.filter((l) => l.source.includes("Instagram")).length,
                    color: "bg-terracotta-500",
                  },
                  {
                    source: "LinkedIn",
                    count: leads.filter((l) => l.source.includes("LinkedIn")).length,
                    color: "bg-sage-500",
                  },
                  {
                    source: "Web / Facebook",
                    count: leads.filter(
                      (l) =>
                        l.source.includes("Web") ||
                        l.source.includes("Facebook") ||
                        l.source.includes("Outreach")
                    ).length,
                    color: "bg-stone-400",
                  },
                ].map((item) => {
                  const pct = Math.round((item.count / (totalLeads || 1)) * 100);
                  return (
                    <div key={item.source} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-stone-700">
                          {item.source}
                        </span>
                        <span className="text-stone-500">
                          {item.count} leads ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200/70">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                <div className="pt-3 border-t border-stone-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/leads")}
                    className="w-full text-xs text-botanical-800 hover:text-botanical-900 hover:bg-oatmeal-200/60 justify-between h-8 px-2 cursor-pointer"
                  >
                    <span>Manage Search Groups</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Tip Card */}
            <div className="rounded-2xl border border-sage-200/80 bg-sage-50/70 p-4">
              <div className="flex items-start gap-2.5">
                <Sprout className="h-5 w-5 text-botanical-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-botanical-900">
                    Botanical Tip: Lead Profiles
                  </h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-stone-600">
                    Click on any lead row to slide out the physical paper
                    profile card. You can view all direct social links,
                    WhatsApp direct chat, and save custom remarks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Preview Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-botanical-900">
                Recently Captured Prospects
              </h3>
              <p className="text-xs text-stone-500">
                Latest leads received from current browser queries
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/leads")}
                className="text-xs h-8 text-botanical-800 border-stone-200 cursor-pointer"
              >
                View All in Leads Table ({totalLeads})
              </Button>
            </div>
          </div>

          <LeadTable
            leads={leads.slice(0, 5)}
            onSelectLead={handleSelectLead}
          />
        </div>
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
