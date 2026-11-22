import { auth } from "@/lib/auth";
import { db } from "@/lib/mongodb";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const SETTINGS_KEY = "workspace_settings";
const DEFAULT_SETTINGS = {
  dailyApproachTarget: 25,
  dailyScrapeLimit: 500,
};

// GET /api/admin/settings - Read current workspace settings (Admin & Moderator)
export async function GET() {
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

    const settingsDoc = await db.collection("settings").findOne({ key: SETTINGS_KEY });

    return NextResponse.json({
      success: true,
      settings: {
        dailyApproachTarget: settingsDoc?.dailyApproachTarget ?? DEFAULT_SETTINGS.dailyApproachTarget,
        dailyScrapeLimit: settingsDoc?.dailyScrapeLimit ?? DEFAULT_SETTINGS.dailyScrapeLimit,
        updatedAt: settingsDoc?.updatedAt ?? null,
        updatedBy: settingsDoc?.updatedBy ?? null,
      },
    });
  } catch (error: any) {
    console.error("[SETTINGS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch workspace settings", details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/settings - Update workspace settings (Admin only)
export async function PATCH(req: NextRequest) {
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

    const userRole = (session.user as any).role;
    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required to update settings" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updateFields: Record<string, any> = {
      updatedAt: new Date(),
      updatedBy: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    };

    if (body.dailyApproachTarget !== undefined) {
      const target = Number(body.dailyApproachTarget);
      if (isNaN(target) || target < 1 || target > 1000) {
        return NextResponse.json(
          { error: "Daily approach target must be a valid number between 1 and 1000" },
          { status: 400 }
        );
      }
      updateFields.dailyApproachTarget = Math.round(target);
    }

    if (body.dailyScrapeLimit !== undefined) {
      const limit = Number(body.dailyScrapeLimit);
      if (isNaN(limit) || limit < 10 || limit > 50000) {
        return NextResponse.json(
          { error: "Daily scrape limit must be a valid number between 10 and 50000" },
          { status: 400 }
        );
      }
      updateFields.dailyScrapeLimit = Math.round(limit);
    }

    await db.collection("settings").updateOne(
      { key: SETTINGS_KEY },
      {
        $set: updateFields,
        $setOnInsert: { key: SETTINGS_KEY, createdAt: new Date() },
      },
      { upsert: true }
    );

    const updatedDoc = await db.collection("settings").findOne({ key: SETTINGS_KEY });

    return NextResponse.json({
      success: true,
      message: "Workspace settings updated successfully",
      settings: {
        dailyApproachTarget: updatedDoc?.dailyApproachTarget ?? DEFAULT_SETTINGS.dailyApproachTarget,
        dailyScrapeLimit: updatedDoc?.dailyScrapeLimit ?? DEFAULT_SETTINGS.dailyScrapeLimit,
        updatedAt: updatedDoc?.updatedAt,
        updatedBy: updatedDoc?.updatedBy,
      },
    });
  } catch (error: any) {
    console.error("[SETTINGS_PATCH_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to update workspace settings", details: error?.message },
      { status: 500 }
    );
  }
}
