"use client";

import React, { useState, useEffect } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  ScanSearch,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  X,
  Compass,
  Layers,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useExtensionBridge } from "@/hooks/useExtensionBridge";

interface ExtensionSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onSearchStarted?: (query: string) => void;
}

export function ExtensionSearchModal({
  isOpen,
  onClose,
  initialQuery = "",
  onSearchStarted,
}: ExtensionSearchModalProps) {
  const { isInstalled, version, isChecking, isTriggering, checkConnection, triggerSearch } =
    useExtensionBridge();

  const [query, setQuery] = useState(initialQuery);
  const [platform, setPlatform] = useState<
    "Google Maps" | "Facebook" | "LinkedIn" | "Instagram"
  >("Google Maps");
  const [limit, setLimit] = useState<number>(50);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setFeedback(null);
      checkConnection();
    }
  }, [isOpen, initialQuery, checkConnection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setFeedback(null);
    const res = await triggerSearch({
      query: query.trim(),
      platform,
      limit,
    });

    if (res.success) {
      setFeedback({
        type: "success",
        message: res.message || "Extraction started! A browser tab has opened for scraping.",
      });
      if (onSearchStarted) {
        onSearchStarted(query.trim());
      }
      setTimeout(() => {
        onClose();
      }, 1800);
    } else {
      setFeedback({
        type: "error",
        message: res.message || "Failed to trigger search in extension.",
      });
    }
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPrimitive.Popup className="relative w-full max-w-lg rounded-3xl border border-stone-200/90 bg-[#FCFBF8] p-6 sm:p-7 shadow-2xl transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:scale-95 data-starting-style:scale-95 space-y-5">
            {/* Close Button */}
            <button
              onClick={onClose}
              disabled={isTriggering}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 cursor-pointer p-1 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex items-start gap-3.5 pr-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-botanical-700 text-paper shadow-xs shrink-0">
                <ScanSearch className="h-6 w-6 text-sage-200" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta-600 bg-terracotta-50 border border-terracotta-200 px-2 py-0.5 rounded-full">
                    Live Chrome Automation
                  </span>
                </div>
                <DialogPrimitive.Title className="text-lg font-bold text-botanical-900 tracking-tight">
                  Trigger Lead Extraction
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-xs text-stone-500 mt-0.5">
                  Launch an automated scraping session in the GM Lead Generator Chrome extension.
                </DialogPrimitive.Description>
              </div>
            </div>

            {/* Extension Connection Status Banner */}
            <div className="rounded-2xl border p-3 text-xs transition-all flex items-center justify-between gap-3 bg-oatmeal-100/60 border-stone-200/80">
              <div className="flex items-center gap-2.5 min-w-0">
                {isChecking ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-stone-400 shrink-0" />
                    <span className="text-stone-600 truncate">
                      Checking Chrome extension link...
                    </span>
                  </>
                ) : isInstalled ? (
                  <>
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="text-botanical-900 font-semibold truncate">
                      Extension Connected • v{version || "1.0.0"}
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span className="text-amber-800 font-medium truncate">
                      Extension Not Detected
                    </span>
                  </>
                )}
              </div>

              {!isInstalled && !isChecking && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={checkConnection}
                  className="h-7 px-2.5 text-[11px] text-stone-600 hover:text-botanical-900 cursor-pointer rounded-lg shrink-0 gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Retry Link</span>
                </Button>
              )}
            </div>

            {/* Helper notice if extension is not installed */}
            {!isInstalled && !isChecking && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-[11px] text-amber-900 leading-relaxed">
                Make sure the <strong>GM Lead Generator</strong> extension is loaded at{" "}
                <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[10px]">
                  chrome://extensions
                </code>{" "}
                and this browser tab was refreshed after loading the extension.
              </div>
            )}

            {/* Feedback Alert */}
            {feedback && (
              <div
                className={`flex items-start gap-2.5 rounded-2xl p-3.5 text-xs animate-in fade-in ${
                  feedback.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                    : "bg-terracotta-50 border border-terracotta-200 text-terracotta-900"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-terracotta-600 shrink-0 mt-0.5" />
                )}
                <span className="flex-1 leading-relaxed">{feedback.message}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Search Query Input */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">
                  Search Query / Business Keywords
                </Label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. Specialty Cafes in Austin TX, Dentists in Miami..."
                    className="h-10.5 pl-10 text-xs sm:text-sm bg-oatmeal-100/40 border-stone-200 focus:bg-[#FCFBF8] focus:border-botanical-600 rounded-xl"
                    autoFocus
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Platform & Extraction Limit Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Platform */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-stone-700">
                    Target Platform
                  </Label>
                  <Select
                    value={platform}
                    onValueChange={(val: any) => setPlatform(val)}
                  >
                    <SelectTrigger className="h-10 text-xs bg-oatmeal-100/40 border-stone-200 rounded-xl">
                      <SelectValue placeholder="Target Platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Google Maps">
                        🗺️ Google Maps (Recommended)
                      </SelectItem>
                      <SelectItem value="Facebook">
                        📘 Facebook Pages
                      </SelectItem>
                      <SelectItem value="LinkedIn">
                        💼 LinkedIn Companies
                      </SelectItem>
                      <SelectItem value="Instagram">
                        📷 Instagram Tags
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Limit */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-stone-700">
                    Extraction Limit
                  </Label>
                  <Select
                    value={String(limit)}
                    onValueChange={(val) => setLimit(Number(val))}
                  >
                    <SelectTrigger className="h-10 text-xs bg-oatmeal-100/40 border-stone-200 rounded-xl">
                      <SelectValue placeholder="Extraction Limit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20 Leads (Fast test)</SelectItem>
                      <SelectItem value="50">50 Leads (Balanced)</SelectItem>
                      <SelectItem value="100">100 Leads (In-depth)</SelectItem>
                      <SelectItem value="0">Unlimited (All results)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Workflow explanation */}
              <div className="rounded-xl bg-oatmeal-100/50 p-3 border border-stone-200/70 text-[11px] text-stone-500 space-y-1">
                <div className="flex items-center gap-1.5 text-botanical-800 font-semibold">
                  <Compass className="h-3.5 w-3.5 text-sage-600" />
                  <span>How it executes:</span>
                </div>
                <p>
                  Clicking launch will open a new browser tab with your target search, initiate the scraper in the background, and push extracted leads directly into your MongoDB database.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isTriggering}
                  className="h-10 px-4 rounded-xl border-stone-200 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isTriggering || !query.trim()}
                  className="h-10 px-5 rounded-xl bg-botanical-800 hover:bg-botanical-900 text-paper text-xs font-semibold shadow-xs cursor-pointer gap-2"
                >
                  {isTriggering ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-sage-200" />
                      <span>Launching Tab...</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Launch in Extension</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogPrimitive.Popup>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
