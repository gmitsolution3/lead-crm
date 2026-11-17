"use client";

import React from "react";
import {
  FolderKanban,
  Users,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchGroup } from "@/types";
import { formatDate } from "@/lib/utils";

interface SearchGroupCardProps {
  group: SearchGroup;
  leadCount: number;
  onFilterByGroup: (query: string) => void;
}

export function SearchGroupCard({
  group,
  leadCount,
  onFilterByGroup,
}: SearchGroupCardProps) {
  return (
    <Card className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-paper-lg hover:border-sage-300">
      {/* Top background accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-botanical-700 via-sage-400 to-terracotta-500 opacity-80" />

      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-botanical-50 text-botanical-800 border border-botanical-100">
              <FolderKanban className="h-4.5 w-4.5" />
            </div>
            <span className="text-xs text-stone-500 bg-oatmeal-200/70 px-2 py-0.5 rounded-md">
              {group.groupId}
            </span>
          </div>

          <Badge variant="sage" className="gap-1 font-semibold text-xs">
            <Users className="h-3 w-3" />
            {leadCount} leads
          </Badge>
        </div>

        {/* Search Query Header */}
        <div className="mt-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
            Target Search Query
          </span>
          <h3 className="mt-1 text-lg font-bold text-botanical-900 leading-snug group-hover:text-botanical-700 transition-colors">
            &ldquo;{group.query}&rdquo;
          </h3>
        </div>

        {/* Stats & Timestamps */}
        <div className="mt-4 rounded-xl bg-oatmeal-100/70 p-3 text-xs text-stone-600 border border-stone-200/60 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-stone-400">Created:</span>
            <span className="font-medium text-stone-700">{formatDate(group.createdAt)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-stone-400">Last Scraped:</span>
            <span className="font-medium text-stone-700">{formatDate(group.updatedAt)}</span>
          </div>
        </div>
      </div>

      {/* Card Action */}
      <div className="mt-5 pt-3 border-t border-stone-200/80 flex items-center justify-between">
        <span className="text-[11px] text-stone-400">
          Source: Extension crawler
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFilterByGroup(group.query)}
          className="text-xs font-semibold text-botanical-800 hover:text-botanical-900 hover:bg-sage-100/70 gap-1.5 rounded-xl h-8 px-3 cursor-pointer"
        >
          <span>View Leads</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </Card>
  );
}
