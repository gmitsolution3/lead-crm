"use client";

import React from "react";
import { DashboardProvider } from "@/context";
import type { User } from "@/types";
import { AppShell } from "./AppShell";

interface DashboardShellProps {
  children: React.ReactNode;
  user?: User | null;
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  return (
    <DashboardProvider>
      <AppShell user={user}>{children}</AppShell>
    </DashboardProvider>
  );
}
