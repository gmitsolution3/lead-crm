"use client";

import React from "react";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Sparkles,
  Download,
  Settings,
  Compass,
  Sprout,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  totalLeadsCount: number;
  totalGroupsCount: number;
  onOpenNewLeadForm?: () => void;
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  activeTab,
  onTabChange,
  totalLeadsCount,
  totalGroupsCount,
  onOpenNewLeadForm,
  isMobile,
  onCloseMobile,
}: SidebarProps) {
  const navItems = [
    {
      id: "overview",
      label: "Overview",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "leads",
      label: "Leads Table",
      icon: Users,
      badge: totalLeadsCount.toString(),
    },
    {
      id: "groups",
      label: "Search Groups",
      icon: FolderKanban,
      badge: totalGroupsCount.toString(),
    },
    {
      id: "campaigns",
      label: "Active Campaigns",
      icon: Compass,
      badge: "6 Active",
      badgeVariant: "sage" as const,
    },
  ];

  const handleSelect = (id: string) => {
    onTabChange(id);
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleOpenForm = () => {
    onOpenNewLeadForm?.();
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <aside
      className={cn(
        "flex flex-col justify-between border-r border-stone-200/90 bg-[#FCFBF8] text-stone-800 shadow-[2px_0_12px_rgba(44,74,62,0.03)] z-40 select-none",
        isMobile
          ? "h-full min-h-screen w-full overflow-y-auto"
          : "hidden md:flex sticky top-0 h-screen w-64 shrink-0 overflow-y-auto"
      )}
    >
      {/* Top Part: Brand + New Lead CTA + Nav */}
      <div className="flex flex-col flex-1">
        {/* Brand Header */}
        <div className="flex h-18 items-center gap-3 border-b border-stone-200/80 px-6 py-4 shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-botanical-700 text-paper shadow-sm">
            <Sprout className="h-6 w-6 text-sage-200" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-botanical-900">
                Verdant
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-terracotta-500">
                Leads
              </span>
            </div>
            <p className="text-xs text-stone-500">Botanical CRM Engine</p>
          </div>
        </div>

        {/* Quick Action: New Lead Button */}
        <div className="px-4 pt-4">
          <Button
            onClick={handleOpenForm}
            className="w-full bg-botanical-700 hover:bg-botanical-800 text-paper rounded-xl gap-2 text-xs h-9.5 shadow-sm font-medium cursor-pointer"
          >
            <PlusCircle className="h-4 w-4 text-sage-300" />
            <span>Add New Lead</span>
          </Button>
        </div>

        {/* Extension Live Connection Pill */}
        <div className="mx-4 mt-3 rounded-xl border border-sage-200/90 bg-sage-50/70 p-3 shrink-0">
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

        {/* Main Navigation */}
        <div className="mt-5 px-3">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
            Main Workspace
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={cn(
                    "group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                    isActive
                      ? "bg-botanical-700 text-paper shadow-sm"
                      : "text-stone-700 hover:bg-oatmeal-200/70 hover:text-botanical-900"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "h-4.5 w-4.5 transition-colors",
                        isActive
                          ? "text-sage-200"
                          : "text-stone-400 group-hover:text-botanical-700"
                      )}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold",
                        isActive
                          ? "bg-botanical-800 text-sage-200"
                          : item.badgeVariant === "sage"
                          ? "bg-sage-100 text-botanical-800"
                          : "bg-oatmeal-200 text-stone-600 group-hover:bg-oatmeal-300"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Secondary Navigation */}
          <div className="mt-6 px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
            Pipeline & Tools
          </div>
          <div className="space-y-1">
            <button
              onClick={() => handleSelect("enrichment")}
              className={cn(
                "group flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-sm font-medium text-stone-700 transition-all hover:bg-oatmeal-200/70 hover:text-botanical-900 cursor-pointer",
                activeTab === "enrichment" && "bg-botanical-700 text-paper"
              )}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="h-4.5 w-4.5 text-terracotta-500" />
                <span>AI Enrichment</span>
              </div>
              <span className="rounded-full bg-terracotta-100 px-1.5 py-0.2 text-[10px] font-semibold text-terracotta-700">
                Beta
              </span>
            </button>

            <button
              onClick={() => handleSelect("export")}
              className="group flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-sm font-medium text-stone-700 transition-all hover:bg-oatmeal-200/70 hover:text-botanical-900 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Download className="h-4.5 w-4.5 text-stone-400 group-hover:text-botanical-700" />
                <span>Data Export</span>
              </div>
              <span className="text-xs text-stone-400">CSV/JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Profile Section: Always pinned to the very bottom */}
      <div className="border-t border-stone-200/80 p-4 mt-auto shrink-0 bg-[#FCFBF8]">
        <div className="flex items-center gap-3 rounded-xl bg-oatmeal-100/90 p-2.5 transition-colors">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage-300 text-botanical-900 font-bold text-sm">
            VK
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-semibold text-botanical-900">
              Lead Architect
            </p>
            <p className="truncate text-[11px] text-stone-500">
              workspace@leadgen.local
            </p>
          </div>
          <Settings className="h-4 w-4 text-stone-400 hover:text-botanical-800 cursor-pointer" />
        </div>
      </div>
    </aside>
  );
}
