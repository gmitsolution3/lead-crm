"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [adminClient()],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;

/**
 * Initiates the password reset workflow by sending a secure reset link to the user's email.
 */
export async function forgetPassword(options: {
  email: string;
  redirectTo?: string;
}): Promise<{ data?: any; error?: { message?: string } | null }> {
  try {
    if (typeof (authClient as any).requestPasswordReset === "function") {
      return await (authClient as any).requestPasswordReset(options);
    }
    if (typeof (authClient as any).forgetPassword === "function") {
      return await (authClient as any).forgetPassword(options);
    }

    const res = await fetch("/api/auth/request-password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        error: {
          message: data.message || data.error || "Failed to send password reset email.",
        },
      };
    }
    return { data, error: null };
  } catch (err: any) {
    return {
      error: {
        message: err?.message || "An unexpected error occurred while requesting password reset.",
      },
    };
  }
}

/**
 * Resets the user's password using the token received in their email.
 */
export async function resetPassword(options: {
  newPassword: string;
  token: string;
}): Promise<{ data?: any; error?: { message?: string } | null }> {
  try {
    if (typeof (authClient as any).resetPassword === "function") {
      return await (authClient as any).resetPassword(options);
    }

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        error: {
          message: data.message || data.error || "Failed to reset password.",
        },
      };
    }
    return { data, error: null };
  } catch (err: any) {
    return {
      error: {
        message: err?.message || "An unexpected error occurred while resetting password.",
      },
    };
  }
}
