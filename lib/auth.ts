import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { admin, bearer } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { APIError } from "better-auth/api";
import { ObjectId } from "mongodb";
import { client, db } from "./mongodb";
import { sendPasswordResetEmail } from "./email";

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client,
  }),
  secret:
    process.env.BETTER_AUTH_SECRET ||
    "5ea07b6d10147f98d065148ff76096c610181cf2da6e63e4d288b4051260271a",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",

  user: {
    additionalFields: {
      phone: {
        type: "string",
        required: false,
      },
      imagePublicId: {
        type: "string",
        required: false,
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    autoSignIn: false, // Do not auto-sign in so pending users do not bypass approval
    minPasswordLength: 6,
    sendResetPassword: async ({ user, token }) => {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const resetUrl = `${appUrl}/reset-password?token=${token}`;
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name || "User",
        resetUrl,
      });
    },
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour in seconds
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          try {
            // Count total existing users in MongoDB
            const usersCount = await db.collection("user").countDocuments();

            // First User Bootstrap Rule:
            // If there are 0 accounts in the database, this very first user automatically becomes the founding Admin!
            // All subsequent users are created with role: "user" (pending admin approval)
            const assignedRole = usersCount === 0 ? "admin" : "user";

            return {
              data: {
                ...user,
                role: assignedRole,
              },
            };
          } catch (err) {
            console.error("Error in user create database hook:", err);
            return { data: user };
          }
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          let userQuery: any = { id: session.userId };
          if (ObjectId.isValid(session.userId)) {
            userQuery = {
              $or: [
                { _id: new ObjectId(session.userId) },
                { id: session.userId },
                { _id: session.userId },
              ],
            };
          }

          const user = await db.collection("user").findOne(userQuery);

          if (!user) {
            throw new APIError("FORBIDDEN", {
              message: "Account not found.",
            });
          }

          // Block banned users from acquiring a session
          if (user.banned) {
            throw new APIError("FORBIDDEN", {
              message: `Account Banned: ${
                user.banReason || "Your account has been suspended by an administrator."
              }`,
            });
          }

          return { data: session };
        },
      },
    },
  },

  plugins: [
    admin({
      adminRoles: ["admin"],
      defaultRole: "user",
    }),
    bearer(),
    nextCookies(), // Must be the last plugin when integrating with Next.js
  ],
});
