"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/lib/auth-client";
import {
  User as UserIcon,
  Shield,
  Key,
  Lock,
  Camera,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Calendar,
  Sparkles,
} from "lucide-react";
import type { User } from "@/types";

interface ProfileDashboardProps {
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

export default function ProfileDashboard({ user: initialUser }: ProfileDashboardProps) {
  const { data: session } = useSession();

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

  // Fetch live user profile
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
        const fallback: UserProfileData = {
          id: initialUser?.id || session?.user?.id || "",
          name: initialUser?.name || session?.user?.name || "Workspace Member",
          email: initialUser?.email || session?.user?.email || "user@example.com",
          phone: initialUser?.phone || "",
          role: initialUser?.role || (session?.user as any)?.role || "moderator",
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
      // Ignore network errors
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
        message: "Profile details updated successfully!",
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

  // Upload Avatar
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarFeedback({
        type: "error",
        message: "Please choose a valid image file (PNG, JPG, WEBP).",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarFeedback({
        type: "error",
        message: "Image size must be smaller than 5MB.",
      });
      return;
    }

    setIsUploadingAvatar(true);
    setAvatarFeedback(null);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload avatar image");
      }

      setAvatarFeedback({
        type: "success",
        message: "Avatar photo updated successfully!",
      });

      if (profile) {
        setProfile({
          ...profile,
          image: data.image,
          imagePublicId: data.imagePublicId,
        });
      }
      setTimeout(() => setAvatarFeedback(null), 4000);
    } catch (err: any) {
      setAvatarFeedback({
        type: "error",
        message: err?.message || "Failed to upload profile picture",
      });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Remove Avatar
  const handleDeleteAvatar = async () => {
    if (!confirm("Are you sure you want to remove your profile photo?")) return;

    setIsDeletingAvatar(true);
    setAvatarFeedback(null);

    try {
      const res = await fetch("/api/user/avatar", {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete avatar image");
      }

      setAvatarFeedback({
        type: "success",
        message: "Avatar removed. Using default avatar.",
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
        message: err?.message || "Failed to remove avatar picture",
      });
    } finally {
      setIsDeletingAvatar(false);
    }
  };

  // Change Password
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
        message: "New password and confirmation do not match.",
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
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password");
      }

      setPasswordFeedback({
        type: "success",
        message: "Your password has been changed successfully!",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordFeedback(null), 5000);
    } catch (err: any) {
      setPasswordFeedback({
        type: "error",
        message: err?.message || "Failed to update password. Check your current password.",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const currentRole = ((profile?.role || (session?.user as any)?.role || "user")).toLowerCase();
  const isAdmin = currentRole === "admin";
  const isModerator = currentRole === "moderator";

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-stone-200/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sage-300 bg-sage-50/80 px-3 py-1 text-xs font-semibold text-botanical-800 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-sage-600" />
            <span>Personal Profile & Identity</span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-botanical-900 md:text-4xl">
            My Profile
          </h1>
          <p className="mt-1 text-sm text-stone-600 max-w-xl">
            Manage your personal profile details, contact information, profile picture, and account security credentials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={isAdmin ? "terracotta" : isModerator ? "sage" : "secondary"}
            className="text-xs uppercase font-bold px-3 py-1"
          >
            {currentRole}
          </Badge>
        </div>
      </div>

      {profileLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-stone-500">
          <Loader2 className="h-7 w-7 animate-spin text-botanical-700" />
          <p className="text-xs font-medium">Loading your profile details...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Avatar & Summary Card */}
          <div className="md:col-span-1 space-y-6">
            <Card className="border border-stone-200/90 bg-[#FCFBF8] shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="relative group mb-4">
                  {profile?.image ? (
                    <img
                      src={profile.image}
                      alt={profile.name}
                      className="h-28 w-28 rounded-2xl object-cover shadow-sm border border-stone-200"
                    />
                  ) : (
                    <div className="h-28 w-28 rounded-2xl bg-botanical-800 text-paper font-serif font-bold text-3xl flex items-center justify-center shadow-sm">
                      {(profile?.name || "U")[0]?.toUpperCase()}
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarFileChange}
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute -bottom-2 -right-2 h-9 w-9 rounded-xl bg-botanical-800 text-white flex items-center justify-center shadow-md hover:bg-botanical-900 cursor-pointer transition-transform hover:scale-105"
                    title="Change Avatar Photo"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <h3 className="font-bold text-base text-botanical-900">
                  {profile?.name || "Anonymous Member"}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">{profile?.email}</p>

                <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-oatmeal-200/80 text-stone-700 border border-stone-300">
                  <Shield className="h-3 w-3 text-sage-600" />
                  <span className="capitalize">{currentRole} Role</span>
                </div>

                {avatarFeedback && (
                  <div
                    className={`mt-4 w-full p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                      avatarFeedback.type === "success"
                        ? "bg-sage-50 text-sage-800 border border-sage-200"
                        : "bg-rose-50 text-rose-800 border border-rose-200"
                    }`}
                  >
                    {avatarFeedback.type === "success" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-sage-600 shrink-0" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                    )}
                    <span className="text-[11px] leading-tight">{avatarFeedback.message}</span>
                  </div>
                )}

                <div className="mt-6 w-full pt-4 border-t border-stone-200/80 flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="w-full text-xs rounded-xl h-8.5 gap-2 border-stone-200 text-stone-700 hover:bg-stone-100"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload New Photo</span>
                  </Button>

                  {profile?.image && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleDeleteAvatar}
                      disabled={isDeletingAvatar}
                      className="w-full text-xs rounded-xl h-8.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    >
                      {isDeletingAvatar ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                      )}
                      <span>Remove Photo</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-stone-200/90 bg-[#FCFBF8] shadow-sm rounded-2xl p-4">
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-stone-500 py-1 border-b border-stone-100">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Member Since</span>
                  </span>
                  <span className="font-medium text-stone-800">
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString()
                      : "Recently"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-stone-500 py-1">
                  <span className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" />
                    <span>Access Tier</span>
                  </span>
                  <span className="font-semibold text-botanical-800 capitalize">
                    {currentRole}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Profile Edit & Security Forms */}
          <div className="md:col-span-2 space-y-6">
            {/* Contact Details Card */}
            <Card className="border border-stone-200/90 bg-[#FCFBF8] shadow-sm rounded-2xl">
              <CardHeader className="pb-3 border-b border-stone-200/70">
                <CardTitle className="text-base font-bold text-botanical-900 flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-botanical-700" />
                  <span>Personal Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  {profileFeedback && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        profileFeedback.type === "success"
                          ? "bg-sage-50 text-sage-800 border border-sage-200"
                          : "bg-rose-50 text-rose-800 border border-rose-200"
                      }`}
                    >
                      {profileFeedback.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4 text-sage-600 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                      )}
                      <span>{profileFeedback.message}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="prof-name" className="text-xs font-semibold text-stone-700">
                        Full Name
                      </Label>
                      <Input
                        id="prof-name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Your full name"
                        className="bg-paper border-stone-300 text-xs h-9 rounded-xl"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="prof-phone" className="text-xs font-semibold text-stone-700">
                        Phone Number
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-stone-400" />
                        <Input
                          id="prof-phone"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="+1 555-0199"
                          className="bg-paper border-stone-300 text-xs h-9 pl-9 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="prof-email" className="text-xs font-semibold text-stone-700">
                      Email Address (Primary Identity)
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-stone-400" />
                      <Input
                        id="prof-email"
                        value={profile?.email || ""}
                        disabled
                        className="bg-stone-100/70 border-stone-200 text-stone-500 text-xs h-9 pl-9 rounded-xl cursor-not-allowed"
                      />
                    </div>
                    <p className="text-[11px] text-stone-400">
                      Email address is managed by authentication and cannot be changed here.
                    </p>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      disabled={isUpdatingProfile}
                      size="sm"
                      className="rounded-xl h-9 px-5 bg-botanical-800 hover:bg-botanical-900 text-paper font-semibold text-xs shadow-xs cursor-pointer"
                    >
                      {isUpdatingProfile ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <span>Save Profile Changes</span>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Change Password Card */}
            <Card className="border border-stone-200/90 bg-[#FCFBF8] shadow-sm rounded-2xl">
              <CardHeader className="pb-3 border-b border-stone-200/70">
                <CardTitle className="text-base font-bold text-botanical-900 flex items-center gap-2">
                  <Key className="h-4 w-4 text-terracotta-600" />
                  <span>Security & Password Credentials</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  {passwordFeedback && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        passwordFeedback.type === "success"
                          ? "bg-sage-50 text-sage-800 border border-sage-200"
                          : "bg-rose-50 text-rose-800 border border-rose-200"
                      }`}
                    >
                      {passwordFeedback.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4 text-sage-600 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                      )}
                      <span>{passwordFeedback.message}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="cur-pass" className="text-xs font-semibold text-stone-700">
                      Current Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-stone-400" />
                      <Input
                        id="cur-pass"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter your current password"
                        className="bg-paper border-stone-300 text-xs h-9 pl-9 pr-9 rounded-xl"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="new-pass" className="text-xs font-semibold text-stone-700">
                        New Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-stone-400" />
                        <Input
                          id="new-pass"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min. 6 characters"
                          className="bg-paper border-stone-300 text-xs h-9 pl-9 pr-9 rounded-xl"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600"
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="conf-pass" className="text-xs font-semibold text-stone-700">
                        Confirm New Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-stone-400" />
                        <Input
                          id="conf-pass"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat new password"
                          className="bg-paper border-stone-300 text-xs h-9 pl-9 pr-9 rounded-xl"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      disabled={isChangingPassword}
                      size="sm"
                      className="rounded-xl h-9 px-5 bg-botanical-800 hover:bg-botanical-900 text-paper font-semibold text-xs shadow-xs cursor-pointer"
                    >
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                          <span>Updating Password...</span>
                        </>
                      ) : (
                        <span>Update Password</span>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
