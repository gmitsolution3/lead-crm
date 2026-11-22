"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
import { useSession } from "@/lib/auth-client";
import { usePatch } from "@/hooks";
import {
  Target,
  Calendar,
  DollarSign,
  UserCheck,
  PhoneCall,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Clock,
  Layers,
} from "lucide-react";

interface LeadPipelineModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated?: (updatedLead: Lead) => void;
}

export function LeadPipelineModal({
  lead,
  isOpen,
  onClose,
  onLeadUpdated,
}: LeadPipelineModalProps) {
  const { data: session } = useSession();

  const { mutateAsync: updateLeadMutation, isPending: isSaving } = usePatch(
    "/leads",
    {
      invalidateQueries: [["/leads"], ["/search-groups"]],
    }
  );

  const [status, setStatus] = useState<LeadStatus>("uncontacted");
  const [priority, setPriority] = useState<LeadPriority>("medium");
  const [followUpDateInput, setFollowUpDateInput] = useState<string>("");
  const [dealValueInput, setDealValueInput] = useState<string>("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Sync state whenever lead changes or modal opens
  useEffect(() => {
    if (lead && isOpen) {
      setStatus(lead.status || "uncontacted");
      setPriority(lead.priority || "medium");
      setDealValueInput(
        lead.dealValue !== undefined && lead.dealValue !== null
          ? String(lead.dealValue)
          : ""
      );
      setFollowUpDateInput(
        lead.followUpDate
          ? new Date(lead.followUpDate).toISOString().split("T")[0]
          : ""
      );
      setSubmitError(null);
    }
  }, [lead, isOpen]);

  if (!lead) return null;

  const handlePresetDate = (daysFromNow: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysFromNow);
    targetDate.setHours(10, 0, 0, 0);
    setFollowUpDateInput(targetDate.toISOString().split("T")[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    let parsedFollowUp: number | null = null;
    if (followUpDateInput) {
      const parsed = new Date(followUpDateInput);
      if (!isNaN(parsed.getTime())) {
        parsedFollowUp = parsed.getTime();
      }
    }

    const numericDeal = parseFloat(dealValueInput);
    const finalDealValue = isNaN(numericDeal) ? 0 : numericDeal;

    const payload: any = {
      status,
      priority,
      dealValue: finalDealValue,
      followUpDate: parsedFollowUp,
      groupId: lead.groupId,
      updatedBy: session?.user
        ? {
            userId: session.user.id,
            name: session.user.name,
            email: session.user.email,
          }
        : undefined,
    };

    try {
      const res = await updateLeadMutation({
        id: lead.leadId,
        data: payload,
      });

      const updatedLead = res?.data || res || { ...lead, ...payload };
      onLeadUpdated?.(updatedLead);
      onClose();
    } catch (err: any) {
      console.error("Failed to update lead pipeline:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to update lead pipeline. Please try again.";
      setSubmitError(msg);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto bg-[#FCFBF8] border-l border-stone-200/90 p-6 sm:p-8 text-stone-800 shadow-2xl"
      >
        <SheetHeader className="pb-4 border-b border-stone-200 text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-botanical-100 text-botanical-800">
              <Target className="h-4 w-4 text-botanical-700" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-botanical-700">
              Pipeline Management
            </span>
          </div>
          <SheetTitle className="text-2xl font-bold text-botanical-900 tracking-tight">
            Update Lead Status & Pipeline
          </SheetTitle>
          <SheetDescription className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
            <Layers className="h-3.5 w-3.5 text-stone-400" />
            <span className="font-semibold text-stone-700">{lead.name}</span>
            <span>•</span>
            <span className="italic truncate">&ldquo;{lead.searchQuery}&rdquo;</span>
          </SheetDescription>
        </SheetHeader>

        {submitError && (
          <div className="mt-4 p-3 rounded-xl bg-terracotta-50 border border-terracotta-200 text-xs text-terracotta-800 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-terracotta-600 mt-0.5" />
            <span className="leading-tight">{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* SECTION 1: STAGE & PRIORITY */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Outreach Status */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">
                  Outreach Status <span className="text-terracotta-600">*</span>
                </Label>
                <Select
                  value={status}
                  onValueChange={(val) => {
                    if (val) setStatus(val as LeadStatus);
                  }}
                >
                  <SelectTrigger className="w-full h-10 text-xs bg-paper border-stone-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uncontacted">🔵 Uncontacted (New)</SelectItem>
                    <SelectItem value="called">📞 Called (Attempted)</SelectItem>
                    <SelectItem value="call_later">⏰ Call Later (Follow-Up)</SelectItem>
                    <SelectItem value="interested">🔥 Interested (Hot)</SelectItem>
                    <SelectItem value="not_interested">🚫 Not Interested</SelectItem>
                    <SelectItem value="converted">🎉 Converted (Deal Won)</SelectItem>
                    <SelectItem value="invalid">❌ Invalid / Dead</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">
                  Priority Urgency
                </Label>
                <Select
                  value={priority}
                  onValueChange={(val) => {
                    if (val) setPriority(val as LeadPriority);
                  }}
                >
                  <SelectTrigger className="w-full h-10 text-xs bg-paper border-stone-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">🔥 High Priority (Urgent)</SelectItem>
                    <SelectItem value="medium">⚡ Medium Priority</SelectItem>
                    <SelectItem value="low">❄️ Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* SECTION 2: FOLLOW-UP & DEAL VALUE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Follow-up Date */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-stone-400" /> Follow-Up Date
                  </Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={followUpDateInput}
                    onChange={(e) => setFollowUpDateInput(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-stone-300 bg-paper text-xs text-stone-800"
                  />
                  {followUpDateInput && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => setFollowUpDateInput("")}
                      className="h-8 w-8 text-stone-400 hover:text-stone-700 rounded-xl cursor-pointer"
                      title="Clear date"
                    >
                      ×
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-1 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handlePresetDate(1)}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium cursor-pointer"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetDate(3)}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium cursor-pointer"
                  >
                    In 3 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetDate(7)}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium cursor-pointer"
                  >
                    Next Week
                  </button>
                </div>
              </div>

              {/* Deal Value */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-stone-400" /> Estimated Deal Value ($)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-stone-400 font-bold">
                    $
                  </span>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    value={dealValueInput}
                    onChange={(e) => setDealValueInput(e.target.value)}
                    placeholder="0.00"
                    className="pl-7 h-10 text-xs bg-paper border-stone-300"
                  />
                </div>
                <p className="text-[10px] text-stone-400">
                  Estimated budget or confirmed closed deal quote
                </p>
              </div>
            </div>

            {/* SECTION 3: DEALT BY & CALL SUMMARY */}
            <div className="rounded-xl border border-stone-200/90 bg-oatmeal-100/50 p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-botanical-700" />
                  <span className="font-semibold text-stone-700">Dealt By:</span>
                  <span className="font-bold text-botanical-900">
                    {lead.assignedTo?.name || (session?.user?.name ? `${session.user.name} (Will be assigned)` : "Unassigned")}
                  </span>
                </div>
                <span className="text-[11px] text-stone-400 italic">
                  Automatically assigned on save
                </span>
              </div>

              {/* Call count display */}
              <div className="pt-2 border-t border-stone-200/70 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-stone-600">
                  <PhoneCall className="h-3.5 w-3.5 text-botanical-600" />
                  <span>Call Attempts Made:</span>
                  <span className="font-bold text-botanical-900 bg-white border border-stone-200 px-2 py-0.5 rounded-md">
                    {lead.callCount || 0}
                  </span>
                </div>
                <span className="text-[11px] text-stone-400 italic">
                  Increments automatically per note
                </span>
              </div>
            </div>
          </div>

          {/* ACTIONS FOOTER */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="border-stone-300 text-stone-700 hover:text-stone-900 hover:bg-stone-100 text-xs h-10 px-4 rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-botanical-800 hover:bg-botanical-900 text-white text-xs h-10 px-5 rounded-xl shadow-md gap-2 font-semibold cursor-pointer transition-all"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-sage-200" />
                  <span>Saving Updates...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-sage-200" />
                  <span>Save Pipeline Changes</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
