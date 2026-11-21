"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LeadMetricCards } from "@/components/features/leads/LeadMetricCards";
import { RecentActivityFeed } from "@/components/features/leads/RecentActivityFeed";
import { LeadTable } from "@/components/features/leads/LeadTable";
import { useDashboard } from "@/context";
import type { User } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Sprout,
  PieChart,
} from "lucide-react";

interface OverviewDashboardProps {
  user?: User | null;
}

export default function OverviewDashboard({ user }: OverviewDashboardProps) {
  const router = useRouter();
  const {
    leads,
    groups,
    activities,
    totalLeadsCount,
    totalGroupsCount,
    openLeadDetail,
  } = useDashboard();

  const handleSelectLeadByName = (leadName: string) => {
    const found = leads.find(
      (l) => l.name.toLowerCase() === leadName.toLowerCase()
    );
    if (found) {
      openLeadDetail(found);
    }
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
    (verifiedCount / (totalLeadsCount || 1)) * 100
  );

  return (
    <div className="space-y-8">
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
        totalLeads={totalLeadsCount}
        totalGroups={totalGroupsCount}
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
                          (totalLeadsCount || 1)) *
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
                          (totalLeadsCount || 1)) *
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
                          (totalLeadsCount || 1)) *
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
                  {totalGroupsCount} groups
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
              View All in Leads Table ({totalLeadsCount})
            </Button>
          </div>
        </div>

        <LeadTable
          leads={leads.slice(0, 5)}
          onSelectLead={openLeadDetail}
        />
      </div>
    </div>
  );
}
