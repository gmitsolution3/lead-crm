"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { UserManagementSystem } from "@/components/features/admin/UserManagementSystem";
import { mockLeads, mockSearchGroups } from "@/lib/mock-data";
import { useSession, signOut } from "@/lib/auth-client";

export default function UsersPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();

  useEffect(() => {
    if (!isSessionPending) {
      if (!session?.user) {
        router.push("/login");
      } else if ((session.user as any)?.role !== "admin") {
        signOut().finally(() => {
          router.push("/login?error=pending");
        });
      }
    }
  }, [session, isSessionPending, router]);

  const [activeTab, setActiveTab] = useState<string>("team");
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
