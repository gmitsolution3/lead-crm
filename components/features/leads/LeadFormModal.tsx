"use client";

import React, { useState, useEffect } from "react";
import { Lead, SearchGroup } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
import { Button } from "@/components/ui/button";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Target,
  MessageCircle,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderKanban,
  Compass,
  DollarSign,
} from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  WhatsAppIcon,
} from "@/components/ui/icons";
import { usePost } from "@/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "@/lib/auth-client";

const leadFormSchema = z.object({
  name: z.string().trim().min(1, { message: "Business / Lead Name is required" }),
  source: z.string().min(1, { message: "Lead Source is required" }),
  status: z.string(),
  priority: z.string(),
  dealValue: z.string().optional(),
  groupId: z.string().optional(),
  searchQuery: z.string().optional(),
  phone: z.string().optional(),
  email: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Please enter a valid email address",
    }),
  website: z.string().optional(),
  address: z.string().optional(),
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
  linkedin: z.string().optional(),
  facebook: z.string().optional(),
  remark: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetGroup?: SearchGroup | { groupId: string; query: string } | null;
  searchGroups?: SearchGroup[];
  onSuccess?: (lead: any) => void;
}

export function LeadFormModal({
  isOpen,
  onClose,
  targetGroup,
  searchGroups = [],
  onSuccess,
}: LeadFormModalProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { mutateAsync: saveLeadMutation, isPending: isSaving } = usePost(
    "/leads/save",
    {
      invalidateQueries: [["/leads"], ["/search-groups"]],
    }
  );

  const defaultGroupId = targetGroup?.groupId || searchGroups[0]?.groupId || "";
  const defaultQuery = targetGroup?.query || searchGroups[0]?.query || "";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting: formIsSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: "",
      source: "Manual",
      status: "uncontacted",
      priority: "medium",
      dealValue: "",
      groupId: defaultGroupId,
      searchQuery: defaultQuery,
      phone: "",
      email: "",
      website: "",
      address: "",
      whatsapp: "",
      instagram: "",
      linkedin: "",
      facebook: "",
      remark: "",
    },
  });

  const currentGroupId = watch("groupId");
  const currentSearchQuery = watch("searchQuery");
  const currentSource = watch("source") || "Manual";
  const currentStatus = watch("status") || "uncontacted";
  const currentPriority = watch("priority") || "medium";
  const currentWebsite = watch("website");

  useEffect(() => {
    if (isOpen) {
      reset({
        name: "",
        source: "Manual",
        status: "uncontacted",
        priority: "medium",
        dealValue: "",
        groupId: targetGroup?.groupId || searchGroups[0]?.groupId || "",
        searchQuery: targetGroup?.query || searchGroups[0]?.query || "",
        phone: "",
        email: "",
        website: "",
        address: "",
        whatsapp: "",
        instagram: "",
        linkedin: "",
        facebook: "",
        remark: "",
      });
      setSubmitError(null);
    }
  }, [isOpen, targetGroup, searchGroups, reset]);

  const sources = [
    "Manual",
    "Google Maps",
    "Facebook",
    "LinkedIn",
    "Instagram",
    "Website",
    "Direct Outreach",
  ];

  const onSubmit = async (values: LeadFormValues) => {
    setSubmitError(null);

    try {
      const selectedGroupId = values.groupId || targetGroup?.groupId || undefined;
      const selectedSearchQuery =
        values.searchQuery || targetGroup?.query || undefined;

      const payload = {
        groupId: selectedGroupId,
        searchQuery: selectedSearchQuery,
        source: values.source || "Manual",
        name: values.name.trim(),
        status: values.status || "uncontacted",
        priority: values.priority || "medium",
        dealValue: values.dealValue && !isNaN(parseFloat(values.dealValue)) ? parseFloat(values.dealValue) : 0,
        assignedTo: session?.user
          ? {
              userId: session.user.id,
              name: session.user.name,
              email: session.user.email,
            }
          : undefined,
        lastContactedBy: session?.user
          ? {
              userId: session.user.id,
              name: session.user.name,
              email: session.user.email,
            }
          : undefined,
        phone: values.phone?.trim() || undefined,
        email: values.email?.trim() || undefined,
        website: values.website?.trim() || undefined,
        address: values.address?.trim() || undefined,
        whatsapp: values.whatsapp?.trim() || undefined,
        instagram: values.instagram?.trim() || undefined,
        linkedin: values.linkedin?.trim() || undefined,
        facebook: values.facebook?.trim() || undefined,
        remark: values.remark?.trim() || undefined,
      };

      const response = await saveLeadMutation(payload);
      const savedResult = response?.data || response;

      // Invalidate specific group query cache if present
      if (selectedGroupId) {
        queryClient.invalidateQueries({
          queryKey: [`/search-groups/${encodeURIComponent(selectedGroupId)}`],
        });
      }

      onSuccess?.(savedResult?.lead || payload);
      onClose();
    } catch (err: any) {
      console.error("Failed to add lead:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to save lead. Please check server connection.";
      setSubmitError(msg);
    }
  };

  const isSubmitting = isSaving || formIsSubmitting;

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
              Lead Registration
            </span>
          </div>
          <SheetTitle className="text-2xl font-bold text-botanical-900 tracking-tight">
            Add Single Lead
          </SheetTitle>
          <SheetDescription className="text-xs text-stone-500">
            Manually log a verified lead under your target search group dataset.
          </SheetDescription>
        </SheetHeader>

        {submitError && (
          <div className="mt-4 p-3 rounded-xl bg-terracotta-50 border border-terracotta-200 text-xs text-terracotta-800 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-terracotta-600 mt-0.5" />
            <span className="leading-tight">{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          {/* SECTION 1: SEARCH GROUP & BUSINESS IDENTITY */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-botanical-800">
              <Building2 className="h-3.5 w-3.5 text-botanical-600" />
              <span>Group & Business Identity</span>
            </div>

            {/* Target Search Group Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                <FolderKanban className="h-3 w-3 text-stone-400" />
                Target Search Group <span className="text-terracotta-600">*</span>
              </Label>
              {targetGroup ? (
                <div className="flex items-center gap-2 h-10 px-3.5 rounded-xl bg-oatmeal-100/90 border border-stone-200 text-xs text-botanical-900 font-semibold">
                  <span className="truncate">&ldquo;{targetGroup.query}&rdquo;</span>
                </div>
              ) : searchGroups.length > 0 ? (
                <Select
                  value={currentGroupId || searchGroups[0]?.groupId}
                  onValueChange={(val) => {
                    const matched = searchGroups.find((g) => g.groupId === val);
                    setValue("groupId", val ?? "", { shouldValidate: true });
                    if (matched?.query) {
                      setValue("searchQuery", matched.query, { shouldValidate: true });
                    }
                  }}
                >
                  <SelectTrigger className="w-full h-10 text-xs bg-paper border-stone-300">
                    <SelectValue placeholder="Select a Search Group">
                      {(val) => {
                        const matched = searchGroups.find((g) => g.groupId === val);
                        return matched ? matched.query : (currentSearchQuery || "Select a Search Group");
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {searchGroups.map((g) => (
                      <SelectItem key={g.groupId} value={g.groupId}>
                        {g.query}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  {...register("searchQuery")}
                  placeholder="e.g. vape shop in mirpur"
                  className="bg-paper border-stone-300 text-xs h-10"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-stone-700">
                Business / Lead Name <span className="text-terracotta-600">*</span>
              </Label>
              <Input
                {...register("name")}
                placeholder="e.g. Vape Hub Mirpur"
                className={`bg-paper border-stone-300 text-sm h-10 ${
                  errors.name ? "border-terracotta-500 focus-visible:ring-terracotta-500" : ""
                }`}
              />
              {errors.name && (
                <p className="text-[11px] text-terracotta-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" /> {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-stone-700">Lead Source</Label>
              <Select
                value={currentSource}
                onValueChange={(val) =>
                  setValue("source", val ?? "Manual", { shouldValidate: true })
                }
              >
                <SelectTrigger className="w-full h-10 text-xs bg-paper border-stone-300">
                  <SelectValue placeholder="Select Source" />
                </SelectTrigger>
                <SelectContent>
                  {sources.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* SECTION 2: PIPELINE & QUALIFICATION */}
          <div className="space-y-3 pt-3 border-t border-stone-200">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-botanical-800">
              <Compass className="h-3.5 w-3.5 text-botanical-600" />
              <span>Pipeline & Initial Qualification</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-stone-700">Initial Status</Label>
                <Select
                  value={currentStatus}
                  onValueChange={(val) =>
                    setValue("status", val ?? "uncontacted", { shouldValidate: true })
                  }
                >
                  <SelectTrigger className="w-full h-9.5 text-xs bg-paper border-stone-300">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uncontacted">Uncontacted</SelectItem>
                    <SelectItem value="called">Called</SelectItem>
                    <SelectItem value="call_later">Call Later</SelectItem>
                    <SelectItem value="interested">Interested</SelectItem>
                    <SelectItem value="not_interested">Not Interested</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="invalid">Invalid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-stone-700">Priority</Label>
                <Select
                  value={currentPriority}
                  onValueChange={(val) =>
                    setValue("priority", val ?? "medium", { shouldValidate: true })
                  }
                >
                  <SelectTrigger className="w-full h-9.5 text-xs bg-paper border-stone-300">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-stone-700 flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-stone-400" /> Deal Value ($)
                </Label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0"
                  {...register("dealValue")}
                  className="bg-paper border-stone-300 text-xs h-9.5"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: DIRECT CONTACT */}
          <div className="space-y-3 pt-3 border-t border-stone-200">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-botanical-800">
              <Phone className="h-3.5 w-3.5 text-botanical-600" />
              <span>Contact Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-stone-400" /> Phone Number
                </Label>
                <Input
                  {...register("phone")}
                  placeholder="e.g. 01711223344"
                  className="bg-paper border-stone-300 text-xs h-9.5"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-stone-400" /> Email Address
                </Label>
                <Input
                  {...register("email")}
                  placeholder="contact@business.com"
                  className={`bg-paper border-stone-300 text-xs h-9.5 ${
                    errors.email ? "border-terracotta-500 focus-visible:ring-terracotta-500" : ""
                  }`}
                />
                {errors.email && (
                  <p className="text-[11px] text-terracotta-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" /> {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                  <Globe className="h-3 w-3 text-stone-400" /> Official Website
                </Label>
                {!currentWebsite && (
                  <span className="text-[10px] text-terracotta-700 font-medium flex items-center gap-1 bg-terracotta-50 border border-terracotta-200 px-1.5 py-0.5 rounded">
                    <Target className="h-2.5 w-2.5 text-terracotta-600" />
                    Will be marked as Potential Client
                  </span>
                )}
              </div>
              <Input
                {...register("website")}
                placeholder="https://example.com (leave blank if no website)"
                className="bg-paper border-stone-300 text-xs h-9.5"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-stone-400" /> Physical Address
              </Label>
              <Input
                {...register("address")}
                placeholder="e.g. Plot 12, Road 4, Section 10, Mirpur, Dhaka"
                className="bg-paper border-stone-300 text-xs h-9.5"
              />
            </div>
          </div>

          {/* SECTION 3: SOCIAL MEDIA CHANNELS */}
          <div className="space-y-3 pt-3 border-t border-stone-200">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-botanical-800">
              <MessageCircle className="h-3.5 w-3.5 text-botanical-600" />
              <span>Social Profiles & Messaging</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                  <WhatsAppIcon className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp Number
                </Label>
                <Input
                  {...register("whatsapp")}
                  placeholder="+8801711223344"
                  className="bg-paper border-stone-300 text-xs h-9.5"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                  <FacebookIcon className="h-3.5 w-3.5 text-stone-600" /> Facebook Page URL
                </Label>
                <Input
                  {...register("facebook")}
                  placeholder="https://facebook.com/page"
                  className="bg-paper border-stone-300 text-xs h-9.5"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                  <InstagramIcon className="h-3.5 w-3.5 text-terracotta-600" /> Instagram URL
                </Label>
                <Input
                  {...register("instagram")}
                  placeholder="https://instagram.com/handle"
                  className="bg-paper border-stone-300 text-xs h-9.5"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                  <LinkedinIcon className="h-3.5 w-3.5 text-botanical-700" /> LinkedIn Profile URL
                </Label>
                <Input
                  {...register("linkedin")}
                  placeholder="https://linkedin.com/company/handle"
                  className="bg-paper border-stone-300 text-xs h-9.5"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: INTELLIGENCE REMARK */}
          <div className="space-y-2 pt-3 border-t border-stone-200">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-botanical-800">
              <FileText className="h-3.5 w-3.5 text-botanical-600" />
              <span>Notes & Outreach Remarks</span>
            </div>
            <Textarea
              {...register("remark")}
              rows={3}
              placeholder="Add any outreach notes, conversation remarks, or client qualification details..."
              className="w-full bg-paper border-stone-300 text-xs"
            />
          </div>

          {/* Actions Footer */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-stone-300 text-stone-700 hover:text-stone-900 hover:bg-stone-100 text-xs h-10 px-4 rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-botanical-800 hover:bg-botanical-900 text-white text-xs h-10 px-5 rounded-xl shadow-md gap-2 font-semibold cursor-pointer transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-sage-200" />
                  <span>Saving Lead...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-sage-200" />
                  <span>Save Lead to Group</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
