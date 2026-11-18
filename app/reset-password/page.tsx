"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  resetPasswordSchema,
  ResetPasswordFormData,
} from "@/lib/validations/auth";
import { resetPassword } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  ShieldCheck,
} from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");
  const errorParam = searchParams.get("error");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(
    errorParam === "INVALID_TOKEN"
      ? "This password reset link is invalid or has expired. Please request a new one."
      : null
  );
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setAuthError("Missing reset token. Please request a new password reset link.");
      return;
    }

    setIsSubmitting(true);
    setAuthError(null);

    try {
      const result = await resetPassword({
        newPassword: data.password,
        token,
      });

      if (result.error) {
        setAuthError(
          result.error.message ||
            "Failed to reset password. The link may have expired."
        );
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setAuthError(
        err?.message || "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F3EF] flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-8 selection:bg-botanical-200">
      {/* Background radial gradient accent */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center opacity-40">
        <div className="w-[600px] h-[600px] bg-gradient-to-tr from-botanical-300/30 to-sage-200/40 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-7">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 mb-3.5 group cursor-pointer"
          >
            <img
              src="/app-icon-256x256.png"
              alt="GM Lead Generator"
              className="h-10 w-10 rounded-xl object-contain shadow-md"
            />
            <div className="text-left">
              <span className="text-lg font-bold text-botanical-900 tracking-tight block leading-tight">
                GM Lead Generator
              </span>
              <span className="text-[10px] font-semibold text-botanical-600 uppercase tracking-wider block">
                Lead Intelligence
              </span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-botanical-950 sm:text-3xl">
            {isSuccess ? "Password updated!" : "Create new password"}
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-stone-500 max-w-sm mx-auto leading-relaxed">
            {isSuccess
              ? "Your password has been securely updated. You will be redirected to the login page."
              : "Your new password must be at least 6 characters long and different from previous passwords."}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-stone-200/90 bg-[#FCFBF8] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
          {/* Missing or Invalid Token State */}
          {!token && !isSuccess ? (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-700">
                <AlertCircle className="h-7 w-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-stone-800">
                  Invalid or Expired Link
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
                  This password reset link is missing a valid token or has expired. Please request a new link to proceed.
                </p>
              </div>
              <Link href="/forgot-password" className="block pt-2">
                <Button className="w-full h-11 rounded-xl bg-botanical-900 text-xs font-semibold text-white hover:bg-botanical-800 cursor-pointer">
                  Request New Reset Link
                </Button>
              </Link>
            </div>
          ) : isSuccess ? (
            /* Success State */
            <div className="space-y-6 text-center py-4 animate-in fade-in duration-300">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-botanical-50 border border-botanical-200/60 shadow-xs text-botanical-700">
                <CheckCircle2 className="h-8 w-8 text-botanical-700" />
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-botanical-950">
                  All Set!
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Your password has been successfully reset. All active sessions have been updated.
                </p>
              </div>

              <div className="rounded-xl bg-botanical-50/60 border border-botanical-200/60 p-3 text-xs text-botanical-800 flex items-center justify-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Redirecting to login in 3 seconds...</span>
              </div>

              <Link href="/login" className="block w-full pt-1">
                <Button className="w-full h-11 rounded-xl bg-botanical-900 text-xs font-semibold text-white hover:bg-botanical-800 shadow-sm cursor-pointer">
                  Go to Login Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {authError && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3.5 text-xs text-amber-900 animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <div className="flex-1 leading-relaxed">{authError}</div>
                </div>
              )}

              {/* New Password */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-xs font-semibold text-stone-700"
                >
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    id="password"
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={`h-11 pl-10 pr-10 text-xs sm:text-sm bg-oatmeal-100/40 border-stone-200 focus:bg-[#FCFBF8] focus:border-botanical-600 focus:ring-2 focus:ring-botanical-600/15 transition-all rounded-xl ${
                      errors.password ? "border-amber-400 focus:border-amber-500" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] text-amber-600 font-medium">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="confirmPassword"
                  className="text-xs font-semibold text-stone-700"
                >
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    id="confirmPassword"
                    {...register("confirmPassword")}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={`h-11 pl-10 pr-10 text-xs sm:text-sm bg-oatmeal-100/40 border-stone-200 focus:bg-[#FCFBF8] focus:border-botanical-600 focus:ring-2 focus:ring-botanical-600/15 transition-all rounded-xl ${
                      errors.confirmPassword
                        ? "border-amber-400 focus:border-amber-500"
                        : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus:outline-none cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-[11px] text-amber-600 font-medium">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-xl bg-botanical-900 text-xs sm:text-sm font-semibold text-white hover:bg-botanical-800 shadow-sm transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating password...
                  </>
                ) : (
                  <>
                    Save New Password
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center text-xs font-medium text-stone-500 hover:text-botanical-900 transition-colors"
                >
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  Cancel and return to login
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Security footer */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
          <ShieldCheck className="h-3.5 w-3.5 text-botanical-600" />
          <span>Passphrase hashed with Argon2id cryptographic protection</span>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F3EF] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-botanical-700" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
