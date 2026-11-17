"use client";

import React from "react";
import {
  Search,
  Bell,
  RefreshCw,
  Menu,
  Plus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenMobileSidebar?: () => void;
  onRefreshData?: () => void;
  selectedGroupQuery?: string | null;
  onClearGroupFilter?: () => void;
  onOpenNewLeadForm?: () => void;
}

export function Header({
  searchQuery,
  onSearchChange,
  onOpenMobileSidebar,
  onRefreshData,
  selectedGroupQuery,
  onClearGroupFilter,
  onOpenNewLeadForm,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-18 w-full items-center justify-between border-b border-stone-200/90 bg-paper/95 px-4 backdrop-blur-md md:px-8">
      {/* Left section: mobile hamburger + global search */}
      <div className="flex flex-1 items-center gap-3 md:gap-6">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-stone-600 cursor-pointer"
          onClick={onOpenMobileSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Global Search Bar */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search leads by name, email, phone, city, or query..."
            className="h-10 w-full pl-9 pr-12 text-sm bg-oatmeal-100/60 border-stone-200 focus:bg-paper transition-all"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border border-stone-300 bg-paper px-1.5 text-[10px] font-medium text-stone-500 sm:inline-flex">
            ⌘K
          </kbd>
        </div>

        {/* Active Filter Pill if a search group is filtered */}
        {selectedGroupQuery && (
          <div className="hidden lg:flex items-center gap-2 rounded-xl border border-sage-300 bg-sage-50/80 px-3 py-1 text-xs">
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
        {/* Add Lead CTA button */}
        <Button
          onClick={onOpenNewLeadForm}
          size="sm"
          className="bg-botanical-700 hover:bg-botanical-800 text-paper text-xs h-9 px-3.5 gap-1.5 rounded-xl shadow-sm cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5 text-sage-200" />
          <span className="hidden sm:inline">Add Lead</span>
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
                  12 leads extracted from Google Maps for "Specialty Organic Cafes".
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
                  Found Instagram & WhatsApp for "Wild Meadow Herbal Apothecary".
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
                  "Biophilic Interior Designers San Francisco" group saved.
                </p>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Live Status indicator */}
        <div className="hidden xl:flex items-center gap-2 rounded-xl bg-oatmeal-200/60 px-3 py-1.5 border border-stone-200/80">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-stone-700">
            Engine Ready
          </span>
        </div>
      </div>
    </header>
  );
}
