"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LeadMetricCards } from "@/components/features/leads/LeadMetricCards";
import { RecentActivityFeed } from "@/components/features/leads/RecentActivityFeed";
import { LeadTable } from "@/components/features/leads/LeadTable";
import { LeadDetailSheet } from "@/components/features/leads/LeadDetailSheet";
import { LeadFormModal } from "@/components/features/leads/LeadFormModal";
import { SearchGroupGrid } from "@/components/features/search-groups/SearchGroupGrid";
import {
  mockLeads,
  mockSearchGroups,
  mockRecentActivities,
  ActivityEvent,
} from "@/lib/mock-data";
import { Lead, SearchGroup } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Sprout,
  Compass,
  PieChart,
  CheckCircle2,
  PlusCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [groups, setGroups] = useState<SearchGroup[]>(mockSearchGroups);
  const [activities, setActivities] = useState<ActivityEvent[]>(mockRecentActivities);
  const [globalSearch, setGlobalSearch] = useState<string>("");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string | null>(null);

  // Lead detail sheet state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);

  // New Lead Form Modal state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  // Sync notification toast / feedback
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsSheetOpen(true);
  };

  const handleSelectLeadByName = (leadName: string) => {
    const found = leads.find(
      (l) => l.name.toLowerCase() === leadName.toLowerCase()
    );
    if (found) {
      handleSelectLead(found);
    }
  };

  const handleFilterByGroup = (query: string) => {
    setSelectedGroupFilter(query);
    setActiveTab("leads");
  };

  const handleAddLead = (newLead: Lead) => {
    setLeads((prev) => [newLead, ...prev]);

    // Check if group exists, if not create it
    const groupExists = groups.some(
      (g) => g.query.toLowerCase() === newLead.searchQuery.toLowerCase()
    );
    if (!groupExists) {
      const newGroup: SearchGroup = {
        groupId: newLead.groupId,
        query: newLead.searchQuery,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setGroups((prev) => [newGroup, ...prev]);
    }

    // Add activity stream event
    const newEvent: ActivityEvent = {
      id: `act-${Date.now()}`,
      leadName: newLead.name,
      searchQuery: newLead.searchQuery,
      source: newLead.source,
      action: "captured",
      timestamp: new Date().toISOString(),
    };
    setActivities((prev) => [newEvent, ...prev.slice(0, 7)]);

    setSyncFeedback(`Successfully added "${newLead.name}" to directory!`);
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  const handleSaveRemark = (leadId: string, newRemark: string) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.leadId === leadId
          ? { ...l, remark: newRemark, updatedAt: new Date().toISOString() }
          : l
      )
    );
    if (selectedLead && selectedLead.leadId === leadId) {
      setSelectedLead((prev) =>
        prev
          ? { ...prev, remark: newRemark, updatedAt: new Date().toISOString() }
          : null
      );
    }
  };

  const handleRefreshData = () => {
    setSyncFeedback("Syncing with extension...");
    setTimeout(() => {
      const newLead: Lead = {
        leadId: `lead-${Date.now().toString().slice(-4)}`,
        groupId: "grp-eco-cafe-ny",
        searchQuery: "Specialty Organic Cafes in Brooklyn",
        source: "Google Maps",
        name: "Botanica Cold Brew & Herbal Co.",
        phone: "+1 (718) 555-0982",
        email: "hello@botanicabrew.nyc",
        website: "https://botanicabrew.nyc",
        address: "71 N 7th St, Brooklyn, NY 11249",
        facebook: "https://facebook.com/botanicabrew",
        instagram: "https://instagram.com/botanicabrew_ny",
        linkedin: "",
        whatsapp: "+17185550982",
        remark: "Just scraped from Google Maps local listing. High matching keyword relevance.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setLeads((prev) => [newLead, ...prev]);

      const newEvent: ActivityEvent = {
        id: `act-${Date.now()}`,
        leadName: newLead.name,
        searchQuery: newLead.searchQuery,
        source: newLead.source,
        action: "captured",
        timestamp: new Date().toISOString(),
      };
      setActivities((prev) => [newEvent, ...prev.slice(0, 7)]);

      setSyncFeedback("Extension sync complete! +1 new lead received.");
      setTimeout(() => setSyncFeedback(null), 3000);
    }, 800);
  };

  const handleNewGroupPrompt = () => {
    const title = prompt("Enter new search query for campaign group:");
    if (!title) return;
    const newGroup: SearchGroup = {
      groupId: `grp-${Date.now().toString().slice(-4)}`,
      query: title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setGroups((prev) => [newGroup, ...prev]);
  };

  // Calculations for metrics
  const totalLeads = leads.length;
  const activeCampaigns = groups.length;
  const enrichedCount = leads.filter(
    (l) => Boolean(l.phone) && Boolean(l.email)
  ).length;
  const conversionRate = Math.round((enrichedCount / (totalLeads || 1)) * 100);

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      searchQuery={globalSearch}
      onSearchChange={setGlobalSearch}
      totalLeadsCount={totalLeads}
      totalGroupsCount={activeCampaigns}
      onRefreshData={handleRefreshData}
      selectedGroupQuery={selectedGroupFilter}
      onClearGroupFilter={() => setSelectedGroupFilter(null)}
      onOpenNewLeadForm={() => setIsFormOpen(true)}
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

      {/* Main Tab Content */}
      <div className="space-y-8">
        {/* VIEW 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Page Header / Welcome */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Lead Intelligence Console
                  </span>
                  <span className="h-1 w-1 rounded-full bg-stone-300" />
                  <span className="text-xs text-botanical-700 font-medium">
                    Warm Earth & Botanical UI
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-botanical-900">
                  Organic Growth & Extraction Hub
                </h1>
                <p className="mt-1 text-sm text-stone-600 max-w-2xl">
                  Monitoring incoming prospect streams from your browser extension.
                  Review verified contact profiles, query groups, and social handles.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
                <Button
                  onClick={() => setIsFormOpen(true)}
                  className="bg-botanical-700 hover:bg-botanical-800 text-paper rounded-xl gap-2 text-xs h-10 px-4 shadow-paper cursor-pointer font-medium"
                >
                  <PlusCircle className="h-4 w-4 text-sage-300" />
                  <span>Add New Lead</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("leads")}
                  className="border-stone-300 text-stone-800 hover:bg-oatmeal-200/60 rounded-xl gap-2 text-xs h-10 px-4 cursor-pointer"
                >
                  <span>Explore Directory</span>
                  <ArrowRight className="h-3.5 w-3.5 text-stone-500" />
                </Button>
              </div>
            </div>

            {/* Metric Cards Top Row */}
            <LeadMetricCards
              totalLeads={totalLeads}
              activeCampaigns={activeCampaigns}
              conversionRate={conversionRate}
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
                      { source: "Google Maps", count: leads.filter(l => l.source.includes("Google")).length, color: "bg-botanical-700" },
                      { source: "Instagram", count: leads.filter(l => l.source.includes("Instagram")).length, color: "bg-terracotta-500" },
                      { source: "LinkedIn", count: leads.filter(l => l.source.includes("LinkedIn")).length, color: "bg-sage-500" },
                      { source: "Web / Direct", count: leads.filter(l => l.source.includes("Web") || l.source.includes("Facebook") || l.source.includes("Outreach")).length, color: "bg-stone-400" },
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
                        onClick={() => setActiveTab("groups")}
                        className="w-full text-xs text-botanical-800 hover:text-botanical-900 hover:bg-oatmeal-200/60 justify-between h-8 px-2 cursor-pointer"
                      >
                        <span>Manage Search Campaigns</span>
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
                        Botanical Tip: Enriched Profiles
                      </h4>
                      <p className="mt-1 text-[11px] leading-relaxed text-stone-600">
                        Click on any lead row to slide out the physical paper profile card. You can view all direct social links, WhatsApp direct chat, and save custom remarks.
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
                    size="sm"
                    onClick={() => setIsFormOpen(true)}
                    className="bg-botanical-700 hover:bg-botanical-800 text-paper text-xs h-8 px-3 rounded-xl cursor-pointer"
                  >
                    + New Lead
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("leads")}
                    className="text-xs h-8 text-botanical-800 border-stone-200 cursor-pointer"
                  >
                    View All ({totalLeads})
                  </Button>
                </div>
              </div>

              <LeadTable
                leads={leads.slice(0, 5)}
                onSelectLead={handleSelectLead}
                externalSearch={globalSearch}
                selectedGroupQuery={selectedGroupFilter}
                onClearGroupFilter={() => setSelectedGroupFilter(null)}
              />
            </div>
          </div>
        )}

        {/* VIEW 2: LEADS TABLE VIEW */}
        {activeTab === "leads" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Data Repository
                  </span>
                  {selectedGroupFilter && (
                    <Badge variant="sage" className="text-[10px]">
                      Filtered by campaign
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-botanical-900">
                  Prospects & Extracted Leads
                </h1>
                <p className="mt-1 text-sm text-stone-600">
                  Complete database of extracted contacts with phone numbers, emails, social profiles, and remarks.
                </p>
              </div>

              <Button
                onClick={() => setIsFormOpen(true)}
                className="bg-botanical-700 hover:bg-botanical-800 text-paper rounded-xl gap-2 text-xs h-10 px-4 shadow-sm cursor-pointer self-start sm:self-auto font-medium"
              >
                <PlusCircle className="h-4 w-4 text-sage-300" />
                <span>Add New Lead</span>
              </Button>
            </div>

            <LeadTable
              leads={leads}
              onSelectLead={handleSelectLead}
              externalSearch={globalSearch}
              selectedGroupQuery={selectedGroupFilter}
              onClearGroupFilter={() => setSelectedGroupFilter(null)}
            />
          </div>
        )}

        {/* VIEW 3: SEARCH GROUPS VIEW */}
        {activeTab === "groups" && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Campaign Architecture
              </span>
              <h1 className="text-3xl font-bold tracking-tight text-botanical-900">
                Search Query Groups
              </h1>
              <p className="mt-1 text-sm text-stone-600">
                Query clusters tracked by your browser scraping extension. Click any card to filter leads.
              </p>
            </div>

            <SearchGroupGrid
              groups={groups}
              leads={leads}
              onSelectGroupQuery={handleFilterByGroup}
              onNewGroup={handleNewGroupPrompt}
            />
          </div>
        )}

        {/* VIEW 4: CAMPAIGNS / PIPELINE */}
        {activeTab === "campaigns" && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Pipeline Management
              </span>
              <h1 className="text-3xl font-bold tracking-tight text-botanical-900">
                Active Scraping Campaigns
              </h1>
              <p className="mt-1 text-sm text-stone-600">
                Overview of automated lead collection schedules and crawler performance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {groups.map((group) => (
                <Card key={group.groupId} className="p-6 border-stone-200 bg-[#FCFBF8]">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="sage" className="mb-2">Active Crawler</Badge>
                      <h3 className="text-xl font-bold text-botanical-900">
                        {group.query}
                      </h3>
                      <p className="text-xs text-stone-400 mt-1">
                        ID: {group.groupId}
                      </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-botanical-50 text-botanical-800">
                      <Compass className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-stone-200 pt-4">
                    <span className="text-xs text-stone-500">
                      {leads.filter(l => l.groupId === group.groupId || l.searchQuery === group.query).length} leads collected
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleFilterByGroup(group.query)}
                      className="text-xs bg-botanical-700 hover:bg-botanical-800 text-paper rounded-xl cursor-pointer"
                    >
                      View Dataset
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Slide-out Physical Paper Lead Detail Sheet */}
      <LeadDetailSheet
        lead={selectedLead}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSaveRemark={handleSaveRemark}
      />

      {/* Add New Lead Form Modal */}
      <LeadFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        searchGroups={groups}
        onAddLead={handleAddLead}
      />
    </AppShell>
  );
}
