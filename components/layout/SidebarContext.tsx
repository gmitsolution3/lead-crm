"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 76;

interface SidebarContextValue {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  setCollapsed: (collapsed: boolean) => void;
  expandedWidth: number;
  collapsedWidth: number;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsedState] = useState<boolean>(false);

  // Load persisted collapse preference from localStorage on mount
  useEffect(() => {
    try {
      const savedCollapsed = localStorage.getItem("gm_sidebar_collapsed");
      if (savedCollapsed !== null) {
        setIsCollapsedState(savedCollapsed === "true");
      }
    } catch {
      // localStorage may fail in private mode
    }
  }, []);

  const setCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsedState(collapsed);
    try {
      localStorage.setItem("gm_sidebar_collapsed", String(collapsed));
    } catch {}
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsCollapsedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("gm_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  }, []);

  // Global keyboard shortcut: Ctrl+B or Cmd+B toggles sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        // Prevent default browser bookmark shortcut
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        toggleSidebar,
        setCollapsed,
        expandedWidth: EXPANDED_WIDTH,
        collapsedWidth: COLLAPSED_WIDTH,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
