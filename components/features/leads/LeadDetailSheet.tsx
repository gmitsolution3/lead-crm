"use client";

import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Lead } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  Mail,
  Phone,
  Globe,
  MapPin,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Layers,
  FileText,
  Bookmark,
  Target,
  PhoneCall,
  UserCheck,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  WhatsAppIcon,
} from "@/components/ui/icons";

interface LeadDetailSheetProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated?: (lead: Lead) => void;
}

export function LeadDetailSheet({
  lead,
  isOpen,
  onClose,
}: LeadDetailSheetProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!lead) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getSourceBadgeVariant = (source: string) => {
    switch (source.toLowerCase()) {
      case "google maps":
        return "sage" as const;
      case "linkedin":
        return "default" as const;
      case "instagram":
      case "facebook":
        return "terracotta" as const;
      default:
        return "secondary" as const;
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "called":
        return { label: "Called (Attempted)", icon: "📞", color: "bg-amber-100 text-amber-800 border-amber-300" };
      case "call_later":
        return { label: "Call Later (Follow-Up)", icon: "⏰", color: "bg-blue-100 text-blue-800 border-blue-300" };
      case "interested":
        return { label: "Interested (Hot)", icon: "🔥", color: "bg-emerald-100 text-emerald-800 border-emerald-300" };
      case "not_interested":
        return { label: "Not Interested", icon: "🚫", color: "bg-stone-100 text-stone-700 border-stone-300" };
      case "converted":
        return { label: "Converted (Deal Won)", icon: "🎉", color: "bg-purple-100 text-purple-800 border-purple-300" };
      case "invalid":
        return { label: "Invalid / Dead", icon: "❌", color: "bg-rose-100 text-rose-800 border-rose-300" };
      default:
        return { label: "Uncontacted (New)", icon: "🔵", color: "bg-stone-100 text-stone-700 border-stone-300" };
    }
  };

  const getPriorityLabel = (priority?: string) => {
    switch (priority) {
      case "high":
        return { label: "High Priority", icon: "🔥", color: "text-terracotta-700 bg-terracotta-50 border-terracotta-300" };
      case "low":
        return { label: "Low Priority", icon: "❄️", color: "text-stone-600 bg-stone-100 border-stone-300" };
      default:
        return { label: "Medium Priority", icon: "⚡", color: "text-amber-800 bg-amber-50 border-amber-300" };
    }
  };

  const isOverdue = Boolean(
    lead.followUpDate &&
      lead.followUpDate < Date.now() &&
      !["converted", "not_interested", "invalid"].includes(lead.status || "")
  );

  const statusInfo = getStatusLabel(lead.status);
  const priorityInfo = getPriorityLabel(lead.priority);

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    lead.address || lead.name
  )}`;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto bg-[#FCFBF8] border-l border-stone-200/90 p-6 sm:p-10 text-stone-800 shadow-2xl"
      >
        {/* Physical Paper Header Style */}
        <div className="relative pb-6 border-b border-stone-200">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge
              variant={getSourceBadgeVariant(lead.source)}
              className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
            >
              {lead.source}
            </Badge>
            {!lead.website && (
              <Badge
                variant="terracotta"
                className="text-xs px-2.5 py-0.5 rounded-full font-semibold gap-1 bg-terracotta-100 text-terracotta-800 border-terracotta-300 shadow-2xs"
              >
                <Target className="h-3.5 w-3.5 text-terracotta-600" />
                Potential Client • No Website
              </Badge>
            )}
            <span className="text-xs text-stone-400 bg-oatmeal-200/70 px-2 py-0.5 rounded-md">
              ID: {lead.leadId}
            </span>
            <span className="text-xs text-stone-400 ml-auto flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(lead.createdAt)}
            </span>
          </div>

          <SheetTitle className="text-2xl sm:text-3xl font-bold text-botanical-900 tracking-tight leading-tight">
            {lead.name}
          </SheetTitle>

          <p className="mt-1.5 text-xs text-stone-500 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-sage-600" />
            <span>Captured from:</span>
            <span className="font-medium text-botanical-800 italic">
              &ldquo;{lead.searchQuery}&rdquo;
            </span>
          </p>
        </div>

        {/* Paper Body Content */}
        <div className="mt-8 space-y-8">
          {/* SECTION: PIPELINE STATUS OVERVIEW (READ-ONLY) */}
          <div className="rounded-2xl border border-stone-200 bg-paper p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-botanical-100 text-botanical-800">
                <Target className="h-4 w-4 text-botanical-700" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-botanical-900">
                  Pipeline & Qualification Status
                </h4>
                <p className="text-[11px] text-stone-400">
                  Current sales stage and outreach parameters
                </p>
              </div>
            </div>

            {/* 2x2 Grid for Stage, Priority, Deal Value & Calls Placed */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Outreach Stage */}
              <div className="p-3 rounded-xl bg-oatmeal-100/50 border border-stone-200/70 space-y-1.5">
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                  Stage
                </span>
                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap shadow-2xs ${statusInfo.color}`}
                  >
                    <span>{statusInfo.icon}</span>
                    <span>{statusInfo.label}</span>
                  </span>
                </div>
              </div>

              {/* Priority */}
              <div className="p-3 rounded-xl bg-oatmeal-100/50 border border-stone-200/70 space-y-1.5">
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                  Priority
                </span>
                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap shadow-2xs ${priorityInfo.color}`}
                  >
                    <span>{priorityInfo.icon}</span>
                    <span>{priorityInfo.label}</span>
                  </span>
                </div>
              </div>

              {/* Deal Value */}
              <div className="p-3 rounded-xl bg-oatmeal-100/50 border border-stone-200/70 space-y-1">
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                  Deal Value
                </span>
                <p className="text-base font-bold text-botanical-900 tracking-tight">
                  {lead.dealValue ? `$${Number(lead.dealValue).toLocaleString()}` : "$0.00"}
                </p>
              </div>

              {/* Calls Attempted */}
              <div className="p-3 rounded-xl bg-oatmeal-100/50 border border-stone-200/70 space-y-1">
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                  Calls Placed
                </span>
                <p className="text-base font-bold text-stone-800 flex items-center gap-1.5 tracking-tight">
                  <PhoneCall className="h-3.5 w-3.5 text-botanical-600" />
                  <span>{lead.callCount || 0}</span>
                </p>
              </div>
            </div>

            {/* Follow-up & Ownership Row */}
            <div className="pt-3 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Follow-up */}
              <div className="p-2.5 rounded-xl bg-oatmeal-100/30 border border-stone-200/60 space-y-1">
                <span className="text-[11px] font-semibold text-stone-400 flex items-center gap-1 uppercase tracking-wider">
                  <Calendar className="h-3 w-3" /> Scheduled Follow-Up
                </span>
                <div className="flex items-center gap-2">
                  {lead.followUpDate ? (
                    <>
                      <span className="font-semibold text-stone-800">
                        {formatDate(lead.followUpDate)}
                      </span>
                      {isOverdue && (
                        <span className="text-[10px] font-bold text-terracotta-700 bg-terracotta-100 px-1.5 py-0.5 rounded border border-terracotta-200">
                          Overdue
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-stone-400 italic">No follow-up scheduled</span>
                  )}
                </div>
              </div>

              {/* Dealt By */}
              <div className="p-2.5 rounded-xl bg-oatmeal-100/30 border border-stone-200/60 space-y-1">
                <span className="text-[11px] font-semibold text-stone-400 flex items-center gap-1 uppercase tracking-wider">
                  <UserCheck className="h-3 w-3" /> Assigned Team Member
                </span>
                <p className="font-semibold text-botanical-900 truncate">
                  {lead.assignedTo?.name || "Unassigned"}
                  {lead.assignedTo?.email && (
                    <span className="font-normal text-stone-500 text-[11px] ml-1">
                      ({lead.assignedTo.email})
                    </span>
                  )}
                </p>
              </div>
            </div>

            {lead.lastContactedAt && (
              <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-500 flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-stone-400" />
                <span>Last touchpoint recorded:</span>
                <span className="font-medium text-stone-700">
                  {formatDate(lead.lastContactedAt)}
                </span>
                {lead.lastContactedBy?.name && (
                  <span className="italic">by {lead.lastContactedBy.name}</span>
                )}
              </div>
            )}
          </div>

          {/* Potential Client Opportunity Callout (when no website) */}
          {!lead.website && (
            <div className="rounded-2xl border border-terracotta-300/80 bg-terracotta-50/70 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-terracotta-100 text-terracotta-700 border border-terracotta-200">
                  <Target className="h-4.5 w-4.5 text-terracotta-600" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-terracotta-900">
                      High-Conversion Potential Client
                    </h5>
                    <span className="text-[10px] bg-terracotta-200 text-terracotta-800 font-semibold px-2 py-0.5 rounded-full">
                      No Website Detected
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-terracotta-800 leading-relaxed">
                    This business has no registered website. They are ideal
                    candidates for web design, online presence building, or
                    social media marketing pitches.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section: Direct Contact Essentials */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-botanical-800 mb-3 flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-botanical-600" />
              Contact Coordinates
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Phone */}
              <div className="rounded-xl border border-stone-200 bg-paper p-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sage-100 text-botanical-800">
                    <Phone className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-stone-500">
                      Phone Number
                    </p>
                    <p className="text-xs font-medium text-stone-800 truncate">
                      {lead.phone || "Not extracted"}
                    </p>
                  </div>
                </div>
                {lead.phone && (
                  <button
                    onClick={() => copyToClipboard(lead.phone, "phone")}
                    className="text-stone-400 hover:text-botanical-700 cursor-pointer p-1"
                    title="Copy phone"
                  >
                    {copiedField === "phone" ? (
                      <Check className="h-3.5 w-3.5 text-sage-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>

              {/* Email */}
              <div className="rounded-xl border border-stone-200 bg-paper p-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sage-100 text-botanical-800">
                    <Mail className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-stone-500">
                      Email Address
                    </p>
                    <p className="text-xs font-medium text-stone-800 truncate">
                      {lead.email || "Not extracted"}
                    </p>
                  </div>
                </div>
                {lead.email && (
                  <button
                    onClick={() => copyToClipboard(lead.email, "email")}
                    className="text-stone-400 hover:text-botanical-700 cursor-pointer p-1"
                    title="Copy email"
                  >
                    {copiedField === "email" ? (
                      <Check className="h-3.5 w-3.5 text-sage-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section: Digital Presence & Location */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-botanical-800 mb-3 flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-botanical-600" />
              Digital Presence & Location
            </h4>

            <div className="space-y-3">
              {/* Website */}
              <div className="rounded-xl border border-stone-200 bg-paper p-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-oatmeal-200 text-stone-700">
                    <Globe className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-stone-500">
                      Official Website
                    </p>
                    <p className="text-xs font-medium text-stone-800 truncate">
                      {lead.website || "No website found"}
                    </p>
                  </div>
                </div>
                {lead.website && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(lead.website, "website")}
                      className="text-stone-400 hover:text-botanical-700 cursor-pointer p-1"
                      title="Copy URL"
                    >
                      {copiedField === "website" ? (
                        <Check className="h-3.5 w-3.5 text-sage-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <a
                      href={
                        lead.website.startsWith("http")
                          ? lead.website
                          : `https://${lead.website}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="text-stone-400 hover:text-botanical-700 cursor-pointer p-1"
                      title="Open website"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
              </div>

              {/* Physical Address */}
              <div className="rounded-xl border border-stone-200 bg-paper p-3 flex items-start justify-between shadow-sm">
                <div className="flex items-start gap-2 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-oatmeal-200 text-stone-700 mt-0.5">
                    <MapPin className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-stone-500">
                      Physical Location
                    </p>
                    <p className="text-xs font-medium text-stone-800 leading-snug">
                      {lead.address || "No address extracted"}
                    </p>
                  </div>
                </div>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-botanical-700 hover:underline flex items-center gap-1 shrink-0 ml-3"
                >
                  <span>Maps</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Section: Social Profiles */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-botanical-800 mb-3 flex items-center gap-2">
              <ShareIcon className="h-3.5 w-3.5 text-botanical-600" />
              Social Media Channels
            </h4>

            <div className="grid grid-cols-2 gap-3">
              {/* WhatsApp */}
              <div className="rounded-xl border border-stone-200 bg-paper p-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <WhatsAppIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-stone-500">
                      WhatsApp
                    </p>
                    <p className="text-xs font-medium text-stone-800 truncate">
                      {lead.whatsapp || "None"}
                    </p>
                  </div>
                </div>
                {lead.whatsapp && (
                  <a
                    href={`https://wa.me/${lead.whatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-stone-400 hover:text-emerald-700 cursor-pointer p-1"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>

              {/* Instagram */}
              <div className="rounded-xl border border-stone-200 bg-paper p-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-terracotta-50 text-terracotta-700">
                    <InstagramIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-stone-500">
                      Instagram
                    </p>
                    <p className="text-xs font-medium text-stone-800 truncate">
                      {lead.instagram ? "Profile" : "None"}
                    </p>
                  </div>
                </div>
                {lead.instagram && (
                  <a
                    href={lead.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="text-stone-400 hover:text-terracotta-700 cursor-pointer p-1"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>

              {/* LinkedIn */}
              <div className="rounded-xl border border-stone-200 bg-paper p-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-botanical-100 text-botanical-800">
                    <LinkedinIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-stone-500">
                      LinkedIn
                    </p>
                    <p className="text-xs font-medium text-stone-800 truncate">
                      {lead.linkedin ? "Connected" : "None"}
                    </p>
                  </div>
                </div>
                {lead.linkedin && (
                  <a
                    href={lead.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="text-stone-400 hover:text-botanical-700 cursor-pointer p-1"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>

              {/* Facebook */}
              <div className="rounded-xl border border-stone-200 bg-paper p-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-700">
                    <FacebookIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-stone-500">
                      Facebook
                    </p>
                    <p className="text-xs font-medium text-stone-800 truncate">
                      {lead.facebook ? "Profile" : "None"}
                    </p>
                  </div>
                </div>
                {lead.facebook && (
                  <a
                    href={lead.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="text-stone-400 hover:text-stone-700 cursor-pointer p-1"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Section: Conversation History Timeline */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-botanical-800 mb-3 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-botanical-600" />
              Activity & Conversation History ({lead.notes?.length || 0})
            </h4>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {lead.notes && lead.notes.length > 0 ? (
                [...lead.notes].reverse().map((note) => (
                  <div
                    key={note.noteId}
                    className="rounded-xl border border-stone-200/80 bg-paper p-3 text-xs space-y-1 shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-stone-400">
                      <span className="font-semibold text-botanical-800">
                        {note.createdBy?.name || "Team Member"}
                      </span>
                      <span>{formatDate(note.createdAt)}</span>
                    </div>
                    <p className="text-stone-700 whitespace-pre-wrap leading-relaxed">
                      {note.content}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-stone-400 italic py-1">
                  No conversation logs recorded yet.
                </p>
              )}
            </div>
          </div>

          {/* Metadata Footer */}
          <div className="pt-4 border-t border-stone-200 flex flex-col gap-1 text-[11px] text-stone-400">
            <div className="flex justify-between">
              <span>Group Association:</span>
              <span className="text-stone-600">{lead.groupId}</span>
            </div>
            <div className="flex justify-between">
              <span>Last Modified:</span>
              <span>{formatDate(lead.updatedAt)}</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ShareIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}
