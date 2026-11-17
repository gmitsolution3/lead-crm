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
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  User,
  AlertCircle,
  Loader2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { loginSchema, LoginFormData } from "@/lib/validations/auth";
import { signIn, signUp, useSession } from "@/lib/auth-client";
import { AuthShowcasePanel } from "@/components/features/auth/AuthShowcasePanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function LoginPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // If already logged in, redirect to dashboard
  React.useEffect(() => {
    if (session?.user) {
      router.push("/");
    }
  }, [session, router]);

  const onSubmit = async (data: LoginFormData) => {
    setAuthError(null);
    setAuthSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await signIn.email({
        email: data.email,
        password: data.password,
      });

      if (res.error) {
        setAuthError(
          res.error.message || "Invalid credentials. Please verify your email and password."
        );
        setIsSubmitting(false);
        return;
      }

      setAuthSuccess("Authentication successful! Redirecting to workspace...");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 500);
    } catch (err: any) {
      setAuthError(err?.message || "Failed to sign in. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Instant 1-Click Demo Login
  const handleQuickDemo = async (role: "admin" | "user") => {
    setAuthError(null);
    setAuthSuccess(null);
    setIsSubmitting(true);

    const demoEmail = role === "admin" ? "admin@verdant.local" : "specialist@verdant.local";
    const demoPassword = "Password123!";
    const demoName = role === "admin" ? "Lead Architect (Admin)" : "Lead Specialist (Member)";

    setValue("email", demoEmail);
    setValue("password", demoPassword);

    try {
      const res = await signIn.email({
        email: demoEmail,
        password: demoPassword,
      });

      if (res.error) {
        // Auto-provision demo account in MongoDB if first time
        const signupRes = await signUp.email({
          email: demoEmail,
          password: demoPassword,
          name: demoName,
          // @ts-ignore
          role,
          phone: "+1 (555) 019-2834",
        });

        if (signupRes.error) {
          setAuthError(signupRes.error.message || "Failed to initialize demo account.");
          setIsSubmitting(false);
          return;
        }
      }

      setAuthSuccess(`Signed in as ${role.toUpperCase()}! Taking you to the dashboard...`);
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 500);
    } catch (err: any) {
      setAuthError(err?.message || "Demo login failed");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F5F2ED] text-stone-900 grid grid-cols-1 lg:grid-cols-12 selection:bg-sage-200">
      {/* LEFT: Botanical Showcase Panel */}
      <AuthShowcasePanel />

      {/* RIGHT: Login Form Section */}
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
        <div className="mx-auto w-full max-w-md my-auto py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-sage-200 bg-sage-50/80 px-3 py-1 text-xs text-botanical-800 font-medium mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-botanical-600" />
              <span>Workspace Authentication</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-botanical-900">
              Welcome back
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-stone-500">
              Enter your credentials to access your verified lead pipeline.
            </p>
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

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">
                  Password
                </label>
                <button
                  type="button"
                  tabIndex={-1}
                  className="text-[11px] font-medium text-stone-400 hover:text-botanical-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`h-11 pl-10 pr-10 text-xs sm:text-sm bg-[#FCFBF8] border-stone-200 focus:bg-paper transition-all rounded-xl ${
                    errors.password ? "border-terracotta-400 focus:ring-terracotta-400" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-terracotta-600 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer select-none">
                <input
                  {...register("rememberMe")}
                  type="checkbox"
                  className="h-4 w-4 rounded border-stone-300 text-botanical-700 focus:ring-botanical-600"
                />
                <span>Remember this device for 30 days</span>
              </label>
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
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="ml-2 h-4 w-4 text-sage-300" />
                </>
              )}
            </Button>
          </form>

          {/* Quick 1-Click Demo Login Drawer */}
          <div className="mt-8 pt-6 border-t border-stone-200/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-terracotta-500" />
                Instant 1-Click Demo Access
              </span>
              <span className="text-[10px] text-stone-400">Better Auth RBAC</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleQuickDemo("admin")}
                className="group flex flex-col items-start p-3 rounded-xl border border-stone-200 bg-[#FCFBF8] hover:border-terracotta-300 hover:bg-terracotta-50/40 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-botanical-900 group-hover:text-terracotta-800">
                  <ShieldCheck className="h-3.5 w-3.5 text-terracotta-600" />
                  <span>Admin Demo</span>
                </div>
                <p className="text-[10px] text-stone-500 mt-0.5">
                  Full export & delete privileges
                </p>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleQuickDemo("user")}
                className="group flex flex-col items-start p-3 rounded-xl border border-stone-200 bg-[#FCFBF8] hover:border-sage-400 hover:bg-sage-50/50 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-botanical-900 group-hover:text-botanical-700">
                  <User className="h-3.5 w-3.5 text-sage-600" />
                  <span>Member Demo</span>
                </div>
                <p className="text-[10px] text-stone-500 mt-0.5">
                  View, filter & add prospects
                </p>
              </button>
            </div>
          </div>

          {/* Switch to Register */}
          <p className="mt-8 text-center text-xs text-stone-500">
            Don't have a team account yet?{" "}
            <Link
              href="/register"
              className="font-semibold text-botanical-800 hover:text-botanical-900 underline underline-offset-4 cursor-pointer"
            >
              Create an account
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
