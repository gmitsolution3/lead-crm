"use client";

import React, { useState } from "react";
import {
  Bell,
  RefreshCw,
  Menu,
  LogOut,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useFetch } from "@/hooks";
import { LeadFormModal } from "@/components/features/leads/LeadFormModal";
import type { SearchGroup } from "@/types";

interface HeaderProps {
  onOpenMobileSidebar?: () => void;
  onRefreshData?: () => void;
  selectedGroupQuery?: string | null;
  onClearGroupFilter?: () => void;
}

export function Header({
  onOpenMobileSidebar,
  onRefreshData,
  selectedGroupQuery,
  onClearGroupFilter,
}: HeaderProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const { data: searchGroupsResponse } = useFetch<any>("/search-groups");
  const searchGroups: SearchGroup[] = Array.isArray(searchGroupsResponse?.data)
    ? searchGroupsResponse.data
    : Array.isArray(searchGroupsResponse)
    ? searchGroupsResponse
    : [];

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-18 w-full items-center justify-between border-b border-stone-200/90 bg-paper/95 px-4 backdrop-blur-md md:px-8">
      {/* Left section: mobile hamburger + active group filter */}
      <div className="flex flex-1 items-center gap-3 md:gap-6">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-stone-600 cursor-pointer"
          onClick={onOpenMobileSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Active Filter Pill if a search group is filtered */}
        {selectedGroupQuery && (
          <div className="flex items-center gap-2 rounded-xl border border-sage-300 bg-sage-50/80 px-3 py-1 text-xs">
            <span className="font-medium text-botanical-800 truncate max-w-[200px]">
              Filtering: {selectedGroupQuery}
            </span>
            <button
              onClick={onClearGroupFilter}
              className="text-stone-400 hover:text-stone-700 font-bold ml-1 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Right section: actions, sync status, notifications, profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Add Lead Button */}
        <Button
          size="sm"
          onClick={() => setIsAddLeadOpen(true)}
          className="inline-flex items-center gap-1.5 h-9 text-xs bg-botanical-800 hover:bg-botanical-900 text-white cursor-pointer rounded-xl shadow-xs font-semibold"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Lead</span>
        </Button>

        {/* Sync Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefreshData}
          className="hidden sm:inline-flex items-center gap-1.5 h-9 text-xs border-stone-200 text-stone-700 hover:text-botanical-900 cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5 text-sage-600" />
          <span>Sync Extension</span>
        </Button>

        {/* Quick Notification Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                className="relative h-9 w-9 rounded-xl border-stone-200 text-stone-600 hover:text-botanical-900 cursor-pointer"
              />
            }
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-terracotta-500 text-[9px] font-bold text-paper">
              3
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-2">
            <DropdownMenuLabel className="text-sm font-semibold text-botanical-900">
              Live Extension Notifications
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="space-y-1 py-1">
              <div className="rounded-lg p-2 hover:bg-oatmeal-100 transition-colors">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-botanical-800">
                    Lead Extraction Complete
                  </span>
                  <span className="text-[10px] text-stone-400">2m ago</span>
                </div>
                <p className="text-xs text-stone-600 mt-0.5">
                  12 leads extracted from Google Maps for &ldquo;Specialty Organic Cafes&rdquo;.
                </p>
              </div>

              <div className="rounded-lg p-2 hover:bg-oatmeal-100 transition-colors">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-botanical-800">
                    Social Handles Enriched
                  </span>
                  <span className="text-[10px] text-stone-400">18m ago</span>
                </div>
                <p className="text-xs text-stone-600 mt-0.5">
                  Found Instagram &amp; WhatsApp for &ldquo;Wild Meadow Herbal Apothecary&rdquo;.
                </p>
              </div>

              <div className="rounded-lg p-2 hover:bg-oatmeal-100 transition-colors">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-botanical-800">
                    New Search Group
                  </span>
                  <span className="text-[10px] text-stone-400">1h ago</span>
                </div>
                <p className="text-xs text-stone-600 mt-0.5">
                  &ldquo;Biophilic Interior Designers San Francisco&rdquo; group saved.
                </p>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Role & Quick Sign Out */}
        {session?.user && (
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-stone-200">
            <Badge
              variant={((session.user as any)?.role || "user").toLowerCase() === "admin" ? "terracotta" : "sage"}
              className="text-[10px] uppercase font-bold"
            >
              {(session.user as any)?.role || "USER"}
            </Badge>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleSignOut}
              title="Sign Out"
              className="h-8 w-8 text-stone-400 hover:text-terracotta-700 hover:bg-terracotta-50 rounded-lg cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* Live Status indicator */}
        <div className="hidden xl:flex items-center gap-2 rounded-xl bg-oatmeal-200/60 px-3 py-1.5 border border-stone-200/80">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-stone-700">
            Engine Ready
          </span>
        </div>
      </div>

      <LeadFormModal
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        searchGroups={searchGroups}
      />
    </header>
  );
}
