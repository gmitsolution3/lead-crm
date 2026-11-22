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
  Database,
  UserPlus,
  Clock,
} from "lucide-react";
import { registerSchema, RegisterFormData } from "@/lib/validations/auth";
import { signUp, signIn, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export default function RegisterPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      terms: true,
    },
  });

  // Redirect if already authenticated as Admin
  React.useEffect(() => {
    if (session?.user && (session.user as any)?.role === "admin") {
      router.push("/");
    }
  }, [session, router]);

  const onSubmit = async (data: RegisterFormData) => {
    setAuthError(null);
    setAuthSuccess(null);
    setIsSubmitting(true);

    try {
      // 1. Create the user in MongoDB
      const res = await signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
        // @ts-ignore
        phone: data.phone || "",
      });

      if (res.error) {
        setAuthError(
          res.error.message ||
            "Failed to register account. Please check your details or try another email."
        );
        setIsSubmitting(false);
        return;
      }

      // 2. Attempt login to see if this user is the First Founding Admin or a Pending User
      const loginRes = await signIn.email({
        email: data.email,
        password: data.password,
      });

      if (loginRes.error) {
        // If login error indicates pending approval or forbidden
        if (
          loginRes.error.message?.includes("Pending Approval") ||
          loginRes.error.status === 403
        ) {
          setIsPendingApproval(true);
          setIsSubmitting(false);
          return;
        }

        // Generic error
        setAuthError(loginRes.error.message || "Failed to authenticate.");
        setIsSubmitting(false);
        return;
      }

      // First user bootstrap succeeded! Logged in as Admin!
      setAuthSuccess(
        "First Administrator account initialized! You have full workspace authority. Launching dashboard..."
      );
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 700);
    } catch (err: any) {
      setAuthError(err?.message || "Registration failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#F5F2ED] text-stone-900 flex flex-col justify-between p-4 sm:p-6 lg:p-8 selection:bg-sage-200">
      {/* Background Architectural Mesh & Botanical Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-sage-300/25 blur-[120px]" />
        <div className="absolute top-1/3 -left-32 h-[450px] w-[450px] rounded-full bg-botanical-600/10 blur-[130px]" />
        <div className="absolute -bottom-32 right-1/3 h-[500px] w-[500px] rounded-full bg-terracotta-300/15 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: "radial-gradient(#2C4A3E 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* Top Navigation / Brand Bar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <img
            src="/app-icon-256x256.png"
            alt="GM Lead Generator"
            className="h-10 w-10 rounded-2xl object-contain shadow-sm"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-botanical-900">
                GM
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-terracotta-500">
                Lead Generator
              </span>
            </div>
            <p className="text-[11px] text-stone-500 leading-none">Admin Workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-stone-300/70 bg-[#FCFBF8]/80 text-stone-600 text-[11px] gap-1.5 py-1 px-3 backdrop-blur-xs"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>System Operational</span>
          </Badge>
        </div>
      </header>

      {/* Main Centered Registration Card */}
      <main className="relative z-10 my-auto w-full max-w-lg mx-auto py-8">
        <div className="rounded-3xl border border-stone-200/90 bg-[#FCFBF8] p-7 sm:p-9 shadow-[0_20px_70px_-15px_rgba(44,74,62,0.08)] backdrop-blur-md relative overflow-hidden">
          {/* Subtle top Botanical hairline accent */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-terracotta-400 via-botanical-600 to-sage-400" />

          {/* If Account Created and Pending Admin Approval */}
          {isPendingApproval ? (
            <div className="py-4 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-terracotta-100 text-terracotta-700 border border-terracotta-200 shadow-xs">
                <Clock className="h-7 w-7 text-terracotta-600" />
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full border border-terracotta-300/80 bg-terracotta-50/70 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-terracotta-800 mb-2.5">
                <span>Account Created • Approval Pending</span>
              </div>

              <h2 className="text-xl font-bold text-botanical-900">
                Awaiting Administrator Promotion
              </h2>

              <p className="mt-2 text-xs text-stone-600 leading-relaxed max-w-sm mx-auto">
                Your profile has been saved to the MongoDB directory. For security, newly registered accounts cannot log in until an existing <strong>Administrator</strong> promotes your role to Admin.
              </p>

              <div className="mt-6 rounded-2xl bg-oatmeal-100/70 p-4 border border-stone-200/80 text-left text-xs text-stone-600 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-stone-400">Current Role:</span>
                  <Badge variant="sage" className="text-[10px]">user (pending)</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Required Role:</span>
                  <Badge variant="terracotta" className="text-[10px]">admin (authorized)</Badge>
                </div>
                <div className="pt-2 border-t border-stone-200/60 text-[11px] text-stone-500">
                  Please notify a workspace admin to approve your account from their Team Management console.
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <Button
                  onClick={() => router.push("/login")}
                  className="w-full h-10.5 rounded-xl bg-botanical-700 hover:bg-botanical-800 text-paper text-xs font-medium cursor-pointer"
                >
                  <span>Go to Sign In Page</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Card Header */}
              <div className="text-center mb-6">
                <img
                  src="/app-icon-256x256.png"
                  alt="GM Lead Generator"
                  className="mx-auto mb-3 h-14 w-14 rounded-2xl object-contain shadow-xs"
                />

                <div className="inline-flex items-center gap-1.5 rounded-full border border-botanical-300/80 bg-botanical-50/70 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-botanical-800 mb-2">
                  <ShieldCheck className="h-3 w-3 text-botanical-600" />
                  <span>Admin Registration</span>
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-botanical-900">
                  Create Account
                </h1>
                <p className="mt-1 text-xs text-stone-500">
                  First registered user automatically becomes the founding Admin.
                </p>
              </div>

              {/* Feedback Alerts */}
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
                  <Label className="text-xs font-semibold text-stone-700">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <Input
                      {...register("name")}
                      type="text"
                      placeholder="e.g. Moin Khan"
                      autoComplete="name"
                      className={`h-11 pl-10 text-xs sm:text-sm bg-oatmeal-100/40 border-stone-200 focus:bg-[#FCFBF8] focus:border-botanical-600 focus:ring-2 focus:ring-botanical-600/15 transition-all rounded-xl ${
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

                {/* Email & Phone Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-stone-700">
                      Work Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                      <Input
                        {...register("email")}
                        type="email"
                        placeholder="admin@company.com"
                        autoComplete="email"
                        className={`h-11 pl-10 text-xs sm:text-sm bg-oatmeal-100/40 border-stone-200 focus:bg-[#FCFBF8] focus:border-botanical-600 focus:ring-2 focus:ring-botanical-600/15 transition-all rounded-xl ${
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

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-stone-700">
                      Phone (Optional)
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                      <Input
                        {...register("phone")}
                        type="tel"
                        placeholder="+1 (555) 012-3456"
                        autoComplete="tel"
                        className="h-11 pl-10 text-xs sm:text-sm bg-oatmeal-100/40 border-stone-200 focus:bg-[#FCFBF8] focus:border-botanical-600 focus:ring-2 focus:ring-botanical-600/15 transition-all rounded-xl"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-[11px] text-terracotta-600 font-medium">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Password & Confirm Password Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Password */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-stone-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                      <Input
                        {...register("password")}
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className={`h-11 pl-10 pr-10 text-xs sm:text-sm bg-oatmeal-100/40 border-stone-200 focus:bg-[#FCFBF8] focus:border-botanical-600 focus:ring-2 focus:ring-botanical-600/15 transition-all rounded-xl ${
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
                    <Label className="text-xs font-semibold text-stone-700">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                      <Input
                        {...register("confirmPassword")}
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className={`h-11 pl-10 pr-10 text-xs sm:text-sm bg-oatmeal-100/40 border-stone-200 focus:bg-[#FCFBF8] focus:border-botanical-600 focus:ring-2 focus:ring-botanical-600/15 transition-all rounded-xl ${
                          errors.confirmPassword
                            ? "border-terracotta-400 focus:ring-terracotta-400"
                            : ""
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
                <div className="pt-1 space-y-1">
                  <div className="flex items-start gap-2.5">
                    <Checkbox
                      id="terms"
                      className="mt-0.5 shrink-0"
                      checked={!!watch("terms")}
                      onCheckedChange={(val) => setValue("terms", !!val)}
                    />
                    <label
                      htmlFor="terms"
                      className="block flex-1 text-xs text-stone-600 cursor-pointer font-normal leading-relaxed select-none"
                    >
                      <span>
                        I agree to the{" "}
                        <span className="text-botanical-800 font-medium underline underline-offset-2">
                          Terms of Service
                        </span>{" "}
                        and acknowledge administrator approval flow.
                      </span>
                    </label>
                  </div>
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
                  className="w-full h-11 rounded-xl bg-botanical-700 hover:bg-botanical-800 text-paper font-medium text-xs sm:text-sm shadow-sm transition-all cursor-pointer mt-2 gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-sage-200" />
                      <span>Registering...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Registration</span>
                      <ArrowRight className="h-4 w-4 text-sage-300" />
                    </>
                  )}
                </Button>
              </form>

              {/* Switch to Login */}
              <div className="mt-7 pt-5 border-t border-stone-200/80 text-center">
                <p className="text-xs text-stone-500">
                  Already registered as an administrator?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-botanical-800 hover:text-botanical-900 underline underline-offset-4 cursor-pointer"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Floating Trust Pills */}
        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-stone-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-botanical-700" />
            <span>Admin Role Verification</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-sage-600" />
            <span>Role-Based Permissions</span>
          </span>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto py-3 text-center text-[11px] text-stone-400">
        &copy; 2026 GM Lead Generator &bull; Lead Extraction System
      </footer>
    </div>
  );
}
