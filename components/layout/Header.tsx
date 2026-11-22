"use client";

import React, { useState } from "react";
import {
  Bell,
  RefreshCw,
  Menu,
  LogOut,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  ScanSearch,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "./SidebarContext";
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
import { useQueryClient } from "@tanstack/react-query";
import { useExtensionBridge } from "@/hooks/useExtensionBridge";
import { LeadFormModal } from "@/components/features/leads/LeadFormModal";
import { ExtensionSearchModal } from "@/components/features/leads/ExtensionSearchModal";
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
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const {
    isInstalled,
    version,
    isChecking,
    isSyncing,
    extractionStatus,
    syncExtension,
  } = useExtensionBridge();

  const userRole = ((session?.user as any)?.role || "user").toLowerCase();
  const canManageLeads = userRole === "admin" || userRole === "moderator";

  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isExtractModalOpen, setIsExtractModalOpen] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  const { data: searchGroupsResponse } = useFetch<any>("/search-groups");
  const searchGroups: SearchGroup[] = Array.isArray(searchGroupsResponse?.data)
    ? searchGroupsResponse.data
    : Array.isArray(searchGroupsResponse)
    ? searchGroupsResponse
    : [];

  const handleSync = async () => {
    try {
      await syncExtension();
      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: ["/leads"] }),
        queryClient.invalidateQueries({ queryKey: ["/search-groups"] }),
      ]);
      router.refresh();
      onRefreshData?.();
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 2200);
    } catch {
      setJustSynced(false);
    }
  };

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
      {/* Left section: sidebar toggle, mobile hamburger + active group filter */}
      <div className="flex flex-1 items-center gap-2 md:gap-4">
        {/* Mobile Hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-stone-600 cursor-pointer"
          onClick={onOpenMobileSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Desktop Sidebar Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          title={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
          className="hidden md:inline-flex text-stone-600 hover:text-botanical-900 hover:bg-oatmeal-200/80 rounded-xl h-9 w-9 cursor-pointer transition-colors"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-4.5 w-4.5 text-stone-600" />
          ) : (
            <PanelLeftClose className="h-4.5 w-4.5 text-stone-600" />
          )}
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
        {canManageLeads && (
          <>
            {/* Extract Leads via Extension Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsExtractModalOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 text-xs border-stone-200 text-stone-700 hover:text-botanical-900 hover:border-botanical-600 bg-paper cursor-pointer rounded-xl"
              title="Launch search extraction in Chrome extension"
            >
              <ScanSearch className="h-3.5 w-3.5 text-terracotta-600" />
              <span>Extract Leads</span>
            </Button>

            {/* Add Lead Button */}
            <Button
              size="sm"
              onClick={() => setIsAddLeadOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 text-xs bg-botanical-800 hover:bg-botanical-900 text-white cursor-pointer rounded-xl shadow-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Lead</span>
            </Button>

            {/* Real-time Sync Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
              className={`hidden sm:inline-flex items-center gap-1.5 h-9 text-xs border-stone-200 text-stone-700 hover:text-botanical-900 cursor-pointer rounded-xl transition-all ${
                justSynced
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : ""
              }`}
              title="Sync latest leads from MongoDB and refresh extension state"
            >
              {justSynced ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Synced!</span>
                </>
              ) : (
                <>
                  <RefreshCw
                    className={`h-3.5 w-3.5 text-sage-600 ${isSyncing ? "animate-spin" : ""}`}
                  />
                  <span>{isSyncing ? "Syncing..." : "Sync Extension"}</span>
                </>
              )}
            </Button>
          </>
        )}

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

        {/* User Role & Quick Sign Out - Only shown for lead managers; unapproved users keep notification bell only */}
        {canManageLeads && session?.user && (
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-stone-200">
            <Badge
              variant={userRole === "admin" ? "terracotta" : "sage"}
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

        {/* Dynamic Extension Engine Status indicator */}
        {canManageLeads && (
          <button
            type="button"
            onClick={() => setIsExtractModalOpen(true)}
            className="hidden xl:inline-flex items-center gap-2 rounded-xl transition-all cursor-pointer group"
            title={
              extractionStatus?.isExtracting
                ? `Scraping: "${extractionStatus.activeQuery}" (${extractionStatus.collectedInSession || 0} leads) • Click to open controls`
                : isInstalled
                ? `GM Scraper Engine Ready (v${version || "1.0"}) • Click to trigger extraction`
                : "Extension Offline • Click to view extension link instructions"
            }
          >
            {extractionStatus?.isExtracting ? (
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-1.5 border border-amber-300 text-amber-900 shadow-2xs">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                <span className="text-xs font-semibold truncate max-w-[170px]">
                  Scraping: {extractionStatus.activeQuery}
                </span>
                {typeof extractionStatus.collectedInSession === "number" && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4.5 bg-amber-100/90 border-amber-300 font-bold">
                    {extractionStatus.collectedInSession}
                  </Badge>
                )}
              </div>
            ) : isInstalled ? (
              <div className="flex items-center gap-2 rounded-xl bg-oatmeal-200/60 px-3 py-1.5 border border-stone-200/80 hover:bg-oatmeal-200 hover:border-stone-300 transition-colors">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-xs font-medium text-stone-700 group-hover:text-botanical-900">
                  Engine Ready
                </span>
                <span className="text-[10px] text-stone-400 font-mono">
                  v{version || "1.0"}
                </span>
              </div>
            ) : isChecking ? (
              <div className="flex items-center gap-2 rounded-xl bg-stone-100/70 px-3 py-1.5 border border-stone-200">
                <RefreshCw className="h-3 w-3 animate-spin text-stone-400 shrink-0" />
                <span className="text-xs font-medium text-stone-500">
                  Connecting...
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-stone-100/80 px-3 py-1.5 border border-stone-200 text-stone-500 hover:bg-stone-200/70 hover:text-stone-700 transition-colors">
                <div className="h-2 w-2 rounded-full bg-stone-400 shrink-0" />
                <span className="text-xs font-medium">
                  Engine Offline
                </span>
              </div>
            )}
          </button>
        )}
      </div>

      <LeadFormModal
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        searchGroups={searchGroups}
      />

      <ExtensionSearchModal
        isOpen={isExtractModalOpen}
        onClose={() => setIsExtractModalOpen(false)}
        initialQuery={selectedGroupQuery || ""}
      />
    </header>
  );
}
