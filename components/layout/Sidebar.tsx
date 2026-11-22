"use client";

import React, { useMemo } from "react";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import type { User } from "@/types";
import { getNavSectionsForRole } from "./sidebar.config";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarNav } from "./SidebarNav";
import { SidebarProfile } from "./SidebarProfile";
import { useSidebar } from "./SidebarContext";

export * from "./sidebar.config";

interface SidebarProps {
  user?: User | null;
  isMobile?: boolean;
  onCloseMobile?: () => void;
  className?: string;
}

export function Sidebar({
  user,
  isMobile,
  onCloseMobile,
  className,
}: SidebarProps) {
  const { data: session } = useSession();
  const { isCollapsed, collapsedWidth, expandedWidth } = useSidebar();

  const currentUser = user || session?.user;
  const userRole = ((currentUser as any)?.role || "user").toLowerCase();

  const navigationSections = useMemo(
    () => getNavSectionsForRole(userRole),
    [userRole]
  );

  const effectiveCollapsed = !isMobile && isCollapsed;

  return (
    <aside
      style={
        isMobile
          ? undefined
          : { width: `${effectiveCollapsed ? collapsedWidth : expandedWidth}px` }
      }
      className={cn(
        "flex flex-col justify-between border-r border-stone-200/90 bg-[#FCFBF8] text-stone-800 shadow-[2px_0_12px_rgba(44,74,62,0.03)] z-40 select-none transition-[width] duration-200 ease-in-out",
        isMobile
          ? "h-full min-h-dvh w-full overflow-y-auto"
          : "hidden md:flex sticky top-0 h-screen md:h-dvh min-h-screen shrink-0 overflow-y-auto overflow-x-hidden",
        className
      )}
    >
      <div className="flex flex-col flex-1 min-w-0">
        <SidebarHeader isCollapsed={effectiveCollapsed} />
        <SidebarNav
          sections={navigationSections}
          isCollapsed={effectiveCollapsed}
          onCloseMobile={isMobile ? onCloseMobile : undefined}
        />
      </div>

      <SidebarProfile
        user={currentUser}
        role={userRole}
        isCollapsed={effectiveCollapsed}
      />
    </aside>
  );
}
