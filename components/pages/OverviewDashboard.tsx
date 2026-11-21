"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { LeadMetricCards } from "@/components/features/leads/LeadMetricCards";
import { RecentActivityFeed } from "@/components/features/leads/RecentActivityFeed";
import { LeadDetailSheet } from "@/components/features/leads/LeadDetailSheet";
import { useFetch, usePatch } from "@/hooks";
import { Lead, SearchGroup } from "@/types";
import type { User, ActivityEvent } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import { formatDate } from "@/lib/utils";
import {
  ArrowRight,
  Sprout,
  PieChart,
  CheckCircle2,
  Sparkles,
  Globe,
  Mail,
  Phone,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface OverviewDashboardProps {
  user?: User | null;
}

export default function OverviewDashboard({ user }: OverviewDashboardProps) {
  const router = useRouter();

  // Colocated SWR fetch for search groups
  const { data: searchGroupsData } = useFetch<any>("/search-groups");

  // Reusable SWR mutation for remark saving with automatic cache invalidation
  const { mutateAsync: patchLeadRemark } = usePatch("/leads", {
    invalidateQueries: [["/search-groups"], ["/leads"]],
  });

  const groups: SearchGroup[] = useMemo(() => {
    const raw = searchGroupsData?.data || searchGroupsData;
    return Array.isArray(raw) ? raw : [];
  }, [searchGroupsData]);

  const [remarkOverrides, setRemarkOverrides] = useState<Record<string, string>>({});

  const leads: Lead[] = useMemo(() => {
    const extracted = groups.flatMap((g) => g.leads || []);
    const baseList = extracted;
    if (Object.keys(remarkOverrides).length === 0) return baseList;
    return baseList.map((l) =>
      remarkOverrides[l.leadId] !== undefined
        ? { ...l, remark: remarkOverrides[l.leadId], updatedAt: new Date().toISOString() }
        : l
    );
  }, [groups, remarkOverrides]);

  const activities: ActivityEvent[] = useMemo(() => {
    if (leads.length > 0) {
      return leads.slice(0, 10).map((l, i) => ({
        id: `act-${l.leadId || i}`,
        leadName: l.name,
        searchQuery: l.searchQuery,
        timestamp: l.createdAt,
        action: "captured" as const,
        source: l.source,
      }));
    }
    return [];
  }, [leads]);

  // Lead detail sheet state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
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

  const handleSaveRemark = async (leadId: string, newRemark: string) => {
    setRemarkOverrides((prev) => ({ ...prev, [leadId]: newRemark }));
    if (selectedLead && selectedLead.leadId === leadId) {
      setSelectedLead((prev) =>
        prev
          ? { ...prev, remark: newRemark, updatedAt: new Date().toISOString() }
          : null
      );
    }

    try {
      await patchLeadRemark({
        id: `${encodeURIComponent(leadId)}/remark`,
        data: { remark: newRemark },
      });
      setSyncFeedback("Remark saved successfully!");
    } catch {
      setSyncFeedback("Local remark updated (Offline mode)");
    }
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  // Metrics Calculations
  const verifiedCount = leads.filter(
    (l) => Boolean(l.phone) || Boolean(l.email)
  ).length;
  const prospectsWithoutWebsite = leads.filter((l) => !l.website).length;
  const enrichedSocialCount = leads.filter(
    (l) =>
      Boolean(l.facebook) ||
      Boolean(l.instagram) ||
      Boolean(l.linkedin) ||
      Boolean(l.whatsapp)
  ).length;
  const conversionRate = Math.round(
    (verifiedCount / (leads.length || 1)) * 100
  );

  return (
    <div className="space-y-8">
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

      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-stone-200/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sage-300 bg-sage-50/80 px-3 py-1 text-xs font-semibold text-botanical-800 mb-2">
            <Sprout className="h-3.5 w-3.5 text-sage-600" />
            <span>GM Lead Generator &bull; Organic Workspace</span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-botanical-900 md:text-4xl">
            Live Workspace Overview
          </h1>
          <p className="mt-1 text-sm text-stone-600 max-w-2xl">
            Real-time feed of multi-platform leads extracted from Google Maps,
            Facebook, and LinkedIn searches with live social contact
            enrichment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="default"
            size="default"
            onClick={() => router.push("/leads")}
            className="cursor-pointer gap-2"
          >
            <span>Explore All Leads</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <LeadMetricCards
        totalLeads={leads.length}
        totalGroups={groups.length}
        conversionRate={conversionRate}
        potentialClients={prospectsWithoutWebsite}
      />

      {/* Two Column Layout: Recent Activity + Distribution Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Activity Feed */}
        <div className="lg:col-span-2">
          <RecentActivityFeed
            activities={activities}
            onSelectLeadByName={handleSelectLeadByName}
          />
        </div>

        {/* Right 1 Col: Platform Health & Lead Insights */}
        <div className="space-y-6">
          {/* Engine Status Card */}
          <Card className="border border-stone-200/90 shadow-paper">
            <CardHeader className="pb-3 border-b border-stone-100">
              <CardTitle className="font-serif text-base text-botanical-900 flex items-center gap-2">
                <PieChart className="h-4 w-4 text-terracotta-600" />
                <span>Extraction Breakdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium text-stone-600 mb-1.5">
                  <span>Google Maps Extraction</span>
                  <span className="font-semibold text-botanical-800">
                    {
                      leads.filter(
                        (l) =>
                          l.source.toLowerCase().includes("map") ||
                          l.source.toLowerCase().includes("google")
                      ).length
                    }{" "}
                    leads
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-oatmeal-200 overflow-hidden">
                  <div
                    className="h-full bg-sage-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (leads.filter(
                          (l) =>
                            l.source.toLowerCase().includes("map") ||
                            l.source.toLowerCase().includes("google")
                        ).length /
                          (leads.length || 1)) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-stone-600 mb-1.5">
                  <span>Facebook Places &amp; Groups</span>
                  <span className="font-semibold text-botanical-800">
                    {
                      leads.filter(
                        (l) =>
                          l.source.toLowerCase().includes("face") ||
                          l.source.toLowerCase().includes("insta")
                      ).length
                    }{" "}
                    leads
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-oatmeal-200 overflow-hidden">
                  <div
                    className="h-full bg-terracotta-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (leads.filter(
                          (l) =>
                            l.source.toLowerCase().includes("face") ||
                            l.source.toLowerCase().includes("insta")
                        ).length /
                          (leads.length || 1)) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-stone-600 mb-1.5">
                  <span>LinkedIn Directory</span>
                  <span className="font-semibold text-botanical-800">
                    {
                      leads.filter((l) =>
                        l.source.toLowerCase().includes("linkedin")
                      ).length
                    }{" "}
                    leads
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-oatmeal-200 overflow-hidden">
                  <div
                    className="h-full bg-botanical-700 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (leads.filter((l) =>
                          l.source.toLowerCase().includes("linkedin")
                        ).length /
                          (leads.length || 1)) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-stone-200 bg-oatmeal-100/50 p-3 mt-4 text-xs text-stone-600 leading-relaxed">
                <span className="font-semibold text-botanical-800">
                  Efficiency Tip:
                </span>{" "}
                Target companies labeled with{" "}
                <span className="font-bold text-terracotta-700">
                  &ldquo;No Website&rdquo;
                </span>{" "}
                for highest web design and conversion rates.
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Summary */}
          <Card className="border border-stone-200/90 shadow-paper bg-gradient-to-br from-paper to-oatmeal-100/40">
            <CardHeader className="pb-3 border-b border-stone-100">
              <CardTitle className="font-serif text-base text-botanical-900">
                Workspace Health
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between text-xs py-1 border-b border-stone-100">
                <span className="text-stone-500">Contactability Score</span>
                <span className="font-bold text-botanical-800">
                  {conversionRate}%
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-b border-stone-100">
                <span className="text-stone-500">Unique Search Clusters</span>
                <span className="font-bold text-botanical-800">
                  {groups.length} groups
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-stone-500">Database Engine</span>
                <span className="font-semibold text-emerald-700">
                  MongoDB Atlas (Active)
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Leads Table Preview (Top 5 Recent) */}
      <div className="space-y-4 pt-4 border-t border-stone-200/80">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold text-botanical-900">
              Recently Captured Leads
            </h2>
            <p className="text-xs text-stone-500">
              Displaying the latest leads saved directly from the Chrome
              extension.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/leads")}
              className="text-xs h-8 text-botanical-800 border-stone-200 cursor-pointer"
            >
              View All in Leads Table ({leads.length})
            </Button>
          </div>
        </div>

        {leads.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-[#FCFBF8] p-8 text-center text-xs text-stone-500">
            No leads captured yet. Captured leads will appear here.
          </div>
        ) : (
          <div className="rounded-2xl border border-stone-200/90 bg-[#FCFBF8] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-stone-200 bg-oatmeal-200/60 hover:bg-oatmeal-200/60">
                  <TableHead className="w-[260px]">Business Name</TableHead>
                  <TableHead className="w-[200px]">Contact Info</TableHead>
                  <TableHead className="w-[180px]">Website / Status</TableHead>
                  <TableHead className="w-[120px]">Source</TableHead>
                  <TableHead className="w-[90px] text-right">Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.slice(0, 5).map((lead, idx) => {
                  const isEven = idx % 2 === 1;
                  return (
                    <TableRow
                      key={lead.leadId || idx}
                      onClick={() => handleSelectLead(lead)}
                      className={`cursor-pointer transition-colors border-b border-stone-200/60 ${
                        isEven ? "bg-oatmeal-100/40" : "bg-paper"
                      } hover:bg-sage-100/50`}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                              !lead.website
                                ? "bg-terracotta-100 text-terracotta-900 border border-terracotta-200"
                                : "bg-sage-200/80 text-botanical-900"
                            }`}
                          >
                            {lead.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-botanical-900 truncate hover:text-botanical-700">
                              {lead.name}
                            </p>
                            <p className="text-[11px] text-stone-400 truncate max-w-[200px]">
                              {lead.address || "No address"}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col space-y-0.5 text-xs">
                          {lead.email ? (
                            <div className="flex items-center gap-1.5 text-stone-700 truncate max-w-[180px]">
                              <Mail className="h-3 w-3 text-sage-600 shrink-0" />
                              <span className="truncate">{lead.email}</span>
                            </div>
                          ) : null}
                          {lead.phone ? (
                            <div className="flex items-center gap-1.5 text-stone-600 text-[11px] truncate">
                              <Phone className="h-3 w-3 text-stone-400 shrink-0" />
                              <span>{lead.phone}</span>
                            </div>
                          ) : null}
                          {!lead.email && !lead.phone && (
                            <span className="text-[11px] text-stone-400 italic">No contact info</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {lead.website ? (
                          <a
                            href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 text-xs text-botanical-800 hover:text-botanical-600 hover:underline max-w-[150px] truncate"
                          >
                            <Globe className="h-3.5 w-3.5 text-sage-600 shrink-0" />
                            <span className="truncate">{lead.website.replace(/^https?:\/\/(www\.)?/, "")}</span>
                            <ExternalLink className="h-2.5 w-2.5 text-stone-400 shrink-0" />
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-terracotta-100/90 border border-terracotta-300/80 px-2 py-0.5 text-[10px] font-semibold text-terracotta-800">
                            <Sparkles className="h-2.5 w-2.5 text-terracotta-600 shrink-0" />
                            Potential Client
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge variant="sage" className="rounded-full px-2 py-0.5 text-[10px] font-medium">
                          {lead.source}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right text-xs text-stone-400">
                        {formatDate(lead.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Lead Detail Sheet */}
      <LeadDetailSheet
        lead={selectedLead}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSaveRemark={handleSaveRemark}
      />
    </div>
  );
}
