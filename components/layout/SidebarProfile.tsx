"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { signOut } from "@/lib/auth-client";
import { Settings, LogOut, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

interface SidebarProfileProps {
  user?: User | null;
  role?: string;
  isCollapsed?: boolean;
}

export function SidebarProfile({
  user,
  role = "user",
  isCollapsed = false,
}: SidebarProfileProps) {
  const router = useRouter();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const isAdmin = role.toLowerCase() === "admin";
  const userName = user?.name || (isAdmin ? "Admin Architect" : "User");
  const userEmail = user?.email || "user@gmleadgenerator.com";
  const initials =
    userName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  return (
    <div
      className={cn(
        "border-t border-stone-200/80 mt-auto shrink-0 bg-[#FCFBF8] relative transition-all",
        isCollapsed ? "p-2" : "p-3"
      )}
    >
      {profileMenuOpen && (
        <div
          className={cn(
            "absolute mb-2 rounded-2xl border border-stone-200 bg-[#FCFBF8] p-3 shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-150",
            isCollapsed
              ? "bottom-full left-1 w-60 shadow-2xl"
              : "bottom-full left-3 right-3"
          )}
        >
          <div className="pb-2.5 mb-2 border-b border-stone-200/70">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                Logged In As
              </span>
              <Badge
                variant={isAdmin ? "terracotta" : "sage"}
                className="text-[10px] uppercase font-bold"
              >
                {role}
              </Badge>
            </div>
            <p className="text-xs font-bold text-botanical-900 truncate">
              {userName}
            </p>
            <p className="text-[11px] text-stone-500 truncate">{userEmail}</p>
          </div>

          <Link
            href="/profile"
            onClick={() => setProfileMenuOpen(false)}
            className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer mb-1"
          >
            <UserIcon className="h-4 w-4 text-stone-500" />
            <span>My Profile</span>
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-terracotta-700 hover:bg-terracotta-50 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      <div
        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
        title={isCollapsed ? `${userName} (${role})` : undefined}
        className={cn(
          "flex items-center rounded-xl bg-oatmeal-100/90 transition-colors cursor-pointer hover:bg-oatmeal-200/90",
          isCollapsed ? "justify-center p-2" : "gap-3 p-2.5"
        )}
      >
        {user?.image ? (
          <img
            src={user.image}
            alt={userName}
            className="h-9 w-9 rounded-lg object-cover shadow-xs border border-stone-200/80 shrink-0"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-botanical-700 text-paper font-bold text-sm shadow-xs shrink-0">
            {initials}
          </div>
        )}
        {!isCollapsed && (
          <>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-xs font-semibold text-botanical-900">
                  {userName}
                </p>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              </div>
              <p className="truncate text-[11px] text-stone-500 capitalize">
                {role}
              </p>
            </div>
            <Settings className="h-4 w-4 text-stone-400 hover:text-botanical-800 shrink-0" />
          </>
        )}
      </div>
    </div>
  );
}
