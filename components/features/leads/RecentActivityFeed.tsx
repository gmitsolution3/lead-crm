"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Clock,
  Layers,
  ArrowRight,
  Send,
  Tag,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ActivityEvent } from "@/types";
import { formatRelativeTime } from "@/lib/utils";

interface RecentActivityFeedProps {
  activities: ActivityEvent[];
  onSelectLeadByName?: (name: string) => void;
}

export function RecentActivityFeed({
  activities,
  onSelectLeadByName,
}: RecentActivityFeedProps) {
  const isClient = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const getActionBadge = (action: ActivityEvent["action"]) => {
    switch (action) {
      case "captured":
        return (
          <Badge variant="sage" className="text-[11px] gap-1">
            <CheckCircle2 className="h-3 w-3" /> Captured
          </Badge>
        );
      case "enriched":
        return (
          <Badge variant="terracotta" className="text-[11px] gap-1">
            <Layers className="h-3 w-3" /> Enriched
          </Badge>
        );
      case "contacted":
        return (
          <Badge variant="default" className="text-[11px] gap-1">
            <Send className="h-3 w-3" /> Outreach
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-[11px] gap-1">
            <Tag className="h-3 w-3" /> Tagged
          </Badge>
        );
    }
  };

  return (
    <Card className="border border-stone-200/90 bg-[#FCFBF8] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-botanical-100 text-botanical-800">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-botanical-900">
              Live Lead Extraction Stream
            </CardTitle>
            <p className="text-xs text-stone-500">
              Real-time events pushed by the Chrome Extension
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-stone-500">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Listening</span>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {activities.length === 0 ? (
          <div className="py-10 text-center text-stone-500">
            <Activity className="h-8 w-8 mx-auto text-stone-400 mb-2 opacity-50" />
            <p className="text-sm font-semibold text-botanical-900">
              No recent activity
            </p>
            <p className="text-xs text-stone-400 mt-1">
              Events will appear here as leads are captured or enriched from the extension.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-200/70">
            {activities.map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.3 }}
                className="group flex flex-col sm:flex-row sm:items-center justify-between py-3.5 px-2 hover:bg-oatmeal-100/60 rounded-xl transition-colors cursor-pointer"
                onClick={() => onSelectLeadByName?.(event.leadName)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getActionBadge(event.action)}</div>
                  <div>
                    <h4 className="text-sm font-semibold text-botanical-900 group-hover:text-botanical-700 transition-colors flex items-center gap-1.5">
                      {event.leadName}
                      <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-botanical-700" />
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-stone-500">
                      <span className="font-medium text-stone-600">
                        Query: {event.searchQuery}
                      </span>
                      <span>•</span>
                      <span className="text-stone-500">Via {event.source}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 sm:mt-0 flex items-center gap-1.5 text-xs text-stone-400 pl-8 sm:pl-0">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{isClient ? formatRelativeTime(event.timestamp) : "Recently"}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
