"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RecentActivityFeed } from "@/components/features/leads/RecentActivityFeed";
import { LeadDetailSheet } from "@/components/features/leads/LeadDetailSheet";
import { LeadPipelineModal } from "@/components/features/leads/LeadPipelineModal";
import { useFetch } from "@/hooks";
import { useSession } from "@/lib/auth-client";
import { Lead, SearchGroup } from "@/types";
import type { User, ActivityEvent } from "@/types";
import { Card } from "@/components/ui/card";
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
  Target,
  Globe,
  Mail,
  Phone,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  Users,
  TrendingUp,
  Award,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type AdminTimeframe = "7d" | "1m" | "3m" | "6m" | "1y";

interface AdminDashboardProps {
  user?: User | null;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const effectiveUser = user || session?.user;

  // SWR fetch for search groups and leads
  const { data: searchGroupsData } = useFetch<any>("/search-groups");

  const groups: SearchGroup[] = useMemo(() => {
    const raw = searchGroupsData?.data || searchGroupsData;
    return Array.isArray(raw) ? raw : [];
  }, [searchGroupsData]);

  const leads: Lead[] = useMemo(() => {
    return groups.flatMap((g) => g.leads || []);
  }, [groups]);

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

  // Pipeline modal state for quick call outcome logging
  const [pipelineLead, setPipelineLead] = useState<Lead | null>(null);
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsSheetOpen(true);
  };

  const handleSelectLeadByName = (leadName: string) => {
    const found = leads.find((l) => l.name.toLowerCase() === leadName.toLowerCase());
    if (found) {
      handleSelectLead(found);
    }
  };

  // Daily Approach KPI Target (fetched from settings, defaults to 25)
  const [dailyTarget, setDailyTarget] = useState<number>(25);

  // Timeframe selector for outreach trend analytics
  const [adminTimeframe, setAdminTimeframe] = useState<AdminTimeframe>("7d");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.settings?.dailyApproachTarget) {
          setDailyTarget(data.settings.dailyApproachTarget);
        }
      })
      .catch(() => {});
  }, []);

  // Team members list for Admin leaderboard
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data?.users)) {
          setTeamMembers(data.users);
        }
      })
      .catch(() => {});
  }, []);

  // Workspace Metrics Calculations
  const verifiedCount = leads.filter((l) => Boolean(l.phone) || Boolean(l.email)).length;
  const prospectsWithoutWebsite = leads.filter((l) => !l.website).length;
  const enrichedSocialCount = leads.filter(
    (l) => Boolean(l.facebook) || Boolean(l.instagram) || Boolean(l.linkedin) || Boolean(l.whatsapp)
  ).length;
  const conversionRate = Math.round((verifiedCount / (leads.length || 1)) * 100);

  // Stage breakdown
  const stageStats = useMemo(() => {
    const counts = {
      uncontacted: 0,
      called: 0,
      call_later: 0,
      interested: 0,
      converted: 0,
      not_interested: 0,
      invalid: 0,
    };
    leads.forEach((l) => {
      const s = (l.status || "uncontacted") as keyof typeof counts;
      if (counts[s] !== undefined) {
        counts[s]++;
      } else {
        counts.uncontacted++;
      }
    });
    return counts;
  }, [leads]);

  // Overall Daily Approach & Contact KPI Calculations
  const kpiStats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;
    const endOfYesterday = startOfToday - 1;

    const isLeadApproached = (l: Lead) => {
      const hasContactTimestamp = Boolean(l.lastContactedAt && l.lastContactedAt > 0);
      const isContactedStatus = Boolean(l.status && l.status !== "uncontacted");
      const hasCalls = Boolean(l.callCount && l.callCount > 0);
      const hasNotes = Boolean(l.notes && l.notes.length > 0);
      return hasContactTimestamp || isContactedStatus || hasCalls || hasNotes;
    };

    const getLeadContactTimestamp = (l: Lead): number => {
      if (l.lastContactedAt) return Number(l.lastContactedAt);
      if (l.notes && l.notes.length > 0) {
        return Math.max(...l.notes.map((n) => Number(n.createdAt) || 0));
      }
      if (l.updatedAt) {
        const t = new Date(l.updatedAt).getTime();
        if (!isNaN(t)) return t;
      }
      return new Date(l.createdAt).getTime() || 0;
    };

    const contactedLeads = leads.filter(isLeadApproached);

    const todayContacted = contactedLeads.filter((l) => {
      const ts = getLeadContactTimestamp(l);
      return ts >= startOfToday;
    });

    const yesterdayContacted = contactedLeads.filter((l) => {
      const ts = getLeadContactTimestamp(l);
      return ts >= startOfYesterday && ts <= endOfYesterday;
    });

    return {
      dailyTarget,
      todayCount: todayContacted.length,
      yesterdayCount: yesterdayContacted.length,
      progressPercent: Math.min(100, Math.round((todayContacted.length / dailyTarget) * 100)),
      isTargetMet: todayContacted.length >= dailyTarget,
    };
  }, [leads, dailyTarget]);

  // Multi-Timeframe Trend Analytics (7 Days, 1 Month, 3 Months, 6 Months, 1 Year)
  const adminTrendAnalytics = useMemo(() => {
    const now = new Date();

    const getContactTs = (l: Lead): number => {
      if (l.lastContactedAt) return Number(l.lastContactedAt);
      if (l.notes && l.notes.length > 0) {
        return Math.max(...l.notes.map((n) => Number(n.createdAt) || 0));
      }
      if (l.updatedAt) {
        const t = new Date(l.updatedAt).getTime();
        if (!isNaN(t)) return t;
      }
      return new Date(l.createdAt).getTime() || 0;
    };

    const isContacted = (l: Lead) => {
      const hasContactTimestamp = Boolean(l.lastContactedAt && l.lastContactedAt > 0);
      const isContactedStatus = Boolean(l.status && l.status !== "uncontacted");
      const hasCalls = Boolean(l.callCount && l.callCount > 0);
      const hasNotes = Boolean(l.notes && l.notes.length > 0);
      return hasContactTimestamp || isContactedStatus || hasCalls || hasNotes;
    };

    const contactedLeads = leads.filter(isContacted);

    interface TrendBucket {
      key: string;
      label: string;
      subLabel: string;
      count: number;
      metTarget: boolean;
      isCurrent?: boolean;
      tooltipText: string;
    }

    let buckets: TrendBucket[] = [];
    let periodBenchmark = dailyTarget;
    let benchmarkUnitLabel = "day";
    let title = "7-Day Team Outreach Volume vs. Configured Target Benchmark";
    let description = `Continuous benchmark reference line set to ${dailyTarget} touches/day. Monitor daily team compliance, weekly cadence, and goal attainment.`;
    let metric1Label = "Today's Workspace Touches";
    let metric1Value = 0;
    let metric1Sub = "";
    let metric2Label = "Yesterday's Completed";
    let metric2Value = 0;
    let metric2Sub = "";
    let metric4Label = "Daily Average";
    let metric4Sub = `Benchmark: ${dailyTarget} / day`;
    let periodAverage = 0;

    if (adminTimeframe === "7d") {
      periodBenchmark = dailyTarget;
      benchmarkUnitLabel = "day";
      title = "7-Day Team Outreach Volume vs. Configured Target Benchmark";
      description = `Continuous benchmark reference line set to ${dailyTarget} touches/day. Monitor daily team compliance, weekly cadence, and goal attainment.`;

      buckets = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const dayEnd = dayStart + 86400000 - 1;

        const dayLeads = contactedLeads.filter((l) => {
          const ts = getContactTs(l);
          return ts >= dayStart && ts <= dayEnd;
        });

        const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
        const dayLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const isToday = i === 6;

        return {
          key: `day7-${i}`,
          label: isToday ? "Today" : dayName,
          subLabel: dayLabel,
          count: dayLeads.length,
          metTarget: dayLeads.length >= dailyTarget,
          isCurrent: isToday,
          tooltipText: `${dayLabel}: ${dayLeads.length} touches (${Math.round((dayLeads.length / dailyTarget) * 100)}% of goal)`,
        };
      });

      const total = buckets.reduce((acc, b) => acc + b.count, 0);
      periodAverage = Math.round((total / 7) * 10) / 10;
      const todayCount = buckets[6]?.count || 0;
      const yesterdayCount = buckets[5]?.count || 0;

      metric1Label = "Today's Workspace Touches";
      metric1Value = todayCount;
      metric1Sub = `${Math.round((todayCount / dailyTarget) * 100)}% of daily benchmark`;

      metric2Label = "Yesterday's Completed";
      metric2Value = yesterdayCount;
      metric2Sub = yesterdayCount >= dailyTarget ? "✓ Target benchmark met" : `${dailyTarget - yesterdayCount} below target`;

      metric4Label = "7-Day Daily Average";
      metric4Sub = `Benchmark: ${dailyTarget} / day`;
    } else if (adminTimeframe === "1m") {
      // 30 Days
      periodBenchmark = dailyTarget;
      benchmarkUnitLabel = "day";
      title = "30-Day Outreach Volume & Daily Consistency Trend";
      description = `Tracking day-by-day touches across the past 30 days against the ${dailyTarget}/day benchmark.`;

      buckets = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (29 - i));
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const dayEnd = dayStart + 86400000 - 1;

        const dayLeads = contactedLeads.filter((l) => {
          const ts = getContactTs(l);
          return ts >= dayStart && ts <= dayEnd;
        });

        const dayNum = d.getDate();
        const monthShort = d.toLocaleDateString("en-US", { month: "short" });
        const isToday = i === 29;

        return {
          key: `day30-${i}`,
          label: isToday ? "Today" : `${monthShort} ${dayNum}`,
          subLabel: `${dayNum}`,
          count: dayLeads.length,
          metTarget: dayLeads.length >= dailyTarget,
          isCurrent: isToday,
          tooltipText: `${monthShort} ${dayNum}: ${dayLeads.length} touches`,
        };
      });

      const total = buckets.reduce((acc, b) => acc + b.count, 0);
      periodAverage = Math.round((total / 30) * 10) / 10;
      const daysMetTarget = buckets.filter((b) => b.metTarget).length;

      metric1Label = "Days Target Met (Past 30D)";
      metric1Value = daysMetTarget;
      metric1Sub = `${Math.round((daysMetTarget / 30) * 100)}% consistency rate (${daysMetTarget} / 30 days)`;

      metric2Label = "Peak Outreach Day";
      const peakDay = [...buckets].sort((a, b) => b.count - a.count)[0];
      metric2Value = peakDay ? peakDay.count : 0;
      metric2Sub = peakDay ? `Peak on ${peakDay.label}` : "None recorded";

      metric4Label = "30-Day Daily Average";
      metric4Sub = `Benchmark: ${dailyTarget} / day`;
    } else if (adminTimeframe === "3m") {
      // 3 Months = 12 Weeks
      const weeklyTarget = dailyTarget * 5;
      periodBenchmark = weeklyTarget;
      benchmarkUnitLabel = "week";
      title = "3-Month Team Outreach Cadence & Weekly Attainment";
      description = `Aggregated across 12 weekly periods against a 5-day weekly target of ${weeklyTarget} touches/week (${dailyTarget}/day × 5).`;

      buckets = Array.from({ length: 12 }, (_, i) => {
        const daysBackStart = (11 - i) * 7;
        const daysBackEnd = daysBackStart - 6;

        const dStart = new Date(now);
        dStart.setDate(dStart.getDate() - daysBackStart);
        const weekStart = new Date(dStart.getFullYear(), dStart.getMonth(), dStart.getDate()).getTime();

        const dEnd = new Date(now);
        dEnd.setDate(dEnd.getDate() - (daysBackEnd > 0 ? daysBackEnd : 0));
        const weekEnd = new Date(dEnd.getFullYear(), dEnd.getMonth(), dEnd.getDate(), 23, 59, 59, 999).getTime();

        const weekLeads = contactedLeads.filter((l) => {
          const ts = getContactTs(l);
          return ts >= weekStart && ts <= weekEnd;
        });

        const isCurrent = i === 11;
        const startFmt = dStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const endFmt = dEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" });

        return {
          key: `week12-${i}`,
          label: isCurrent ? "This Wk" : `W${i + 1}`,
          subLabel: `${startFmt} - ${endFmt}`,
          count: weekLeads.length,
          metTarget: weekLeads.length >= weeklyTarget,
          isCurrent,
          tooltipText: `${startFmt} - ${endFmt}: ${weekLeads.length} touches (${Math.round((weekLeads.length / weeklyTarget) * 100)}% of weekly goal)`,
        };
      });

      const total = buckets.reduce((acc, b) => acc + b.count, 0);
      periodAverage = Math.round((total / 12) * 10) / 10;
      const weeksMet = buckets.filter((b) => b.metTarget).length;

      metric1Label = "Weeks Quota Achieved";
      metric1Value = weeksMet;
      metric1Sub = `${Math.round((weeksMet / 12) * 100)}% weekly attainment (${weeksMet} / 12 wks)`;

      metric2Label = "Peak Weekly Volume";
      const peakWk = [...buckets].sort((a, b) => b.count - a.count)[0];
      metric2Value = peakWk ? peakWk.count : 0;
      metric2Sub = peakWk ? `${peakWk.subLabel}` : "None recorded";

      metric4Label = "Weekly Outreach Average";
      metric4Sub = `Benchmark: ${weeklyTarget} / week`;
    } else if (adminTimeframe === "6m") {
      // 6 Months
      const monthlyTarget = dailyTarget * 22;
      periodBenchmark = monthlyTarget;
      benchmarkUnitLabel = "month";
      title = "6-Month Outreach Velocity & Monthly Performance";
      description = `Tracking total monthly touches across the past 6 months against an estimated monthly benchmark of ${monthlyTarget} (${dailyTarget}/day × 22 workdays).`;

      buckets = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const monthStart = d.getTime();
        const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const monthEnd = nextMonth.getTime() - 1;

        const monthLeads = contactedLeads.filter((l) => {
          const ts = getContactTs(l);
          return ts >= monthStart && ts <= monthEnd;
        });

        const monthName = d.toLocaleDateString("en-US", { month: "short" });
        const yearStr = d.getFullYear().toString();
        const isCurrent = i === 5;

        return {
          key: `month6-${i}`,
          label: isCurrent ? `${monthName} (Now)` : monthName,
          subLabel: yearStr,
          count: monthLeads.length,
          metTarget: monthLeads.length >= monthlyTarget,
          isCurrent,
          tooltipText: `${monthName} ${yearStr}: ${monthLeads.length} touches (${Math.round((monthLeads.length / monthlyTarget) * 100)}% of goal)`,
        };
      });

      const total = buckets.reduce((acc, b) => acc + b.count, 0);
      periodAverage = Math.round((total / 6) * 10) / 10;
      const monthsMet = buckets.filter((b) => b.metTarget).length;

      metric1Label = "Months Quota Achieved";
      metric1Value = monthsMet;
      metric1Sub = `${Math.round((monthsMet / 6) * 100)}% monthly attainment (${monthsMet} / 6 mos)`;

      metric2Label = "Peak Monthly Volume";
      const peakMo = [...buckets].sort((a, b) => b.count - a.count)[0];
      metric2Value = peakMo ? peakMo.count : 0;
      metric2Sub = peakMo ? `${peakMo.label} ${peakMo.subLabel}` : "None recorded";

      metric4Label = "Monthly Outreach Average";
      metric4Sub = `Benchmark: ${monthlyTarget} / month`;
    } else if (adminTimeframe === "1y") {
      // 1 Year = 12 Calendar Months
      const monthlyTarget = dailyTarget * 22;
      periodBenchmark = monthlyTarget;
      benchmarkUnitLabel = "month";
      title = "1-Year Comprehensive Outreach & Pipeline Growth Trend";
      description = `Full 12-month historical outreach view across the workspace with ${monthlyTarget} touches/month reference benchmark.`;

      buckets = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
        const monthStart = d.getTime();
        const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const monthEnd = nextMonth.getTime() - 1;

        const monthLeads = contactedLeads.filter((l) => {
          const ts = getContactTs(l);
          return ts >= monthStart && ts <= monthEnd;
        });

        const monthName = d.toLocaleDateString("en-US", { month: "short" });
        const yearStr = d.getFullYear().toString().slice(-2);
        const isCurrent = i === 11;

        return {
          key: `month12-${i}`,
          label: isCurrent ? `${monthName} (Now)` : monthName,
          subLabel: `'${yearStr}`,
          count: monthLeads.length,
          metTarget: monthLeads.length >= monthlyTarget,
          isCurrent,
          tooltipText: `${monthName} 20${yearStr}: ${monthLeads.length} touches (${Math.round((monthLeads.length / monthlyTarget) * 100)}% of goal)`,
        };
      });

      const total = buckets.reduce((acc, b) => acc + b.count, 0);
      periodAverage = Math.round((total / 12) * 10) / 10;
      const monthsMet = buckets.filter((b) => b.metTarget).length;

      metric1Label = "Months Quota Achieved";
      metric1Value = monthsMet;
      metric1Sub = `${Math.round((monthsMet / 12) * 100)}% annual consistency (${monthsMet} / 12 mos)`;

      metric2Label = "Peak Monthly Volume";
      const peakYrMo = [...buckets].sort((a, b) => b.count - a.count)[0];
      metric2Value = peakYrMo ? peakYrMo.count : 0;
      metric2Sub = peakYrMo ? `${peakYrMo.label} ${peakYrMo.subLabel}` : "None recorded";

      metric4Label = "Annual Monthly Average";
      metric4Sub = `Benchmark: ${monthlyTarget} / month`;
    }

    const totalTouchpoints = buckets.reduce((acc, b) => acc + b.count, 0);
    const maxBucketValue = Math.max(
      periodBenchmark * 1.3,
      ...buckets.map((b) => b.count),
      1
    );

    return {
      timeframe: adminTimeframe,
      periodBenchmark,
      benchmarkUnitLabel,
      title,
      description,
      buckets,
      totalTouchpoints,
      periodAverage,
      maxBucketValue,
      metric1Label,
      metric1Value,
      metric1Sub,
      metric2Label,
      metric2Value,
      metric2Sub,
      metric4Label,
      metric4Sub,
    };
  }, [leads, dailyTarget, adminTimeframe]);

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
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-botanical-900 md:text-4xl">
            Workspace Command Center
          </h1>
          <p className="mt-1 text-sm text-stone-600 max-w-2xl">
            Live multi-platform extraction intelligence, team outreach KPI velocity, and conversion funnel analytics across all active search clusters.
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
                  {kpiStats.todayCount}
                </span>
                <span className="text-xs font-semibold text-stone-400">
                  / {kpiStats.dailyTarget} goal
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                {Math.round((kpiStats.todayCount / kpiStats.dailyTarget) * 100)}% of daily quota
              </p>
            </div>
            <div className="space-y-1 pt-1 border-t border-stone-100 text-[11px] text-stone-500 flex items-center justify-between">
              <span>Yesterday: {kpiStats.yesterdayCount}</span>
              <span
                className={
                  kpiStats.todayCount >= kpiStats.yesterdayCount
                    ? "text-emerald-700 font-bold"
                    : "text-stone-500"
                }
              >
                {kpiStats.todayCount >= kpiStats.yesterdayCount
                  ? `+${kpiStats.todayCount - kpiStats.yesterdayCount} today`
                  : `${kpiStats.todayCount - kpiStats.yesterdayCount} today`}
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
                  {leads.length}
                </span>
                <span className="text-xs text-stone-400">records</span>
              </div>
              <p className="text-[11px] text-botanical-700 font-medium mt-0.5">
                Across {groups.length} search clusters
              </p>
            </div>
            <div className="space-y-1 pt-1 border-t border-stone-100 text-[11px] text-stone-500 flex items-center justify-between">
              <span>Verified Contact Info</span>
              <span className="font-semibold text-botanical-800">{conversionRate}%</span>
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
                  {stageStats.interested + stageStats.converted}
                </span>
                <span className="text-xs text-stone-400">prospects</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                {stageStats.converted} deals closed / converted
              </p>
            </div>
            <div className="space-y-1 pt-1 border-t border-stone-100 text-[11px] text-stone-500 flex items-center justify-between">
              <span>Active Negotiation</span>
              <span className="font-semibold text-botanical-800">{stageStats.interested} leads</span>
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
                  {prospectsWithoutWebsite}
                </span>
                <span className="text-xs text-stone-400">
                  ({Math.round((prospectsWithoutWebsite / (leads.length || 1)) * 100)}%)
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                No active website presence
              </p>
            </div>
            <div className="space-y-1 pt-1 border-t border-stone-100 text-[11px] text-stone-500 flex items-center justify-between">
              <span>High-margin pitch</span>
              <span className="font-semibold text-terracotta-700">Prime Targets</span>
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
                  {adminTrendAnalytics.title}
                </h3>
                <Badge variant="sage" className="text-[10px] uppercase font-bold tracking-wider">
                  {adminTrendAnalytics.benchmarkUnitLabel === "day"
                    ? `Target: ${dailyTarget}/day`
                    : adminTrendAnalytics.benchmarkUnitLabel === "week"
                    ? `Target: ${dailyTarget * 5}/wk`
                    : `Target: ${dailyTarget * 22}/mo`}
                </Badge>
              </div>
              <p className="text-xs text-stone-500">
                {adminTrendAnalytics.description}
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
                    onClick={() => setAdminTimeframe(tab.id as AdminTimeframe)}
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

              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/settings")}
                className="rounded-xl text-xs h-8.5 border-stone-300 text-stone-700 hover:text-botanical-900 gap-1.5 cursor-pointer bg-paper shrink-0"
              >
                <Target className="h-3.5 w-3.5 text-terracotta-600" />
                <span>Adjust Target ({dailyTarget})</span>
              </Button>
            </div>
          </div>

          {/* 4 Summary Metric Pills */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-stone-200/80 bg-paper p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                {adminTrendAnalytics.metric1Label}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-botanical-900">{adminTrendAnalytics.metric1Value}</span>
                {adminTimeframe === "7d" && (
                  <span className="text-xs text-stone-400">/ {dailyTarget} goal</span>
                )}
              </div>
              <p className="text-[11px] text-emerald-700 font-medium mt-1">
                {adminTrendAnalytics.metric1Sub}
              </p>
            </div>

            <div className="rounded-xl border border-stone-200/80 bg-paper p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                {adminTrendAnalytics.metric2Label}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-botanical-900">{adminTrendAnalytics.metric2Value}</span>
                <span className="text-xs text-stone-400">touches</span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium mt-1 truncate" title={adminTrendAnalytics.metric2Sub}>
                {adminTrendAnalytics.metric2Sub}
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
                <span className="text-2xl font-bold text-botanical-900">{adminTrendAnalytics.totalTouchpoints}</span>
                <span className="text-xs text-stone-400">leads touched</span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium mt-1">
                Across workspace pipeline
              </p>
            </div>

            <div className="rounded-xl border border-stone-200/80 bg-paper p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                {adminTrendAnalytics.metric4Label}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-botanical-900">{adminTrendAnalytics.periodAverage}</span>
                <span className="text-xs text-stone-400">touches/{adminTrendAnalytics.benchmarkUnitLabel}</span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium mt-1">
                {adminTrendAnalytics.metric4Sub}
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
                  <span className="h-2.5 w-2.5 rounded-xs bg-botanical-700" /> Met Target ({`≥ ${adminTrendAnalytics.periodBenchmark}`})
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-terracotta-500" /> Below Target
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-stone-600">
                  <span className="w-3.5 h-0.5 border-t-2 border-dashed border-terracotta-600" /> Benchmark ({adminTrendAnalytics.periodBenchmark}/{adminTrendAnalytics.benchmarkUnitLabel})
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
                      (adminTrendAnalytics.periodBenchmark / adminTrendAnalytics.maxBucketValue) * 100
                    )
                  )}%`,
                }}
              >
                <span className="absolute -top-5 right-0 rounded-md bg-terracotta-100 text-terracotta-800 border border-terracotta-200 px-1.5 py-0.5 text-[9px] font-bold">
                  Target: {adminTrendAnalytics.periodBenchmark} / {adminTrendAnalytics.benchmarkUnitLabel}
                </span>
              </div>

              {/* Bars Container */}
              {adminTimeframe === "1m" ? (
                /* 30-Day Scrollable / Compact Bar Grid */
                <div className="flex items-end justify-between gap-1 sm:gap-1.5 h-48 border-b border-stone-200/90 pb-2 overflow-x-auto pt-2">
                  {adminTrendAnalytics.buckets.map((bucket, idx) => {
                    const barHeightPercent = Math.min(
                      100,
                      Math.max(6, Math.round((bucket.count / adminTrendAnalytics.maxBucketValue) * 100))
                    );
                    const showLabel = idx % 3 === 0 || idx === adminTrendAnalytics.buckets.length - 1;

                    return (
                      <div
                        key={bucket.key}
                        title={bucket.tooltipText}
                        className="flex-1 min-w-[14px] max-w-[28px] flex flex-col items-center h-full justify-end group relative cursor-pointer"
                      >
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
                            style={{ height: `${barHeightPercent}%` }}
                          />
                        </div>
                        <span className="mt-1 text-[8px] font-semibold text-botanical-900 truncate">
                          {showLabel ? bucket.subLabel : "·"}
                        </span>
                      </div>
                    );
                  })}
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
                  {adminTrendAnalytics.buckets.map((bucket) => {
                    const barHeightPercent = Math.min(
                      100,
                      Math.max(8, Math.round((bucket.count / adminTrendAnalytics.maxBucketValue) * 100))
                    );

                    return (
                      <div
                        key={bucket.key}
                        title={bucket.tooltipText}
                        className="flex flex-col items-center h-full justify-end group cursor-pointer"
                      >
                        <span className="text-[10px] font-bold text-stone-600 mb-1 transition-opacity">
                          {bucket.count}
                        </span>
                        <div
                          className={`w-full bg-oatmeal-200 rounded-t-lg overflow-hidden flex flex-col justify-end h-full ${
                            adminTimeframe === "7d" ? "max-w-[48px]" : adminTimeframe === "6m" ? "max-w-[64px]" : "max-w-[36px]"
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
                  Live monitoring of moderator approach quotas, completed outreach, and target compliance today.
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

          {teamMembers.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-500">
              No team members loaded yet. Ensure your moderators are configured in the Team Management tab.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {teamMembers
                .filter((member) => (member.role || "user").toLowerCase() === "moderator" || (member.role || "user").toLowerCase() === "admin")
                .map((member) => {
                  const now = new Date();
                  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

                  const memberTodayTouches = leads.filter((l) => {
                    const matchesUser =
                      l.lastContactedBy?.userId === member.id ||
                      l.assignedTo?.userId === member.id ||
                      (l.notes && l.notes.some((n) => n.createdBy?.userId === member.id));

                    if (!matchesUser) return false;

                    const ts = l.lastContactedAt
                      ? Number(l.lastContactedAt)
                      : l.updatedAt
                      ? new Date(l.updatedAt).getTime()
                      : 0;

                    return ts >= startOfToday;
                  }).length;

                  const memberProgressPercent = Math.min(100, Math.round((memberTodayTouches / dailyTarget) * 100));
                  const isMet = memberTodayTouches >= dailyTarget;

                  return (
                    <div
                      key={member.id}
                      className="rounded-xl border border-stone-200/90 bg-paper p-4 shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-xl bg-botanical-700 text-paper flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                            {member.name ? member.name.charAt(0) : "U"}
                          </div>
                          <div>
                            <h4 className="font-semibold text-xs text-botanical-900 truncate">
                              {member.name || "Anonymous Member"}
                            </h4>
                            <p className="text-[11px] text-stone-400 truncate">{member.email}</p>
                          </div>
                        </div>
                        <Badge
                          variant={member.role === "admin" ? "terracotta" : "sage"}
                          className="text-[9px] uppercase font-bold"
                        >
                          {member.role}
                        </Badge>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-stone-500">Today&apos;s Approaches</span>
                          <span className="font-bold text-botanical-900">
                            {memberTodayTouches} / {dailyTarget}
                          </span>
                        </div>
                        <div className="w-full bg-oatmeal-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isMet ? "bg-botanical-700" : "bg-terracotta-500"
                            }`}
                            style={{ width: `${memberProgressPercent}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] pt-0.5">
                          <span className={isMet ? "text-emerald-700 font-bold" : "text-stone-500"}>
                            {memberProgressPercent}% of daily quota
                          </span>
                          {isMet ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                              ✓ Quota Met
                            </span>
                          ) : (
                            <span className="text-terracotta-700 font-semibold">
                              {Math.max(0, dailyTarget - memberTodayTouches)} to go
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                End-to-end pipeline progression from initial automated web scrape to closed deals.
              </p>
            </div>
            <Badge variant="sage" className="text-[10px] uppercase font-bold">
              {stageStats.converted} Closed Deals
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
            {/* Step 1 */}
            <div className="rounded-xl border border-stone-200/80 bg-paper p-3.5 text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">1. Raw Scraped</span>
              <p className="text-xl font-bold text-botanical-900">{leads.length}</p>
              <p className="text-[10px] text-stone-500">100% of pipeline</p>
            </div>

            {/* Step 2 */}
            <div className="rounded-xl border border-stone-200/80 bg-paper p-3.5 text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta-700">2. Approached</span>
              <p className="text-xl font-bold text-botanical-900">
                {leads.length - stageStats.uncontacted}
              </p>
              <p className="text-[10px] text-stone-500">
                {Math.round(((leads.length - stageStats.uncontacted) / (leads.length || 1)) * 100)}% contact rate
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-xl border border-stone-200/80 bg-paper p-3.5 text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-botanical-700">3. In Touch</span>
              <p className="text-xl font-bold text-botanical-900">{stageStats.called + stageStats.call_later}</p>
              <p className="text-[10px] text-stone-500">
                {Math.round(((stageStats.called + stageStats.call_later) / (leads.length || 1)) * 100)}% active negotiation
              </p>
            </div>

            {/* Step 4 */}
            <div className="rounded-xl border border-stone-200/80 bg-paper p-3.5 text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sage-800">4. Interested</span>
              <p className="text-xl font-bold text-emerald-800">{stageStats.interested}</p>
              <p className="text-[10px] text-stone-500">
                {Math.round((stageStats.interested / (leads.length || 1)) * 100)}% deal proposals
              </p>
            </div>

            {/* Step 5 */}
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-3.5 text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">5. Closed Won</span>
              <p className="text-xl font-bold text-emerald-900">{stageStats.converted}</p>
              <p className="text-[10px] text-emerald-700 font-semibold">
                {Math.round((stageStats.converted / (leads.length || 1)) * 100)}% win rate
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
                {groups.length} Search Batches
              </Badge>
            </div>
            <div className="space-y-3 pt-1 text-xs text-stone-600">
              <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-botanical-700" /> Google Maps
                </span>
                <span className="font-bold text-botanical-900">
                  {leads.filter((l) => l.source === "google_maps").length} leads
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-terracotta-500" /> Instagram / Facebook
                </span>
                <span className="font-bold text-botanical-900">
                  {leads.filter((l) => l.source === "instagram" || l.source === "facebook").length} leads
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sage-500" /> LinkedIn
                </span>
                <span className="font-bold text-botanical-900">
                  {leads.filter((l) => l.source === "linkedin").length} leads
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-stone-400" /> Other Platforms
                </span>
                <span className="font-bold text-stone-600">
                  {leads.filter((l) => !["google_maps", "instagram", "facebook", "linkedin"].includes(l.source || "")).length} leads
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
              <span className="text-xs text-emerald-700 font-bold">{conversionRate}% Contactable</span>
            </div>
            <div className="space-y-3 pt-1 text-xs text-stone-600">
              <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                <span>Phone Number Verified</span>
                <span className="font-bold text-botanical-800">
                  {leads.filter((l) => Boolean(l.phone)).length} leads (
                  {Math.round((leads.filter((l) => Boolean(l.phone)).length / (leads.length || 1)) * 100)}%)
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                <span>Email Address Active</span>
                <span className="font-bold text-botanical-800">
                  {leads.filter((l) => Boolean(l.email)).length} leads (
                  {Math.round((leads.filter((l) => Boolean(l.email)).length / (leads.length || 1)) * 100)}%)
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                <span>Social Media Footprint Enriched</span>
                <span className="font-bold text-emerald-800">
                  {enrichedSocialCount} leads (
                  {Math.round((enrichedSocialCount / (leads.length || 1)) * 100)}%)
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span>Database Cluster</span>
                <span className="font-semibold text-emerald-700">MongoDB Atlas (Cluster Active)</span>
              </div>
            </div>
          </Card>
        </div>

        {/* 6. Recent Activity Feed */}
        <RecentActivityFeed
          activities={activities}
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
              Displaying the latest leads saved directly from the Chrome extension.
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
                              {lead.website.replace(/^https?:\/\/(www\.)?/, "")}
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
            (pipelineLead.leadId === updated.leadId || pipelineLead.id === updated.id)
          ) {
            setPipelineLead(updated);
          }
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
            (selectedLead.leadId === updatedLead.leadId || selectedLead.id === updatedLead.id)
          ) {
            setSelectedLead(updatedLead);
          }
          setSyncFeedback(`Successfully logged call & updated ${updatedLead.name}!`);
          setTimeout(() => setSyncFeedback(null), 3000);
        }}
      />
    </div>
  );
}
