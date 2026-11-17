import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

function buildUserQuery(userId: string) {
  const query: any = { $or: [{ id: userId }] };
  if (ObjectId.isValid(userId)) {
    query.$or.push({ _id: new ObjectId(userId) });
  } else {
    query.$or.push({ _id: userId });
  }
  return query;
}

// GET /api/user/profile - Fetch the current authenticated user's profile
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

    const query = buildUserQuery(session.user.id);
    const user = await db.collection("user").findOne(query);

    if (!user) {
      return NextResponse.json(
        { error: "User account not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id || user._id.toString(),
        name: user.name || session.user.name,
        email: user.email || session.user.email,
        phone: user.phone || "",
        role: user.role || (session.user as any).role || "user",
        image: user.image || session.user.image || null,
        imagePublicId: user.imagePublicId || null,
        banned: Boolean(user.banned),
        createdAt:
          user.createdAt instanceof Date
            ? user.createdAt.toISOString()
            : user.createdAt || new Date().toISOString(),
        updatedAt:
          user.updatedAt instanceof Date
            ? user.updatedAt.toISOString()
            : user.updatedAt || new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error("GET /api/user/profile error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PATCH /api/user/profile - Update the current user's personal information (Name, Phone)
export async function PATCH(request: NextRequest) {
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
    const { name, phone } = body;

    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (typeof name === "string" && name.trim()) {
      updateFields.name = name.trim();
    }

    if (typeof phone === "string") {
      updateFields.phone = phone.trim();
    }

    const query = buildUserQuery(session.user.id);
    const result = await db.collection("user").updateOne(query, {
      $set: updateFields,
    });

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "User account not found" },
        { status: 404 }
      );
    }

    // Fetch updated record
    const updatedUser = await db.collection("user").findOne(query);

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser?.id || updatedUser?._id.toString(),
        name: updatedUser?.name,
        email: updatedUser?.email,
        phone: updatedUser?.phone || "",
        role: updatedUser?.role,
        image: updatedUser?.image || null,
        imagePublicId: updatedUser?.imagePublicId || null,
      },
    });
  } catch (err: any) {
    console.error("PATCH /api/user/profile error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
