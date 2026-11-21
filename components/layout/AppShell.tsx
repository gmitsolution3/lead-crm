"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { LeadDetailSheet } from "@/components/features/leads/LeadDetailSheet";
import { useDashboard } from "@/context";
import type { User } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  user?: User | null;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  totalLeadsCount?: number;
  totalGroupsCount?: number;
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
  const router = useRouter();
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Consume centralized dashboard context
  const dashboard = useDashboard();

  const effectiveTotalLeads = totalLeadsCount ?? dashboard.totalLeadsCount;
  const effectiveTotalGroups = totalGroupsCount ?? dashboard.totalGroupsCount;
  const effectiveRefresh = onRefreshData ?? dashboard.refetchData;
  const effectiveGroupQuery = selectedGroupQuery ?? dashboard.selectedGroupQuery;
  const effectiveExport = onExportLeads ?? dashboard.exportLeadsHandler;
  const effectiveClearFilter = onClearGroupFilter ?? (() => router.push("/leads"));

  const currentTab =
    activeTab ||
    (pathname === "/users"
      ? "users"
      : pathname === "/settings"
      ? "settings"
      : pathname?.startsWith("/leads")
      ? "leads"
      : "overview");

  return (
    <div className="relative flex min-h-screen w-full bg-[#F5F2ED] text-stone-900 selection:bg-sage-200 items-stretch">
      {/* Toast Feedback - Centralized in Shell */}
      <AnimatePresence>
        {dashboard.syncFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-8 z-50 rounded-xl bg-botanical-800 text-paper px-4 py-2.5 shadow-paper-lg border border-botanical-600 text-xs font-medium flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4 text-sage-300" />
            <span>{dashboard.syncFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sticky Sidebar */}
      <Sidebar
        activeTab={currentTab}
        onTabChange={onTabChange || (() => {})}
        totalLeadsCount={effectiveTotalLeads}
        totalGroupsCount={effectiveTotalGroups}
        onExportLeads={effectiveExport}
      />

      {/* Mobile Drawer */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 gap-0 w-72 h-full max-h-screen bg-[#FCFBF8] border-r border-stone-200 overflow-hidden">
          <Sidebar
            activeTab={currentTab}
            onTabChange={onTabChange || (() => {})}
            totalLeadsCount={effectiveTotalLeads}
            totalGroupsCount={effectiveTotalGroups}
            onExportLeads={effectiveExport}
            isMobile
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main App Container */}
      <div className="flex flex-1 flex-col min-w-0">
        <Header
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onRefreshData={effectiveRefresh}
          selectedGroupQuery={effectiveGroupQuery}
          onClearGroupFilter={effectiveClearFilter}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      {/* Centralized Lead Detail Sheet */}
      <LeadDetailSheet
        lead={dashboard.selectedLead}
        isOpen={dashboard.isSheetOpen}
        onClose={dashboard.closeLeadDetail}
        onSaveRemark={dashboard.saveRemark}
      />
    </div>
  );
}
