"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface AppShellProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  totalLeadsCount: number;
  totalGroupsCount: number;
  onRefreshData?: () => void;
  selectedGroupQuery?: string | null;
  onClearGroupFilter?: () => void;
  onExportLeads?: () => void;
}

export function AppShell({
  children,
  activeTab,
  onTabChange,
  totalLeadsCount,
  totalGroupsCount,
  onRefreshData,
  selectedGroupQuery,
  onClearGroupFilter,
  onExportLeads,
}: AppShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen w-full bg-[#F5F2ED] text-stone-900 selection:bg-sage-200 items-stretch">
      {/* Desktop Sticky Sidebar (always reaches top-to-bottom of viewport) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        totalLeadsCount={totalLeadsCount}
        totalGroupsCount={totalGroupsCount}
        onExportLeads={onExportLeads}
      />

      {/* Mobile Drawer */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 gap-0 w-72 h-full max-h-screen bg-[#FCFBF8] border-r border-stone-200 overflow-hidden">
          <Sidebar
            activeTab={activeTab}
            onTabChange={onTabChange}
            totalLeadsCount={totalLeadsCount}
            totalGroupsCount={totalGroupsCount}
            onExportLeads={onExportLeads}
            isMobile
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main App Container */}
      <div className="flex flex-1 flex-col min-w-0">
        <Header
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onRefreshData={onRefreshData}
          selectedGroupQuery={selectedGroupQuery}
          onClearGroupFilter={onClearGroupFilter}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
