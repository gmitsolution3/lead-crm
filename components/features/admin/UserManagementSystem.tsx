"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession } from "@/lib/auth-client";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  MoreVertical,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  image?: string | null;
  imagePublicId?: string | null;
  banned: boolean;
  banReason?: string | null;
  banExpires?: string | null;
  createdAt: string;
  updatedAt: string;
}

export function UserManagementSystem() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialSearch = searchParams?.get("search") || "";
  const initialRole = (searchParams?.get("role") as any) || "all";
  const initialStatus = (searchParams?.get("status") as any) || "all";

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [roleFilter, setRoleFilter] = useState<
    "all" | "admin" | "user"
  >(initialRole);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "banned" | "pending"
  >(initialStatus);

  // Sync URL query params with current filter state
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (roleFilter !== "all") params.set("role", roleFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);

    const qs = params.toString();
    const newUrl = qs ? `${pathname}?${qs}` : pathname;
    window.history.replaceState(null, "", newUrl);
  }, [searchQuery, roleFilter, statusFilter, pathname]);

  // Action states
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Modals state
  const [banModalUser, setBanModalUser] =
    useState<ManagedUser | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banDays, setBanDays] = useState<number | "permanent">(
    "permanent",
  );

  const [deleteModalUser, setDeleteModalUser] =
    useState<ManagedUser | null>(null);
  const [detailModalUser, setDetailModalUser] =
    useState<ManagedUser | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load users");
      }
      setUsers(data.users || []);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Failed to query users from MongoDB",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Update Role (Promote / Demote)
  const handleUpdateRole = async (
    userId: string,
    newRole: "admin" | "user",
  ) => {
    setIsProcessing(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFeedback({
        type: "success",
        message:
          newRole === "admin"
            ? "User promoted to Administrator! Login access granted."
            : "User demoted to pending user status.",
      });
      await fetchUsers();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Role update failed",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Ban User
  const handleConfirmBan = async () => {
    if (!banModalUser) return;
    setIsProcessing(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: banModalUser.id,
          action: "ban",
          banReason: banReason || "Administrative suspension",
          banExpiresInDays: banDays === "permanent" ? null : banDays,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFeedback({
        type: "success",
        message: `Account for ${banModalUser.name} has been banned and all active sessions revoked.`,
      });
      setBanModalUser(null);
      setBanReason("");
      await fetchUsers();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Failed to ban user",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Unban User
  const handleUnbanUser = async (
    userId: string,
    userName: string,
  ) => {
    setIsProcessing(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "unban",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFeedback({
        type: "success",
        message: `Account for ${userName} has been unbanned.`,
      });
      await fetchUsers();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Failed to unban user",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete User
  const handleConfirmDelete = async () => {
    if (!deleteModalUser) return;
    setIsProcessing(true);
    setFeedback(null);

    try {
      const res = await fetch(
        `/api/admin/users?userId=${deleteModalUser.id}`,
        {
          method: "DELETE",
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFeedback({
        type: "success",
        message: `User ${deleteModalUser.name} (${deleteModalUser.email}) and all session data purged permanently.`,
      });
      setDeleteModalUser(null);
      await fetchUsers();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Failed to delete user",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.toLowerCase().includes(q)) ||
      u.id.toLowerCase().includes(q);

    const matchesRole = roleFilter === "all" || u.role === roleFilter;

    let matchesStatus = true;
    if (statusFilter === "banned") {
      matchesStatus = u.banned;
    } else if (statusFilter === "pending") {
      matchesStatus = !u.banned && u.role === "user";
    } else if (statusFilter === "active") {
      matchesStatus = !u.banned && u.role === "admin";
    }

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Metrics
  const totalCount = users.length;
  const adminCount = users.filter(
    (u) => !u.banned && u.role === "admin",
  ).length;
  const pendingCount = users.filter(
    (u) => !u.banned && u.role === "user",
  ).length;
  const bannedCount = users.filter((u) => u.banned).length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-stone-200/90 bg-[#FCFBF8] p-6 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-botanical-100 text-botanical-800">
              <Users className="h-4 w-4 text-botanical-700" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-botanical-700">
              Directory Control
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-botanical-900">
            User Management System
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Browse users, search records, update access roles, enforce
            account bans, and remove profiles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => fetchUsers()}
            disabled={loading || isProcessing}
            className="h-10 gap-2 rounded-xl border-stone-200 bg-paper text-xs text-stone-700 hover:text-botanical-900 shadow-xs cursor-pointer"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span>Refresh Directory</span>
          </Button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Registered */}
        <div className="rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Total Users
            </span>
            <Users className="h-4 w-4 text-stone-400" />
          </div>
          <p className="text-2xl font-bold text-botanical-900">
            {totalCount}
          </p>
          <p className="text-[11px] text-stone-400 mt-0.5">
            MongoDB user collection
          </p>
        </div>

        {/* Active Admins */}
        <div className="rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Active Admins
            </span>
            <ShieldCheck className="h-4 w-4 text-terracotta-600" />
          </div>
          <p className="text-2xl font-bold text-botanical-900">
            {adminCount}
          </p>
          <p className="text-[11px] text-stone-400 mt-0.5">
            Full console authority
          </p>
        </div>

        {/* Pending Approvals */}
        <div className="rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Pending Approval
            </span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-terracotta-600">
              {pendingCount}
            </p>
            {pendingCount > 0 && (
              <span className="text-[9px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded-md">
                Action Required
              </span>
            )}
          </div>
          <p className="text-[11px] text-stone-400 mt-0.5">
            Awaiting promotion
          </p>
        </div>

        {/* Banned Users */}
        <div className="rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Banned Accounts
            </span>
            <Ban className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-stone-800">
            {bannedCount}
          </p>
          <p className="text-[11px] text-stone-400 mt-0.5">
            Access suspended
          </p>
        </div>
      </div>

      {/* Notifications / Feedback Alert */}
      {feedback && (
        <div
          className={`flex items-start gap-2.5 rounded-2xl p-4 text-xs animate-in fade-in ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
              : "bg-terracotta-50 border border-terracotta-200 text-terracotta-900"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-terracotta-600 mt-0.5" />
          )}
          <span className="flex-1 leading-relaxed">
            {feedback.message}
          </span>
          <button
            onClick={() => setFeedback(null)}
            className="text-stone-400 hover:text-stone-600 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* User Directory Table Card */}
      <div className="rounded-3xl border border-stone-200/90 bg-[#FCFBF8] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        {/* Search & Filter Toolbar */}
        <div className="p-4 sm:p-5 border-b border-stone-200/80 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-oatmeal-100/30">
          <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, email, phone, or ID..."
                className="h-9.5 pl-9 text-xs sm:text-sm bg-paper border-stone-200 focus:bg-paper"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Role Filter */}
            <div className="w-full sm:w-44">
              <Select
                value={roleFilter}
                onValueChange={(val: any) =>
                  setRoleFilter(val ?? "all")
                }
              >
                <SelectTrigger
                  size="sm"
                  className="h-9.5 text-xs bg-paper border-stone-200"
                >
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">
                    Administrator Only
                  </SelectItem>
                  <SelectItem value="user">
                    User (Pending) Only
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-44">
              <Select
                value={statusFilter}
                onValueChange={(val: any) =>
                  setStatusFilter(val ?? "all")
                }
              >
                <SelectTrigger
                  size="sm"
                  className="h-9.5 text-xs bg-paper border-stone-200"
                >
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">
                    Active (Admin)
                  </SelectItem>
                  <SelectItem value="pending">
                    Pending Approval
                  </SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <span className="text-xs text-stone-500 font-medium shrink-0">
            Showing{" "}
            <strong className="text-botanical-900">
              {filteredUsers.length}
            </strong>{" "}
            of {totalCount} users
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-oatmeal-100/50">
              <TableRow>
                <TableHead className="text-xs font-semibold text-stone-600">
                  User Identity
                </TableHead>
                <TableHead className="text-xs font-semibold text-stone-600">
                  Contact
                </TableHead>
                <TableHead className="text-xs font-semibold text-stone-600">
                  Role & Access
                </TableHead>
                <TableHead className="text-xs font-semibold text-stone-600">
                  Account Status
                </TableHead>
                <TableHead className="text-xs font-semibold text-stone-600">
                  Registered
                </TableHead>
                <TableHead className="text-xs font-semibold text-stone-600 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-stone-400 text-xs">
                      <Loader2 className="h-5 w-5 animate-spin text-botanical-700" />
                      <span>
                        Loading user directory from MongoDB...
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-1.5 text-stone-400 text-xs">
                      <Users className="h-6 w-6 text-stone-300" />
                      <p className="font-semibold text-stone-600">
                        No matching users found
                      </p>
                      <p className="text-[11px]">
                        Try adjusting your search query or status
                        filter.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrentUser = user.id === currentUserId;
                  const isAdmin = user.role === "admin";
                  const isBanned = user.banned;

                  return (
                    <TableRow
                      key={user.id}
                      className="border-b border-stone-200/60 hover:bg-sage-50/20 transition-colors"
                    >
                      {/* Identity */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.name}
                              className="h-9 w-9 shrink-0 rounded-xl object-cover shadow-xs border border-stone-200"
                            />
                          ) : (
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-xs shadow-xs ${
                                isBanned
                                  ? "bg-red-100 text-red-700 border border-red-200"
                                  : isAdmin
                                    ? "bg-botanical-700 text-paper"
                                    : "bg-sage-200 text-botanical-900"
                              }`}
                            >
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-botanical-900 truncate">
                                {user.name}
                              </span>
                              {isCurrentUser && (
                                <span className="rounded-md bg-sage-200 px-1.5 py-0.2 text-[9px] font-bold text-botanical-800">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-stone-400 block truncate">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Contact */}
                      <TableCell>
                        <span className="text-xs text-stone-600">
                          {user.phone || (
                            <span className="text-stone-300 italic">
                              No phone
                            </span>
                          )}
                        </span>
                      </TableCell>

                      {/* Role */}
                      <TableCell>
                        {isAdmin ? (
                          <Badge
                            variant="terracotta"
                            className="text-[10px] gap-1 font-semibold"
                          >
                            <ShieldCheck className="h-3 w-3" />
                            <span>Administrator</span>
                          </Badge>
                        ) : (
                          <Badge
                            variant="sage"
                            className="text-[10px] gap-1 font-semibold"
                          >
                            <Clock className="h-3 w-3 text-amber-600" />
                            <span>User (Pending)</span>
                          </Badge>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {isBanned ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800 border border-red-200">
                            <Ban className="h-3 w-3" />
                            <span>Banned</span>
                          </span>
                        ) : isAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="h-3 w-3" />
                            <span>Awaiting Role</span>
                          </span>
                        )}
                      </TableCell>

                      {/* Registered Date */}
                      <TableCell>
                        <span className="text-xs text-stone-500">
                          {new Date(
                            user.createdAt,
                          ).toLocaleDateString()}
                        </span>
                      </TableCell>

                      {/* Action Dropdown & Quick Buttons */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Promotion button for pending users */}
                          {!isAdmin && !isBanned && (
                            <Button
                              size="sm"
                              disabled={isProcessing}
                              onClick={() =>
                                handleUpdateRole(user.id, "admin")
                              }
                              className="h-8 gap-1 rounded-xl bg-botanical-700 hover:bg-botanical-800 text-paper text-xs font-medium cursor-pointer shadow-xs"
                            >
                              <ShieldCheck className="h-3.5 w-3.5 text-sage-200" />
                              <span>Promote</span>
                            </Button>
                          )}

                          {/* Quick Unban button */}
                          {isBanned && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isProcessing}
                              onClick={() =>
                                handleUnbanUser(user.id, user.name)
                              }
                              className="h-8 gap-1 rounded-xl border-emerald-300 bg-emerald-50 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 cursor-pointer shadow-xs"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Unban</span>
                            </Button>
                          )}

                          {/* Actions Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="h-8 w-8 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-oatmeal-200 cursor-pointer"
                                />
                              }
                            >
                              <MoreVertical className="h-4 w-4" />
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                              align="end"
                              className="w-48 p-1.5 bg-[#FCFBF8] border-stone-200"
                            >
                              <DropdownMenuGroup>
                                <DropdownMenuLabel className="text-[10px] uppercase font-bold text-stone-400 px-2 py-1">
                                  User Actions
                                </DropdownMenuLabel>

                                {/* View Details */}
                                <DropdownMenuItem
                                  onClick={() =>
                                    setDetailModalUser(user)
                                  }
                                  className="text-xs font-medium cursor-pointer gap-2"
                                >
                                  <Info className="h-3.5 w-3.5 text-stone-500" />
                                  <span>View Details</span>
                                </DropdownMenuItem>
                              </DropdownMenuGroup>

                              <DropdownMenuSeparator className="my-1 bg-stone-200/80" />

                              {/* Role Changes */}
                              {!isCurrentUser && !isBanned && (
                                <DropdownMenuGroup>
                                  {isAdmin ? (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleUpdateRole(
                                          user.id,
                                          "user",
                                        )
                                      }
                                      className="text-xs font-medium cursor-pointer gap-2 text-stone-700"
                                    >
                                      <Clock className="h-3.5 w-3.5 text-amber-600" />
                                      <span>Demote to User</span>
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleUpdateRole(
                                          user.id,
                                          "admin",
                                        )
                                      }
                                      className="text-xs font-medium cursor-pointer gap-2 text-botanical-800"
                                    >
                                      <ShieldCheck className="h-3.5 w-3.5 text-botanical-700" />
                                      <span>Promote to Admin</span>
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuGroup>
                              )}

                              {/* Ban / Unban */}
                              {!isCurrentUser && (
                                <DropdownMenuGroup>
                                  {isBanned ? (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleUnbanUser(
                                          user.id,
                                          user.name,
                                        )
                                      }
                                      className="text-xs font-medium cursor-pointer gap-2 text-emerald-800"
                                    >
                                      <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                                      <span>Lift Account Ban</span>
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setBanModalUser(user)
                                      }
                                      className="text-xs font-medium cursor-pointer gap-2 text-red-700 focus:text-red-800 focus:bg-red-50"
                                    >
                                      <Ban className="h-3.5 w-3.5 text-red-600" />
                                      <span>Ban User...</span>
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuGroup>
                              )}

                              {/* Delete User */}
                              {!isCurrentUser && (
                                <DropdownMenuGroup>
                                  <DropdownMenuSeparator className="my-1 bg-stone-200/80" />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setDeleteModalUser(user)
                                    }
                                    className="text-xs font-medium cursor-pointer gap-2 text-red-700 focus:text-red-800 focus:bg-red-50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-red-600" />
                                    <span>Delete Permanently...</span>
                                  </DropdownMenuItem>
                                </DropdownMenuGroup>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* MODAL 1: BAN USER MODAL */}
      {banModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-stone-200 bg-[#FCFBF8] p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setBanModalUser(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-700">
                <Ban className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-botanical-900">
                  Ban User Account
                </h3>
                <p className="text-xs text-stone-500">
                  Revoke login privileges & sessions
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-oatmeal-100/70 border border-stone-200/70 text-xs text-stone-700 space-y-1">
              <p>
                Target:{" "}
                <strong className="text-botanical-900">
                  {banModalUser.name}
                </strong>{" "}
                ({banModalUser.email})
              </p>
              <p className="text-[11px] text-stone-500">
                Banning this user will immediately terminate any
                active browser sessions and reject all subsequent
                login attempts.
              </p>
            </div>

            {/* Presets */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">
                Ban Reason Presets
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Policy violation",
                  "Suspicious scraping activity",
                  "Offboarded personnel",
                  "Security audit flag",
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setBanReason(reason)}
                    className="px-2.5 py-1 rounded-lg border border-stone-200 bg-paper text-[11px] font-medium text-stone-600 hover:bg-stone-100 cursor-pointer"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">
                Custom Reason
              </Label>
              <Input
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Enter specific reason for account suspension..."
                className="text-xs bg-paper border-stone-200"
              />
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">
                Ban Duration
              </Label>
              <Select
                value={String(banDays)}
                onValueChange={(val: any) =>
                  setBanDays(
                    val === "permanent" ? "permanent" : Number(val),
                  )
                }
              >
                <SelectTrigger className="w-full h-10 text-xs bg-paper border-stone-200">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">
                    Permanent (Indefinite)
                  </SelectItem>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="90">90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="destructive"
                disabled={isProcessing}
                onClick={handleConfirmBan}
                className="flex-1 h-10 rounded-xl text-xs font-medium cursor-pointer"
              >
                {isProcessing
                  ? "Processing ban..."
                  : "Confirm & Ban User"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setBanModalUser(null)}
                className="h-10 rounded-xl border-stone-200 text-xs cursor-pointer"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DELETE USER MODAL */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-red-200 bg-[#FCFBF8] p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setDeleteModalUser(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-700">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-900">
                  Delete User Permanently
                </h3>
                <p className="text-xs text-stone-500">
                  Irreversible MongoDB cascade deletion
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200 text-xs text-red-900 space-y-2">
              <p>
                Are you sure you want to delete{" "}
                <strong className="font-bold">
                  {deleteModalUser.name}
                </strong>{" "}
                ({deleteModalUser.email})?
              </p>
              <p className="text-[11px] text-red-700 leading-relaxed">
                This will completely remove the user document, delete
                all linked authentication accounts, and invalidate all
                associated sessions from MongoDB.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="destructive"
                disabled={isProcessing}
                onClick={handleConfirmDelete}
                className="flex-1 h-10 rounded-xl text-xs font-medium cursor-pointer bg-red-600 hover:bg-red-700"
              >
                {isProcessing
                  ? "Purging data..."
                  : "Delete User Permanently"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeleteModalUser(null)}
                className="h-10 rounded-xl border-stone-200 text-xs cursor-pointer"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW USER DETAIL MODAL */}
      {detailModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-stone-200 bg-[#FCFBF8] p-6 shadow-2xl space-y-5">
            <button
              onClick={() => setDetailModalUser(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-botanical-700 text-paper font-bold text-base">
                {detailModalUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-botanical-900">
                  {detailModalUser.name}
                </h3>
                <p className="text-xs text-stone-500">
                  {detailModalUser.email}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-oatmeal-100/70 p-4 border border-stone-200/70 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-stone-200/60">
                <span className="text-stone-500">User ID:</span>
                <span className="text-stone-800 font-medium">
                  {detailModalUser.id}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Phone:</span>
                <span className="text-stone-800 font-medium">
                  {detailModalUser.phone || "None registered"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200/60">
                <span className="text-stone-500">System Role:</span>
                <Badge
                  variant={
                    detailModalUser.role === "admin"
                      ? "terracotta"
                      : "sage"
                  }
                  className="text-[10px] uppercase"
                >
                  {detailModalUser.role}
                </Badge>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200/60">
                <span className="text-stone-500">
                  Account Status:
                </span>
                <span
                  className={`font-semibold ${detailModalUser.banned ? "text-red-600" : "text-emerald-700"}`}
                >
                  {detailModalUser.banned
                    ? "Suspended (Banned)"
                    : "Active"}
                </span>
              </div>
              {detailModalUser.banned && (
                <>
                  <div className="flex justify-between py-1 border-b border-stone-200/60">
                    <span className="text-stone-500">
                      Ban Reason:
                    </span>
                    <span className="text-red-700 font-medium">
                      {detailModalUser.banReason || "Not specified"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-200/60">
                    <span className="text-stone-500">
                      Ban Expires:
                    </span>
                    <span className="text-stone-800">
                      {detailModalUser.banExpires
                        ? new Date(
                            detailModalUser.banExpires,
                          ).toLocaleString()
                        : "Permanent"}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between py-1 border-b border-stone-200/60">
                <span className="text-stone-500">
                  Registration Date:
                </span>
                <span className="text-stone-800">
                  {new Date(
                    detailModalUser.createdAt,
                  ).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-stone-500">Last Modified:</span>
                <span className="text-stone-800">
                  {new Date(
                    detailModalUser.updatedAt,
                  ).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setDetailModalUser(null)}
                className="h-9.5 px-5 rounded-xl border-stone-200 text-xs cursor-pointer"
              >
                Close Profile
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
