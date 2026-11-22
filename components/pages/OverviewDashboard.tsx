"use client";

import { LeadDetailSheet } from "@/components/features/leads/LeadDetailSheet";
import { LeadPipelineModal } from "@/components/features/leads/LeadPipelineModal";
import { RecentActivityFeed } from "@/components/features/leads/RecentActivityFeed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFetch } from "@/hooks";
import { signOut, useSession } from "@/lib/auth-client";
import { formatDate, formatShortDateTime } from "@/lib/utils";
import type { ActivityEvent, User } from "@/types";
import { Lead, SearchGroup } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Award,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  Flame,
  Globe,
  LogOut,
  Mail,
  Phone,
  PhoneCall,
  PieChart,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sprout,
  Target,
  TrendingUp,
  User as UserIcon,
  Users,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";

interface OverviewDashboardProps {
  user?: User | null;
}

export default function OverviewDashboard({
  user,
}: OverviewDashboardProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const effectiveUser = user || session?.user;
  const userRole = (
    (effectiveUser as any)?.role || "user"
  ).toLowerCase();
  const isModerator = userRole === "moderator";

  // Colocated SWR fetch for search groups
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
  const [syncFeedback, setSyncFeedback] = useState<string | null>(
    null,
  );

  // Pipeline modal state for quick call outcome logging
  const [pipelineLead, setPipelineLead] = useState<Lead | null>(null);
  const [isPipelineModalOpen, setIsPipelineModalOpen] =
    useState(false);

  // Copied phone toast feedback
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const handleCopyPhone = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setSyncFeedback(`Copied ${phone} to clipboard`);
    setTimeout(() => {
      setCopiedPhone(null);
      setSyncFeedback(null);
    }, 2500);
  };

  const handleOpenPipelineModal = (
    e: React.MouseEvent,
    lead: Lead,
  ) => {
    e.stopPropagation();
    setPipelineLead(lead);
    setIsPipelineModalOpen(true);
  };

  // Daily Approach KPI Target (fetched from settings, defaults to 25)
  const [dailyTarget, setDailyTarget] = useState<number>(25);

  // Admin Trend Analytics Timeframe Selector (7d, 1m, 3m, 6m, 1y)
  type AdminTimeframe = "7d" | "1m" | "3m" | "6m" | "1y";
  const [adminTimeframe, setAdminTimeframe] =
    useState<AdminTimeframe>("7d");

  React.useEffect(() => {
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

  React.useEffect(() => {
    if (!isModerator) {
      fetch("/api/admin/users")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data?.users)) {
            setTeamMembers(data.users);
          }
        })
        .catch(() => {});
    }
  }, [isModerator]);

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsSheetOpen(true);
  };

  const handleSelectLeadByName = (leadName: string) => {
    const found = leads.find(
      (l) => l.name.toLowerCase() === leadName.toLowerCase(),
    );
    if (found) {
      handleSelectLead(found);
    }
  };

  // Metrics Calculations
  const verifiedCount = leads.filter(
    (l) => Boolean(l.phone) || Boolean(l.email),
  ).length;
  const prospectsWithoutWebsite = leads.filter(
    (l) => !l.website,
  ).length;
  const enrichedSocialCount = leads.filter(
    (l) =>
      Boolean(l.facebook) ||
      Boolean(l.instagram) ||
      Boolean(l.linkedin) ||
      Boolean(l.whatsapp),
  ).length;
  const conversionRate = Math.round(
    (verifiedCount / (leads.length || 1)) * 100,
  );

  // Daily Approach & Contact Target KPI Calculations
  const kpiStats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
    const startOfYesterday = startOfToday - 86400000;
    const endOfYesterday = startOfToday - 1;

    // Helper: is lead approached / contacted
    const isLeadApproached = (l: Lead) => {
      const hasContactTimestamp = Boolean(
        l.lastContactedAt && l.lastContactedAt > 0,
      );
      const isContactedStatus = Boolean(
        l.status && l.status !== "uncontacted",
      );
      const hasCalls = Boolean(l.callCount && l.callCount > 0);
      const hasNotes = Boolean(l.notes && l.notes.length > 0);
      return (
        hasContactTimestamp ||
        isContactedStatus ||
        hasCalls ||
        hasNotes
      );
    };

    // Helper: get contact timestamp for a lead
    const getLeadContactTimestamp = (l: Lead): number => {
      if (l.lastContactedAt) return Number(l.lastContactedAt);
      if (l.notes && l.notes.length > 0) {
        return Math.max(
          ...l.notes.map((n) => Number(n.createdAt) || 0),
        );
      }
      if (l.updatedAt) {
        const t = new Date(l.updatedAt).getTime();
        if (!isNaN(t)) return t;
      }
      return new Date(l.createdAt).getTime() || 0;
    };

    // All contacted leads
    const contactedLeads = leads.filter(isLeadApproached);

    // Today's contacts
    const todayContacted = contactedLeads.filter((l) => {
      const ts = getLeadContactTimestamp(l);
      return ts >= startOfToday;
    });

    // Yesterday's contacts
    const yesterdayContacted = contactedLeads.filter((l) => {
      const ts = getLeadContactTimestamp(l);
      return ts >= startOfYesterday && ts <= endOfYesterday;
    });

    // Moderator attribution (or general pool if unassigned)
    const moderatorToday = todayContacted.filter((l) => {
      if (!isModerator) return true;
      if (l.lastContactedBy?.userId && effectiveUser?.id) {
        return l.lastContactedBy.userId === effectiveUser.id;
      }
      if (l.assignedTo?.userId && effectiveUser?.id) {
        return l.assignedTo.userId === effectiveUser.id;
      }
      return true;
    });

    const moderatorTodayCount = isModerator
      ? moderatorToday.length
      : todayContacted.length;
    const remainingToGo = Math.max(
      0,
      dailyTarget - moderatorTodayCount,
    );
    const progressPercent = Math.min(
      100,
      Math.round((moderatorTodayCount / dailyTarget) * 100),
    );

    // Past 7 Days data for performance trend chart
    const past7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const dayStart = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
      ).getTime();
      const dayEnd = dayStart + 86400000 - 1;

      const dayLeads = contactedLeads.filter((l) => {
        const ts = getLeadContactTimestamp(l);
        return ts >= dayStart && ts <= dayEnd;
      });

      const dayName = d.toLocaleDateString("en-US", {
        weekday: "short",
      });
      const dayLabel = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const isToday = i === 6;
      const isYesterday = i === 5;

      return {
        dayStart,
        dayName,
        dayLabel,
        isToday,
        isYesterday,
        count: dayLeads.length,
        metTarget: dayLeads.length >= dailyTarget,
      };
    });

    const past7DaysTotal = past7Days.reduce(
      (acc, curr) => acc + curr.count,
      0,
    );
    const past7DaysAvg = Math.round((past7DaysTotal / 7) * 10) / 10;

    return {
      dailyTarget,
      todayCount: todayContacted.length,
      moderatorTodayCount,
      yesterdayCount: yesterdayContacted.length,
      remainingToGo,
      progressPercent,
      isTargetMet: moderatorTodayCount >= dailyTarget,
      past7Days,
      past7DaysTotal,
      past7DaysAvg,
      // Status breakdown
      calledToday: todayContacted.filter((l) => l.status === "called")
        .length,
      interestedToday: todayContacted.filter(
        (l) => l.status === "interested" || l.status === "converted",
      ).length,
      callLaterToday: todayContacted.filter(
        (l) => l.status === "call_later",
      ).length,
    };
  }, [leads, dailyTarget, isModerator, effectiveUser]);

  // Multi-Timeframe Outreach Trend Analytics for Admin (7 Days, 1 Month, 3 Months, 6 Months, 1 Year)
  const adminTrendAnalytics = useMemo(() => {
    const now = new Date();

    const getContactTs = (l: Lead): number => {
      if (l.lastContactedAt) return Number(l.lastContactedAt);
      if (l.notes && l.notes.length > 0) {
        return Math.max(
          ...l.notes.map((n) => Number(n.createdAt) || 0),
        );
      }
      if (l.updatedAt) {
        const t = new Date(l.updatedAt).getTime();
        if (!isNaN(t)) return t;
      }
      return new Date(l.createdAt).getTime() || 0;
    };

    const isContacted = (l: Lead) => {
      const hasContactTimestamp = Boolean(
        l.lastContactedAt && l.lastContactedAt > 0,
      );
      const isContactedStatus = Boolean(
        l.status && l.status !== "uncontacted",
      );
      const hasCalls = Boolean(l.callCount && l.callCount > 0);
      const hasNotes = Boolean(l.notes && l.notes.length > 0);
      return (
        hasContactTimestamp ||
        isContactedStatus ||
        hasCalls ||
        hasNotes
      );
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
    let title =
      "7-Day Team Outreach Volume vs. Configured Target Benchmark";
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
      title =
        "7-Day Team Outreach Volume vs. Configured Target Benchmark";
      description = `Continuous benchmark reference line set to ${dailyTarget} touches/day. Monitor daily team compliance, weekly cadence, and goal attainment.`;

      buckets = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        const dayStart = new Date(
          d.getFullYear(),
          d.getMonth(),
          d.getDate(),
        ).getTime();
        const dayEnd = dayStart + 86400000 - 1;

        const dayLeads = contactedLeads.filter((l) => {
          const ts = getContactTs(l);
          return ts >= dayStart && ts <= dayEnd;
        });

        const dayName = d.toLocaleDateString("en-US", {
          weekday: "short",
        });
        const dayLabel = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
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
      metric2Sub =
        yesterdayCount >= dailyTarget
          ? "✓ Target benchmark met"
          : `${dailyTarget - yesterdayCount} below target`;

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
        const dayStart = new Date(
          d.getFullYear(),
          d.getMonth(),
          d.getDate(),
        ).getTime();
        const dayEnd = dayStart + 86400000 - 1;

        const dayLeads = contactedLeads.filter((l) => {
          const ts = getContactTs(l);
          return ts >= dayStart && ts <= dayEnd;
        });

        const dayNum = d.getDate();
        const monthShort = d.toLocaleDateString("en-US", {
          month: "short",
        });
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
      const peakDay = [...buckets].sort(
        (a, b) => b.count - a.count,
      )[0];
      metric2Value = peakDay ? peakDay.count : 0;
      metric2Sub = peakDay
        ? `Peak on ${peakDay.label}`
        : "None recorded";

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
        const weekStart = new Date(
          dStart.getFullYear(),
          dStart.getMonth(),
          dStart.getDate(),
        ).getTime();

        const dEnd = new Date(now);
        dEnd.setDate(
          dEnd.getDate() - (daysBackEnd > 0 ? daysBackEnd : 0),
        );
        const weekEnd = new Date(
          dEnd.getFullYear(),
          dEnd.getMonth(),
          dEnd.getDate(),
          23,
          59,
          59,
          999,
        ).getTime();

        const weekLeads = contactedLeads.filter((l) => {
          const ts = getContactTs(l);
          return ts >= weekStart && ts <= weekEnd;
        });

        const isCurrent = i === 11;
        const startFmt = dStart.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const endFmt = dEnd.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

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
      const peakWk = [...buckets].sort(
        (a, b) => b.count - a.count,
      )[0];
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
        const d = new Date(
          now.getFullYear(),
          now.getMonth() - (5 - i),
          1,
        );
        const monthStart = d.getTime();
        const nextMonth = new Date(
          d.getFullYear(),
          d.getMonth() + 1,
          1,
        );
        const monthEnd = nextMonth.getTime() - 1;

        const monthLeads = contactedLeads.filter((l) => {
          const ts = getContactTs(l);
          return ts >= monthStart && ts <= monthEnd;
        });

        const monthName = d.toLocaleDateString("en-US", {
          month: "short",
        });
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
      const peakMo = [...buckets].sort(
        (a, b) => b.count - a.count,
      )[0];
      metric2Value = peakMo ? peakMo.count : 0;
      metric2Sub = peakMo
        ? `${peakMo.label} ${peakMo.subLabel}`
        : "None recorded";

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
        const d = new Date(
          now.getFullYear(),
          now.getMonth() - (11 - i),
          1,
        );
        const monthStart = d.getTime();
        const nextMonth = new Date(
          d.getFullYear(),
          d.getMonth() + 1,
          1,
        );
        const monthEnd = nextMonth.getTime() - 1;

        const monthLeads = contactedLeads.filter((l) => {
          const ts = getContactTs(l);
          return ts >= monthStart && ts <= monthEnd;
        });

        const monthName = d.toLocaleDateString("en-US", {
          month: "short",
        });
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
      const peakYrMo = [...buckets].sort(
        (a, b) => b.count - a.count,
      )[0];
      metric2Value = peakYrMo ? peakYrMo.count : 0;
      metric2Sub = peakYrMo
        ? `${peakYrMo.label} ${peakYrMo.subLabel}`
        : "None recorded";

      metric4Label = "Annual Monthly Average";
      metric4Sub = `Benchmark: ${monthlyTarget} / month`;
    }

    const totalTouchpoints = buckets.reduce(
      (acc, b) => acc + b.count,
      0,
    );
    const maxBucketValue = Math.max(
      periodBenchmark * 1.3,
      ...buckets.map((b) => b.count),
      1,
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

  // Today's Scheduled Follow-Up Calls (Due Today or Overdue)
  const todayFollowUps = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
    const endOfToday = startOfToday + 86400000 - 1;

    return leads
      .filter((l) => {
        if (!l.followUpDate) return false;
        if (
          ["converted", "not_interested", "invalid"].includes(
            l.status || "",
          )
        )
          return false;
        const ts = Number(l.followUpDate);
        return ts <= endOfToday;
      })
      .map((l) => {
        const ts = Number(l.followUpDate);
        const isOverdue = ts < Date.now();
        const diffMinutes = Math.round(
          (ts - Date.now()) / (1000 * 60),
        );
        const isDueNow = !isOverdue && diffMinutes <= 60;

        const d = new Date(ts);
        const timeString = isNaN(d.getTime())
          ? "Scheduled"
          : new Intl.DateTimeFormat("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }).format(d);

        return {
          lead: l,
          timestamp: ts,
          isOverdue,
          isDueNow,
          timeString,
          fullDateString: formatShortDateTime(ts),
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [leads]);

  // Next Priority Uncontacted Prospects (Ready for immediate outreach sprint)
  const hotProspects = useMemo(() => {
    return leads
      .filter(
        (l) =>
          (!l.status || l.status === "uncontacted") &&
          Boolean(l.phone),
      )
      .sort((a, b) => {
        // Prioritize prospects without website
        if (!a.website && b.website) return -1;
        if (a.website && !b.website) return 1;
        return (
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
        );
      })
      .slice(0, 4);
  }, [leads]);

  // Pipeline Stage Distribution Counts
  const stageStats = useMemo(() => {
    return {
      uncontacted: leads.filter(
        (l) => !l.status || l.status === "uncontacted",
      ).length,
      called: leads.filter((l) => l.status === "called").length,
      callLater: leads.filter((l) => l.status === "call_later")
        .length,
      interested: leads.filter((l) => l.status === "interested")
        .length,
      converted: leads.filter((l) => l.status === "converted").length,
      followUpsDue: todayFollowUps.length,
    };
  }, [leads, todayFollowUps]);

  // Dynamic Pacing Advisor calculation
  const pacingAdvice = useMemo(() => {
    const currentHour = new Date().getHours();
    // Assuming workday ends around 18:00 (6 PM)
    const hoursLeft = Math.max(1, 18 - currentHour);
    const paceNeeded = Math.ceil(kpiStats.remainingToGo / hoursLeft);

    if (kpiStats.isTargetMet) {
      return {
        label: "Quota Crushed! 🏆",
        message: `Outstanding job! You've exceeded today's KPI with +${
          kpiStats.moderatorTodayCount - kpiStats.dailyTarget
        } bonus touches.`,
        tone: "emerald",
      };
    }

    if (kpiStats.moderatorTodayCount === 0) {
      return {
        label: "Ready for Kickoff 🚀",
        message: `Today's target is ${kpiStats.dailyTarget} approaches. Start with today's scheduled follow-ups or cold leads.`,
        tone: "terracotta",
      };
    }

    return {
      label: `Pacing: ~${paceNeeded} calls/hr`,
      message: `${kpiStats.remainingToGo} more approaches needed before end of shift. Roughly ${paceNeeded} touchpoints per remaining hour.`,
      tone: kpiStats.progressPercent >= 50 ? "sage" : "amber",
    };
  }, [kpiStats]);

  const isPendingUser =
    userRole !== "admin" && userRole !== "moderator";

  if (isPendingUser) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 font-sans text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 border border-amber-200 text-amber-700 shadow-sm">
          <Clock className="h-8 w-8 text-amber-600 animate-pulse" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/80 px-3 py-1 text-xs font-semibold text-amber-800">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
            <span>Account Pending Approval</span>
          </div>

          <h1 className="font-serif text-3xl font-bold tracking-tight text-botanical-900 sm:text-4xl">
            Welcome, {effectiveUser?.name || "Workspace Member"}
          </h1>

          <p className="text-sm text-stone-600 leading-relaxed max-w-lg mx-auto">
            Your account has been registered successfully. An
            Administrator must promote your role to{" "}
            <strong>Moderator</strong> before you can access workspace
            leads, data streams, and CRM operations.
          </p>
        </div>

        {/* Account Details Summary */}
        <div className="rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-5 shadow-sm text-left max-w-md mx-auto space-y-3">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-stone-100">
            <span className="text-stone-500">Registered Email</span>
            <span className="font-medium text-stone-800 truncate max-w-[200px]">
              {effectiveUser?.email}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pb-2 border-b border-stone-100">
            <span className="text-stone-500">Current Status</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Pending Approval
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-500">
              Access Granted When
            </span>
            <span className="font-semibold text-botanical-800">
              Promoted to Moderator
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            type="button"
            onClick={() => router.refresh()}
            className="rounded-xl text-xs h-10 px-5 bg-botanical-800 hover:bg-botanical-900 text-paper font-semibold gap-2 shadow-xs cursor-pointer w-full sm:w-auto"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Check Approval Status</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/profile")}
            className="rounded-xl text-xs h-10 px-5 border-stone-200 text-stone-700 hover:bg-stone-100 gap-2 cursor-pointer w-full sm:w-auto"
          >
            <UserIcon className="h-3.5 w-3.5" />
            <span>Manage My Profile</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={async () => {
              await signOut();
              router.push("/login");
            }}
            className="rounded-xl text-xs h-10 px-4 text-terracotta-700 hover:bg-terracotta-50 gap-1.5 cursor-pointer w-full sm:w-auto"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>
    );
  }

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
      {isModerator ? (
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-stone-200/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-sage-300 bg-sage-50/80 px-3 py-1 text-xs font-semibold text-botanical-800">
                <Sprout className="h-3.5 w-3.5 text-sage-600" />
                <span>Moderator Workspace</span>
              </div>
              <Badge
                variant="sage"
                className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-sage-200/90 text-botanical-900 border-sage-300"
              >
                Moderator
              </Badge>
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-botanical-900 md:text-4xl">
              Moderator Operations Center
            </h1>
            <p className="mt-1 text-sm text-stone-600 max-w-2xl">
              Audit extracted business records, verify contact
              information, and review scraped lead streams across
              active search clusters.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="default"
              size="default"
              onClick={() => router.push("/leads")}
              className="cursor-pointer gap-2 bg-botanical-800 hover:bg-botanical-900 text-paper rounded-xl shadow-xs"
            >
              <span>Review Lead Directory</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-stone-200/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-sage-300 bg-sage-50/80 px-3 py-1 text-xs font-semibold text-botanical-800">
                <Sprout className="h-3.5 w-3.5 text-sage-600" />
                <span>
                  GM Lead Generator &bull; Organic Workspace
                </span>
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
              Live multi-platform extraction intelligence, team
              outreach KPI velocity, and conversion funnel analytics
              across all active search clusters.
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
      )}

      {/* Metric Cards Row */}
      {isModerator ? (
        <div className="space-y-6">
          {/* 1. Interactive Pipeline Stages Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <button
              type="button"
              onClick={() => router.push("/leads")}
              className="flex flex-col text-left rounded-xl border border-stone-200/90 bg-[#FCFBF8] p-3 shadow-2xs hover:border-botanical-600 transition-all cursor-pointer group"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 group-hover:text-botanical-800">
                All Monitored
              </span>
              <span className="text-xl font-extrabold text-botanical-900 mt-0.5">
                {leads.length}
              </span>
              <span className="text-[10px] text-stone-400">
                Total in queue
              </span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/leads?status=uncontacted")}
              className="flex flex-col text-left rounded-xl border border-stone-200/90 bg-[#FCFBF8] p-3 shadow-2xs hover:border-botanical-600 transition-all cursor-pointer group"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta-600 group-hover:text-terracotta-700">
                Uncontacted
              </span>
              <span className="text-xl font-extrabold text-terracotta-700 mt-0.5">
                {stageStats.uncontacted}
              </span>
              <span className="text-[10px] text-stone-400">
                Ready to approach
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById(
                  "follow-ups-section",
                );
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`flex flex-col text-left rounded-xl border p-3 shadow-2xs transition-all cursor-pointer group relative ${
                todayFollowUps.length > 0
                  ? "border-amber-300 bg-amber-50/70 hover:border-amber-500"
                  : "border-stone-200/90 bg-[#FCFBF8] hover:border-botanical-600"
              }`}
            >
              {todayFollowUps.length > 0 && (
                <span className="absolute top-2 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
              )}
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                <CalendarClock className="h-3 w-3" />
                Due Today
              </span>
              <span className="text-xl font-extrabold text-amber-900 mt-0.5">
                {todayFollowUps.length}
              </span>
              <span className="text-[10px] text-amber-700 font-medium">
                Follow-up calls
              </span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/leads?status=called")}
              className="flex flex-col text-left rounded-xl border border-stone-200/90 bg-[#FCFBF8] p-3 shadow-2xs hover:border-botanical-600 transition-all cursor-pointer group"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-botanical-700 group-hover:text-botanical-800">
                In Touch
              </span>
              <span className="text-xl font-extrabold text-botanical-900 mt-0.5">
                {stageStats.called}
              </span>
              <span className="text-[10px] text-stone-400">
                Called / In discussion
              </span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/leads?status=interested")}
              className="flex flex-col text-left rounded-xl border border-stone-200/90 bg-[#FCFBF8] p-3 shadow-2xs hover:border-botanical-600 transition-all cursor-pointer group"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-sage-700 group-hover:text-sage-800">
                Interested
              </span>
              <span className="text-xl font-extrabold text-emerald-800 mt-0.5">
                {stageStats.interested}
              </span>
              <span className="text-[10px] text-stone-400">
                Hot prospects
              </span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/leads?status=converted")}
              className="flex flex-col text-left rounded-xl border border-emerald-200/90 bg-emerald-50/50 p-3 shadow-2xs hover:border-emerald-500 transition-all cursor-pointer group"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                <Award className="h-3 w-3 text-emerald-600" />
                Converted
              </span>
              <span className="text-xl font-extrabold text-emerald-900 mt-0.5">
                {stageStats.converted}
              </span>
              <span className="text-[10px] text-emerald-700 font-medium">
                Deals closed
              </span>
            </button>
          </div>

          {/* 2. Core Operational Command Center: Follow-ups Queue + Daily KPI Ring Hub */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Today's Scheduled Follow-Up Calls */}
            <div
              id="follow-ups-section"
              className="lg:col-span-2 space-y-4"
            >
              <Card className="rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/70 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                      <CalendarClock className="h-4.5 w-4.5 text-amber-700" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif text-base font-bold text-botanical-900">
                          Today&apos;s Due Follow-Up Calls
                        </h3>
                        <Badge
                          variant={
                            todayFollowUps.length > 0
                              ? "default"
                              : "secondary"
                          }
                          className="text-[10px] font-bold"
                        >
                          {todayFollowUps.length} Scheduled
                        </Badge>
                      </div>
                      <p className="text-xs text-stone-500">
                        Appointments and reminders scheduled for
                        today. Complete calls at their assigned time.
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push("/leads?status=call_later")
                    }
                    className="text-xs h-8 text-botanical-800 border-stone-200 rounded-xl cursor-pointer shrink-0"
                  >
                    <span>All Scheduled</span>
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>

                {todayFollowUps.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-stone-200 bg-sage-50/40 p-8 text-center space-y-3">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-sage-100 border border-sage-200 text-sage-800">
                      <CalendarCheck className="h-5 w-5 text-botanical-700" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-botanical-900">
                        All Caught Up on Scheduled Follow-Ups!
                      </h4>
                      <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                        No pending appointments are waiting in your
                        queue today. Jump directly into your
                        uncontacted prospect sprint to hit
                        today&apos;s KPI target.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        router.push("/leads?status=uncontacted")
                      }
                      className="rounded-xl text-xs h-8 px-4 bg-botanical-800 hover:bg-botanical-900 text-paper font-semibold cursor-pointer"
                    >
                      <PhoneCall className="h-3 w-3 mr-1.5" />
                      <span>Start Calling Uncontacted Leads</span>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayFollowUps.map((item, idx) => {
                      const latestNote =
                        item.lead.notes && item.lead.notes.length > 0
                          ? item.lead.notes[
                              item.lead.notes.length - 1
                            ]
                          : null;

                      return (
                        <div
                          key={item.lead.leadId || idx}
                          onClick={() => handleSelectLead(item.lead)}
                          className="rounded-xl border border-stone-200/90 bg-paper p-4 shadow-2xs hover:border-botanical-600 transition-all cursor-pointer space-y-2.5 group"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Time Pill */}
                              {item.isOverdue ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-900 border border-red-300">
                                  <AlertCircle className="h-3 w-3 text-red-600" />
                                  Overdue ({item.timeString})
                                </span>
                              ) : item.isDueNow ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                                  <Clock className="h-3 w-3 text-amber-700" />
                                  Due Now ({item.timeString})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sage-100 text-botanical-900 border border-sage-300">
                                  <CalendarClock className="h-3 w-3 text-botanical-700" />
                                  Today at {item.timeString}
                                </span>
                              )}

                              <Badge
                                variant="secondary"
                                className="text-[10px] uppercase font-semibold"
                              >
                                {item.lead.status?.replace(
                                  "_",
                                  " ",
                                ) || "Follow-up"}
                              </Badge>
                            </div>

                            <span className="text-[11px] text-stone-400 font-medium">
                              Added {formatDate(item.lead.createdAt)}
                            </span>
                          </div>

                          {/* Business Name, Location, Phone */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="font-semibold text-sm text-botanical-900 group-hover:text-botanical-700 truncate">
                                {item.lead.name}
                              </h4>
                              <p className="text-xs text-stone-500 truncate max-w-md">
                                {item.lead.address ||
                                  item.lead.searchQuery ||
                                  "Lead prospect"}
                              </p>
                            </div>

                            {/* Direct Call & Copy Controls */}
                            {item.lead.phone ? (
                              <div className="flex items-center gap-2 shrink-0">
                                <a
                                  href={`tel:${item.lead.phone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-botanical-800 hover:bg-botanical-900 text-paper text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                                  title="Click to dial client directly"
                                >
                                  <Phone className="h-3.5 w-3.5 text-sage-300" />
                                  <span>{item.lead.phone}</span>
                                </a>

                                <button
                                  type="button"
                                  onClick={(e) =>
                                    handleCopyPhone(
                                      e,
                                      item.lead.phone,
                                    )
                                  }
                                  className="h-8 w-8 rounded-xl border border-stone-200 bg-paper hover:bg-stone-50 flex items-center justify-center text-stone-500 hover:text-stone-700 transition-colors cursor-pointer"
                                  title="Copy phone number"
                                >
                                  {copiedPhone === item.lead.phone ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs italic text-stone-400">
                                No direct phone
                              </span>
                            )}
                          </div>

                          {/* Note Snippet */}
                          {latestNote && (
                            <div className="rounded-lg bg-oatmeal-100/70 border border-stone-200/60 p-2.5 text-xs text-stone-600 flex items-start gap-2">
                              <span className="font-semibold text-botanical-800 shrink-0">
                                Context:
                              </span>
                              <span className="italic line-clamp-1 text-stone-700">
                                &ldquo;{latestNote.content}&rdquo;
                              </span>
                            </div>
                          )}

                          {/* Quick Action Buttons */}
                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-stone-100">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectLead(item.lead);
                              }}
                              className="text-[11px] h-7 px-2.5 rounded-lg border-stone-200 text-stone-600 hover:text-botanical-900 cursor-pointer"
                            >
                              View Full History
                            </Button>

                            <Button
                              size="sm"
                              onClick={(e) =>
                                handleOpenPipelineModal(e, item.lead)
                              }
                              className="text-[11px] h-7 px-3 rounded-lg bg-botanical-700 hover:bg-botanical-800 text-paper font-semibold gap-1.5 cursor-pointer shadow-2xs"
                            >
                              <PhoneCall className="h-3 w-3 text-sage-200" />
                              <span>Log Call Outcome</span>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>

            {/* Right 1 Col: Daily Approach Target Command Hub (Radial Progress & Pacing) */}
            <div className="space-y-4">
              <Card className="rounded-2xl border-2 border-botanical-700/50 bg-gradient-to-br from-paper via-[#FCFBF8] to-sage-50/50 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200/70 pb-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-4.5 w-4.5 text-terracotta-600" />
                    <h3 className="font-serif text-base font-bold text-botanical-900">
                      Daily Approach KPI
                    </h3>
                  </div>
                  <Badge
                    variant={
                      kpiStats.isTargetMet ? "default" : "terracotta"
                    }
                    className="text-[10px] uppercase font-bold"
                  >
                    Target: {kpiStats.dailyTarget}/day
                  </Badge>
                </div>

                {/* Circular Radial Gauge */}
                <div className="flex flex-col items-center justify-center py-2">
                  <div className="relative flex items-center justify-center">
                    <svg className="w-36 h-36 transform -rotate-90">
                      {/* Background circle */}
                      <circle
                        cx="72"
                        cy="72"
                        r="54"
                        className="text-oatmeal-200"
                        strokeWidth="10"
                        stroke="currentColor"
                        fill="transparent"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="72"
                        cy="72"
                        r="54"
                        className={`${
                          kpiStats.isTargetMet
                            ? "text-emerald-600"
                            : kpiStats.progressPercent >= 50
                              ? "text-botanical-700"
                              : "text-terracotta-500"
                        } transition-all duration-700 ease-out`}
                        strokeWidth="10"
                        strokeDasharray={339.29}
                        strokeDashoffset={
                          339.29 -
                          (339.29 *
                            Math.min(100, kpiStats.progressPercent)) /
                            100
                        }
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                      />
                    </svg>

                    {/* Center stats */}
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="font-serif text-3xl font-extrabold text-botanical-900">
                        {kpiStats.moderatorTodayCount}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                        / {kpiStats.dailyTarget} calls
                      </span>
                      <span className="text-xs font-bold text-botanical-800 mt-0.5">
                        {kpiStats.progressPercent}%
                      </span>
                    </div>
                  </div>

                  {/* Motivational Status Pill */}
                  <div className="mt-3 text-center">
                    {kpiStats.isTargetMet ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Target Achieved (+
                        {kpiStats.moderatorTodayCount -
                          kpiStats.dailyTarget}{" "}
                        bonus)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-terracotta-100 text-terracotta-900 border border-terracotta-300">
                        <Flame className="h-3.5 w-3.5 text-terracotta-600" />
                        <strong>{kpiStats.remainingToGo}</strong> more
                        to reach today&apos;s quota
                      </span>
                    )}
                  </div>
                </div>

                {/* Real-Time Pacing Advisor Box */}
                <div
                  className={`rounded-xl p-3 text-xs border ${
                    pacingAdvice.tone === "emerald"
                      ? "bg-emerald-50 text-emerald-950 border-emerald-200"
                      : pacingAdvice.tone === "sage"
                        ? "bg-sage-50 text-botanical-900 border-sage-200"
                        : "bg-amber-50 text-amber-950 border-amber-200"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <Zap className="h-3.5 w-3.5 text-botanical-700" />
                    <span>{pacingAdvice.label}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-stone-600">
                    {pacingAdvice.message}
                  </p>
                </div>

                {/* Touchpoint Breakdown Counters */}
                <div className="space-y-2 pt-1 border-t border-stone-200/70 text-xs">
                  <div className="flex items-center justify-between text-stone-600">
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-botanical-700" />{" "}
                      Direct Calls Logged
                    </span>
                    <span className="font-bold text-botanical-900">
                      {kpiStats.calledToday}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-stone-600">
                    <span className="flex items-center gap-1.5">
                      <Award className="h-3 w-3 text-emerald-600" />{" "}
                      Interested / Won
                    </span>
                    <span className="font-bold text-emerald-800">
                      {kpiStats.interestedToday}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-stone-600">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-3 w-3 text-terracotta-600" />{" "}
                      Follow-ups Scheduled
                    </span>
                    <span className="font-bold text-terracotta-700">
                      {kpiStats.callLaterToday}
                    </span>
                  </div>
                </div>

                {/* Quick Call Action Button */}
                <Button
                  onClick={() =>
                    router.push("/leads?status=uncontacted")
                  }
                  className="w-full rounded-xl text-xs h-9.5 bg-botanical-800 hover:bg-botanical-900 text-paper font-semibold gap-2 cursor-pointer shadow-xs"
                >
                  <PhoneCall className="h-3.5 w-3.5 text-sage-200" />
                  <span>Launch Cold Calling Sprint</span>
                </Button>
              </Card>
            </div>
          </div>

          {/* 3. Next Hot Uncontacted Prospects Queue */}
          <Card className="rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/70 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-terracotta-100 text-terracotta-900 border border-terracotta-200 shrink-0">
                  <Flame className="h-4.5 w-4.5 text-terracotta-600" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-botanical-900">
                    Next Priority Prospects to Approach
                  </h3>
                  <p className="text-xs text-stone-500">
                    High-potential uncontacted businesses ready for
                    immediate outreach. Call &amp; log directly to
                    increment today&apos;s KPI.
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push("/leads?status=uncontacted")
                }
                className="text-xs h-8 text-botanical-800 border-stone-200 rounded-xl cursor-pointer"
              >
                <span>
                  View Full Uncontacted Pool ({stageStats.uncontacted}
                  )
                </span>
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>

            {hotProspects.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-500">
                No uncontacted leads with active phone numbers
                currently in queue. Extract new leads using the Chrome
                extension!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {hotProspects.map((lead, idx) => (
                  <div
                    key={lead.leadId || idx}
                    onClick={() => handleSelectLead(lead)}
                    className="rounded-xl border border-stone-200/90 bg-paper p-3.5 shadow-2xs hover:border-botanical-600 transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <Badge
                          variant="sage"
                          className="text-[9px] px-1.5 py-0 font-medium"
                        >
                          {lead.source}
                        </Badge>
                        {!lead.website && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-terracotta-100 px-2 py-0.2 text-[9px] font-bold text-terracotta-800 border border-terracotta-200">
                            <Target className="h-2.5 w-2.5" /> No
                            Website
                          </span>
                        )}
                      </div>

                      <h4 className="font-semibold text-xs text-botanical-900 group-hover:text-botanical-700 truncate">
                        {lead.name}
                      </h4>
                      <p className="text-[11px] text-stone-400 truncate mt-0.5">
                        {lead.address ||
                          lead.searchQuery ||
                          "Business lead"}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-stone-100">
                      {lead.phone ? (
                        <div className="flex items-center justify-between text-xs">
                          <a
                            href={`tel:${lead.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 font-bold text-botanical-900 hover:text-botanical-700 truncate"
                          >
                            <Phone className="h-3 w-3 text-sage-600 shrink-0" />
                            <span className="truncate">
                              {lead.phone}
                            </span>
                          </a>
                          <button
                            type="button"
                            onClick={(e) =>
                              handleCopyPhone(e, lead.phone)
                            }
                            className="p-1 rounded-md text-stone-400 hover:text-stone-600 cursor-pointer"
                            title="Copy number"
                          >
                            {copiedPhone === lead.phone ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      ) : null}

                      <Button
                        size="sm"
                        onClick={(e) =>
                          handleOpenPipelineModal(e, lead)
                        }
                        className="w-full text-[11px] h-7 bg-botanical-800 hover:bg-botanical-900 text-paper font-semibold gap-1.5 cursor-pointer shadow-2xs rounded-lg"
                      >
                        <PhoneCall className="h-3 w-3 text-sage-200" />
                        <span>Log Approach / Call</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : (
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
                  {Math.round(
                    (kpiStats.todayCount / kpiStats.dailyTarget) *
                      100,
                  )}
                  % of daily quota
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
                  <span className="text-xs text-stone-400">
                    records
                  </span>
                </div>
                <p className="text-[11px] text-botanical-700 font-medium mt-0.5">
                  Across {groups.length} search clusters
                </p>
              </div>
              <div className="space-y-1 pt-1 border-t border-stone-100 text-[11px] text-stone-500 flex items-center justify-between">
                <span>Verified Contact Info</span>
                <span className="font-semibold text-botanical-800">
                  {conversionRate}%
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
                    {stageStats.interested + stageStats.converted}
                  </span>
                  <span className="text-xs text-stone-400">
                    prospects
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                  {stageStats.converted} deals closed / converted
                </p>
              </div>
              <div className="space-y-1 pt-1 border-t border-stone-100 text-[11px] text-stone-500 flex items-center justify-between">
                <span>Active Negotiation</span>
                <span className="font-semibold text-botanical-800">
                  {stageStats.interested} leads
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
                    {prospectsWithoutWebsite}
                  </span>
                  <span className="text-xs text-stone-400">
                    (
                    {Math.round(
                      (prospectsWithoutWebsite /
                        (leads.length || 1)) *
                        100,
                    )}
                    %)
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
                    {adminTrendAnalytics.title}
                  </h3>
                  <Badge
                    variant="sage"
                    className="text-[10px] uppercase font-bold tracking-wider"
                  >
                    {adminTrendAnalytics.benchmarkUnitLabel === "day"
                      ? `Target: ${dailyTarget}/day`
                      : adminTrendAnalytics.benchmarkUnitLabel ===
                          "week"
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
                  <span className="text-2xl font-bold text-botanical-900">
                    {adminTrendAnalytics.metric1Value}
                  </span>
                  {adminTimeframe === "7d" && (
                    <span className="text-xs text-stone-400">
                      / {dailyTarget} goal
                    </span>
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
                  <span className="text-2xl font-bold text-botanical-900">
                    {adminTrendAnalytics.metric2Value}
                  </span>
                  <span className="text-xs text-stone-400">
                    touches
                  </span>
                </div>
                <p
                  className="text-[11px] text-stone-500 font-medium mt-1 truncate"
                  title={adminTrendAnalytics.metric2Sub}
                >
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
                  <span className="text-2xl font-bold text-botanical-900">
                    {adminTrendAnalytics.totalTouchpoints}
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
                  {adminTrendAnalytics.metric4Label}
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-botanical-900">
                    {adminTrendAnalytics.periodAverage}
                  </span>
                  <span className="text-xs text-stone-400">
                    touches/{adminTrendAnalytics.benchmarkUnitLabel}
                  </span>
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
                    <span className="h-2.5 w-2.5 rounded-xs bg-botanical-700" />{" "}
                    Met Target (
                    {`≥ ${adminTrendAnalytics.periodBenchmark}`})
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-xs bg-terracotta-500" />{" "}
                    Below Target
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-stone-600">
                    <span className="w-3.5 h-0.5 border-t-2 border-dashed border-terracotta-600" />{" "}
                    Benchmark ({adminTrendAnalytics.periodBenchmark}/
                    {adminTrendAnalytics.benchmarkUnitLabel})
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
                        (adminTrendAnalytics.periodBenchmark /
                          adminTrendAnalytics.maxBucketValue) *
                          100,
                      ),
                    )}%`,
                  }}
                >
                  <span className="absolute -top-5 right-0 rounded-md bg-terracotta-100 text-terracotta-800 border border-terracotta-200 px-1.5 py-0.5 text-[9px] font-bold">
                    Target: {adminTrendAnalytics.periodBenchmark} /{" "}
                    {adminTrendAnalytics.benchmarkUnitLabel}
                  </span>
                </div>

                {/* Bars Container */}
                {adminTimeframe === "1m" ? (
                  /* 30-Day Scrollable / Compact Bar Grid */
                  <div className="flex items-end justify-between gap-1 sm:gap-1.5 h-48 border-b border-stone-200/90 pb-2 overflow-x-auto pt-2">
                    {adminTrendAnalytics.buckets.map(
                      (bucket, idx) => {
                        const barHeightPercent = Math.min(
                          100,
                          Math.max(
                            6,
                            Math.round(
                              (bucket.count /
                                adminTrendAnalytics.maxBucketValue) *
                                100,
                            ),
                          ),
                        );
                        const showLabel =
                          idx % 3 === 0 ||
                          idx ===
                            adminTrendAnalytics.buckets.length - 1;

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
                    {adminTrendAnalytics.buckets.map((bucket) => {
                      const barHeightPercent = Math.min(
                        100,
                        Math.max(
                          8,
                          Math.round(
                            (bucket.count /
                              adminTrendAnalytics.maxBucketValue) *
                              100,
                          ),
                        ),
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
                              style={{
                                height: `${barHeightPercent}%`,
                              }}
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
                    Tracking individual moderator approach progress
                    toward the configured {kpiStats.dailyTarget}{" "}
                    touches/day target.
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/users")}
                className="text-xs h-8 text-botanical-800 border-stone-300 rounded-xl cursor-pointer bg-paper shrink-0"
              >
                <Users className="h-3 w-3 mr-1 text-botanical-700" />
                <span>Manage Users &amp; Permissions</span>
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>

            {teamMembers.length === 0 ? (
              <div className="rounded-xl border border-stone-200/70 bg-paper p-6 text-center text-xs text-stone-500">
                Loading team members matrix...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {teamMembers
                  .filter(
                    (m) =>
                      (m.role || "").toLowerCase() === "moderator" ||
                      (m.role || "").toLowerCase() === "admin",
                  )
                  .map((member, idx) => {
                    const isMod =
                      (member.role || "").toLowerCase() ===
                      "moderator";
                    // Calculate attributed approaches or fallback to distributed share
                    const memberTouches = leads.filter((l) => {
                      const isToday =
                        l.lastContactedAt &&
                        l.lastContactedAt >=
                          (kpiStats.past7Days[6]?.dayStart || 0);
                      const isMatch =
                        l.lastContactedBy?.userId === member.id ||
                        l.lastContactedBy?.email === member.email;
                      return isToday && isMatch;
                    }).length;

                    // If not individual, show overall if single moderator
                    const displayCount =
                      memberTouches > 0
                        ? memberTouches
                        : isMod
                          ? kpiStats.moderatorTodayCount
                          : kpiStats.todayCount;
                    const percent = Math.min(
                      100,
                      Math.round(
                        (displayCount / kpiStats.dailyTarget) * 100,
                      ),
                    );
                    const isGoalMet =
                      displayCount >= kpiStats.dailyTarget;

                    return (
                      <div
                        key={member.id || idx}
                        className="rounded-xl border border-stone-200/90 bg-paper p-4 shadow-2xs space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-botanical-800 text-paper font-bold text-xs shrink-0">
                              {(member.name || "U")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-botanical-900 truncate">
                                {member.name || "Team Member"}
                              </p>
                              <p className="text-[11px] text-stone-400 truncate">
                                {member.email}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={isMod ? "sage" : "terracotta"}
                            className="text-[9px] uppercase font-bold"
                          >
                            {member.role || "user"}
                          </Badge>
                        </div>

                        {/* Progress Bar & Status */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-botanical-900">
                              {displayCount} / {kpiStats.dailyTarget}{" "}
                              approaches
                            </span>
                            <span className="font-bold text-stone-500">
                              {percent}%
                            </span>
                          </div>

                          <div className="h-2 w-full rounded-full bg-oatmeal-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isGoalMet
                                  ? "bg-emerald-600"
                                  : percent >= 50
                                    ? "bg-botanical-700"
                                    : "bg-terracotta-500"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] pt-0.5">
                            <span className="text-stone-400">
                              Daily Target Quota
                            </span>
                            {isGoalMet ? (
                              <span className="text-emerald-700 font-bold flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />{" "}
                                Target Met
                              </span>
                            ) : (
                              <span className="text-terracotta-700 font-semibold">
                                {Math.max(
                                  0,
                                  kpiStats.dailyTarget - displayCount,
                                )}{" "}
                                remaining
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

          {/* 4. Interactive Full-Workspace Conversion Pipeline Funnel */}
          <Card className="rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/70 pb-3">
              <div>
                <h3 className="font-serif text-base font-bold text-botanical-900 flex items-center gap-2">
                  <Target className="h-4.5 w-4.5 text-botanical-700" />
                  <span>Workspace Conversion Pipeline Funnel</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Full lifecycle drop-off from captured scraper noise
                  down to closed paying deals.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/leads")}
                className="text-xs h-8 border-stone-300 text-stone-700 rounded-xl cursor-pointer bg-paper shrink-0"
              >
                <span>Filter Pipeline in Leads Table</span>
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <button
                type="button"
                onClick={() => router.push("/leads")}
                className="rounded-xl border border-stone-200/90 bg-paper p-3.5 text-left hover:border-botanical-600 transition-all cursor-pointer shadow-2xs group"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  1. Raw Scraped
                </span>
                <p className="text-xl font-extrabold text-botanical-900 mt-1">
                  {leads.length}
                </p>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  100% of pipeline
                </p>
              </button>

              <button
                type="button"
                onClick={() => router.push("/leads")}
                className="rounded-xl border border-stone-200/90 bg-paper p-3.5 text-left hover:border-botanical-600 transition-all cursor-pointer shadow-2xs group"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-botanical-700">
                  2. Contactable
                </span>
                <p className="text-xl font-extrabold text-botanical-900 mt-1">
                  {verifiedCount}
                </p>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  {conversionRate}% phone / email
                </p>
              </button>

              <button
                type="button"
                onClick={() => router.push("/leads?status=called")}
                className="rounded-xl border border-stone-200/90 bg-paper p-3.5 text-left hover:border-botanical-600 transition-all cursor-pointer shadow-2xs group"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  3. In Outreach
                </span>
                <p className="text-xl font-extrabold text-amber-900 mt-1">
                  {stageStats.called + stageStats.callLater}
                </p>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  Calls &amp; follow-ups
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push("/leads?status=interested")
                }
                className="rounded-xl border border-stone-200/90 bg-paper p-3.5 text-left hover:border-botanical-600 transition-all cursor-pointer shadow-2xs group"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-sage-800">
                  4. Warm Prospects
                </span>
                <p className="text-xl font-extrabold text-emerald-800 mt-1">
                  {stageStats.interested}
                </p>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  High intent
                </p>
              </button>

              <button
                type="button"
                onClick={() => router.push("/leads?status=converted")}
                className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-left hover:border-emerald-500 transition-all cursor-pointer shadow-2xs group"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  5. Closed Deals
                </span>
                <p className="text-xl font-extrabold text-emerald-900 mt-1">
                  {stageStats.converted}
                </p>
                <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                  {Math.round(
                    (stageStats.converted / (leads.length || 1)) *
                      100,
                  )}
                  % total yield
                </p>
              </button>
            </div>
          </Card>

          {/* 5. Two-Column Intelligence: Platform Breakdown + Data Quality Health */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Platform Distribution */}
            <Card className="border border-stone-200/90 shadow-sm p-6 bg-[#FCFBF8] space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <CardTitle className="font-serif text-base text-botanical-900 flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-terracotta-600" />
                  <span>Platform Extraction Sources</span>
                </CardTitle>
                <Badge variant="sage" className="text-[10px]">
                  Multi-Engine Active
                </Badge>
              </div>

              <div className="space-y-3.5 pt-1">
                <div>
                  <div className="flex justify-between text-xs font-medium text-stone-600 mb-1.5">
                    <span>Google Maps Business Extraction</span>
                    <span className="font-semibold text-botanical-800">
                      {
                        leads.filter(
                          (l) =>
                            l.source.toLowerCase().includes("map") ||
                            l.source.toLowerCase().includes("google"),
                        ).length
                      }{" "}
                      leads
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-oatmeal-200 overflow-hidden">
                    <div
                      className="h-full bg-sage-500 rounded-full"
                      style={{
                        width: `${Math.min(100, (leads.filter((l) => l.source.toLowerCase().includes("map") || l.source.toLowerCase().includes("google")).length / (leads.length || 1)) * 100)}%`,
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
                            l.source.toLowerCase().includes("insta"),
                        ).length
                      }{" "}
                      leads
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-oatmeal-200 overflow-hidden">
                    <div
                      className="h-full bg-terracotta-500 rounded-full"
                      style={{
                        width: `${Math.min(100, (leads.filter((l) => l.source.toLowerCase().includes("face") || l.source.toLowerCase().includes("insta")).length / (leads.length || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-stone-600 mb-1.5">
                    <span>LinkedIn Professional Directory</span>
                    <span className="font-semibold text-botanical-800">
                      {
                        leads.filter((l) =>
                          l.source.toLowerCase().includes("linkedin"),
                        ).length
                      }{" "}
                      leads
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-oatmeal-200 overflow-hidden">
                    <div
                      className="h-full bg-botanical-700 rounded-full"
                      style={{
                        width: `${Math.min(100, (leads.filter((l) => l.source.toLowerCase().includes("linkedin")).length / (leads.length || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Right: Data Quality Coverage */}
            <Card className="border border-stone-200/90 shadow-sm p-6 bg-[#FCFBF8] space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <CardTitle className="font-serif text-base text-botanical-900 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-botanical-700" />
                  <span>Contact Data Health &amp; Enrichment</span>
                </CardTitle>
                <Badge variant="sage" className="text-[10px]">
                  Active TLS 1.3
                </Badge>
              </div>

              <div className="space-y-3 pt-1 text-xs text-stone-600">
                <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                  <span>Phone Number Verified</span>
                  <span className="font-bold text-botanical-800">
                    {leads.filter((l) => Boolean(l.phone)).length}{" "}
                    leads (
                    {Math.round(
                      (leads.filter((l) => Boolean(l.phone)).length /
                        (leads.length || 1)) *
                        100,
                    )}
                    %)
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                  <span>Email Address Active</span>
                  <span className="font-bold text-botanical-800">
                    {leads.filter((l) => Boolean(l.email)).length}{" "}
                    leads (
                    {Math.round(
                      (leads.filter((l) => Boolean(l.email)).length /
                        (leads.length || 1)) *
                        100,
                    )}
                    %)
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                  <span>Social Media Footprint Enriched</span>
                  <span className="font-bold text-emerald-800">
                    {enrichedSocialCount} leads (
                    {Math.round(
                      (enrichedSocialCount / (leads.length || 1)) *
                        100,
                    )}
                    %)
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span>Database Cluster</span>
                  <span className="font-semibold text-emerald-700">
                    MongoDB Atlas (Cluster Active)
                  </span>
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
      )}

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
        }}
      />

      {/* Lead Pipeline Modal for direct call logging from dashboard */}
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
        }}
      />
    </div>
  );
}
