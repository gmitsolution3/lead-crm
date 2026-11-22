"use client";

import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  UserCheck,
  Clock,
  Ban,
  CheckCircle2,
  Calendar,
  Mail,
  Phone,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  User as UserIcon,
  Fingerprint,
  RefreshCw,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";
import type { ManagedUser } from "./UserManagementSystem";

interface UserDetailSheetProps {
  user: ManagedUser | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  onUpdateRole?: (userId: string, newRole: "admin" | "moderator" | "user") => void;
  onOpenBanModal?: (user: ManagedUser) => void;
  onUnbanUser?: (userId: string, userName: string) => void;
  onOpenDeleteModal?: (user: ManagedUser) => void;
  isProcessing?: boolean;
}

export function UserDetailSheet({
  user,
  isOpen,
  onClose,
  currentUserId,
  onUpdateRole,
  onOpenBanModal,
  onUnbanUser,
  onOpenDeleteModal,
  isProcessing = false,
}: UserDetailSheetProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!user) return null;

  const isCurrentUser = user.id === currentUserId;
  const isBanned = user.banned;
  const userRole = (user.role || "user").toLowerCase();
  const isAdmin = userRole === "admin";
  const isModerator = userRole === "moderator";
  const isPending = !isAdmin && !isModerator;

  const copyToClipboard = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getAccountAge = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) return "Registered today";
      if (diffDays === 1) return "1 day ago";
      return `${diffDays} days active`;
    } catch {
      return "Active";
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto bg-[#FCFBF8] border-l border-stone-200/90 p-6 sm:p-10 text-stone-800 shadow-2xl"
      >
        {/* Header Section */}
        <div className="relative pb-6 border-b border-stone-200">
          {/* Top Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {isAdmin ? (
              <Badge
                variant="terracotta"
                className="text-xs px-2.5 py-0.5 rounded-full font-semibold gap-1"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Administrator</span>
              </Badge>
            ) : isModerator ? (
              <Badge
                variant="sage"
                className="text-xs px-2.5 py-0.5 rounded-full font-semibold gap-1 bg-sage-200/90 text-botanical-900 border border-sage-300"
              >
                <UserCheck className="h-3.5 w-3.5 text-botanical-700" />
                <span>Moderator</span>
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-xs px-2.5 py-0.5 rounded-full font-semibold gap-1 text-amber-800 bg-amber-50 border-amber-300"
              >
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                <span>Pending Approval</span>
              </Badge>
            )}

            {/* Status Badge */}
            {isBanned ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
                <Ban className="h-3.5 w-3.5 text-red-700" />
                <span>Suspended</span>
              </span>
            ) : isAdmin || isModerator ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                <span>Active Account</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                <Clock className="h-3.5 w-3.5 text-amber-700" />
                <span>Awaiting Role</span>
              </span>
            )}

            {isCurrentUser && (
              <span className="text-xs font-bold bg-sage-200 text-botanical-900 px-2.5 py-0.5 rounded-full">
                Your Account
              </span>
            )}

            <span className="text-xs text-stone-400 ml-auto flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(user.createdAt)}
            </span>
          </div>

          {/* User Name & Avatar */}
          <div className="flex items-center gap-3.5 mt-2">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="h-14 w-14 rounded-2xl object-cover border border-stone-200/90 shadow-sm shrink-0"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-botanical-700 text-paper font-bold text-lg shadow-sm shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-2xl sm:text-3xl font-bold text-botanical-900 tracking-tight leading-tight truncate">
                {user.name}
              </SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-stone-500 truncate flex items-center gap-1">
                  <Mail className="h-3 w-3 text-stone-400 shrink-0" />
                  <span>{user.email}</span>
                </p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(user.email, "email")}
                  title="Copy email address"
                  className="text-stone-400 hover:text-botanical-800 cursor-pointer p-0.5 rounded transition-colors"
                >
                  {copiedField === "email" ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Paper Body Content */}
        <div className="mt-6 space-y-6">
          {/* BAN ALERT BANNER IF USER IS SUSPENDED */}
          {isBanned && (
            <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4 shadow-sm animate-in fade-in space-y-2">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-red-900 uppercase tracking-wide">
                    Account Currently Suspended
                  </h4>
                  <p className="text-xs text-red-800 mt-1 leading-relaxed">
                    <strong>Reason:</strong> {user.banReason || "Administrative suspension"}
                  </p>
                  <p className="text-[11px] text-red-700/80 mt-0.5">
                    <strong>Expiration:</strong>{" "}
                    {user.banExpires ? formatDateTime(user.banExpires) : "Indefinite / Permanent"}
                  </p>
                </div>
              </div>

              {!isCurrentUser && onUnbanUser && (
                <div className="pt-2 border-t border-red-200/80 flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isProcessing}
                    onClick={() => onUnbanUser(user.id, user.name)}
                    className="h-8 rounded-xl border-red-300 text-red-800 hover:bg-red-100 text-xs font-semibold cursor-pointer gap-1.5"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Lift Suspension (Unban)</span>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* SECTION 1: ACCOUNT PARAMETERS OVERVIEW */}
          <div className="rounded-2xl border border-stone-200 bg-paper p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-botanical-100 text-botanical-800">
                <UserIcon className="h-4 w-4 text-botanical-700" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-botanical-900">
                  Account Authority & Identity
                </h4>
                <p className="text-[11px] text-stone-400">
                  System access level and registration parameters
                </p>
              </div>
            </div>

            {/* 2x2 Grid for Key Properties */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* System Role */}
              <div className="p-3 rounded-xl bg-oatmeal-100/50 border border-stone-200/70 space-y-1">
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                  Console Role
                </span>
                <p className="text-sm font-bold text-botanical-900 capitalize">
                  {user.role}
                </p>
                <p className="text-[10px] text-stone-500">
                  {isAdmin
                    ? "Full administration"
                    : isModerator
                    ? "Manage leads & groups"
                    : "Awaiting admin authorization"}
                </p>
              </div>

              {/* Status */}
              <div className="p-3 rounded-xl bg-oatmeal-100/50 border border-stone-200/70 space-y-1">
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                  Status
                </span>
                <p
                  className={`text-sm font-bold ${
                    isBanned
                      ? "text-red-700"
                      : isAdmin || isModerator
                      ? "text-emerald-800"
                      : "text-amber-700"
                  }`}
                >
                  {isBanned ? "Suspended" : isAdmin || isModerator ? "Authorized" : "Pending"}
                </p>
                <p className="text-[10px] text-stone-500">
                  {isBanned ? "Login blocked" : "Active session enabled"}
                </p>
              </div>

              {/* Phone */}
              <div className="p-3 rounded-xl bg-oatmeal-100/50 border border-stone-200/70 space-y-1">
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                  Phone Number
                </span>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-stone-800 truncate">
                    {user.phone || "No phone listed"}
                  </p>
                  {user.phone && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(user.phone || "", "phone")}
                      className="text-stone-400 hover:text-botanical-800 cursor-pointer"
                    >
                      {copiedField === "phone" ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-stone-500">Contact extension</p>
              </div>

              {/* Account Tenure */}
              <div className="p-3 rounded-xl bg-oatmeal-100/50 border border-stone-200/70 space-y-1">
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                  Account Age
                </span>
                <p className="text-xs font-bold text-stone-800">
                  {getAccountAge(user.createdAt)}
                </p>
                <p className="text-[10px] text-stone-500">
                  Joined {formatDate(user.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 2: TECHNICAL & AUDIT METADATA */}
          <div className="rounded-2xl border border-stone-200 bg-paper p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-botanical-100 text-botanical-800">
                <Fingerprint className="h-4 w-4 text-botanical-700" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-botanical-900">
                  Database & Audit Trail
                </h4>
                <p className="text-[11px] text-stone-400">
                  MongoDB record identifiers and system timestamps
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {/* User ID */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-oatmeal-100/60 border border-stone-200/60">
                <span className="text-stone-500 font-medium">Record ID:</span>
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-stone-800">
                  <span>{user.id}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(user.id, "id")}
                    title="Copy User ID"
                    className="text-stone-400 hover:text-botanical-800 cursor-pointer"
                  >
                    {copiedField === "id" ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>

              {/* Registration Date */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-oatmeal-100/60 border border-stone-200/60">
                <span className="text-stone-500 font-medium">Created At:</span>
                <span className="text-stone-800 font-medium">
                  {formatDateTime(user.createdAt)}
                </span>
              </div>

              {/* Last Updated */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-oatmeal-100/60 border border-stone-200/60">
                <span className="text-stone-500 font-medium">Last Modified:</span>
                <span className="text-stone-800 font-medium">
                  {formatDateTime(user.updatedAt)}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: ROLE & ACCESS MANAGEMENT (ADMIN ACTIONS) */}
          {!isCurrentUser && onUpdateRole && (
            <div className="rounded-2xl border border-stone-200 bg-paper p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-botanical-100 text-botanical-800">
                  <ShieldCheck className="h-4 w-4 text-botanical-700" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-botanical-900">
                    Role & Authority Controls
                  </h4>
                  <p className="text-[11px] text-stone-400">
                    Promote or demote user authority across the workspace
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Promote to Admin */}
                <Button
                  size="sm"
                  variant={isAdmin ? "default" : "outline"}
                  disabled={isProcessing || isAdmin}
                  onClick={() => onUpdateRole(user.id, "admin")}
                  className={`h-9 text-xs rounded-xl cursor-pointer ${
                    isAdmin
                      ? "bg-terracotta-600 text-white cursor-default"
                      : "border-stone-200 hover:border-terracotta-400 hover:text-terracotta-800"
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                  <span>{isAdmin ? "Current Admin" : "Make Admin"}</span>
                </Button>

                {/* Set as Moderator */}
                <Button
                  size="sm"
                  variant={isModerator ? "default" : "outline"}
                  disabled={isProcessing || isModerator}
                  onClick={() => onUpdateRole(user.id, "moderator")}
                  className={`h-9 text-xs rounded-xl cursor-pointer ${
                    isModerator
                      ? "bg-botanical-700 text-white cursor-default"
                      : "border-stone-200 hover:border-botanical-500 hover:text-botanical-800"
                  }`}
                >
                  <UserCheck className="h-3.5 w-3.5 mr-1" />
                  <span>{isModerator ? "Current Moderator" : "Make Moderator"}</span>
                </Button>

                {/* Demote to User */}
                <Button
                  size="sm"
                  variant={isPending ? "default" : "outline"}
                  disabled={isProcessing || isPending}
                  onClick={() => onUpdateRole(user.id, "user")}
                  className={`h-9 text-xs rounded-xl cursor-pointer ${
                    isPending
                      ? "bg-amber-600 text-white cursor-default"
                      : "border-stone-200 hover:border-amber-400 hover:text-amber-800"
                  }`}
                >
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  <span>{isPending ? "Pending User" : "Demote to User"}</span>
                </Button>
              </div>
            </div>
          )}

          {/* DANGER ZONE: BAN & DELETE CONTROLS */}
          {!isCurrentUser && (onOpenBanModal || onOpenDeleteModal) && (
            <div className="rounded-2xl border border-terracotta-200/80 bg-terracotta-50/40 p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-terracotta-600 shrink-0" />
                <span className="text-xs font-bold text-terracotta-900 uppercase tracking-wider">
                  Account Governance & Security
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                Suspend user access or purge the user and associated session tokens from the MongoDB database.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* Ban / Unban Button */}
                {!isBanned && onOpenBanModal && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isProcessing}
                    onClick={() => onOpenBanModal(user)}
                    className="h-8.5 rounded-xl border-stone-200 hover:border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold cursor-pointer gap-1.5"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    <span>Suspend User</span>
                  </Button>
                )}

                {/* Delete User Button */}
                {onOpenDeleteModal && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isProcessing}
                    onClick={() => onOpenDeleteModal(user)}
                    className="h-8.5 rounded-xl text-terracotta-700 hover:bg-terracotta-100 text-xs font-semibold cursor-pointer gap-1.5 ml-auto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete User Permanently</span>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-stone-200 flex items-center justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-9 px-5 rounded-xl border-stone-200 text-xs font-medium text-stone-700 hover:bg-oatmeal-100 cursor-pointer"
          >
            Close Profile
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
