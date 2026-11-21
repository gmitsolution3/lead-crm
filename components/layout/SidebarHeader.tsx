import React from "react";
import { Badge } from "@/components/ui/badge";

export function SidebarHeader() {
  return (
    <>
      {/* Brand Header */}
      <div className="flex h-18 items-center gap-3 border-b border-stone-200/80 px-6 py-4 shrink-0">
        <img
          src="/app-icon-256x256.png"
          alt="GM Lead Generator"
          className="h-10 w-10 rounded-xl object-contain shadow-sm"
        />
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold tracking-tight text-botanical-900">
              GM
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-terracotta-500">
              Lead Generator
            </span>
          </div>
          <p className="text-xs text-stone-500">Lead Extraction System</p>
        </div>
      </div>

      {/* Extension Live Connection Pill */}
      <div className="mx-4 mt-4 rounded-xl border border-sage-200/90 bg-sage-50/70 p-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-botanical-600" />
            </span>
            <span className="text-xs font-medium text-botanical-900">
              Extension Connected
            </span>
          </div>
          <Badge variant="sage" className="px-1.5 py-0 text-[10px]">
            v2.4
          </Badge>
        </div>
        <p className="mt-1 text-[11px] leading-tight text-stone-500">
          Syncing leads from active browser scraping session
        </p>
      </div>
    </>
  );
}
