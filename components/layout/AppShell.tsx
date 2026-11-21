"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { User } from "@/types";

interface AppShellProps {
  children: React.ReactNode;
  user?: User | null;
}

export function AppShell({ children, user }: AppShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen w-full bg-[#F5F2ED] text-stone-900 selection:bg-sage-200 items-stretch">
      {/* Desktop Sticky Sidebar */}
      <Sidebar user={user} />

      {/* Mobile Drawer */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent
          side="left"
          className="p-0 gap-0 w-72 h-full max-h-screen bg-[#FCFBF8] border-r border-stone-200 overflow-hidden"
        >
          <Sidebar
            user={user}
            isMobile
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main App Container */}
      <div className="flex flex-1 flex-col min-w-0">
        <Header onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
