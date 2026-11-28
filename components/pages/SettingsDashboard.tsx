"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/lib/auth-client";
import { useFetch, usePatch, usePost, useDelete } from "@/hooks";
import {
  Settings,
  User as UserIcon,
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
  Zap,
  Calendar,
  Mail,
  Phone,
  Laptop,
  Target,
  TrendingUp,
} from "lucide-react";
import type { User } from "@/types";

interface SettingsDashboardProps {
  user?: User | null;
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

// Zod Schemas
const settingsSchema = z.object({
  dailyApproachTarget: z.coerce
    .number()
    .min(1, "Target must be at least 1")
    .max(1000, "Target cannot exceed 1000"),
  dailyScrapeLimit: z.coerce
    .number()
    .min(1, "Limit must be at least 1")
    .max(5000, "Limit cannot exceed 5000"),
});

const profileSchema = z.object({
  name: z.string().min(1, "Full name is required").max(100, "Name is too long"),
  phone: z.string(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters long"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirm password do not match",
    path: ["confirmPassword"],
  });

type SettingsFormValues = z.infer<typeof settingsSchema>;
type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function SettingsDashboard({ user: initialUser }: SettingsDashboardProps) {
  const { data: session } = useSession();

  const [activeSection, setActiveSection] = useState<
    "profile" | "workspace" | "security"
  >("workspace");

  // Extension Key state
  const [extensionApiKey] = useState("vdt_live_84f93c019d42eb78a1bc8942e8d3fa");
  const [copiedKey, setCopiedKey] = useState(false);

  // Password visibility state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Avatar state
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Feedback states
  const [kpiFeedback, setKpiFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [profileFeedback, setProfileFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [avatarFeedback, setAvatarFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // API Hooks - Workspace Settings (Backend Module)
  const {
    data: settingsResponse,
    isLoading: settingsLoading,
    refetch: refetchSettings,
  } = useFetch<any>("/settings");

  const { mutateAsync: updateSettingsMutation, isPending: isSavingKpi } =
    usePatch("/settings");

  // API Hooks - User Profile & Security (Internal API)
  const {
    data: profileResponse,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = useFetch<any>("/api/user/profile");

  const { mutateAsync: updateProfileMutation, isPending: isUpdatingProfile } =
    usePatch("/api/user/profile");

  const { mutateAsync: updatePasswordMutation, isPending: isChangingPassword } =
    usePost("/api/user/password");

  const { mutateAsync: uploadAvatarMutation, isPending: isUploadingAvatar } =
    usePost("/api/user/avatar");

  const { mutateAsync: deleteAvatarMutation, isPending: isDeletingAvatar } =
    useDelete("/api/user/avatar");

  // React Hook Form for Workspace Settings
  const settingsForm = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema) as any,
    defaultValues: {
      dailyApproachTarget: 25,
      dailyScrapeLimit: 500,
    },
  });

  // React Hook Form for Profile
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema) as any,
    defaultValues: {
      name: "",
      phone: "",
    },
  });

  // React Hook Form for Password
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema) as any,
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Sync settings response into settingsForm
  useEffect(() => {
    if (settingsResponse?.data) {
      settingsForm.reset({
        dailyApproachTarget: settingsResponse.data.dailyApproachTarget || 25,
        dailyScrapeLimit: settingsResponse.data.dailyScrapeLimit || 500,
      });
    }
  }, [settingsResponse, settingsForm]);

  // Active Profile Calculation
  const profile: UserProfileData = React.useMemo(() => {
    if (profileResponse?.user) {
      return profileResponse.user;
    }
    return {
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
  }, [profileResponse, initialUser, session]);

  // Sync profile data into profileForm
  useEffect(() => {
    if (profile) {
      profileForm.reset({
        name: profile.name || "",
        phone: profile.phone || "",
      });
    }
  }, [profile.name, profile.phone, profileForm]);

  // Save Settings handler
  const onSettingsSubmit = async (values: SettingsFormValues) => {
    setKpiFeedback(null);
    try {
      await updateSettingsMutation(values);
      await refetchSettings();
      setKpiFeedback({
        type: "success",
        message: `Workspace KPI target updated! Meaningful contact target: ${values.dailyApproachTarget} leads/day.`,
      });
      setTimeout(() => setKpiFeedback(null), 4000);
    } catch (err: any) {
      setKpiFeedback({
        type: "error",
        message:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to save settings to backend",
      });
    }
  };

  // Profile submit handler
  const onProfileSubmit = async (values: ProfileFormValues) => {
    setProfileFeedback(null);
    try {
      await updateProfileMutation(values);
      await refetchProfile();
      setProfileFeedback({
        type: "success",
        message: "Profile information updated successfully!",
      });
      setTimeout(() => setProfileFeedback(null), 4000);
    } catch (err: any) {
      setProfileFeedback({
        type: "error",
        message:
          err?.response?.data?.error ||
          err?.message ||
          "Failed to save profile changes",
      });
    }
  };

  // Password submit handler
  const onPasswordSubmit = async (values: PasswordFormValues) => {
    setPasswordFeedback(null);
    try {
      await updatePasswordMutation({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      passwordForm.reset();
      setPasswordFeedback({
        type: "success",
        message: "Password changed successfully! Other sessions revoked.",
      });
      setTimeout(() => setPasswordFeedback(null), 4000);
    } catch (err: any) {
      setPasswordFeedback({
        type: "error",
        message:
          err?.response?.data?.error ||
          err?.message ||
          "Password change failed. Check your current password.",
      });
    }
  };

  // Avatar handlers
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setAvatarFeedback({
        type: "error",
        message: "Image exceeds 5MB size limit. Please choose a smaller photo.",
      });
      return;
    }

    setAvatarFeedback(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      await uploadAvatarMutation(formData);
      await refetchProfile();
      setAvatarFeedback({
        type: "success",
        message: "Profile picture uploaded to Cloudinary successfully!",
      });
      setTimeout(() => setAvatarFeedback(null), 4000);
    } catch (err: any) {
      setAvatarFeedback({
        type: "error",
        message:
          err?.response?.data?.error ||
          err?.message ||
          "Failed to upload avatar",
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteAvatar = async () => {
    if (
      !confirm(
        "Are you sure you want to delete your profile picture? This will also remove the asset permanently from Cloudinary."
      )
    ) {
      return;
    }

    setAvatarFeedback(null);
    try {
      await deleteAvatarMutation(undefined);
      await refetchProfile();
      setAvatarFeedback({
        type: "success",
        message: "Profile picture deleted from Cloudinary.",
      });
      setTimeout(() => setAvatarFeedback(null), 4000);
    } catch (err: any) {
      setAvatarFeedback({
        type: "error",
        message:
          err?.response?.data?.error ||
          err?.message ||
          "Failed to remove avatar",
      });
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

  const userRole = (
    initialUser?.role ||
    (session?.user as any)?.role ||
    profile?.role ||
    "user"
  ).toLowerCase();

  if (!profileLoading && userRole !== "admin") {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto border border-amber-200">
          <Shield className="h-6 w-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-botanical-900">
          Administrator Access Required
        </h2>
        <p className="text-xs text-stone-600 leading-relaxed">
          Settings are restricted to system administrators. To manage your personal profile information, please visit your profile page.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/profile">
            <Button size="sm" className="rounded-xl text-xs bg-botanical-800 hover:bg-botanical-900 text-paper">
              Go to My Profile
            </Button>
          </Link>
          <Link href="/">
            <Button size="sm" variant="outline" className="rounded-xl text-xs border-stone-200">
              Return to Overview
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentDailyTarget = settingsForm.watch("dailyApproachTarget") || 25;

  return (
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
            Workspace & System Settings
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Configure extension crawler credentials, API keys, lead extraction rules, and CRM security policies.
          </p>
        </div>
      </div>

      {/* Profile Separation Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3.5 rounded-2xl bg-sage-50/80 border border-sage-200 text-xs text-botanical-800">
        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-sage-600 shrink-0" />
          <span>Looking to update your personal details, avatar photo, or password?</span>
        </div>
        <Link
          href="/profile"
          className="font-semibold text-botanical-900 underline hover:text-botanical-700 shrink-0"
        >
          Go to My Profile &rarr;
        </Link>
      </div>

      {/* Section Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200/90 pb-3 overflow-x-auto">
        {[
          { id: "workspace", label: "Extension & Crawler Keys", icon: Key },
          { id: "security", label: "Security Policies & System Roles", icon: Shield },
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

              <div className="flex items-center gap-2.5 self-start sm:self-auto">
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
            <Card className="p-6 border-stone-200 bg-[#FCFBF8] shadow-sm">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-base font-bold text-botanical-900 flex items-center gap-2">
                  <UserIcon className="h-4.5 w-4.5 text-botanical-700" />
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

                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-stone-700">Full Name</Label>
                    <Input
                      {...profileForm.register("name")}
                      placeholder="Your full name"
                      className="bg-[#FCFBF8] border-stone-200 text-xs rounded-xl h-9.5"
                    />
                    {profileForm.formState.errors.name && (
                      <p className="text-[11px] text-rose-600 font-medium">
                        {profileForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-stone-700">Phone Number</Label>
                    <Input
                      {...profileForm.register("phone")}
                      placeholder="+880 1316-145125"
                      className="bg-[#FCFBF8] border-stone-200 text-xs rounded-xl h-9.5"
                    />
                    {profileForm.formState.errors.phone && (
                      <p className="text-[11px] text-rose-600 font-medium">
                        {profileForm.formState.errors.phone.message}
                      </p>
                    )}
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

                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-stone-700">Current Password</Label>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        {...passwordForm.register("currentPassword")}
                        placeholder="••••••••"
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
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="text-[11px] text-rose-600 font-medium">
                        {passwordForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-stone-700">New Password</Label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        {...passwordForm.register("newPassword")}
                        placeholder="At least 6 characters"
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
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-[11px] text-rose-600 font-medium">
                        {passwordForm.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-stone-700">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        {...passwordForm.register("confirmPassword")}
                        placeholder="Re-type new password"
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
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-[11px] text-rose-600 font-medium">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
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
          {/* KPI Target Configuration Card */}
          <Card className="p-6 border-stone-200 bg-[#FCFBF8] shadow-sm md:col-span-2">
            <CardHeader className="p-0 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-botanical-900 flex items-center gap-2">
                  <Target className="h-4.5 w-4.5 text-terracotta-600" />
                  <span>Daily Approach Target (Moderator KPI)</span>
                </CardTitle>
                <Badge variant="terracotta" className="text-[10px] uppercase font-bold tracking-wider">
                  KPI Policy
                </Badge>
              </div>
              <p className="text-xs text-stone-500">
                Set the daily client approach quota required from each moderator. This calibrates the daily progress ring, remaining to-go counters, and team performance charts on the overview dashboard.
              </p>
            </CardHeader>

            <CardContent className="p-0">
              {kpiFeedback && (
                <div
                  className={`mb-4 flex items-center gap-2.5 rounded-xl p-3 text-xs font-medium ${
                    kpiFeedback.type === "success"
                      ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                      : "bg-red-50 text-red-900 border border-red-200"
                  }`}
                >
                  {kpiFeedback.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                  )}
                  <span>{kpiFeedback.message}</span>
                </div>
              )}

              <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-stone-700">
                      Meaningful Lead Interaction Target / Day (per Moderator)
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min={1}
                        max={1000}
                        {...settingsForm.register("dailyApproachTarget")}
                        className="bg-[#FCFBF8] border-stone-200 text-xs rounded-xl h-10 font-bold text-botanical-900 pl-3.5 pr-20"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-stone-400 pointer-events-none">
                        leads / day
                      </span>
                    </div>
                    {settingsForm.formState.errors.dailyApproachTarget ? (
                      <p className="text-[11px] text-rose-600 font-medium">
                        {settingsForm.formState.errors.dailyApproachTarget.message}
                      </p>
                    ) : (
                      <p className="text-[11px] text-stone-400">
                        Counts reached outcomes (Call Later, Interested, Converted, Not Interested).
                      </p>
                    )}
                  </div>

                  <div>
                    <Button
                      type="submit"
                      disabled={isSavingKpi}
                      className="w-full sm:w-auto px-6 bg-botanical-700 hover:bg-botanical-800 text-paper text-xs h-10 rounded-xl font-medium cursor-pointer shadow-xs"
                    >
                      {isSavingKpi ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                          <span>Saving KPI Target...</span>
                        </>
                      ) : (
                        <span>Update KPI Target</span>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl bg-oatmeal-100/70 border border-stone-200/70 p-3.5 text-xs text-stone-600 flex items-start gap-2.5">
                  <TrendingUp className="h-4 w-4 text-terracotta-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Only meaningful interactions (where the customer was reached) count toward this <strong>{currentDailyTarget} leads/day</strong> target. Unanswered calls (<code>called</code>) are tracked separately as dial attempts without inflating KPIs.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

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
                  {...settingsForm.register("dailyScrapeLimit")}
                  className="bg-[#FCFBF8] border-stone-200 text-xs rounded-xl h-9.5"
                />
                {settingsForm.formState.errors.dailyScrapeLimit ? (
                  <p className="text-[11px] text-rose-600 font-medium">
                    {settingsForm.formState.errors.dailyScrapeLimit.message}
                  </p>
                ) : (
                  <p className="text-[11px] text-stone-400">Protects browser memory and avoids scraping rate limit flags.</p>
                )}
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
  );
}
