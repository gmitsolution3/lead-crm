import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET /api/admin/users - List all users in MongoDB (Admin only)
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

    if ((session.user as any).role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Query all users from MongoDB
    const users = await db
      .collection("user")
      .find({})
      .project({
        id: 1,
        _id: 1,
        name: 1,
        email: 1,
        role: 1,
        phone: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .sort({ createdAt: -1 })
      .toArray();

    const formattedUsers = users.map((u) => ({
      id: u.id || u._id.toString(),
      name: u.name || "Anonymous User",
      email: u.email,
      role: u.role || "user",
      phone: u.phone || "",
      createdAt: u.createdAt || new Date().toISOString(),
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (err: any) {
    console.error("Failed to fetch users:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users - Update user role (Admin only)
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

    if ((session.user as any).role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role || !["admin", "user"].includes(role)) {
      return NextResponse.json(
        { error: "Valid userId and role ('admin' | 'user') are required" },
        { status: 400 }
      );
    }

    // Prevent self-demotion to avoid locking out the last admin
    if (userId === session.user.id && role !== "admin") {
      return NextResponse.json(
        { error: "Cannot demote your own admin account" },
        { status: 400 }
      );
    }

    // Update role in MongoDB user collection
    const query: any = {
      $or: [{ id: userId }],
    };

    if (ObjectId.isValid(userId)) {
      query.$or.push({ _id: new ObjectId(userId) });
    }

    const result = await db.collection("user").updateOne(query, {
      $set: {
        role,
        updatedAt: new Date(),
      },
    });

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        role === "admin"
          ? "User promoted to Administrator successfully"
          : "User demoted to pending user",
    });
  } catch (err: any) {
    console.error("Failed to update user role:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
