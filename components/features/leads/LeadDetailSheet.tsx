"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lead, LeadStatus, LeadPriority } from "@/types";
import { formatDate } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";
import { apiClient } from "@/lib/axios";
import { useQueryClient } from "@tanstack/react-query";
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
  Flame,
  CheckCircle2,
  AlertCircle,
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
  onLeadUpdated?: (updatedLead: Lead) => void;
}

export function LeadDetailSheet({
  lead: initialLead,
  isOpen,
  onClose,
  onSaveRemark,
  onLeadUpdated,
}: LeadDetailSheetProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [lead, setLead] = useState<Lead | null>(initialLead);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [remarkText, setRemarkText] = useState(initialLead?.remark || "");
  const [isEditingRemark, setIsEditingRemark] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dealValueInput, setDealValueInput] = useState<string>(
    initialLead?.dealValue ? String(initialLead.dealValue) : "",
  );

  // Sync state whenever initialLead changes
  useEffect(() => {
    if (initialLead) {
      setLead(initialLead);
      setRemarkText(initialLead.remark || "");
      setIsEditingRemark(false);
      setDealValueInput(
        initialLead.dealValue ? String(initialLead.dealValue) : "",
      );
    }
  }, [initialLead]);

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

  // Partial update helper for pipeline management
  const handleUpdate = async (patch: Partial<Lead>) => {
    setIsUpdating(true);
    const updated = { ...lead, ...patch, updatedAt: Date.now() };
    setLead(updated);
    onLeadUpdated?.(updated);

    try {
      await apiClient.patch(`/leads/${lead.leadId}`, {
        ...patch,
        groupId: lead.groupId,
      });
      queryClient.invalidateQueries({ queryKey: ["/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/search-groups"] });
    } catch (err) {
      console.error("Failed to update lead management properties:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  // 1-Click Call Logging
  const handleLogCall = async () => {
    const nextCallCount = (lead.callCount || 0) + 1;
    const patch: Partial<Lead> = {
      callCount: nextCallCount,
      lastContactedAt: Date.now(),
      status: lead.status === "uncontacted" ? "called" : lead.status,
      lastContactedBy: session?.user
        ? {
            userId: session.user.id,
            name: session.user.name,
            email: session.user.email,
          }
        : undefined,
    };
    await handleUpdate(patch);
  };

  // Assign to logged-in user
  const handleAssignToMe = async () => {
    if (!session?.user) return;
    await handleUpdate({
      assignedTo: {
        userId: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    });
  };

  // Follow-up Date input & presets
  const handlePresetDate = async (daysFromNow: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysFromNow);
    targetDate.setHours(10, 0, 0, 0); // 10:00 AM preset
    await handleUpdate({ followUpDate: targetDate.getTime() });
  };

  const handleDateInputChange = async (val: string) => {
    if (!val) {
      await handleUpdate({ followUpDate: null });
    } else {
      const parsed = new Date(val);
      if (!isNaN(parsed.getTime())) {
        await handleUpdate({ followUpDate: parsed.getTime() });
      }
    }
  };

  const followUpDateString = lead.followUpDate
    ? new Date(lead.followUpDate).toISOString().split("T")[0]
    : "";

  const isOverdue = Boolean(
    lead.followUpDate &&
      lead.followUpDate < Date.now() &&
      !["converted", "not_interested", "invalid"].includes(lead.status || ""),
  );

  // Deal Value blur
  const handleDealValueBlur = async () => {
    const numeric = parseFloat(dealValueInput);
    const finalVal = isNaN(numeric) ? 0 : numeric;
    if (finalVal !== (lead.dealValue || 0)) {
      await handleUpdate({ dealValue: finalVal });
    }
  };

  // Add Conversation Note
  const handleAddNote = async () => {
    if (!newNoteText.trim()) return;
    setIsSubmittingNote(true);

    try {
      const res = await apiClient.post(`/leads/${lead.leadId}/notes`, {
        content: newNoteText.trim(),
        createdBy: session?.user
          ? {
              userId: session.user.id,
              name: session.user.name,
              email: session.user.email,
            }
          : undefined,
        groupId: lead.groupId,
      });

      const updatedLead = res.data?.data || res.data;
      if (updatedLead?.notes) {
        setLead(updatedLead);
        onLeadUpdated?.(updatedLead);
      }
      setNewNoteText("");
      queryClient.invalidateQueries({ queryKey: ["/leads"] });
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Delete Conversation Note
  const handleDeleteNote = async (noteId: string) => {
    try {
      const res = await apiClient.delete(
        `/leads/${lead.leadId}/notes/${noteId}?groupId=${lead.groupId}`,
      );
      const updatedLead = res.data?.data || res.data;
      if (updatedLead?.notes) {
        setLead(updatedLead);
        onLeadUpdated?.(updatedLead);
      } else {
        const filteredNotes = (lead.notes || []).filter(
          (n) => n.noteId !== noteId,
        );
        setLead({ ...lead, notes: filteredNotes });
      }
      queryClient.invalidateQueries({ queryKey: ["/leads"] });
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    lead.address || lead.name,
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
          {/* SECTION: PIPELINE, OUTREACH & MANAGEMENT */}
          <div className="rounded-2xl border border-stone-200 bg-paper p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-botanical-100 text-botanical-800">
                  <Target className="h-4 w-4 text-botanical-700" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-botanical-900">
                    Pipeline & Outreach Status
                  </h4>
                  <p className="text-[11px] text-stone-400">
                    Manage stage, follow-ups, and lead ownership
                  </p>
                </div>
              </div>

              {/* Log Call Action */}
              <Button
                size="sm"
                variant="outline"
                onClick={handleLogCall}
                disabled={isUpdating}
                className="text-xs h-8 border-stone-300 text-stone-700 hover:text-botanical-900 hover:bg-sage-50 gap-1.5 rounded-xl cursor-pointer"
                title="Record that a call was placed right now"
              >
                <PhoneCall className="h-3.5 w-3.5 text-botanical-600" />
                <span>Log Call ({lead.callCount || 0})</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Outreach Status Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">
                  Outreach Status
                </Label>
                <Select
                  value={lead.status || "uncontacted"}
                  onValueChange={(val) => {
                    if (val) handleUpdate({ status: val as LeadStatus });
                  }}
                >
                  <SelectTrigger className="w-full h-9.5 text-xs bg-paper border-stone-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uncontacted">
                      🔵 Uncontacted (New)
                    </SelectItem>
                    <SelectItem value="called">
                      📞 Called (Attempted)
                    </SelectItem>
                    <SelectItem value="call_later">
                      ⏰ Call Later (Follow Up)
                    </SelectItem>
                    <SelectItem value="interested">
                      🔥 Interested (Hot)
                    </SelectItem>
                    <SelectItem value="not_interested">
                      🚫 Not Interested
                    </SelectItem>
                    <SelectItem value="converted">
                      🎉 Converted (Deal Won)
                    </SelectItem>
                    <SelectItem value="invalid">
                      ❌ Invalid / Dead
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">
                  Priority Urgency
                </Label>
                <Select
                  value={lead.priority || "medium"}
                  onValueChange={(val) => {
                    if (val) handleUpdate({ priority: val as LeadPriority });
                  }}
                >
                  <SelectTrigger className="w-full h-9.5 text-xs bg-paper border-stone-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">
                      🔥 High Priority (Urgent)
                    </SelectItem>
                    <SelectItem value="medium">
                      ⚡ Medium Priority
                    </SelectItem>
                    <SelectItem value="low">
                      ❄️ Low Priority
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Follow-up Date */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-stone-400" /> Follow-Up Date
                  </Label>
                  {isOverdue && (
                    <span className="text-[10px] font-bold text-terracotta-700 bg-terracotta-100 px-1.5 py-0.5 rounded">
                      Overdue
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={followUpDateString}
                    onChange={(e) => handleDateInputChange(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-stone-300 bg-paper text-xs text-stone-800"
                  />
                  {lead.followUpDate && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleUpdate({ followUpDate: null })}
                      className="h-8 w-8 text-stone-400 hover:text-stone-700 rounded-xl cursor-pointer"
                      title="Clear date"
                    >
                      ×
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-1 pt-0.5">
                  <button
                    onClick={() => handlePresetDate(1)}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium cursor-pointer"
                  >
                    Tomorrow
                  </button>
                  <button
                    onClick={() => handlePresetDate(3)}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium cursor-pointer"
                  >
                    In 3 Days
                  </button>
                  <button
                    onClick={() => handlePresetDate(7)}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium cursor-pointer"
                  >
                    Next Week
                  </button>
                </div>
              </div>

              {/* Deal Value */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">
                  Estimated Deal / Quote ($)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-stone-400 font-bold">
                    $
                  </span>
                  <Input
                    type="number"
                    value={dealValueInput}
                    onChange={(e) => setDealValueInput(e.target.value)}
                    onBlur={handleDealValueBlur}
                    placeholder="0.00"
                    className="pl-7 h-9 text-xs bg-paper border-stone-300"
                  />
                </div>
                <p className="text-[10px] text-stone-400">
                  Quoted deal value or expected contract amount
                </p>
              </div>
            </div>

            {/* Ownership & Last Touchpoint */}
            <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-botanical-700 shrink-0" />
                <span className="text-stone-500">Dealt By:</span>
                <span className="font-semibold text-botanical-900">
                  {lead.assignedTo?.name || "Unassigned"}
                </span>
                {session?.user &&
                  lead.assignedTo?.userId !== session.user.id && (
                    <button
                      onClick={handleAssignToMe}
                      className="text-[11px] font-semibold text-botanical-700 hover:underline ml-1 cursor-pointer"
                    >
                      (Assign to me)
                    </button>
                  )}
              </div>

              {lead.lastContactedAt && (
                <div className="text-[11px] text-stone-400">
                  Last touchpoint: {formatDate(lead.lastContactedAt)}
                  {lead.lastContactedBy?.name
                    ? ` by ${lead.lastContactedBy.name}`
                    : ""}
                </div>
              )}
            </div>
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

          {/* SECTION: CONVERSATION HISTORY & TIMELINE NOTES */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-botanical-800 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-botanical-600" />
              Conversation History & Activity ({lead.notes?.length || 0})
            </h4>

            {/* Note Input */}
            <div className="rounded-xl border border-stone-200 bg-paper p-3 shadow-2xs space-y-2">
              <Textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Log a call summary, client feedback, or agreement notes..."
                rows={2}
                className="w-full text-xs bg-transparent border-stone-200 focus-visible:ring-1"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  disabled={!newNoteText.trim() || isSubmittingNote}
                  onClick={handleAddNote}
                  className="text-xs h-7.5 bg-botanical-800 hover:bg-botanical-900 text-white rounded-lg px-3 cursor-pointer"
                >
                  {isSubmittingNote ? "Posting..." : "Post Note"}
                </Button>
              </div>
            </div>

            {/* Notes List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {lead.notes && lead.notes.length > 0 ? (
                [...lead.notes].reverse().map((note) => (
                  <div
                    key={note.noteId}
                    className="rounded-xl border border-stone-200/80 bg-oatmeal-100/60 p-3 text-xs space-y-1 relative group"
                  >
                    <div className="flex items-center justify-between text-[11px] text-stone-400">
                      <span className="font-semibold text-botanical-800">
                        {note.createdBy?.name || "Team Member"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span>{formatDate(note.createdAt)}</span>
                        <button
                          onClick={() => handleDeleteNote(note.noteId)}
                          className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-terracotta-700 transition-opacity cursor-pointer font-bold"
                          title="Delete note"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <p className="text-stone-700 whitespace-pre-wrap leading-relaxed">
                      {note.content}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-stone-400 italic py-1">
                  No conversation logs yet. Post the first update above!
                </p>
              )}
            </div>
          </div>

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
                    className="text-stone-400 hover:text-botanical-700 cursor-pointer"
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
                    className="text-stone-400 hover:text-botanical-700 cursor-pointer"
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
                      className="text-stone-400 hover:text-botanical-700 cursor-pointer"
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
                      className="text-stone-400 hover:text-botanical-700 cursor-pointer"
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
                    className="text-stone-400 hover:text-emerald-700 cursor-pointer"
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
                    className="text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Section: Premium Sticky Remark */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-botanical-800 flex items-center gap-2">
                <Bookmark className="h-3.5 w-3.5 text-terracotta-500" />
                Quick Remark
              </h4>
              <button
                onClick={() => {
                  if (isEditingRemark) {
                    onSaveRemark?.(lead.leadId, remarkText);
                    handleUpdate({ remark: remarkText });
                    setIsEditingRemark(false);
                  } else {
                    setIsEditingRemark(true);
                  }
                }}
                className="text-xs font-semibold text-botanical-700 hover:text-botanical-900 cursor-pointer"
              >
                {isEditingRemark ? "Save Remark" : "Edit"}
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
                  &ldquo;{remarkText || "No notes recorded yet for this prospect."}&rdquo;
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
