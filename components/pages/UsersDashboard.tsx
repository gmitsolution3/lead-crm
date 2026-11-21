"use client";

import React from "react";
import { UserManagementSystem } from "@/components/features/admin/UserManagementSystem";

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
  return <UserManagementSystem />;
}
