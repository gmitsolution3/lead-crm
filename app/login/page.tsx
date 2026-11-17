"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn, useSession } from "@/lib/auth-client";
import { LoginFormData, loginSchema } from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Database,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sprout,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

export default function LoginPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // Redirect if already authenticated
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
          res.error.message ||
            "Invalid credentials. Please verify your administrator email and password.",
        );
        setIsSubmitting(false);
        return;
      }

      setAuthSuccess("Administrator verified. Entering dashboard...");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 500);
    } catch (err: any) {
      setAuthError(
        err?.message || "Failed to sign in. Please try again.",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#F5F2ED] text-stone-900 flex flex-col justify-between p-4 sm:p-6 lg:p-8 selection:bg-sage-200">
      {/* Background Architectural Mesh & Botanical Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-sage-300/25 blur-[120px]" />
        <div className="absolute top-1/3 -right-32 h-[450px] w-[450px] rounded-full bg-botanical-600/10 blur-[130px]" />
        <div className="absolute -bottom-32 left-1/3 h-[500px] w-[500px] rounded-full bg-terracotta-300/15 blur-[120px]" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "radial-gradient(#2C4A3E 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* Top Navigation / Brand Bar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-botanical-700 text-paper shadow-sm">
            <Sprout className="h-5 w-5 text-sage-200" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-botanical-900">
                Verdant
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-terracotta-500">
                Leads
              </span>
            </div>
            <p className="text-[11px] text-stone-500 leading-none">
              Admin Workspace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-stone-300/70 bg-[#FCFBF8]/80 text-stone-600 text-[11px] gap-1.5 py-1 px-3 backdrop-blur-xs"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>MongoDB Connected</span>
          </Badge>
        </div>
      </header>

      {/* Main Centered Auth Sanctuary Card */}
      <main className="relative z-10 my-auto w-full max-w-md mx-auto py-8">
        <div className="rounded-3xl border border-stone-200/90 bg-[#FCFBF8] p-7 sm:p-9 shadow-[0_20px_70px_-15px_rgba(44,74,62,0.08)] backdrop-blur-md relative overflow-hidden">
          {/* Subtle top Botanical hairline accent */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sage-400 via-botanical-600 to-terracotta-400" />

          {/* Card Header */}
          <div className="text-center mb-7">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-100 text-botanical-800 border border-sage-200 shadow-xs">
              <LockKeyhole className="h-6 w-6 text-botanical-700" />
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-sage-300/80 bg-sage-50/70 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-botanical-800 mb-2">
              <ShieldCheck className="h-3 w-3 text-botanical-600" />
              <span>Admin Authentication</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-botanical-900">
              Sign In to Console
            </h1>
            <p className="mt-1 text-xs text-stone-500">
              Enter your credentials to manage lead generation
              pipelines.
            </p>
          </div>

          {/* Feedback Alerts */}
          {authError && (
            <div
              className={`mb-5 flex items-start gap-2.5 rounded-2xl p-3.5 text-xs animate-in fade-in ${
                authError.includes("Pending Approval")
                  ? "bg-amber-50/90 border border-amber-300 text-amber-950"
                  : "bg-terracotta-50 border border-terracotta-200 text-terracotta-900"
              }`}
            >
              {authError.includes("Pending Approval") ? (
                <Clock className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-terracotta-600 mt-0.5" />
              )}
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
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="admin@verdant.local"
                  autoComplete="email"
                  className={`h-11 pl-10 text-xs sm:text-sm bg-oatmeal-100/40 border-stone-200 focus:bg-[#FCFBF8] focus:border-botanical-600 focus:ring-2 focus:ring-botanical-600/15 transition-all rounded-xl ${
                    errors.email
                      ? "border-terracotta-400 focus:ring-terracotta-400"
                      : ""
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-terracotta-600 font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">
                  Password
                </label>
                <span className="text-[11px] text-stone-400 hover:text-stone-600 cursor-not-allowed">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`h-11 pl-10 pr-10 text-xs sm:text-sm bg-oatmeal-100/40 border-stone-200 focus:bg-[#FCFBF8] focus:border-botanical-600 focus:ring-2 focus:ring-botanical-600/15 transition-all rounded-xl ${
                    errors.password
                      ? "border-terracotta-400 focus:ring-terracotta-400"
                      : ""
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

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer select-none">
                <input
                  {...register("rememberMe")}
                  type="checkbox"
                  className="h-4 w-4 rounded border-stone-300 text-botanical-700 focus:ring-botanical-600 accent-botanical-700"
                />
                <span>Keep admin session active</span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl bg-botanical-700 hover:bg-botanical-800 text-paper font-medium text-xs sm:text-sm shadow-sm transition-all cursor-pointer mt-2 gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-sage-200" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In as Admin</span>
                  <ArrowRight className="h-4 w-4 text-sage-300" />
                </>
              )}
            </Button>
          </form>

          {/* Switch to Registration */}
          <div className="mt-7 pt-5 border-t border-stone-200/80 text-center">
            <p className="text-xs text-stone-500">
              Need to create a new administrator profile?{" "}
              <Link
                href="/register"
                className="font-semibold text-botanical-800 hover:text-botanical-900 underline underline-offset-4 cursor-pointer"
              >
                Register Admin
              </Link>
            </p>
          </div>
        </div>

        {/* Floating Trust Pills */}
        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-stone-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-botanical-700" />
            <span>Sole Admin Privilege</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-sage-600" />
            <span>MongoDB Enforced</span>
          </span>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto py-3 text-center text-[11px] text-stone-400">
        Verdant Botanical CRM • High Performance Lead Extraction •
        Next.js 16
      </footer>
    </div>
  );
}
