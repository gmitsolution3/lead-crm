import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Helper: build MongoDB ID query for string ID or ObjectId
function buildIdQuery(userId: string) {
  const query: any = {
    $or: [{ id: userId }],
  };
  if (ObjectId.isValid(userId)) {
    query.$or.push({ _id: new ObjectId(userId) });
  } else {
    query.$or.push({ _id: userId });
  }
  return query;
}

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
        banned: 1,
        banReason: 1,
        banExpires: 1,
        image: 1,
        imagePublicId: 1,
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
      image: u.image || null,
      imagePublicId: u.imagePublicId || null,
      banned: Boolean(u.banned),
      banReason: u.banReason || null,
      banExpires: u.banExpires || null,
      createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : (u.createdAt || new Date().toISOString()),
      updatedAt: u.updatedAt instanceof Date ? u.updatedAt.toISOString() : (u.updatedAt || new Date().toISOString()),
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

// PATCH /api/admin/users - Update user role, ban, or unban (Admin only)
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
    const { userId, action, role, banReason, banExpiresInDays } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const query = buildIdQuery(userId);

    // 1. ACTION: BAN USER
    if (action === "ban") {
      if (userId === session.user.id) {
        return NextResponse.json(
          { error: "You cannot ban your own active administrator account" },
          { status: 400 }
        );
      }

      let banExpires: Date | null = null;
      if (banExpiresInDays && typeof banExpiresInDays === "number") {
        banExpires = new Date(Date.now() + banExpiresInDays * 24 * 60 * 60 * 1000);
      }

      const updateResult = await db.collection("user").updateOne(query, {
        $set: {
          banned: true,
          banReason: banReason || "Suspended by administrator",
          banExpires,
          updatedAt: new Date(),
        },
      });

      if (updateResult.matchedCount === 0) {
        return NextResponse.json(
          { error: "User not found in database" },
          { status: 404 }
        );
      }

      // Immediately terminate all active sessions for this banned user
      await db.collection("session").deleteMany({
        $or: [{ userId }, { userId: new ObjectId(userId) as any }],
      });

      return NextResponse.json({
        success: true,
        message: "User banned successfully. Active sessions revoked.",
      });
    }

    // 2. ACTION: UNBAN USER
    if (action === "unban") {
      const updateResult = await db.collection("user").updateOne(query, {
        $set: {
          banned: false,
          banReason: null,
          banExpires: null,
          updatedAt: new Date(),
        },
      });

      if (updateResult.matchedCount === 0) {
        return NextResponse.json(
          { error: "User not found in database" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "User unbanned successfully.",
      });
    }

    // 3. ACTION: UPDATE ROLE
    if (role && ["admin", "user"].includes(role)) {
      if (userId === session.user.id && role !== "admin") {
        return NextResponse.json(
          { error: "Cannot demote your own administrator account" },
          { status: 400 }
        );
      }

      const updateResult = await db.collection("user").updateOne(query, {
        $set: {
          role,
          updatedAt: new Date(),
        },
      });

      if (updateResult.matchedCount === 0) {
        return NextResponse.json(
          { error: "User not found in database" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message:
          role === "admin"
            ? "User promoted to Administrator successfully."
            : "User demoted to pending user.",
      });
    }

    return NextResponse.json(
      { error: "Invalid action or parameters specified" },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Failed to update user:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users - Permanently delete a user (Admin only)
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const userIdFromQuery = searchParams.get("userId");

    let userId = userIdFromQuery;
    if (!userId) {
      try {
        const body = await request.json();
        userId = body.userId;
      } catch {
        // no body provided
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "userId parameter is required" },
        { status: 400 }
      );
    }

    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own active administrator account" },
        { status: 400 }
      );
    }

    const query = buildIdQuery(userId);

    // 1. Delete user document from 'user' collection
    const userDeleteResult = await db.collection("user").deleteOne(query);

    if (userDeleteResult.deletedCount === 0) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    // 2. Cascade delete from 'session' collection
    const sessionQuery: any = {
      $or: [{ userId }],
    };
    if (ObjectId.isValid(userId)) {
      sessionQuery.$or.push({ userId: new ObjectId(userId) });
    }
    await db.collection("session").deleteMany(sessionQuery);

    // 3. Cascade delete from 'account' collection
    await db.collection("account").deleteMany(sessionQuery);

    return NextResponse.json({
      success: true,
      message: "User and all associated authentication data deleted permanently.",
    });
  } catch (err: any) {
    console.error("Failed to delete user:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
