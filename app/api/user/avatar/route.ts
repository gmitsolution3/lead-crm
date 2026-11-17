import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/mongodb";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";
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

// POST /api/user/avatar - Upload profile picture to Cloudinary & update MongoDB
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    // Validate mime type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Please upload a valid image file (PNG, JPG, WebP, etc.)" },
        { status: 400 }
      );
    }

    // Max 5MB size limit
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image file size exceeds the 5MB limit" },
        { status: 400 }
      );
    }

    const query = buildUserQuery(session.user.id);
    const existingUser = await db.collection("user").findOne(query);

    if (!existingUser) {
      return NextResponse.json(
        { error: "User account not found" },
        { status: 404 }
      );
    }

    // If an existing Cloudinary avatar exists, delete it first to keep storage tidy
    if (existingUser.imagePublicId) {
      try {
        await deleteFromCloudinary(existingUser.imagePublicId);
      } catch (delErr) {
        console.warn("Failed to delete previous avatar from Cloudinary:", delErr);
      }
    }

    // Convert file to Buffer and upload to Cloudinary under folder "gm-lead-generator"
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { url, publicId } = await uploadToCloudinary(
      buffer,
      "gm-lead-generator"
    );

    // Save public url and public id in MongoDB
    await db.collection("user").updateOne(query, {
      $set: {
        image: url,
        imagePublicId: publicId,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      image: url,
      imagePublicId: publicId,
      message: "Profile picture uploaded successfully!",
    });
  } catch (err: any) {
    console.error("POST /api/user/avatar error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to upload avatar" },
      { status: 500 }
    );
  }
}

// DELETE /api/user/avatar - Remove profile picture from Cloudinary & clear MongoDB
export async function DELETE() {
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
    const existingUser = await db.collection("user").findOne(query);

    if (!existingUser) {
      return NextResponse.json(
        { error: "User account not found" },
        { status: 404 }
      );
    }

    // Delete image from Cloudinary if publicId exists
    if (existingUser.imagePublicId) {
      await deleteFromCloudinary(existingUser.imagePublicId);
    }

    // Clear image and imagePublicId from user record
    await db.collection("user").updateOne(query, {
      $set: {
        image: null,
        imagePublicId: null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile picture removed successfully",
    });
  } catch (err: any) {
    console.error("DELETE /api/user/avatar error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to remove avatar" },
      { status: 500 }
    );
  }
}
