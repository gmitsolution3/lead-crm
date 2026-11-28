"use client";

import { LeadDetailSheet } from "@/components/features/leads/LeadDetailSheet";
import { LeadPipelineModal } from "@/components/features/leads/LeadPipelineModal";
import { RecentActivityFeed } from "@/components/features/leads/RecentActivityFeed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFetch } from "@/hooks";
import { useSession } from "@/lib/auth-client";
import { formatDate } from "@/lib/utils";
import type { ActivityEvent, User } from "@/types";
import { Lead } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  Check,
  DollarSign,
  ExternalLink,
  Globe,
  Loader2,
  Mail,
  Phone,
  PieChart,
  Search,
  ShieldCheck,
  Sprout,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type AdminTimeframe = "7d" | "1m" | "3m" | "6m" | "1y";

interface AdminDashboardProps {
  user?: User | null;
}

export default function AdminDashboard({
  user,
}: AdminDashboardProps) {
  const router = useRouter();
  const { data: session } = useSession();

  // Timeframe selector for outreach trend analytics
  const [adminTimeframe, setAdminTimeframe] =
    useState<AdminTimeframe>("7d");

  // Fetch pre-aggregated admin dashboard analytics directly from backend database pipeline
  const {
    data: dashboardDataResponse,
    isLoading: isDashboardLoading,
    refetch: refetchDashboard,
  } = useFetch<any>("/dashboard/admin", {
    timeframe: adminTimeframe,
  });

  const adminData = dashboardDataResponse?.data;

  // Lead detail sheet state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(
    null,
  );

  // Pipeline modal state for quick call outcome logging
  const [pipelineLead, setPipelineLead] = useState<Lead | null>(null);
  const [isPipelineModalOpen, setIsPipelineModalOpen] =
    useState(false);

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsSheetOpen(true);
  };

  const handleSelectLeadByName = (leadName: string) => {
    const found = adminData?.recentLeads?.find(
      (l: Lead) => l.name.toLowerCase() === leadName.toLowerCase(),
    );
    if (found) {
      handleSelectLead(found);
    }
  };

  // Safe fallback values from backend aggregation
  const dailyTarget = adminData?.dailyTarget || 25;
  const perModeratorTarget = adminData?.perModeratorTarget || dailyTarget;
  const moderatorCount = adminData?.moderatorCount || 1;
  const velocity = adminData?.velocity || {
    todayCount: 0,
    yesterdayCount: 0,
    dailyTarget,
    progressPercent: 0,
    isTargetMet: false,
    differenceFromYesterday: 0,
  };

  const kpiSummary = adminData?.kpiSummary || {
    totalLeads: 0,
    totalSearchClusters: 0,
    verifiedCount: 0,
    conversionRate: 0,
    prospectsWithoutWebsite: 0,
    prospectsWithoutWebsitePercent: 0,
    enrichedSocialCount: 0,
    enrichedSocialPercent: 0,
  };

  const funnelStages = adminData?.funnelStages || {
    uncontacted: 0,
    called: 0,
    call_later: 0,
    interested: 0,
    converted: 0,
    not_interested: 0,
    invalid: 0,
    pipelineDeals: 0,
    contactRate: 0,
    activeNegotiationRate: 0,
    dealProposalRate: 0,
    winRate: 0,
  };

  const platformFootprint = adminData?.platformFootprint || {
    googleMaps: 0,
    instagramFacebook: 0,
    linkedin: 0,
    other: 0,
  };

  const trendAnalytics = adminData?.trendAnalytics || {
    timeframe: adminTimeframe,
    periodBenchmark: dailyTarget,
    benchmarkUnitLabel: "day",
    title:
      "7-Day Team Outreach Volume vs. Configured Target Benchmark",
    description:
      "Monitor daily team compliance, weekly cadence, and goal attainment.",
    buckets: [],
    totalTouchpoints: 0,
    periodAverage: 0,
    maxBucketValue: dailyTarget * 1.3,
    metric1Label: "Today's Workspace Touches",
    metric1Value: 0,
    metric1Sub: "0% of daily benchmark",
    metric2Label: "Yesterday's Completed",
    metric2Value: 0,
    metric2Sub: "0 below target",
    metric4Label: "Daily Average",
    metric4Sub: `Benchmark: ${dailyTarget} / day`,
  };

  const moderatorLeaderboard = adminData?.moderatorLeaderboard || [];
  const dealPipeline = adminData?.dealPipeline || {
    totalPipelineValue: 0,
    closedWonValue: 0,
    activeDealsValue: 0,
  };
  const topSearchQueries = adminData?.topSearchQueries || [];
  const recentLeads: Lead[] = adminData?.recentLeads || [];
  const recentActivities: ActivityEvent[] =
    adminData?.recentActivities || [];

  return (
    <div className="space-y-8 animate-fade-in pb-16 font-sans">
      {/* Toast Notification */}
      <AnimatePresence>
        {syncFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 rounded-xl bg-botanical-800 text-paper px-4 py-3 shadow-lg flex items-center gap-2 text-xs border border-sage-500/30"
          >
            <Check className="h-4 w-4 text-sage-200" />
            <span>{syncFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Banner for Admin */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-stone-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-sage-300 bg-sage-50/80 px-3 py-1 text-xs font-semibold text-botanical-800">
              <Sprout className="h-3.5 w-3.5 text-sage-600" />
              <span>GM Lead Generator &bull; Organic Workspace</span>
            </div>
            <Badge
              variant="terracotta"
              className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5"
            >
              Executive Admin
            </Badge>
            {isDashboardLoading && (
              <span className="inline-flex items-center gap-1 text-[11px] text-stone-400">
                <Loader2 className="h-3 w-3 animate-spin text-botanical-600" />
                Updating analytics...
              </span>
            )}
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-botanical-900 md:text-4xl">
            Workspace Command Center
          </h1>
          <p className="mt-1 text-sm text-stone-600 max-w-2xl">
            Live multi-platform extraction intelligence, team outreach
            KPI velocity, and conversion funnel analytics across all
            active search clusters.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="default"
            onClick={() => router.push("/settings")}
            className="cursor-pointer gap-2 border-stone-300 text-stone-700 hover:text-botanical-900 rounded-xl bg-paper shadow-2xs"
          >
            <Target className="h-4 w-4 text-terracotta-600" />
            <span>KPI Settings ({dailyTarget}/day)</span>
          </Button>

          <Button
            variant="outline"
            size="default"
            onClick={() => router.push("/users")}
            className="cursor-pointer gap-2 border-stone-300 text-stone-700 hover:text-botanical-900 rounded-xl bg-paper shadow-2xs"
          >
            <Users className="h-4 w-4 text-botanical-700" />
            <span>Team &amp; Roles</span>
          </Button>

          <Button
            variant="default"
            size="default"
            onClick={() => router.push("/leads")}
            className="cursor-pointer gap-2 bg-botanical-800 hover:bg-botanical-900 text-paper rounded-xl shadow-xs"
          >
            <span>Explore Leads Directory</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Admin Executive Views */}
      <div className="space-y-6">
        {/* 1. Executive Velocity & KPI Metrics (4 High-Impact Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Team Outreach Velocity */}
          <Card className="rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-terracotta-700">
                Daily Outreach Velocity
              </span>
              <Target className="h-4 w-4 text-terracotta-600" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-botanical-900">
                  {velocity.todayCount}
                </span>
                <span className="text-xs font-semibold text-stone-400">
                  / {dailyTarget} goal
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                {velocity.progressPercent}% of team quota ({moderatorCount}{" "}
                {moderatorCount === 1 ? "moderator" : "moderators"} ×{" "}
                {perModeratorTarget}/day)
              </p>
            </div>
            <div className="space-y-1 pt-1 border-t border-stone-100 text-[11px] text-stone-500 flex items-center justify-between">
              <span>Yesterday: {velocity.yesterdayCount}</span>
              <span
                className={
                  velocity.todayCount >= velocity.yesterdayCount
                    ? "text-emerald-700 font-bold"
                    : "text-stone-500"
                }
              >
                {velocity.differenceFromYesterday >= 0
                  ? `+${velocity.differenceFromYesterday} today`
                  : `${velocity.differenceFromYesterday} today`}
              </span>
            </div>
          </Card>

          {/* Card 2: Total Monitored Leads */}
          <Card className="rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-botanical-700">
                Total Monitored Leads
              </span>
              <Users className="h-4 w-4 text-botanical-700" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-botanical-900">
                  {kpiSummary.totalLeads}
                </span>
                <span className="text-xs text-stone-400">
                  records
                </span>
              </div>
              <p className="text-[11px] text-botanical-700 font-medium mt-0.5">
                Across {kpiSummary.totalSearchClusters} search
                clusters
              </p>
            </div>
            <div className="space-y-1 pt-1 border-t border-stone-100 text-[11px] text-stone-500 flex items-center justify-between">
              <span>Verified Contact Info</span>
              <span className="font-semibold text-botanical-800">
                {kpiSummary.conversionRate}%
              </span>
            </div>
          </Card>

          {/* Card 3: Pipeline Deals & Opportunities */}
          <Card className="rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-emerald-700">
                Pipeline &amp; Conversions
              </span>
              <Award className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-800">
                  {funnelStages.pipelineDeals}
                </span>
                <span className="text-xs text-stone-400">
                  prospects
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                {funnelStages.converted} deals closed / converted
              </p>
            </div>
            <div className="space-y-1 pt-1 border-t border-stone-100 text-[11px] text-stone-500 flex items-center justify-between">
              <span>Active Negotiation</span>
              <span className="font-semibold text-botanical-800">
                {funnelStages.interested} leads
              </span>
            </div>
          </Card>

          {/* Card 4: Prospects Without Website */}
          <Card className="rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-terracotta-700">
                Prime Design Prospects
              </span>
              <Target className="h-4 w-4 text-terracotta-600" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-terracotta-700">
                  {kpiSummary.prospectsWithoutWebsite}
                </span>
                <span className="text-xs text-stone-400">
                  ({kpiSummary.prospectsWithoutWebsitePercent}%)
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                No active website presence
              </p>
            </div>
            <div className="space-y-1 pt-1 border-t border-stone-100 text-[11px] text-stone-500 flex items-center justify-between">
              <span>High-margin pitch</span>
              <span className="font-semibold text-terracotta-700">
                Prime Targets
              </span>
            </div>
          </Card>
        </div>

        {/* 2. Full-Width Dynamic Approach Benchmark & Trend Analytics (7D, 1M, 3M, 6M, 1Y) */}
        <Card className="rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-6 shadow-sm space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200/80 pb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-botanical-700 text-paper shrink-0">
                  <TrendingUp className="h-4.5 w-4.5 text-sage-200" />
                </div>
                <h3 className="font-serif text-lg font-bold text-botanical-900">
                  {trendAnalytics.title}
                </h3>
                <Badge
                  variant="sage"
                  className="text-[10px] uppercase font-bold tracking-wider"
                >
                  Target: {trendAnalytics.periodBenchmark}/
                  {trendAnalytics.benchmarkUnitLabel}
                </Badge>
              </div>
              <p className="text-xs text-stone-500">
                {trendAnalytics.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Timeframe Selector Pill Group */}
              <div className="flex items-center rounded-xl bg-oatmeal-200/90 p-1 border border-stone-200/90 shadow-2xs">
                {[
                  { id: "7d", label: "7 Days" },
                  { id: "1m", label: "1 Month" },
                  { id: "3m", label: "3 Months" },
                  { id: "6m", label: "6 Months" },
                  { id: "1y", label: "1 Year" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() =>
                      setAdminTimeframe(tab.id as AdminTimeframe)
                    }
                    className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      adminTimeframe === tab.id
                        ? "bg-[#FCFBF8] text-botanical-900 shadow-2xs border border-stone-300 font-bold"
                        : "text-stone-500 hover:text-stone-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4 Summary Metric Pills */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-stone-200/80 bg-paper p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                {trendAnalytics.metric1Label}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-botanical-900">
                  {trendAnalytics.metric1Value}
                </span>
                {adminTimeframe === "7d" && (
                  <span className="text-xs text-stone-400">
                    / {dailyTarget} goal
                  </span>
                )}
              </div>
              <p className="text-[11px] text-emerald-700 font-medium mt-1">
                {trendAnalytics.metric1Sub}
              </p>
            </div>

            <div className="rounded-xl border border-stone-200/80 bg-paper p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                {trendAnalytics.metric2Label}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-botanical-900">
                  {trendAnalytics.metric2Value}
                </span>
                <span className="text-xs text-stone-400">
                  touches
                </span>
              </div>
              <p
                className="text-[11px] text-stone-500 font-medium mt-1 truncate"
                title={trendAnalytics.metric2Sub}
              >
                {trendAnalytics.metric2Sub}
              </p>
            </div>

            <div className="rounded-xl border border-stone-200/80 bg-paper p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                {adminTimeframe === "7d"
                  ? "7-Day Total Touches"
                  : adminTimeframe === "1m"
                    ? "30-Day Total Touches"
                    : adminTimeframe === "3m"
                      ? "3-Month Total Touches"
                      : adminTimeframe === "6m"
                        ? "6-Month Total Touches"
                        : "1-Year Total Touches"}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-botanical-900">
                  {trendAnalytics.totalTouchpoints}
                </span>
                <span className="text-xs text-stone-400">
                  leads touched
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium mt-1">
                Across workspace pipeline
              </p>
            </div>

            <div className="rounded-xl border border-stone-200/80 bg-paper p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                {trendAnalytics.metric4Label}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-botanical-900">
                  {trendAnalytics.periodAverage}
                </span>
                <span className="text-xs text-stone-400">
                  touches/{trendAnalytics.benchmarkUnitLabel}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium mt-1">
                {trendAnalytics.metric4Sub}
              </p>
            </div>
          </div>

          {/* Dynamic Trend Visual Chart */}
          <div className="rounded-xl border border-stone-200/80 bg-paper p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-botanical-700" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-botanical-900">
                  {adminTimeframe === "7d"
                    ? "Weekly Outreach Cadence"
                    : adminTimeframe === "1m"
                      ? "30-Day Daily Consistency Grid"
                      : adminTimeframe === "3m"
                        ? "12-Week Rolling Trend"
                        : adminTimeframe === "6m"
                          ? "6-Month Velocity Overview"
                          : "12-Month Annual Distribution"}
                </h4>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] text-stone-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-botanical-700" />{" "}
                  Target Met
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-terracotta-500" />{" "}
                  Below Target
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-stone-600">
                  <span className="w-3.5 h-0.5 border-t-2 border-dashed border-terracotta-600" />{" "}
                  Target Benchmark ({trendAnalytics.periodBenchmark}/
                  {trendAnalytics.benchmarkUnitLabel})
                </span>
              </div>
            </div>

            <div className="relative pt-6 pb-2">
              {/* Target Benchmark Reference Line */}
              <div
                className="absolute left-0 right-0 border-b-2 border-dashed border-terracotta-500/80 pointer-events-none z-10"
                style={{
                  bottom: `${Math.min(
                    82,
                    Math.max(
                      18,
                      (trendAnalytics.periodBenchmark /
                        trendAnalytics.maxBucketValue) *
                        100,
                    ),
                  )}%`,
                }}
              >
                <span className="absolute -top-5 right-0 rounded-md bg-terracotta-100 text-terracotta-800 border border-terracotta-200 px-1.5 py-0.5 text-[9px] font-bold">
                  Target: {trendAnalytics.periodBenchmark} /{" "}
                  {trendAnalytics.benchmarkUnitLabel}
                </span>
              </div>

              {/* Bars Container */}
              {adminTimeframe === "1m" ? (
                /* 30-Day Scrollable / Compact Bar Grid */
                <div className="flex items-end justify-between gap-1 sm:gap-1.5 h-48 border-b border-stone-200/90 pb-2 overflow-x-auto pt-2">
                  {trendAnalytics.buckets.map(
                    (bucket: any, idx: number) => {
                      const barHeightPercent = Math.min(
                        100,
                        Math.max(
                          6,
                          Math.round(
                            (bucket.count /
                              trendAnalytics.maxBucketValue) *
                              100,
                          ),
                        ),
                      );
                      const showLabel =
                        idx % 3 === 0 ||
                        idx === trendAnalytics.buckets.length - 1;

                      return (
                        <div
                          key={bucket.key}
                          title={bucket.tooltipText}
                          className="flex-1 min-w-[14px] max-w-[28px] flex flex-col items-center h-full justify-end group relative cursor-pointer"
                        >
                          {/* Floating Hover Badge */}
                          <div className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none whitespace-nowrap bg-stone-900 text-stone-100 text-[9px] px-2 py-0.5 rounded shadow-md font-medium">
                            {bucket.count}/{bucket.target || trendAnalytics.periodBenchmark}
                            <span className={`ml-1 font-bold ${bucket.metTarget ? "text-emerald-400" : "text-amber-300"}`}>
                              ({bucket.progressPercent ?? Math.round((bucket.count / (bucket.target || 1)) * 100)}%)
                            </span>
                          </div>
                          <span className="text-[8px] font-bold text-stone-600 mb-1 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity whitespace-nowrap">
                            {bucket.count > 0 ? bucket.count : ""}
                          </span>
                          <div className="w-full bg-oatmeal-200 rounded-t-sm overflow-hidden flex flex-col justify-end h-full">
                            <div
                              className={`w-full rounded-t-sm transition-all duration-300 ${
                                bucket.metTarget
                                  ? "bg-botanical-700 group-hover:bg-botanical-800"
                                  : "bg-terracotta-500 group-hover:bg-terracotta-600"
                              } ${bucket.isCurrent ? "ring-2 ring-botanical-500 ring-offset-1" : ""}`}
                              style={{
                                height: `${barHeightPercent}%`,
                              }}
                            />
                          </div>
                          <span className="mt-1 text-[8px] font-semibold text-botanical-900 truncate">
                            {showLabel ? bucket.subLabel : "·"}
                          </span>
                        </div>
                      );
                    },
                  )}
                </div>
              ) : (
                /* 7D, 3M, 6M, 1Y Grid */
                <div
                  className={`grid items-end h-48 border-b border-stone-200/90 pb-2 ${
                    adminTimeframe === "7d"
                      ? "grid-cols-7 gap-2 sm:gap-4"
                      : adminTimeframe === "6m"
                        ? "grid-cols-6 gap-3 sm:gap-6"
                        : "grid-cols-6 sm:grid-cols-12 gap-1.5 sm:gap-2.5"
                  }`}
                >
                  {trendAnalytics.buckets.map((bucket: any) => {
                    const barHeightPercent = Math.min(
                      100,
                      Math.max(
                        8,
                        Math.round(
                          (bucket.count /
                            trendAnalytics.maxBucketValue) *
                            100,
                        ),
                      ),
                    );

                    return (
                      <div
                        key={bucket.key}
                        title={bucket.tooltipText}
                        className="flex flex-col items-center h-full justify-end group relative cursor-pointer"
                      >
                        {/* Floating Hover Badge */}
                        <div className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none whitespace-nowrap bg-stone-900 text-stone-100 text-[10px] px-2 py-0.5 rounded shadow-md font-medium">
                          {bucket.count} / {bucket.target || trendAnalytics.periodBenchmark}
                          <span className={`ml-1 font-bold ${bucket.metTarget ? "text-emerald-400" : "text-amber-300"}`}>
                            ({bucket.progressPercent ?? Math.round((bucket.count / (bucket.target || 1)) * 100)}%)
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-stone-600 mb-1 transition-opacity">
                          {bucket.count}
                          {adminTimeframe === "7d" && bucket.target ? (
                            <span className="text-[9px] font-medium text-stone-400">/{bucket.target}</span>
                          ) : null}
                        </span>
                        <div
                          className={`w-full bg-oatmeal-200 rounded-t-lg overflow-hidden flex flex-col justify-end h-full ${
                            adminTimeframe === "7d"
                              ? "max-w-[48px]"
                              : adminTimeframe === "6m"
                                ? "max-w-[64px]"
                                : "max-w-[36px]"
                          }`}
                        >
                          <div
                            className={`w-full rounded-t-lg transition-all duration-300 ${
                              bucket.metTarget
                                ? "bg-botanical-700 group-hover:bg-botanical-800"
                                : "bg-terracotta-500 group-hover:bg-terracotta-600"
                            } ${bucket.isCurrent ? "ring-2 ring-botanical-500 ring-offset-1" : ""}`}
                            style={{ height: `${barHeightPercent}%` }}
                          />
                        </div>
                        <span className="mt-2 text-[10px] font-semibold text-botanical-900 truncate max-w-full text-center">
                          {bucket.label}
                        </span>
                        <span className="text-[9px] text-stone-400 truncate max-w-full text-center">
                          {bucket.subLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* 3. Team Moderator Outreach Leaderboard & Activity Matrix */}
        <Card className="rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/70 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-botanical-700 text-paper shrink-0">
                <Users className="h-4.5 w-4.5 text-sage-200" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-botanical-900">
                  Team Moderator Performance &amp; KPI Compliance
                </h3>
                <p className="text-xs text-stone-500">
                  Database-aggregated moderator approach quotas,
                  completed outreach, and target compliance today.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/users")}
              className="text-xs h-8 text-botanical-800 border-stone-200 rounded-xl cursor-pointer"
            >
              <span>Manage Team &amp; Roles</span>
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          {moderatorLeaderboard.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-500">
              No moderator activity recorded today yet. When
              moderators log calls and approaches, compliance will
              appear here in real-time.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {moderatorLeaderboard.map((member: any) => (
                <div
                  key={member.userId}
                  className="rounded-xl border border-stone-200/90 bg-paper p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-botanical-700 text-paper flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                        {member.name ? member.name.charAt(0) : "M"}
                      </div>
                      <div>
                        <h4 className="font-semibold text-xs text-botanical-900 truncate">
                          {member.name || "Moderator"}
                        </h4>
                        <p className="text-[11px] text-stone-400 truncate">
                          {member.email || "No email"}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="sage"
                      className="text-[9px] uppercase font-bold"
                    >
                      {member.role}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-500">
                        Meaningful Contacts
                      </span>
                      <span className="font-bold text-botanical-900">
                        {member.meaningfulContactsToday ?? member.todayTouches} /{" "}
                        {perModeratorTarget}
                      </span>
                    </div>
                    <div className="w-full bg-oatmeal-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          member.isMet
                            ? "bg-botanical-700"
                            : "bg-terracotta-500"
                        }`}
                        style={{
                          width: `${member.progressPercent}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] pt-0.5">
                      <span
                        className={
                          member.isMet
                            ? "text-emerald-700 font-bold"
                            : "text-stone-500"
                        }
                      >
                        {member.progressPercent}% of daily quota
                      </span>
                      {member.isMet ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                          ✓ Quota Met
                        </span>
                      ) : (
                        <span className="text-terracotta-700 font-semibold">
                          {member.toGo} to go
                        </span>
                      )}
                    </div>

                    {/* Activity Breakdown */}
                    <div className="grid grid-cols-3 gap-1.5 pt-2 mt-2 border-t border-stone-100 text-center">
                      <div className="rounded-lg bg-oatmeal-100/70 px-1.5 py-1">
                        <div className="text-[11px] font-bold text-botanical-900">
                          {member.attemptsToday ?? member.todayTouches}
                        </div>
                        <div className="text-[9px] text-stone-500">Attempts</div>
                      </div>
                      <div className="rounded-lg bg-emerald-50/70 px-1.5 py-1">
                        <div className="text-[11px] font-bold text-emerald-800">
                          {member.qualifiedToday ?? 0}
                        </div>
                        <div className="text-[9px] text-emerald-700">Qualified</div>
                      </div>
                      <div className="rounded-lg bg-stone-100/80 px-1.5 py-1">
                        <div className="text-[11px] font-bold text-stone-800">
                          {member.reachRate ?? 0}%
                        </div>
                        <div className="text-[9px] text-stone-500">Reach Rate</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 4. Interactive Full-Workspace Funnel Distribution */}
        <Card className="rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200/70 pb-3">
            <div>
              <h3 className="font-serif text-base font-bold text-botanical-900">
                Workspace Conversion Funnel
              </h3>
              <p className="text-xs text-stone-500">
                End-to-end pipeline progression from initial automated
                web scrape to closed deals.
              </p>
            </div>
            <Badge
              variant="sage"
              className="text-[10px] uppercase font-bold"
            >
              {funnelStages.converted} Closed Deals
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
            {/* Step 1 */}
            <div className="rounded-xl border border-stone-200/80 bg-paper p-3.5 text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                1. Raw Scraped
              </span>
              <p className="text-xl font-bold text-botanical-900">
                {kpiSummary.totalLeads}
              </p>
              <p className="text-[10px] text-stone-500">
                100% of pipeline
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-xl border border-stone-200/80 bg-paper p-3.5 text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta-700">
                2. Approached
              </span>
              <p className="text-xl font-bold text-botanical-900">
                {kpiSummary.totalLeads - funnelStages.uncontacted}
              </p>
              <p className="text-[10px] text-stone-500">
                {funnelStages.contactRate}% contact rate
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-xl border border-stone-200/80 bg-paper p-3.5 text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-botanical-700">
                3. In Touch
              </span>
              <p className="text-xl font-bold text-botanical-900">
                {funnelStages.called + funnelStages.call_later}
              </p>
              <p className="text-[10px] text-stone-500">
                {funnelStages.activeNegotiationRate}% active in touch
              </p>
            </div>

            {/* Step 4 */}
            <div className="rounded-xl border border-stone-200/80 bg-paper p-3.5 text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sage-800">
                4. Interested
              </span>
              <p className="text-xl font-bold text-emerald-800">
                {funnelStages.interested}
              </p>
              <p className="text-[10px] text-stone-500">
                {funnelStages.dealProposalRate}% hot proposals
              </p>
            </div>

            {/* Step 5 */}
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-3.5 text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                5. Closed Won
              </span>
              <p className="text-xl font-bold text-emerald-900">
                {funnelStages.converted}
              </p>
              <p className="text-[10px] text-emerald-700 font-semibold">
                {funnelStages.winRate}% win rate
              </p>
            </div>
          </div>
        </Card>

        {/* 5. Platform Intelligence & Quality Coverage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200/70 pb-3">
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-botanical-700" />
                <h4 className="font-serif text-sm font-bold text-botanical-900">
                  Extraction Source Footprint
                </h4>
              </div>
              <Badge variant="sage" className="text-[10px]">
                {kpiSummary.totalSearchClusters} Search Batches
              </Badge>
            </div>
            <div className="space-y-3 pt-1 text-xs text-stone-600">
              <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-botanical-700" />{" "}
                  Google Maps
                </span>
                <span className="font-bold text-botanical-900">
                  {platformFootprint.googleMaps} leads
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-terracotta-500" />{" "}
                  Instagram / Facebook
                </span>
                <span className="font-bold text-botanical-900">
                  {platformFootprint.instagramFacebook} leads
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sage-500" />{" "}
                  LinkedIn
                </span>
                <span className="font-bold text-botanical-900">
                  {platformFootprint.linkedin} leads
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-stone-400" />{" "}
                  Other Platforms
                </span>
                <span className="font-bold text-stone-600">
                  {platformFootprint.other} leads
                </span>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200/70 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                <h4 className="font-serif text-sm font-bold text-botanical-900">
                  Data Quality &amp; Verification Health
                </h4>
              </div>
              <span className="text-xs text-emerald-700 font-bold">
                {kpiSummary.conversionRate}% Contactable
              </span>
            </div>
            <div className="space-y-3 pt-1 text-xs text-stone-600">
              <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                <span>Verified Contact Numbers</span>
                <span className="font-bold text-botanical-800">
                  {kpiSummary.verifiedCount} leads (
                  {kpiSummary.conversionRate}%)
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                <span>
                  Prospects Without Website (Prime Monetization)
                </span>
                <span className="font-bold text-terracotta-700">
                  {kpiSummary.prospectsWithoutWebsite} leads (
                  {kpiSummary.prospectsWithoutWebsitePercent}%)
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                <span>Social Media Footprint Enriched</span>
                <span className="font-bold text-emerald-800">
                  {kpiSummary.enrichedSocialCount} leads (
                  {kpiSummary.enrichedSocialPercent}%)
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span>Database Cluster</span>
                <span className="font-semibold text-emerald-700">
                  MongoDB Atlas (Pipeline Active)
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* 6. Extra High-Value Feature: Deal Pipeline Value & Top Search Queries */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Deal Pipeline Value */}
          <Card className="rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200/70 pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-700" />
                <h4 className="font-serif text-sm font-bold text-botanical-900">
                  Monetary Deal Pipeline
                </h4>
              </div>
              <Badge variant="sage" className="text-[10px] font-bold">
                Closed: $
                {dealPipeline.closedWonValue.toLocaleString()}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="rounded-xl border border-stone-200/80 bg-paper p-3 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Active Deals In Pipeline
                </span>
                <p className="text-xl font-bold text-botanical-900 mt-1">
                  ${dealPipeline.activeDealsValue.toLocaleString()}
                </p>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  Interested proposals
                </p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Total Closed Revenue
                </span>
                <p className="text-xl font-bold text-emerald-900 mt-1">
                  ${dealPipeline.closedWonValue.toLocaleString()}
                </p>
                <p className="text-[10px] text-emerald-700 mt-0.5">
                  Won conversions
                </p>
              </div>
            </div>
          </Card>

          {/* Top Converting Queries */}
          <Card className="rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200/70 pb-3">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-botanical-700" />
                <h4 className="font-serif text-sm font-bold text-botanical-900">
                  Top Converting Queries
                </h4>
              </div>
              <span className="text-[11px] text-stone-400">
                Search Yields
              </span>
            </div>
            <div className="space-y-2 pt-1 text-xs">
              {topSearchQueries.length === 0 ? (
                <p className="text-stone-400 text-center py-2">
                  No queries logged yet
                </p>
              ) : (
                topSearchQueries.map((q: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1 border-b border-stone-100 last:border-b-0"
                  >
                    <span className="font-medium text-botanical-900 truncate max-w-[200px] capitalize">
                      {q.query}
                    </span>
                    <span className="text-stone-500 text-[11px]">
                      <strong className="text-botanical-900">
                        {q.totalLeads}
                      </strong>{" "}
                      leads &bull;{" "}
                      <strong className="text-emerald-700">
                        {q.convertedLeads}
                      </strong>{" "}
                      won
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* 7. Recent Activity Feed */}
        <RecentActivityFeed
          activities={recentActivities}
          onSelectLeadByName={handleSelectLeadByName}
        />
      </div>

      {/* Leads Table Preview (Top 5 Recent) */}
      <div className="space-y-4 pt-4 border-t border-stone-200/80">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold text-botanical-900">
              Recently Captured Leads
            </h2>
            <p className="text-xs text-stone-500">
              Displaying the latest leads saved directly from the
              Chrome extension.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/leads")}
              className="text-xs h-8 text-botanical-800 border-stone-200 cursor-pointer"
            >
              View All in Leads Table ({kpiSummary.totalLeads})
            </Button>
          </div>
        </div>

        {recentLeads.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-[#FCFBF8] p-8 text-center text-xs text-stone-500">
            No leads captured yet. Captured leads will appear here.
          </div>
        ) : (
          <div className="rounded-2xl border border-stone-200/90 bg-[#FCFBF8] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-stone-200 bg-oatmeal-200/60 hover:bg-oatmeal-200/60">
                  <TableHead className="w-[260px]">
                    Business Name
                  </TableHead>
                  <TableHead className="w-[200px]">
                    Contact Info
                  </TableHead>
                  <TableHead className="w-[180px]">
                    Website / Status
                  </TableHead>
                  <TableHead className="w-[120px]">Source</TableHead>
                  <TableHead className="w-[90px] text-right">
                    Added
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLeads
                  .slice(0, 5)
                  .map((lead: Lead, idx: number) => {
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
                              {lead.name ? lead.name.charAt(0) : "L"}
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
                                <span className="truncate">
                                  {lead.email}
                                </span>
                              </div>
                            ) : null}
                            {lead.phone ? (
                              <div className="flex items-center gap-1.5 text-stone-600 text-[11px] truncate">
                                <Phone className="h-3 w-3 text-stone-400 shrink-0" />
                                <span>{lead.phone}</span>
                              </div>
                            ) : null}
                            {!lead.email && !lead.phone && (
                              <span className="text-[11px] text-stone-400 italic">
                                No contact info
                              </span>
                            )}
                          </div>
                        </TableCell>

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
                              className="inline-flex items-center gap-1.5 text-xs text-botanical-800 hover:text-botanical-600 hover:underline max-w-[150px] truncate"
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
                            <span className="inline-flex items-center gap-1 rounded-full bg-terracotta-100/90 border border-terracotta-300/80 px-2 py-0.5 text-[10px] font-semibold text-terracotta-800">
                              <Target className="h-2.5 w-2.5 text-terracotta-600 shrink-0" />
                              Potential Client
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="sage"
                            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          >
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
        onLeadUpdated={(updated) => {
          if (
            pipelineLead &&
            (pipelineLead.leadId === updated.leadId ||
              pipelineLead.id === updated.id)
          ) {
            setPipelineLead(updated);
          }
          refetchDashboard();
        }}
      />

      {/* Lead Pipeline Modal */}
      <LeadPipelineModal
        lead={pipelineLead}
        isOpen={isPipelineModalOpen}
        onClose={() => {
          setIsPipelineModalOpen(false);
          setPipelineLead(null);
        }}
        onLeadUpdated={(updatedLead) => {
          if (
            selectedLead &&
            (selectedLead.leadId === updatedLead.leadId ||
              selectedLead.id === updatedLead.id)
          ) {
            setSelectedLead(updatedLead);
          }
          setSyncFeedback(
            `Successfully logged call & updated ${updatedLead.name}!`,
          );
          setTimeout(() => setSyncFeedback(null), 3000);
          refetchDashboard();
        }}
      />
    </div>
  );
}
