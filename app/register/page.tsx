"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sprout,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { registerSchema, RegisterFormData } from "@/lib/validations/auth";
import { signUp, useSession } from "@/lib/auth-client";
import { AuthShowcasePanel } from "@/components/features/auth/AuthShowcasePanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function RegisterPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: "user",
      terms: true,
    },
  });

  const selectedRole = watch("role");
  const enteredPassword = watch("password");

  // If already logged in, redirect to dashboard
  React.useEffect(() => {
    if (session?.user) {
      router.push("/");
    }
  }, [session, router]);

  const onSubmit = async (data: RegisterFormData) => {
    setAuthError(null);
    setAuthSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
        // @ts-ignore - Better Auth additional fields
        phone: data.phone || "",
        role: data.role,
      });

      if (res.error) {
        setAuthError(
          res.error.message || "Failed to create account. Please check your inputs or try another email."
        );
        setIsSubmitting(false);
        return;
      }

      setAuthSuccess(
        `Profile created successfully with ${data.role.toUpperCase()} privileges! Launching dashboard...`
      );
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 600);
    } catch (err: any) {
      setAuthError(err?.message || "Registration failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Quick preset helper to test form inputs instantly
  const handlePrefillDemo = (role: "admin" | "user") => {
    const timestamp = Date.now().toString().slice(-4);
    if (role === "admin") {
      setValue("name", "Moin Khan (Admin)");
      setValue("email", `admin.${timestamp}@verdant.local`);
      setValue("phone", "+1 (555) 789-0123");
      setValue("password", "SecureAdminPass123!");
      setValue("confirmPassword", "SecureAdminPass123!");
      setValue("role", "admin");
    } else {
      setValue("name", "Elena Vance (Specialist)");
      setValue("email", `elena.${timestamp}@verdant.local`);
      setValue("phone", "+1 (555) 345-6789");
      setValue("password", "SecureMemberPass123!");
      setValue("confirmPassword", "SecureMemberPass123!");
      setValue("role", "user");
    }
    setAuthError(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#F5F2ED] text-stone-900 grid grid-cols-1 lg:grid-cols-12 selection:bg-sage-200">
      {/* LEFT: Botanical Showcase Panel */}
      <AuthShowcasePanel />

      {/* RIGHT: Registration Form Section */}
      <div className="col-span-1 lg:col-span-7 flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-y-auto">
        {/* Mobile Brand Header */}
        <div className="flex items-center justify-between lg:hidden pb-6 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-botanical-700 text-paper shadow-sm">
              <Sprout className="h-5 w-5 text-sage-200" />
            </div>
            <span className="text-base font-bold text-botanical-900">Verdant Leads</span>
          </div>
          <Badge variant="sage" className="text-[10px]">
            MongoDB Powered
          </Badge>
        </div>

        {/* Center Card */}
        <div className="mx-auto w-full max-w-md my-auto py-6">
          {/* Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-terracotta-200 bg-terracotta-50/80 px-3 py-1 text-xs text-terracotta-800 font-medium mb-3">
              <Sparkles className="h-3 w-3 text-terracotta-600" />
              <span>Workspace Registration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-botanical-900">
              Create your account
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-stone-500">
              Set up your profile and configure role-based permissions for your team.
            </p>
          </div>

          {/* Quick Demo Fill Helper */}
          <div className="mb-5 p-3 rounded-2xl bg-oatmeal-100/80 border border-stone-200/80 flex items-center justify-between text-xs">
            <span className="text-stone-500 font-medium text-[11px]">
              Need quick test data?
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePrefillDemo("admin")}
                className="px-2 py-1 rounded-lg bg-paper border border-stone-200 text-[10px] font-semibold text-botanical-900 hover:bg-botanical-50 cursor-pointer transition-colors"
              >
                + Admin Preset
              </button>
              <button
                type="button"
                onClick={() => handlePrefillDemo("user")}
                className="px-2 py-1 rounded-lg bg-paper border border-stone-200 text-[10px] font-semibold text-botanical-900 hover:bg-sage-50 cursor-pointer transition-colors"
              >
                + Member Preset
              </button>
            </div>
          </div>

          {/* Feedback alerts */}
          {authError && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl bg-terracotta-50 border border-terracotta-200 p-3.5 text-xs text-terracotta-900 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-terracotta-600 mt-0.5" />
              <div className="flex-1 leading-relaxed">{authError}</div>
            </div>
          )}

          {authSuccess && (
            <div className="mb-5 flex items-center gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-900 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{authSuccess}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input
                  {...register("name")}
                  type="text"
                  placeholder="e.g. Moin Khan"
                  autoComplete="name"
                  className={`h-11 pl-10 text-xs sm:text-sm bg-[#FCFBF8] border-stone-200 focus:bg-paper transition-all rounded-xl ${
                    errors.name ? "border-terracotta-400 focus:ring-terracotta-400" : ""
                  }`}
                />
              </div>
              {errors.name && (
                <p className="text-[11px] text-terracotta-600 font-medium">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email and Phone Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    {...register("email")}
                    type="email"
                    placeholder="name@company.com"
                    autoComplete="email"
                    className={`h-11 pl-10 text-xs sm:text-sm bg-[#FCFBF8] border-stone-200 focus:bg-paper transition-all rounded-xl ${
                      errors.email ? "border-terracotta-400 focus:ring-terracotta-400" : ""
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] text-terracotta-600 font-medium">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Phone Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700">
                  Phone (Optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    {...register("phone")}
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    autoComplete="tel"
                    className="h-11 pl-10 text-xs sm:text-sm bg-[#FCFBF8] border-stone-200 focus:bg-paper transition-all rounded-xl"
                  />
                </div>
                {errors.phone && (
                  <p className="text-[11px] text-terracotta-600 font-medium">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            {/* Role Selection RBAC */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-700 flex items-center justify-between">
                <span>Account Role & Privileges</span>
                <span className="text-[10px] text-stone-400 font-normal">Better Auth RBAC</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue("role", "user")}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    selectedRole === "user"
                      ? "border-botanical-600 bg-sage-50/70 shadow-xs ring-1 ring-botanical-600"
                      : "border-stone-200 bg-[#FCFBF8] hover:bg-oatmeal-100/50"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <User className="h-4 w-4 text-sage-600" />
                    <span className="text-xs font-bold text-botanical-900">Team Member</span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-tight">
                    Standard access: search, filter, and add prospective leads.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setValue("role", "admin")}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    selectedRole === "admin"
                      ? "border-terracotta-500 bg-terracotta-50/70 shadow-xs ring-1 ring-terracotta-500"
                      : "border-stone-200 bg-[#FCFBF8] hover:bg-oatmeal-100/50"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="h-4 w-4 text-terracotta-600" />
                    <span className="text-xs font-bold text-terracotta-900">Administrator</span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-tight">
                    Full elevated privileges: CSV export, AI tools & team control.
                  </p>
                </button>
              </div>
            </div>

            {/* Password and Confirm Password Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={`h-11 pl-10 pr-10 text-xs sm:text-sm bg-[#FCFBF8] border-stone-200 focus:bg-paper transition-all rounded-xl ${
                      errors.password ? "border-terracotta-400 focus:ring-terracotta-400" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] text-terracotta-600 font-medium">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    {...register("confirmPassword")}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={`h-11 pl-10 pr-10 text-xs sm:text-sm bg-[#FCFBF8] border-stone-200 focus:bg-paper transition-all rounded-xl ${
                      errors.confirmPassword ? "border-terracotta-400 focus:ring-terracotta-400" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-[11px] text-terracotta-600 font-medium">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 text-xs text-stone-600 cursor-pointer select-none">
                <input
                  {...register("terms")}
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-stone-300 text-botanical-700 focus:ring-botanical-600"
                />
                <span className="leading-relaxed">
                  I agree to the{" "}
                  <span className="text-botanical-800 font-medium underline underline-offset-2">
                    Terms of Service
                  </span>{" "}
                  and{" "}
                  <span className="text-botanical-800 font-medium underline underline-offset-2">
                    Privacy Policy
                  </span>
                  .
                </span>
              </label>
              {errors.terms && (
                <p className="text-[11px] text-terracotta-600 font-medium mt-1">
                  {errors.terms.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl bg-botanical-700 hover:bg-botanical-800 text-paper font-medium text-xs sm:text-sm shadow-sm transition-all cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-sage-200" />
                  <span>Registering user with MongoDB...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Enter</span>
                  <ArrowRight className="ml-2 h-4 w-4 text-sage-300" />
                </>
              )}
            </Button>
          </form>

          {/* Switch to Login */}
          <p className="mt-8 text-center text-xs text-stone-500">
            Already have an active account?{" "}
            <Link
              href="/login"
              className="font-semibold text-botanical-800 hover:text-botanical-900 underline underline-offset-4 cursor-pointer"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-stone-200/80 flex items-center justify-between text-[11px] text-stone-400">
          <span>Verdant Botanical CRM Engine</span>
          <span>MongoDB Protected</span>
        </div>
      </div>
    </div>
  );
}
