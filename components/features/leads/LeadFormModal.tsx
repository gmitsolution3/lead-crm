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
} from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  WhatsAppIcon,
} from "@/components/ui/icons";
import { apiClient } from "@/lib/axios";
import { useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    source: "Manual",
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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        source: "Manual",
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
      setErrors({});
      setSubmitError(null);
    }
  }, [isOpen, targetGroup, searchGroups]);

  const sources = [
    "Manual",
    "Google Maps",
    "Facebook",
    "LinkedIn",
    "Instagram",
    "Website",
    "Direct Outreach",
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) {
      errs.name = "Business / Lead Name is required";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = "Please enter a valid email address";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const selectedGroupId = formData.groupId || targetGroup?.groupId || undefined;
      const selectedSearchQuery =
        formData.searchQuery || targetGroup?.query || undefined;

      const payload = {
        groupId: selectedGroupId,
        searchQuery: selectedSearchQuery,
        source: formData.source || "Manual",
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        website: formData.website.trim() || undefined,
        address: formData.address.trim() || undefined,
        whatsapp: formData.whatsapp.trim() || undefined,
        instagram: formData.instagram.trim() || undefined,
        linkedin: formData.linkedin.trim() || undefined,
        facebook: formData.facebook.trim() || undefined,
        remark: formData.remark.trim() || undefined,
      };

      const response = await apiClient.post("/leads/save", payload);
      const savedResult = response.data?.data || response.data;

      // Invalidate react-query cache for real-time table sync
      queryClient.invalidateQueries({ queryKey: ["/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/search-groups"] });

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
    } finally {
      setIsSubmitting(false);
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

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
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
                <div className="flex items-center justify-between gap-2 h-10 px-3.5 rounded-xl bg-oatmeal-100/90 border border-stone-200 text-xs text-botanical-900 font-semibold">
                  <span className="truncate">&ldquo;{targetGroup.query}&rdquo;</span>
                  {targetGroup.groupId && (
                    <span className="text-[10px] font-mono text-stone-500 bg-paper px-2 py-0.5 rounded border border-stone-200 shrink-0">
                      {targetGroup.groupId}
                    </span>
                  )}
                </div>
              ) : searchGroups.length > 0 ? (
                <Select
                  value={formData.groupId || searchGroups[0]?.groupId}
                  onValueChange={(val) => {
                    const matched = searchGroups.find((g) => g.groupId === val);
                    setFormData((prev) => ({
                      ...prev,
                      groupId: val ?? "",
                      searchQuery: matched?.query ?? prev.searchQuery,
                    }));
                  }}
                >
                  <SelectTrigger className="w-full h-10 text-xs bg-paper border-stone-300">
                    <SelectValue placeholder="Select a Search Group" />
                  </SelectTrigger>
                  <SelectContent>
                    {searchGroups.map((g) => (
                      <SelectItem key={g.groupId} value={g.groupId}>
                        &ldquo;{g.query}&rdquo; ({g.groupId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  name="searchQuery"
                  value={formData.searchQuery}
                  onChange={handleChange}
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
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Vape Hub Mirpur"
                className={`bg-paper border-stone-300 text-sm h-10 ${
                  errors.name ? "border-terracotta-500 focus-visible:ring-terracotta-500" : ""
                }`}
              />
              {errors.name && (
                <p className="text-[11px] text-terracotta-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" /> {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-stone-700">Lead Source</Label>
              <Select
                value={formData.source}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, source: val ?? "Manual" }))
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

          {/* SECTION 2: DIRECT CONTACT */}
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
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. 01711223344"
                  className="bg-paper border-stone-300 text-xs h-9.5"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-stone-400" /> Email Address
                </Label>
                <Input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contact@business.com"
                  className={`bg-paper border-stone-300 text-xs h-9.5 ${
                    errors.email ? "border-terracotta-500 focus-visible:ring-terracotta-500" : ""
                  }`}
                />
                {errors.email && (
                  <p className="text-[11px] text-terracotta-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" /> {errors.email}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                  <Globe className="h-3 w-3 text-stone-400" /> Official Website
                </Label>
                {!formData.website && (
                  <span className="text-[10px] text-terracotta-700 font-medium flex items-center gap-1 bg-terracotta-50 border border-terracotta-200 px-1.5 py-0.5 rounded">
                    <Target className="h-2.5 w-2.5 text-terracotta-600" />
                    Will be marked as Potential Client
                  </span>
                )}
              </div>
              <Input
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://example.com (leave blank if no website)"
                className="bg-paper border-stone-300 text-xs h-9.5"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-stone-400" /> Physical Address
              </Label>
              <Input
                name="address"
                value={formData.address}
                onChange={handleChange}
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
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  placeholder="+8801711223344"
                  className="bg-paper border-stone-300 text-xs h-9.5"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                  <FacebookIcon className="h-3.5 w-3.5 text-stone-600" /> Facebook Page URL
                </Label>
                <Input
                  name="facebook"
                  value={formData.facebook}
                  onChange={handleChange}
                  placeholder="https://facebook.com/page"
                  className="bg-paper border-stone-300 text-xs h-9.5"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                  <InstagramIcon className="h-3.5 w-3.5 text-terracotta-600" /> Instagram URL
                </Label>
                <Input
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleChange}
                  placeholder="https://instagram.com/handle"
                  className="bg-paper border-stone-300 text-xs h-9.5"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                  <LinkedinIcon className="h-3.5 w-3.5 text-botanical-700" /> LinkedIn Profile URL
                </Label>
                <Input
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleChange}
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
              name="remark"
              value={formData.remark}
              onChange={handleChange}
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
              className="border-stone-300 text-stone-700 text-xs h-10 px-4 rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-botanical-750 hover:bg-botanical-850 text-paper text-xs h-10 px-5 rounded-xl shadow-md gap-2 font-medium cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-sage-300" />
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
