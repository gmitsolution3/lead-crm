"use client";

import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  onSaveRemark?: (leadId: string, newRemark: string) => void;
}

export function LeadDetailSheet({
  lead,
  isOpen,
  onClose,
  onSaveRemark,
}: LeadDetailSheetProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [remarkText, setRemarkText] = useState(lead?.remark || "");
  const [isEditingRemark, setIsEditingRemark] = useState(false);

  // Sync remark when lead changes
  React.useEffect(() => {
    if (lead) {
      setRemarkText(lead.remark || "");
      setIsEditingRemark(false);
    }
  }, [lead]);

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
              "{lead.searchQuery}"
            </span>
          </p>
        </div>

        {/* Paper Body Content */}
        <div className="mt-8 space-y-8">
          {/* Section: Direct Contact Channels */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-botanical-800 mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-botanical-600" />
              Direct Contact Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Phone Card */}
              <div className="rounded-xl border border-stone-200 bg-paper p-3.5 shadow-sm transition-all hover:border-stone-300">
                <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
                  <span className="flex items-center gap-1.5 text-stone-500 font-medium">
                    <Phone className="h-3.5 w-3.5 text-botanical-700" />
                    Phone
                  </span>
                  {lead.phone && (
                    <button
                      onClick={() => copyToClipboard(lead.phone, "phone")}
                      className="text-stone-400 hover:text-botanical-700 transition-colors cursor-pointer"
                      title="Copy phone"
                    >
                      {copiedField === "phone" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
                <p className="font-medium text-sm text-stone-800">
                  {lead.phone ? (
                    <a
                      href={`tel:${lead.phone}`}
                      className="hover:underline hover:text-botanical-800"
                    >
                      {lead.phone}
                    </a>
                  ) : (
                    <span className="text-stone-400 italic">Not available</span>
                  )}
                </p>
              </div>

              {/* Email Card */}
              <div className="rounded-xl border border-stone-200 bg-paper p-3.5 shadow-sm transition-all hover:border-stone-300">
                <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
                  <span className="flex items-center gap-1.5 text-stone-500 font-medium">
                    <Mail className="h-3.5 w-3.5 text-botanical-700" />
                    Email Address
                  </span>
                  {lead.email && (
                    <button
                      onClick={() => copyToClipboard(lead.email, "email")}
                      className="text-stone-400 hover:text-botanical-700 transition-colors cursor-pointer"
                      title="Copy email"
                    >
                      {copiedField === "email" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
                <p className="font-medium text-sm text-stone-800 truncate">
                  {lead.email ? (
                    <a
                      href={`mailto:${lead.email}`}
                      className="hover:underline hover:text-botanical-800"
                    >
                      {lead.email}
                    </a>
                  ) : (
                    <span className="text-stone-400 italic">Not available</span>
                  )}
                </p>
              </div>
            </div>

            {/* Website Link */}
            {lead.website && (
              <div className="mt-3 rounded-xl border border-stone-200 bg-paper p-3.5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <Globe className="h-4 w-4 text-botanical-700 shrink-0" />
                  <span className="text-xs text-stone-500 font-medium shrink-0">
                    Website:
                  </span>
                  <a
                    href={lead.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-botanical-800 hover:underline truncate"
                  >
                    {lead.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
                <a
                  href={lead.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-stone-400 hover:text-botanical-700 p-1 cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}
          </div>

          {/* Section: Physical Address */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-botanical-800 mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-botanical-600" />
              Physical Location & Map
            </h4>
            <div className="rounded-2xl border border-stone-200 bg-paper p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sage-100 text-botanical-800">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-800 leading-relaxed">
                    {lead.address || "No street address recorded"}
                  </p>
                  {lead.address && (
                    <div className="mt-2.5 flex items-center gap-3">
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-botanical-700 hover:text-botanical-900 hover:underline cursor-pointer"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open in Google Maps
                      </a>
                      <button
                        onClick={() => copyToClipboard(lead.address, "address")}
                        className="text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
                      >
                        {copiedField === "address" ? "Copied!" : "Copy address"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Social Profiles */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-botanical-800 mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-botanical-600" />
              Social Media Channels
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {/* WhatsApp */}
              <div className="rounded-xl border border-stone-200 bg-paper p-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                    <WhatsAppIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-stone-500">WhatsApp</p>
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
                    className="text-stone-400 hover:text-emerald-700 cursor-pointer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>

              {/* Instagram */}
              <div className="rounded-xl border border-stone-200 bg-paper p-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-terracotta-100 text-terracotta-800">
                    <InstagramIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-stone-500">Instagram</p>
                    <p className="text-xs font-medium text-stone-800 truncate">
                      {lead.instagram ? "@" + lead.instagram.split("/").filter(Boolean).pop() : "None"}
                    </p>
                  </div>
                </div>
                {lead.instagram && (
                  <a
                    href={lead.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="text-stone-400 hover:text-terracotta-700 cursor-pointer"
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
                    <p className="text-[11px] font-semibold text-stone-500">LinkedIn</p>
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
                    className="text-stone-400 hover:text-botanical-700 cursor-pointer"
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
                    <p className="text-[11px] font-semibold text-stone-500">Facebook</p>
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
                    className="text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Section: Premium Paper Sticky Remark */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-botanical-800 flex items-center gap-2">
                <Bookmark className="h-3.5 w-3.5 text-terracotta-500" />
                Notes & Field Remarks
              </h4>
              <button
                onClick={() => {
                  if (isEditingRemark) {
                    onSaveRemark?.(lead.leadId, remarkText);
                    setIsEditingRemark(false);
                  } else {
                    setIsEditingRemark(true);
                  }
                }}
                className="text-xs font-semibold text-botanical-700 hover:text-botanical-900 cursor-pointer"
              >
                {isEditingRemark ? "Save Note" : "Edit"}
              </button>
            </div>

            <div className="rounded-2xl border border-terracotta-200/80 bg-oatmeal-100/70 p-4 shadow-sm relative">
              <div className="absolute top-3 right-3 text-terracotta-400">
                <FileText className="h-4 w-4 opacity-50" />
              </div>
              {isEditingRemark ? (
                <Textarea
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  rows={3}
                  className="w-full bg-paper border-stone-300 text-xs text-stone-800"
                />
              ) : (
                <p className="text-xs leading-relaxed text-stone-700 italic">
                  "{remarkText || "No notes recorded yet for this prospect."}"
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
