import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// POST /api/user/password - Change password via Better Auth
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword) {
      return NextResponse.json(
        { error: "Please enter your current password" },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "New password and confirmation do not match" },
        { status: 400 }
      );
    }

    // Call Better Auth change password API
    const result = await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });

    if (!result) {
      return NextResponse.json(
        { error: "Failed to update password. Please check your current password." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password changed successfully! Other active sessions have been revoked.",
    });
  } catch (err: any) {
    console.error("POST /api/user/password error:", err);
    return NextResponse.json(
      {
        error:
          err?.message ||
          "Failed to change password. Please verify your current password.",
      },
      { status: 400 }
    );
  }
}
