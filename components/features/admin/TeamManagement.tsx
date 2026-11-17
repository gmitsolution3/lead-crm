"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  UserCheck,
  Clock,
  Users,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  Shield,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession } from "@/lib/auth-client";

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  createdAt: string;
}

export function TeamManagement() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load team users");
      }
      setUsers(data.users || []);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to load users from database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: "admin" | "user") => {
    setUpdatingUserId(userId);
    setActionFeedback(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update role");
      }

      setActionFeedback(
        newRole === "admin"
          ? "User promoted to Administrator! They can now log in immediately."
          : "User demoted to pending user status."
      );

      // Refresh list
      await fetchUsers();
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to update user status");
    } finally {
      setUpdatingUserId(null);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchFilter.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const pendingCount = users.filter((u) => u.role !== "admin").length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-stone-200/90 bg-[#FCFBF8] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-botanical-100 text-botanical-800">
              <ShieldCheck className="h-4 w-4 text-botanical-700" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-botanical-700">
              Access Gatekeeper
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-botanical-900">
            Admin Team & Access Management
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Review registered accounts and promote pending members to Administrator to grant login access.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={loading}
            className="h-9 gap-1.5 rounded-xl border-stone-200 text-xs text-stone-700 hover:text-botanical-900 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Users</span>
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Registered */}
        <div className="rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Total Profiles
            </span>
            <Users className="h-4 w-4 text-stone-400" />
          </div>
          <p className="text-2xl font-bold text-botanical-900">{totalUsers}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">In MongoDB user collection</p>
        </div>

        {/* Active Admins */}
        <div className="rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Active Administrators
            </span>
            <ShieldCheck className="h-4 w-4 text-terracotta-600" />
          </div>
          <p className="text-2xl font-bold text-botanical-900">{adminCount}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Can login & manage leads</p>
        </div>

        {/* Pending Approval */}
        <div className="rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Pending Approval
            </span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-terracotta-600">{pendingCount}</p>
            {pendingCount > 0 && (
              <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Action Needed
              </span>
            )}
          </div>
          <p className="text-[11px] text-stone-400 mt-0.5">Cannot login until promoted</p>
        </div>
      </div>

      {/* Notifications */}
      {actionFeedback && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-900 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-terracotta-50 border border-terracotta-200 p-3.5 text-xs text-terracotta-900 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-terracotta-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Users Table Card */}
      <div className="rounded-3xl border border-stone-200/90 bg-[#FCFBF8] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-stone-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
            <Input
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search by name, email, or role..."
              className="h-9 pl-8 text-xs bg-oatmeal-100/50 border-stone-200"
            />
          </div>

          <span className="text-xs text-stone-400">
            Showing {filteredUsers.length} of {totalUsers} registered users
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-oatmeal-100/40">
              <TableRow>
                <TableHead className="text-xs">User / Administrator</TableHead>
                <TableHead className="text-xs">Contact Details</TableHead>
                <TableHead className="text-xs">Access Status</TableHead>
                <TableHead className="text-xs">Registered</TableHead>
                <TableHead className="text-xs text-right">Admin Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-36 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-stone-400 text-xs">
                      <Loader2 className="h-5 w-5 animate-spin text-botanical-700" />
                      <span>Reading MongoDB users...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-xs text-stone-400">
                    No users match your query.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrentUser = user.id === currentUserId;
                  const isAdmin = user.role === "admin";
                  const isUpdating = updatingUserId === user.id;

                  return (
                    <TableRow key={user.id} className="border-b border-stone-200/60 hover:bg-sage-50/30">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                            isAdmin
                              ? "bg-botanical-700 text-paper"
                              : "bg-stone-200 text-stone-700"
                          }`}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-botanical-900">
                                {user.name}
                              </span>
                              {isCurrentUser && (
                                <span className="rounded-md bg-sage-200/80 px-1.5 py-0.2 text-[9px] font-bold text-botanical-800">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-stone-400">{user.email}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="text-xs text-stone-600">
                          {user.phone || "—"}
                        </span>
                      </TableCell>

                      <TableCell>
                        {isAdmin ? (
                          <Badge variant="terracotta" className="text-[10px] gap-1 font-semibold">
                            <ShieldCheck className="h-3 w-3" />
                            <span>Administrator</span>
                          </Badge>
                        ) : (
                          <Badge variant="sage" className="text-[10px] gap-1 font-semibold">
                            <Clock className="h-3 w-3 text-amber-600" />
                            <span>Pending Approval</span>
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        <span className="text-xs text-stone-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        {isCurrentUser ? (
                          <span className="text-[11px] text-stone-400 italic">
                            Current Session
                          </span>
                        ) : !isAdmin ? (
                          <Button
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleRoleChange(user.id, "admin")}
                            className="h-8 gap-1 rounded-xl bg-botanical-700 hover:bg-botanical-800 text-paper text-xs font-medium cursor-pointer shadow-xs"
                          >
                            {isUpdating ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ShieldCheck className="h-3.5 w-3.5 text-sage-200" />
                            )}
                            <span>Promote to Admin</span>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleRoleChange(user.id, "user")}
                            className="h-8 rounded-xl border-stone-200 text-xs text-stone-500 hover:text-terracotta-700 hover:bg-terracotta-50 cursor-pointer"
                          >
                            {isUpdating ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <span>Revoke Admin</span>
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
