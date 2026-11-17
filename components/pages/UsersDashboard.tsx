"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { UserManagementSystem } from "@/components/features/admin/UserManagementSystem";
import { mockLeads, mockSearchGroups } from "@/lib/mock-data";

interface UsersDashboardProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role?: string;
    phone?: string;
  };
}

export default function UsersDashboard({ user }: UsersDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>("users");
  const [globalSearch, setGlobalSearch] = useState<string>("");

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      searchQuery={globalSearch}
      onSearchChange={setGlobalSearch}
      totalLeadsCount={mockLeads.length}
      totalGroupsCount={mockSearchGroups.length}
    >
      <UserManagementSystem />
    </AppShell>
  );
}
