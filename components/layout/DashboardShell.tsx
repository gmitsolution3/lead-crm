"use client";

import React from "react";
import { DashboardProvider } from "@/context";
import { AppShell } from "./AppShell";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <DashboardProvider>
      <AppShell>{children}</AppShell>
    </DashboardProvider>
  );
}
