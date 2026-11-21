"use client";

import React from "react";
import { UserManagementSystem } from "@/components/features/admin/UserManagementSystem";
import type { User } from "@/types";

interface UsersDashboardProps {
  user?: User | null;
}

export default function UsersDashboard({ user }: UsersDashboardProps) {
  return <UserManagementSystem />;
}
