"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { mockLeads, mockSearchGroups } from "@/lib/mock-data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/lib/auth-client";
import {
  Settings,
  User,
  Shield,
  Key,
  Database,
  Lock,
  Camera,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Calendar,
  Mail,
  Phone,
  Laptop,
} from "lucide-react";

interface SettingsDashboardProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role?: string;
    phone?: string;
    image?: string;
    imagePublicId?: string;
  };
}

interface UserProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  image: string | null;
  imagePublicId: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function SettingsDashboard({ user: initialUser }: SettingsDashboardProps) {
  const { data: session } = useSession();

  const [activeTab, setActiveTab] = useState<string>("settings");
  const [globalSearch, setGlobalSearch] = useState<string>("");
  const [activeSection, setActiveSection] = useState<
    "profile" | "workspace" | "security"
  >("profile");

  // User Profile State
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Profile Edit Form State
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Avatar Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const [avatarFeedback, setAvatarFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Dummy Extension & Workspace State
  const [extensionApiKey, setExtensionApiKey] = useState(
    "vdt_live_84f93c019d42eb78a1bc8942e8d3fa"
  );
  const [copiedKey, setCopiedKey] = useState(false);
  const [dailyLimit, setDailyLimit] = useState("500");

  // Fetch live user profile from MongoDB via Next.js internal API
  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setProfile(data.user);
          setEditName(data.user.name || "");
          setEditPhone(data.user.phone || "");
        }
      } else {
        // Fallback to initial prop / session
        const fallback: UserProfileData = {
          id: initialUser?.id || session?.user?.id || "",
          name: initialUser?.name || session?.user?.name || "Administrator",
          email: initialUser?.email || session?.user?.email || "admin@gmleadgenerator.com",
          phone: initialUser?.phone || "",
          role: initialUser?.role || (session?.user as any)?.role || "admin",
          image: initialUser?.image || session?.user?.image || null,
          imagePublicId: initialUser?.imagePublicId || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setProfile(fallback);
        setEditName(fallback.name);
        setEditPhone(fallback.phone);
      }
    } catch {
      // Ignore network errors on initial render
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Update Profile Info (Name & Phone)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileFeedback(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile details");
      }

      setProfileFeedback({
        type: "success",
        message: "Profile information updated successfully!",
      });

      if (profile) {
        setProfile({
          ...profile,
          name: editName,
          phone: editPhone,
        });
      }
      setTimeout(() => setProfileFeedback(null), 4000);
    } catch (err: any) {
      setProfileFeedback({
        type: "error",
        message: err?.message || "Failed to save profile changes",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Upload Avatar to Cloudinary via Next.js API
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarFeedback({
        type: "error",
        message: "Image exceeds 5MB size limit. Please choose a smaller photo.",
      });
      return;
    }

    setIsUploadingAvatar(true);
    setAvatarFeedback(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload image to Cloudinary");
      }

      setAvatarFeedback({
        type: "success",
        message: "Profile picture uploaded to Cloudinary successfully!",
      });

      if (profile) {
        setProfile({
          ...profile,
          image: data.image,
          imagePublicId: data.imagePublicId,
        });
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setTimeout(() => setAvatarFeedback(null), 4000);
    } catch (err: any) {
      setAvatarFeedback({
        type: "error",
        message: err?.message || "Failed to upload avatar",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Delete Avatar from Cloudinary & Clear DB
  const handleDeleteAvatar = async () => {
    if (!confirm("Are you sure you want to delete your profile picture? This will also remove the asset permanently from Cloudinary.")) {
      return;
    }

    setIsDeletingAvatar(true);
    setAvatarFeedback(null);

    try {
      const res = await fetch("/api/user/avatar", {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove profile picture");
      }

      setAvatarFeedback({
        type: "success",
        message: "Profile picture deleted from Cloudinary.",
      });

      if (profile) {
        setProfile({
          ...profile,
          image: null,
          imagePublicId: null,
        });
      }

      setTimeout(() => setAvatarFeedback(null), 4000);
    } catch (err: any) {
      setAvatarFeedback({
        type: "error",
        message: err?.message || "Failed to remove avatar",
      });
    } finally {
      setIsDeletingAvatar(false);
    }
  };

  // Change Password via Next.js API
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword.length < 6) {
      setPasswordFeedback({
        type: "error",
        message: "New password must be at least 6 characters long.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        type: "error",
        message: "New password and confirm password do not match.",
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password");
      }

      setPasswordFeedback({
        type: "success",
        message: "Password changed successfully! Other sessions revoked.",
      });

      // Clear password inputs
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => setPasswordFeedback(null), 4000);
    } catch (err: any) {
      setPasswordFeedback({
        type: "error",
        message: err?.message || "Password change failed. Check your current password.",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(extensionApiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const initials =
    (profile?.name || session?.user?.name || "Admin")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AA";

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      searchQuery={globalSearch}
      onSearchChange={setGlobalSearch}
      totalLeadsCount={mockLeads.length}
      totalGroupsCount={mockSearchGroups.length}
    >
      <div className="space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                System Administration
              </span>
              <span className="h-1 w-1 rounded-full bg-stone-300" />
              <Badge variant="terracotta" className="text-[10px] uppercase font-bold">
                {profile?.role?.toUpperCase() || "ADMIN"}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-botanical-900">
              Account & Workspace Settings
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Manage your personal administrator identity, Cloudinary profile avatar, credentials, and crawler preferences.
            </p>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-stone-200/90 pb-3 overflow-x-auto">
          {[
            { id: "profile", label: "My Profile & Cloudinary Avatar", icon: User },
            { id: "workspace", label: "Extension & Crawler Keys", icon: Key },
            { id: "security", label: "Security Policies & Roles", icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-botanical-700 text-paper shadow-sm"
                    : "text-stone-600 hover:bg-oatmeal-200/70 hover:text-botanical-900"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-sage-200" : "text-stone-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* SECTION 1: MY PROFILE & CLOUDINARY AVATAR */}
        {activeSection === "profile" && (
          <div className="space-y-6">
            {/* Feedback Notifications */}
            {avatarFeedback && (
              <div
                className={`flex items-center gap-2.5 rounded-xl p-3.5 text-xs font-medium ${
                  avatarFeedback.type === "success"
                    ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                    : "bg-red-50 text-red-900 border border-red-200"
                }`}
              >
                {avatarFeedback.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                )}
                <span>{avatarFeedback.message}</span>
              </div>
            )}

            {/* Profile Overview Card with Cloudinary Avatar & Uploader */}
            <Card className="p-6 border-stone-200 bg-[#FCFBF8] shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-stone-200/80">
                <div className="flex items-center gap-5">
                  {/* Avatar Display */}
                  <div className="relative group">
                    {profile?.image ? (
                      <img
                        src={profile.image}
                        alt={profile.name || "User Avatar"}
                        className="h-20 w-20 rounded-2xl object-cover border-2 border-sage-200 shadow-md bg-oatmeal-100"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-botanical-700 text-paper font-bold text-2xl shadow-md border-2 border-sage-200">
                        {initials}
                      </div>
                    )}

                    {/* Camera overlay hover indicator */}
                    <button
                      type="button"
                      disabled={isUploadingAvatar}
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 text-paper opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Upload new picture"
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <Camera className="h-6 w-6" />
                      )}
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-botanical-900">
                        {profile?.name || "Administrator"}
                      </h2>
                      <Badge variant="terracotta" className="text-[10px] uppercase font-bold">
                        {profile?.role?.toUpperCase() || "ADMIN"}
                      </Badge>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-stone-400" />
                      <span>{profile?.email || "admin@gmleadgenerator.com"}</span>
                    </p>
                    <p className="text-[11px] text-stone-400 mt-1 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-stone-400" />
                      <span>Registered: {formatDate(profile?.createdAt)}</span>
                    </p>
                  </div>
                </div>

                {/* Cloudinary Action Buttons */}
                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />

                  <Button
                    type="button"
                    disabled={isUploadingAvatar}
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-botanical-700 hover:bg-botanical-800 text-paper text-xs h-9.5 px-3.5 rounded-xl gap-2 cursor-pointer font-medium shadow-xs"
                  >
                    {isUploadingAvatar ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-sage-200" />
                        <span>Uploading to Cloudinary...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 text-sage-200" />
                        <span>Upload Picture</span>
                      </>
                    )}
                  </Button>

                  {profile?.image && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isDeletingAvatar || isUploadingAvatar}
                      onClick={handleDeleteAvatar}
                      className="border-stone-200 text-terracotta-700 hover:bg-terracotta-50 hover:border-terracotta-200 text-xs h-9.5 px-3 rounded-xl gap-1.5 cursor-pointer"
                    >
                      {isDeletingAvatar ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      <span>Remove</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Cloudinary Folder & Public Details Badge */}
              <div className="mt-4 pt-1 flex flex-wrap items-center justify-between text-[11px] text-stone-500 gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-600">Cloudinary Folder:</span>
                  <Badge variant="sage" className="text-[10px] font-mono">
                    gm-lead-generator
                  </Badge>
                  <span className="text-stone-300">•</span>
                  <span className="font-semibold text-stone-600">Cloud:</span>
                  <span className="font-mono text-stone-600">dknitablq</span>
                </div>

                {profile?.imagePublicId && (
                  <div className="flex items-center gap-1.5 text-stone-400 font-mono text-[10px] truncate max-w-xs">
                    <span>Public ID:</span>
                    <span className="truncate">{profile.imagePublicId}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Split Row: Update Info & Change Password */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form 1: Update Personal Details */}
              <Card className="p-6 border-stone-200 bg-[#FCFBF8] shadow-sm">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-base font-bold text-botanical-900 flex items-center gap-2">
                    <User className="h-4.5 w-4.5 text-botanical-700" />
                    <span>Personal Information</span>
                  </CardTitle>
                  <p className="text-xs text-stone-500">
                    Update your administrator display name and contact phone number.
                  </p>
                </CardHeader>

                <CardContent className="p-0">
                  {profileFeedback && (
                    <div
                      className={`mb-4 flex items-center gap-2.5 rounded-xl p-3 text-xs font-medium ${
                        profileFeedback.type === "success"
                          ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                          : "bg-red-50 text-red-900 border border-red-200"
                      }`}
                    >
                      {profileFeedback.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                      )}
                      <span>{profileFeedback.message}</span>
                    </div>
                  )}

                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-stone-700">Full Name</Label>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Your full name"
                        required
                        className="bg-[#FCFBF8] border-stone-200 text-xs rounded-xl h-9.5"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-stone-700">Phone Number</Label>
                      <Input
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="+880 1316-145125"
                        className="bg-[#FCFBF8] border-stone-200 text-xs rounded-xl h-9.5"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-stone-700">Email Address (Locked)</Label>
                      <Input
                        value={profile?.email || ""}
                        disabled
                        className="bg-oatmeal-100/70 border-stone-200 text-xs rounded-xl h-9.5 text-stone-500 cursor-not-allowed"
                      />
                      <p className="text-[11px] text-stone-400">
                        Primary administrator email cannot be edited directly for security.
                      </p>
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={isUpdatingProfile}
                        className="w-full bg-botanical-700 hover:bg-botanical-800 text-paper text-xs h-9.5 rounded-xl font-medium cursor-pointer"
                      >
                        {isUpdatingProfile ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                            <span>Updating Profile...</span>
                          </>
                        ) : (
                          <span>Save Profile Information</span>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Form 2: Change Password */}
              <Card className="p-6 border-stone-200 bg-[#FCFBF8] shadow-sm">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-base font-bold text-botanical-900 flex items-center gap-2">
                    <Lock className="h-4.5 w-4.5 text-terracotta-600" />
                    <span>Change Password</span>
                  </CardTitle>
                  <p className="text-xs text-stone-500">
                    Ensure your account stays secure with a strong password (minimum 6 characters).
                  </p>
                </CardHeader>

                <CardContent className="p-0">
                  {passwordFeedback && (
                    <div
                      className={`mb-4 flex items-center gap-2.5 rounded-xl p-3 text-xs font-medium ${
                        passwordFeedback.type === "success"
                          ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                          : "bg-red-50 text-red-900 border border-red-200"
                      }`}
                    >
                      {passwordFeedback.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                      )}
                      <span>{passwordFeedback.message}</span>
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-3.5">
                    {/* Current Password */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-stone-700">Current Password</Label>
                      <div className="relative">
                        <Input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="bg-[#FCFBF8] border-stone-200 text-xs rounded-xl h-9.5 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-stone-700">New Password</Label>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          required
                          minLength={6}
                          className="bg-[#FCFBF8] border-stone-200 text-xs rounded-xl h-9.5 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm New Password */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-stone-700">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-type new password"
                          required
                          minLength={6}
                          className="bg-[#FCFBF8] border-stone-200 text-xs rounded-xl h-9.5 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={isChangingPassword}
                        className="w-full bg-botanical-700 hover:bg-botanical-800 text-paper text-xs h-9.5 rounded-xl font-medium cursor-pointer"
                      >
                        {isChangingPassword ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                            <span>Updating Password...</span>
                          </>
                        ) : (
                          <span>Update Password & Revoke Sessions</span>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* SECTION 2: EXTENSION & CRAWLER */}
        {activeSection === "workspace" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 border-stone-200 bg-[#FCFBF8] shadow-sm md:col-span-2">
              <CardHeader className="p-0 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-botanical-900 flex items-center gap-2">
                    <Key className="h-4.5 w-4.5 text-botanical-700" />
                    <span>Browser Extension Sync Token</span>
                  </CardTitle>
                  <Badge variant="sage" className="text-[10px]">Encrypted TLS 1.3</Badge>
                </div>
                <p className="text-xs text-stone-500">
                  Paste this token inside your Chrome extension pop-up to sync real-time scraped Google Maps & social leads.
                </p>
              </CardHeader>

              <CardContent className="p-0 space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={extensionApiKey}
                    className="font-mono text-xs bg-oatmeal-100/60 border-stone-200 h-10 rounded-xl"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyKey}
                    className="gap-1.5 text-xs h-10 px-3.5 border-stone-300 rounded-xl cursor-pointer"
                  >
                    {copiedKey ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-stone-500" />}
                    <span>{copiedKey ? "Copied" : "Copy"}</span>
                  </Button>
                </div>

                <div className="rounded-xl bg-sage-50/70 border border-sage-200/80 p-3.5 text-xs text-stone-600 flex items-start gap-2.5">
                  <Zap className="h-4 w-4 text-botanical-700 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Token is bound to <strong>{profile?.email || "admin account"}</strong>. When scraping on Google Maps or Instagram, the extension encrypts lead payloads with this token.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 border-stone-200 bg-[#FCFBF8] shadow-sm">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-base font-bold text-botanical-900 flex items-center gap-2">
                  <Shield className="h-4.5 w-4.5 text-botanical-700" />
                  <span>Scraping Safety Limits</span>
                </CardTitle>
                <p className="text-xs text-stone-500">Thresholds to protect browser memory and stability</p>
              </CardHeader>

              <CardContent className="p-0 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-stone-700">Max Daily Leads Cap</Label>
                  <Input
                    type="number"
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(e.target.value)}
                    className="bg-[#FCFBF8] border-stone-200 text-xs rounded-xl h-9.5"
                  />
                  <p className="text-[11px] text-stone-400">Protects browser memory and avoids scraping rate limit flags.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 border-stone-200 bg-[#FCFBF8] shadow-sm">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-base font-bold text-botanical-900 flex items-center gap-2">
                  <Database className="h-4.5 w-4.5 text-botanical-700" />
                  <span>Storage & Cloudinary</span>
                </CardTitle>
                <p className="text-xs text-stone-500">Assets and MongoDB Atlas metadata</p>
              </CardHeader>

              <CardContent className="p-0 space-y-3 text-xs text-stone-600">
                <div className="flex items-center justify-between py-2 border-b border-stone-200/70">
                  <span>Image Media Host</span>
                  <Badge variant="terracotta" className="text-[10px]">Cloudinary (dknitablq)</Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-stone-200/70">
                  <span>Dedicated Media Folder</span>
                  <span className="font-mono font-semibold text-botanical-900">gm-lead-generator</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Database Cluster</span>
                  <span className="font-semibold text-botanical-900">gm-lead-generator-clust</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* SECTION 3: SECURITY & ACCESS */}
        {activeSection === "security" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 border-stone-200 bg-[#FCFBF8] shadow-sm">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-base font-bold text-botanical-900 flex items-center gap-2">
                  <Shield className="h-4.5 w-4.5 text-botanical-700" />
                  <span>Authentication Rules</span>
                </CardTitle>
                <p className="text-xs text-stone-500">Better Auth security policies and role controls</p>
              </CardHeader>

              <CardContent className="p-0 space-y-4">
                <div className="rounded-xl border border-stone-200/80 bg-oatmeal-50 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-botanical-900">Single Role Gate</span>
                    <Badge variant="terracotta" className="text-[10px]">Active</Badge>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Only users promoted to <code>admin</code> by an existing administrator can acquire an active session. Unapproved users remain in pending status.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-emerald-200/90 bg-emerald-50/70 text-emerald-950">
                  <h4 className="font-bold text-xs">Self-Protection Safeguard Active</h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Admins are prohibited from demoting, banning, or deleting their own active user ID.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 border-stone-200 bg-[#FCFBF8] shadow-sm">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-base font-bold text-botanical-900 flex items-center gap-2">
                  <Laptop className="h-4.5 w-4.5 text-terracotta-600" />
                  <span>Session Lifecycle</span>
                </CardTitle>
                <p className="text-xs text-stone-500">Session revocation safeguards</p>
              </CardHeader>

              <CardContent className="p-0 space-y-3 text-xs text-stone-600">
                <div className="p-3 rounded-xl border border-stone-200 bg-oatmeal-50 text-stone-700">
                  <h4 className="font-bold text-xs">Immediate Session Invalidation</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Banning a user or changing a password instantly revokes all active sessions in MongoDB.
                  </p>
                </div>

                <div className="flex items-center justify-between py-2 border-t border-stone-200/70">
                  <span>Default Session Lifetime</span>
                  <span className="font-semibold text-botanical-900">7 Days (Sliding Window)</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
