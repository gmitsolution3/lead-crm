"use client";

import React, { useState } from "react";
import { Lead, SearchGroup } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Sparkles,
  MessageCircle,
  FileText,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  WhatsAppIcon,
} from "@/components/ui/icons";

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchGroups: SearchGroup[];
  onAddLead: (lead: Lead) => void;
}

export function LeadFormModal({
  isOpen,
  onClose,
  searchGroups,
  onAddLead,
}: LeadFormModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    source: "Google Maps",
    searchQuery: searchGroups[0]?.query || "Specialty Organic Cafes in Brooklyn",
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sources = [
    "Google Maps",
    "Instagram",
    "LinkedIn",
    "Facebook",
    "Website",
    "Direct Outreach",
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      // Find matching group or generate one
      const matchedGroup = searchGroups.find(
        (g) => g.query.toLowerCase() === formData.searchQuery.toLowerCase()
      );
      const groupId = matchedGroup?.groupId || `grp-${Date.now().toString().slice(-4)}`;

      const newLead: Lead = {
        leadId: `lead-${Date.now().toString().slice(-4)}`,
        groupId,
        searchQuery: formData.searchQuery,
        source: formData.source,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        website: formData.website.trim(),
        address: formData.address.trim(),
        whatsapp: formData.whatsapp.trim(),
        instagram: formData.instagram.trim(),
        linkedin: formData.linkedin.trim(),
        facebook: formData.facebook.trim(),
        remark: formData.remark.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onAddLead(newLead);
      setIsSubmitting(false);
      onClose();

      // Reset form
      setFormData({
        name: "",
        source: "Google Maps",
        searchQuery: searchGroups[0]?.query || "Specialty Organic Cafes in Brooklyn",
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
    }, 400);
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
              <Sparkles className="h-4 w-4 text-botanical-700" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-botanical-700">
              New Prospect Registration
            </span>
          </div>
          <SheetTitle className="text-2xl font-bold text-botanical-900 tracking-tight">
            Add Verified Lead
          </SheetTitle>
          <SheetDescription className="text-xs text-stone-500">
            Manually log or curate a lead profile matching your database schema.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* SECTION 1: BUSINESS IDENTITY */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-botanical-800">
              <Building2 className="h-3.5 w-3.5 text-botanical-600" />
              <span>Identity & Origin</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-700">
                Business / Lead Name <span className="text-terracotta-600">*</span>
              </label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Hearth & Stone Sourdough Bakery"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-stone-700">Extraction Source</label>
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  className="w-full h-10 rounded-xl border border-stone-300 bg-paper px-3 py-2 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-botanical-600"
                >
                  {sources.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-stone-700">Campaign Query Group</label>
                <div className="relative">
                  <Input
                    name="searchQuery"
                    value={formData.searchQuery}
                    onChange={handleChange}
                    placeholder="Search query name"
                    className="bg-paper border-stone-300 text-xs h-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: DIRECT CONTACT */}
          <div className="space-y-3 pt-3 border-t border-stone-200">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-botanical-800">
              <Phone className="h-3.5 w-3.5 text-botanical-600" />
              <span>Direct Contact Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-stone-400" /> Phone Number
                </label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 019-2834"
                  className="bg-paper border-stone-300 text-xs h-9.5"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-stone-400" /> Email Address
                </label>
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
              <label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                <Globe className="h-3 w-3 text-stone-400" /> Official Website
              </label>
              <Input
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://example.com"
                className="bg-paper border-stone-300 text-xs h-9.5"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-stone-400" /> Physical Address
              </label>
              <Input
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Mulberry St, New York, NY 10013"
                className="bg-paper border-stone-300 text-xs h-9.5"
              />
            </div>
          </div>

          {/* SECTION 3: SOCIAL MEDIA CHANNELS */}
          <div className="space-y-3 pt-3 border-t border-stone-200">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-botanical-800">
              <MessageCircle className="h-3.5 w-3.5 text-botanical-600" />
              <span>Social & Instant Messaging</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                  <WhatsAppIcon className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp Number
                </label>
                <Input
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  placeholder="+15550192834"
                  className="bg-paper border-stone-300 text-xs h-9.5"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                  <InstagramIcon className="h-3.5 w-3.5 text-terracotta-600" /> Instagram URL / Handle
                </label>
                <Input
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleChange}
                  placeholder="https://instagram.com/handle"
                  className="bg-paper border-stone-300 text-xs h-9.5"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                  <LinkedinIcon className="h-3.5 w-3.5 text-botanical-700" /> LinkedIn Profile
                </label>
                <Input
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/company/handle"
                  className="bg-paper border-stone-300 text-xs h-9.5"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                  <FacebookIcon className="h-3.5 w-3.5 text-stone-600" /> Facebook Page
                </label>
                <Input
                  name="facebook"
                  value={formData.facebook}
                  onChange={handleChange}
                  placeholder="https://facebook.com/page"
                  className="bg-paper border-stone-300 text-xs h-9.5"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: INTELLIGENCE REMARK */}
          <div className="space-y-2 pt-3 border-t border-stone-200">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-botanical-800">
              <FileText className="h-3.5 w-3.5 text-botanical-600" />
              <span>Field Remarks & Prospect Notes</span>
            </div>
            <textarea
              name="remark"
              value={formData.remark}
              onChange={handleChange}
              rows={3}
              placeholder="e.g. Connected with store manager Elena. Requested organic wholesale coffee pricing sheet..."
              className="w-full rounded-xl border border-stone-300 bg-paper p-3 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-botanical-600 transition-all"
            />
          </div>

          {/* Actions Footer */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-stone-300 text-stone-700 text-xs h-10 px-4 rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-botanical-700 hover:bg-botanical-800 text-paper text-xs h-10 px-5 rounded-xl shadow-md gap-2 font-medium cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4 text-sage-200" />
              <span>{isSubmitting ? "Saving Lead..." : "Save Prospect"}</span>
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
