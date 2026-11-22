"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import type { User } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Clock,
  ShieldAlert,
  RefreshCw,
  User as UserIcon,
  LogOut,
  CheckCircle2,
} from "lucide-react";

interface UserDashboardProps {
  user?: User | null;
}

export default function UserDashboard({ user }: UserDashboardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const effectiveUser = user || session?.user;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleCheckStatus = async () => {
    setIsRefreshing(true);
    setFeedback(null);
    try {
      router.refresh();
      setFeedback("Account status rechecked.");
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 800);
      setTimeout(() => {
        setFeedback(null);
      }, 3000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 font-sans text-center space-y-6 animate-fade-in">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 border border-amber-200 text-amber-700 shadow-sm">
        <Clock className="h-8 w-8 text-amber-600 animate-pulse" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/80 px-3 py-1 text-xs font-semibold text-amber-800">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
          <span>Account Pending Approval</span>
        </div>

        <h1 className="font-serif text-3xl font-bold tracking-tight text-botanical-900 sm:text-4xl">
          Welcome, {effectiveUser?.name || "Workspace Member"}
        </h1>

        <p className="text-sm text-stone-600 leading-relaxed max-w-lg mx-auto">
          Your account has been registered successfully. An Administrator must promote your role to{" "}
          <strong className="text-botanical-800 font-semibold">Moderator</strong> before you can access workspace leads, data streams, and CRM operations.
        </p>
      </div>

      {/* Account Details Summary */}
      <div className="rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-5 shadow-sm text-left max-w-md mx-auto space-y-3">
        <div className="flex items-center justify-between text-xs pb-2 border-b border-stone-100">
          <span className="text-stone-500">Registered Email</span>
          <span className="font-medium text-stone-800 truncate max-w-[200px]">
            {effectiveUser?.email}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs pb-2 border-b border-stone-100">
          <span className="text-stone-500">Current Status</span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Pending Approval
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-stone-500">Access Granted When</span>
          <span className="font-semibold text-botanical-800">Promoted to Moderator</span>
        </div>
      </div>

      {feedback && (
        <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Action Controls */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button
          type="button"
          onClick={handleCheckStatus}
          disabled={isRefreshing}
          className="rounded-xl text-xs h-10 px-5 bg-botanical-800 hover:bg-botanical-900 text-paper font-semibold gap-2 shadow-xs cursor-pointer w-full sm:w-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>{isRefreshing ? "Checking..." : "Check Approval Status"}</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/profile")}
          className="rounded-xl text-xs h-10 px-5 border-stone-200 text-stone-700 hover:bg-stone-100 gap-2 cursor-pointer w-full sm:w-auto"
        >
          <UserIcon className="h-3.5 w-3.5" />
          <span>Manage My Profile</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={async () => {
            await signOut();
            router.push("/login");
          }}
          className="rounded-xl text-xs h-10 px-4 text-terracotta-700 hover:bg-terracotta-50 gap-1.5 cursor-pointer w-full sm:w-auto"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  );
}
