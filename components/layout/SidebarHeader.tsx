import React from "react";
import { Badge } from "@/components/ui/badge";

interface SidebarHeaderProps {
  isCollapsed?: boolean;
}

export function SidebarHeader({ isCollapsed = false }: SidebarHeaderProps) {
  if (isCollapsed) {
    return (
      <div className="flex h-18 items-center justify-center border-b border-stone-200/80 px-2 py-4 shrink-0">
        <div className="relative group">
          <img
            src="/app-icon-256x256.png"
            alt="GM Lead Generator"
            className="h-10 w-10 rounded-xl object-contain shadow-sm"
          />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-botanical-600 border-2 border-white" />
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Brand Header */}
      <div className="flex h-18 items-center gap-3 border-b border-stone-200/80 px-6 py-4 shrink-0 overflow-hidden">
        <img
          src="/app-icon-256x256.png"
          alt="GM Lead Generator"
          className="h-10 w-10 rounded-xl object-contain shadow-sm shrink-0"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-lg font-bold tracking-tight text-botanical-900">
              GM
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-terracotta-500 truncate">
              Lead Generator
            </span>
          </div>
          <p className="text-xs text-stone-500 truncate">Lead Extraction System</p>
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
            <span className="text-xs font-medium text-botanical-900 truncate">
              Extension Connected
            </span>
          </div>
          <Badge variant="sage" className="px-1.5 py-0 text-[10px] shrink-0">
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
