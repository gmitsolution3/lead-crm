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
import { isStatusTransitionAllowed } from "@/lib/lead-pipeline";
import { useSession } from "@/lib/auth-client";
import { usePatch } from "@/hooks";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "cn";
import {
  Target,
  Calendar as CalendarIcon,
  DollarSign,
  UserCheck,
  PhoneCall,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Clock,
  Layers,
  X,
  CircleDot,
  Flame,
  UserX,
  Trophy,
  Ban,
  ArrowUp,
  ArrowDown,
  Equal,
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("10:00");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
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
      if (lead.followUpDate) {
        const d = new Date(lead.followUpDate);
        setSelectedDate(d);
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        setSelectedTime(`${hh}:${mm}`);
      } else {
        setSelectedDate(undefined);
        setSelectedTime("10:00");
      }
      setIsCalendarOpen(false);
      setSubmitError(null);
    }
  }, [lead, isOpen]);

  if (!lead) return null;

  const handleTimeChange = (newTime: string) => {
    setSelectedTime(newTime);
    if (selectedDate) {
      const [h, m] = newTime.split(":").map(Number);
      const updated = new Date(selectedDate);
      updated.setHours(isNaN(h) ? 10 : h, isNaN(m) ? 0 : m, 0, 0);
      setSelectedDate(updated);
    }
  };

  const handlePresetDate = (daysFromNow: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysFromNow);
    const [h, m] = selectedTime.split(":").map(Number);
    targetDate.setHours(isNaN(h) ? 10 : h, isNaN(m) ? 0 : m, 0, 0);
    setSelectedDate(targetDate);
    setIsCalendarOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!isStatusTransitionAllowed(lead.status, status)) {
      setSubmitError(
        `Cannot update status from "${(lead.status || "uncontacted").replace("_", " ")}" to "${status.replace("_", " ")}".`
      );
      return;
    }

    let parsedFollowUp: number | null = null;
    if (selectedDate && !isNaN(selectedDate.getTime())) {
      parsedFollowUp = selectedDate.getTime();
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
                    <SelectItem
                      value="uncontacted"
                      disabled={!isStatusTransitionAllowed(lead.status, "uncontacted")}
                    >
                      <div className="flex items-center gap-2">
                        <CircleDot className="h-3.5 w-3.5 text-stone-500 shrink-0" />
                        <span>Uncontacted (New)</span>
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="called"
                      disabled={!isStatusTransitionAllowed(lead.status, "called")}
                    >
                      <div className="flex items-center gap-2">
                        <PhoneCall className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span>Called (Attempted)</span>
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="call_later"
                      disabled={!isStatusTransitionAllowed(lead.status, "call_later")}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <span>Call Later (Follow-Up)</span>
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="interested"
                      disabled={!isStatusTransitionAllowed(lead.status, "interested")}
                    >
                      <div className="flex items-center gap-2">
                        <Flame className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                        <span>Interested (Hot)</span>
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="not_interested"
                      disabled={!isStatusTransitionAllowed(lead.status, "not_interested")}
                    >
                      <div className="flex items-center gap-2">
                        <UserX className="h-3.5 w-3.5 text-stone-500 shrink-0" />
                        <span>Not Interested</span>
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="converted"
                      disabled={!isStatusTransitionAllowed(lead.status, "converted")}
                    >
                      <div className="flex items-center gap-2">
                        <Trophy className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                        <span>Converted (Deal Won)</span>
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="invalid"
                      disabled={!isStatusTransitionAllowed(lead.status, "invalid")}
                    >
                      <div className="flex items-center gap-2">
                        <Ban className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                        <span>Invalid / Dead</span>
                      </div>
                    </SelectItem>
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
                    <SelectItem value="high">
                      <div className="flex items-center gap-2 text-rose-700">
                        <ArrowUp className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                        <span>High Priority</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2 text-amber-800">
                        <Equal className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span>Medium Priority</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2 text-stone-700">
                        <ArrowDown className="h-3.5 w-3.5 text-stone-500 shrink-0" />
                        <span>Low Priority</span>
                      </div>
                    </SelectItem>
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
                    <CalendarIcon className="h-3.5 w-3.5 text-botanical-700" /> Follow-Up Date
                  </Label>
                  {selectedDate && (
                    <button
                      type="button"
                      onClick={() => setSelectedDate(undefined)}
                      className="text-[10px] text-stone-400 hover:text-stone-700 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger
                      render={
                        <button
                          type="button"
                          className={cn(
                            "w-full h-10 px-3 rounded-xl border border-stone-300 bg-paper text-xs text-stone-800 flex items-center justify-between transition-colors shadow-2xs hover:border-botanical-500/80 focus:outline-none focus:ring-1 focus:ring-botanical-500 cursor-pointer text-left",
                            !selectedDate && "text-stone-400"
                          )}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <CalendarIcon className="h-3.5 w-3.5 text-botanical-600 shrink-0" />
                            <span className="truncate font-medium">
                              {selectedDate
                                ? format(selectedDate, "MMM d, yyyy 'at' h:mm a")
                                : "Select follow-up date & time..."}
                            </span>
                          </div>
                        </button>
                      }
                    />
                    <PopoverContent
                      align="start"
                      sideOffset={4}
                      className="p-3 w-auto bg-[#FCFBF8] border border-stone-200/90 rounded-2xl shadow-xl max-w-xs"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-stone-100 pb-2 px-1">
                          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                            Date & Time
                          </span>
                          {selectedDate && (
                            <span className="text-xs font-bold text-botanical-900">
                              {format(selectedDate, "MMM d, h:mm a")}
                            </span>
                          )}
                        </div>

                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            if (date) {
                              const [h, m] = selectedTime.split(":").map(Number);
                              const combined = new Date(date);
                              combined.setHours(isNaN(h) ? 10 : h, isNaN(m) ? 0 : m, 0, 0);
                              setSelectedDate(combined);
                            } else {
                              setSelectedDate(undefined);
                            }
                          }}
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return date < today;
                          }}
                          autoFocus
                        />

                        {/* Time of Follow-Up Section */}
                        <div className="pt-2.5 border-t border-stone-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs text-stone-700 font-semibold">
                              <Clock className="h-3.5 w-3.5 text-botanical-700" />
                              <span>Outreach Time</span>
                            </div>
                            <input
                              type="time"
                              value={selectedTime}
                              onChange={(e) => handleTimeChange(e.target.value)}
                              className="h-8 px-2.5 rounded-lg border border-stone-300 bg-paper text-xs font-semibold text-stone-800 focus:outline-none focus:ring-1 focus:ring-botanical-500"
                            />
                          </div>

                          {/* Quick Time Slots */}
                          <div className="flex items-center justify-between gap-1 pt-0.5">
                            {["09:30", "11:00", "14:30", "16:00"].map((slot) => {
                              const [h, m] = slot.split(":").map(Number);
                              const label = `${h > 12 ? h - 12 : h}:${m === 0 ? "00" : m} ${h >= 12 ? "PM" : "AM"}`;
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => handleTimeChange(slot)}
                                  className={cn(
                                    "text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer font-medium",
                                    selectedTime === slot
                                      ? "bg-botanical-800 text-white border-botanical-900 font-bold shadow-2xs"
                                      : "bg-oatmeal-100 border-stone-200/80 text-stone-600 hover:bg-oatmeal-200"
                                  )}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            onClick={() => setIsCalendarOpen(false)}
                            className="w-full mt-1 h-8 text-xs bg-botanical-800 hover:bg-botanical-900 text-white font-semibold rounded-xl cursor-pointer"
                          >
                            Done
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {selectedDate && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => setSelectedDate(undefined)}
                      className="h-10 w-10 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl cursor-pointer shrink-0"
                      title="Clear date"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handlePresetDate(1)}
                    className="text-[10px] px-2.5 py-0.5 rounded-lg bg-oatmeal-100/90 hover:bg-oatmeal-200 text-stone-600 hover:text-botanical-900 font-semibold border border-stone-200/60 transition-colors cursor-pointer"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetDate(3)}
                    className="text-[10px] px-2.5 py-0.5 rounded-lg bg-oatmeal-100/90 hover:bg-oatmeal-200 text-stone-600 hover:text-botanical-900 font-semibold border border-stone-200/60 transition-colors cursor-pointer"
                  >
                    In 3 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetDate(7)}
                    className="text-[10px] px-2.5 py-0.5 rounded-lg bg-oatmeal-100/90 hover:bg-oatmeal-200 text-stone-600 hover:text-botanical-900 font-semibold border border-stone-200/60 transition-colors cursor-pointer"
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
