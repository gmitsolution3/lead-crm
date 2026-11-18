"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordSchema,
  ForgotPasswordFormData,
} from "@/lib/validations/auth";
import { forgetPassword } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    setAuthError(null);

    try {
      const redirectTo = `${window.location.origin}/reset-password`;

      const result = await forgetPassword({
        email: data.email,
        redirectTo,
      });

      if (result.error) {
        setAuthError(
          result.error.message || "Failed to process password reset request."
        );
        return;
      }

      setSubmittedEmail(data.email);
      startResendTimer();
    } catch (err: any) {
      setAuthError(
        err?.message || "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const startResendTimer = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (!submittedEmail || resendCooldown > 0) return;
    setIsSubmitting(true);
    setAuthError(null);

    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      await forgetPassword({
        email: submittedEmail,
        redirectTo,
      });
      startResendTimer();
    } catch (err: any) {
      setAuthError(err?.message || "Failed to resend reset email.");
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
            {submittedEmail ? "Check your inbox" : "Forgot your password?"}
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-stone-500 max-w-sm mx-auto leading-relaxed">
            {submittedEmail
              ? `We have sent password reset instructions to ${submittedEmail}`
              : "Enter your registered email address and we'll send you a link to reset your password."}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-stone-200/90 bg-[#FCFBF8] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
          {/* Error Message */}
          {authError && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3.5 text-xs text-amber-900 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div className="flex-1 leading-relaxed">{authError}</div>
            </div>
          )}

          {submittedEmail ? (
            /* Success State */
            <div className="space-y-6 text-center py-2 animate-in fade-in duration-300">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-botanical-50 border border-botanical-200/60 shadow-xs text-botanical-700">
                <Mail className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                <p className="text-xs text-stone-600 leading-relaxed">
                  If an account exists with <strong className="text-botanical-950">{submittedEmail}</strong>, you will receive an email shortly with a secure link to reset your password.
                </p>
                <div className="rounded-xl bg-stone-100/70 p-3 text-[11px] text-stone-500 border border-stone-200/70">
                  ⏱️ For your security, the reset link will expire in <strong className="text-stone-700">60 minutes</strong>.
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <Button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || isSubmitting}
                  variant="outline"
                  className="w-full h-11 text-xs border-stone-200 hover:bg-stone-100 rounded-xl cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5 mr-2" />
                  )}
                  {resendCooldown > 0
                    ? `Resend email in ${resendCooldown}s`
                    : "Did not receive it? Resend email"}
                </Button>

                <Link href="/login" className="block w-full">
                  <Button
                    type="button"
                    className="w-full h-11 rounded-xl bg-botanical-900 text-xs font-semibold text-white hover:bg-botanical-800 shadow-sm cursor-pointer"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-stone-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    id="email"
                    {...register("email")}
                    type="email"
                    placeholder="name@company.com"
                    autoComplete="email"
                    className={`h-11 pl-10 text-xs sm:text-sm bg-oatmeal-100/40 border-stone-200 focus:bg-[#FCFBF8] focus:border-botanical-600 focus:ring-2 focus:ring-botanical-600/15 transition-all rounded-xl ${
                      errors.email ? "border-amber-400 focus:border-amber-500" : ""
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] text-amber-600 font-medium">
                    {errors.email.message}
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
                    Sending reset link...
                  </>
                ) : (
                  <>
                    Send Reset Link
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
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Security badge footer */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
          <ShieldCheck className="h-3.5 w-3.5 text-botanical-600" />
          <span>Encrypted 256-bit automated password recovery</span>
        </div>
      </div>
    </div>
  );
}
