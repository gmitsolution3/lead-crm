"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { formatDate, formatShortDateTime } from "@/lib/utils";
import {
  ArrowRight,
  Sprout,
  CalendarClock,
  CalendarCheck,
  Award,
  Phone,
  Mail,
  Globe,
  ExternalLink,
  Clock,
  Target,
  ChevronRight,
  Copy,
  Check,
  PhoneCall,
  PhoneForwarded,
  Flame,
  Zap,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ModeratorDashboardProps {
  user?: User | null;
}

export default function ModeratorDashboard({ user }: ModeratorDashboardProps) {
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

  // Lead detail sheet state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Pipeline modal state for quick call outcome logging
  const [pipelineLead, setPipelineLead] = useState<Lead | null>(null);
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);

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

  const handleOpenPipelineModal = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    setPipelineLead(lead);
    setIsPipelineModalOpen(true);
  };

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsSheetOpen(true);
  };

  // Daily Approach KPI Target (fetched from settings, defaults to 25)
  const [dailyTarget, setDailyTarget] = useState<number>(25);

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

  // Daily Approach & Contact Target KPI Calculations
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

    // Moderator-specific attribution (or pool fallback if unassigned)
    const moderatorToday = todayContacted.filter((l) => {
      if (l.lastContactedBy?.userId && effectiveUser?.id) {
        return l.lastContactedBy.userId === effectiveUser.id;
      }
      if (l.assignedTo?.userId && effectiveUser?.id) {
        return l.assignedTo.userId === effectiveUser.id;
      }
      return true;
    });

    const moderatorTodayCount = moderatorToday.length;
    const remainingToGo = Math.max(0, dailyTarget - moderatorTodayCount);
    const progressPercent = Math.min(100, Math.round((moderatorTodayCount / dailyTarget) * 100));

    return {
      dailyTarget,
      todayCount: todayContacted.length,
      moderatorTodayCount,
      yesterdayCount: yesterdayContacted.length,
      remainingToGo,
      progressPercent,
      isTargetMet: moderatorTodayCount >= dailyTarget,
      calledToday: todayContacted.filter((l) => l.status === "called").length,
      interestedToday: todayContacted.filter((l) => l.status === "interested" || l.status === "converted").length,
      callLaterToday: todayContacted.filter((l) => l.status === "call_later").length,
    };
  }, [leads, dailyTarget, effectiveUser]);

  // Today's Scheduled Follow-Up Calls (Due Today or Overdue)
  const todayFollowUps = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 86400000 - 1;

    return leads
      .filter((l) => {
        if (!l.followUpDate) return false;
        if (["converted", "not_interested", "invalid"].includes(l.status || "")) return false;
        const ts = Number(l.followUpDate);
        return ts <= endOfToday;
      })
      .map((lead) => {
        const ts = Number(lead.followUpDate);
        const isOverdue = ts < Date.now();
        const isDueNow = Math.abs(ts - Date.now()) <= 1000 * 60 * 30; // within 30 min

        const callNotes = lead.notes || [];
        const lastCallNote = callNotes[callNotes.length - 1];

        return {
          lead,
          followUpTs: ts,
          isOverdue,
          isDueNow,
          lastCallNote,
        };
      })
      .sort((a, b) => a.followUpTs - b.followUpTs);
  }, [leads]);

  // Priority cold outreach prospects (uncontacted with valid phone & no website)
  const hotProspects = useMemo(() => {
    return leads
      .filter((l) => (!l.status || l.status === "uncontacted") && Boolean(l.phone) && !l.website)
      .slice(0, 4);
  }, [leads]);

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

      {/* Top Header Banner */}
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
            Execute today&apos;s scheduled follow-ups, achieve daily call targets, and reach out to priority uncontacted prospects.
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

      {/* Main Moderator Operational Views */}
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
            <span className="text-[10px] text-stone-400">Total in queue</span>
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
            <span className="text-[10px] text-stone-400">Ready to approach</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("follow-ups-section");
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
            <span className="text-[10px] text-amber-700 font-medium">Follow-up calls</span>
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
            <span className="text-[10px] text-stone-400">Called / In discussion</span>
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
            <span className="text-[10px] text-stone-400">Hot prospects</span>
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
            <span className="text-[10px] text-emerald-700 font-medium">Deals closed</span>
          </button>
        </div>

        {/* 2. Core Operational Command Center: Follow-ups Queue + Daily KPI Ring Hub */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Today's Scheduled Follow-Up Calls */}
          <div id="follow-ups-section" className="lg:col-span-2 space-y-4">
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
                        variant={todayFollowUps.length > 0 ? "default" : "secondary"}
                        className="text-[10px] font-bold"
                      >
                        {todayFollowUps.length} Scheduled
                      </Badge>
                    </div>
                    <p className="text-xs text-stone-500">
                      Appointments and reminders scheduled for today. Complete calls at their assigned time.
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/leads?status=call_later")}
                  className="text-xs h-8 text-botanical-800 border-stone-200 rounded-xl cursor-pointer"
                >
                  <span>View All Scheduled ({stageStats.call_later})</span>
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>

              {todayFollowUps.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-100 text-sage-800 border border-sage-200">
                    <CalendarCheck className="h-5 w-5 text-botanical-700" />
                  </div>
                  <h4 className="font-serif font-bold text-sm text-botanical-900">
                    No follow-ups remaining for today!
                  </h4>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    You have cleared all scheduled calls due today. Move to the uncontacted queue below to continue reaching prospects.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayFollowUps.map((item, idx) => {
                    const lead = item.lead;
                    const followDate = new Date(item.followUpTs);
                    const timeFormatted = followDate.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    });

                    return (
                      <div
                        key={lead.leadId || idx}
                        onClick={() => handleSelectLead(lead)}
                        className={`rounded-xl border p-4 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                          item.isOverdue
                            ? "border-rose-200 bg-rose-50/40 hover:border-rose-400"
                            : item.isDueNow
                            ? "border-amber-300 bg-amber-50/50 hover:border-amber-400 ring-1 ring-amber-300"
                            : "border-stone-200/90 bg-paper hover:border-botanical-600"
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            {item.isOverdue ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                <Clock className="h-3 w-3 text-rose-600" />
                                Overdue ({timeFormatted})
                              </span>
                            ) : item.isDueNow ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                                <Clock className="h-3 w-3 text-amber-700" />
                                Due Now ({timeFormatted})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sage-100 text-botanical-900 border border-sage-300">
                                <CalendarClock className="h-3 w-3 text-botanical-700" />
                                Today at {timeFormatted}
                              </span>
                            )}

                            <Badge variant="sage" className="text-[10px] px-2 py-0">
                              {lead.source}
                            </Badge>

                            {lead.notes && lead.notes.length > 0 && (
                              <span className="text-[10px] text-stone-500 font-medium">
                                • {lead.notes.length} touchpoints logged
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 pt-0.5">
                            <h4 className="font-semibold text-sm text-botanical-900 group-hover:text-botanical-700 truncate">
                              {lead.name}
                            </h4>
                            {!lead.website && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-terracotta-100 px-2 py-0.2 text-[9px] font-bold text-terracotta-800 border border-terracotta-200 shrink-0">
                                <Target className="h-2.5 w-2.5" /> No Website
                              </span>
                            )}
                          </div>

                          {lead.address && (
                            <p className="text-[11px] text-stone-400 truncate">{lead.address}</p>
                          )}

                          {item.lastCallNote && (
                            <div className="rounded-lg bg-oatmeal-100/70 border border-stone-200/60 p-2 text-xs text-stone-600 flex items-start gap-1.5 mt-1">
                              <span className="font-semibold text-botanical-900 shrink-0">Last note:</span>
                              <span className="italic line-clamp-1 text-stone-700">
                                &quot;{item.lastCallNote.content}&quot;
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                          {lead.phone ? (
                            <div className="flex items-center gap-1.5">
                              <a
                                href={`tel:${lead.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-botanical-700 bg-botanical-800 text-paper hover:bg-botanical-900 text-xs font-bold transition-all shadow-2xs"
                              >
                                <PhoneCall className="h-3.5 w-3.5 text-sage-200" />
                                <span>{lead.phone}</span>
                              </a>
                              <button
                                type="button"
                                onClick={(e) => handleCopyPhone(e, lead.phone)}
                                className="h-8 w-8 rounded-xl border border-stone-200 bg-paper hover:bg-stone-50 flex items-center justify-center text-stone-500 hover:text-stone-700 transition-colors cursor-pointer"
                                title="Copy phone number"
                              >
                                {copiedPhone === lead.phone ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs italic text-stone-400">No direct phone</span>
                          )}

                          <Button
                            size="sm"
                            onClick={(e) => handleOpenPipelineModal(e, lead)}
                            className="text-xs h-8 bg-paper hover:bg-stone-100 text-botanical-900 border border-stone-300 font-semibold gap-1.5 cursor-pointer shadow-2xs rounded-xl"
                          >
                            <PhoneForwarded className="h-3.5 w-3.5 text-terracotta-600" />
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

          {/* Right 1 Col: Moderator Daily Target KPI Ring Hub */}
          <div className="space-y-4">
            <Card className="rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-5 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-stone-200/70 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-botanical-700 text-paper shrink-0">
                    <Target className="h-4 w-4 text-sage-200" />
                  </div>
                  <div>
                    <h3 className="font-serif text-sm font-bold text-botanical-900">
                      Daily Approach Target
                    </h3>
                    <p className="text-[11px] text-stone-500">Your personal quota today</p>
                  </div>
                </div>
                <Badge
                  variant={kpiStats.isTargetMet ? "default" : "terracotta"}
                  className="text-[10px] uppercase font-bold tracking-wider"
                >
                  {kpiStats.isTargetMet ? "Quota Met! 🎯" : "In Progress"}
                </Badge>
              </div>

              {/* Circular SVG Gauge */}
              <div className="flex flex-col items-center justify-center py-2">
                <div className="relative flex items-center justify-center">
                  <svg className="w-36 h-36 transform -rotate-90">
                    <circle
                      cx="72"
                      cy="72"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="10"
                      className="text-oatmeal-200"
                      fill="transparent"
                    />
                    <circle
                      cx="72"
                      cy="72"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="10"
                      strokeDasharray={2 * Math.PI * 58}
                      strokeDashoffset={2 * Math.PI * 58 * (1 - kpiStats.progressPercent / 100)}
                      strokeLinecap="round"
                      className={`transition-all duration-700 ease-out ${
                        kpiStats.isTargetMet ? "text-botanical-700" : "text-terracotta-500"
                      }`}
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center text-center">
                    <span className="font-serif text-3xl font-extrabold text-botanical-900">
                      {kpiStats.moderatorTodayCount}
                    </span>
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      of {kpiStats.dailyTarget} goal
                    </span>
                  </div>
                </div>

                <div className="mt-3 text-center space-y-1">
                  {kpiStats.isTargetMet ? (
                    <p className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1">
                      <Award className="h-4 w-4 text-emerald-600" />
                      Target achieved! Keep up the momentum.
                    </p>
                  ) : (
                    <p className="text-xs font-semibold text-terracotta-700">
                      {kpiStats.remainingToGo} more approach
                      {kpiStats.remainingToGo === 1 ? "" : "es"} needed today
                    </p>
                  )}
                  <p className="text-[11px] text-stone-400">
                    {Math.round(kpiStats.progressPercent)}% daily target completion
                  </p>
                </div>
              </div>

              {/* Dynamic Hourly Pacing Advisor */}
              <div className="rounded-xl border border-stone-200/80 bg-paper p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-semibold text-botanical-900">
                  <span className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-600" />
                    Pacing Advisor
                  </span>
                  {kpiStats.remainingToGo > 0 ? (
                    <span className="text-[11px] text-amber-700 font-bold">
                      ~
                      {Math.max(
                        1,
                        Math.round(
                          kpiStats.remainingToGo /
                            Math.max(1, Math.min(8, 18 - new Date().getHours()))
                        )
                      )}{" "}
                      calls/hr needed
                    </span>
                  ) : (
                    <span className="text-[11px] text-emerald-700 font-bold">Goal complete</span>
                  )}
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Calls logged through the outcome modal automatically count toward this target.
                </p>
              </div>

              {/* Touchpoint Breakdown Counters */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-100 text-center">
                <div className="rounded-lg bg-oatmeal-100/60 p-2">
                  <span className="text-xs font-bold text-botanical-900">{kpiStats.calledToday}</span>
                  <p className="text-[10px] text-stone-500 mt-0.5">Calls</p>
                </div>
                <div className="rounded-lg bg-emerald-50/60 p-2">
                  <span className="text-xs font-bold text-emerald-800">{kpiStats.interestedToday}</span>
                  <p className="text-[10px] text-emerald-700 mt-0.5">Interested</p>
                </div>
                <div className="rounded-lg bg-amber-50/60 p-2">
                  <span className="text-xs font-bold text-amber-800">{kpiStats.callLaterToday}</span>
                  <p className="text-[10px] text-amber-700 mt-0.5">Follow-ups</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* 3. Next Priority Prospects to Approach (Cold Outreach Queue) */}
        <Card className="rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/70 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-terracotta-100 text-terracotta-900 border border-terracotta-200 shrink-0">
                <Flame className="h-4.5 w-4.5 text-terracotta-600" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-botanical-900">
                  Next Priority Prospects to Approach
                </h3>
                <p className="text-xs text-stone-500">
                  High-potential uncontacted businesses ready for immediate outreach. Call &amp; log directly to increment today&apos;s KPI.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/leads?status=uncontacted")}
              className="text-xs h-8 text-botanical-800 border-stone-200 rounded-xl cursor-pointer"
            >
              <span>View Full Uncontacted Pool ({stageStats.uncontacted})</span>
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          {hotProspects.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-500">
              No uncontacted leads with active phone numbers currently in queue. Extract new leads using the Chrome extension!
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
                      <Badge variant="sage" className="text-[9px] px-1.5 py-0 font-medium">
                        {lead.source}
                      </Badge>
                      {!lead.website && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-terracotta-100 px-2 py-0.2 text-[9px] font-bold text-terracotta-800 border border-terracotta-200">
                          <Target className="h-2.5 w-2.5" /> No Website
                        </span>
                      )}
                    </div>

                    <h4 className="font-semibold text-xs text-botanical-900 group-hover:text-botanical-700 truncate">
                      {lead.name}
                    </h4>
                    <p className="text-[11px] text-stone-400 truncate mt-0.5">
                      {lead.address || lead.searchQuery || "Business lead"}
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
                          <span className="truncate">{lead.phone}</span>
                        </a>
                        <button
                          type="button"
                          onClick={(e) => handleCopyPhone(e, lead.phone)}
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
                      onClick={(e) => handleOpenPipelineModal(e, lead)}
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
