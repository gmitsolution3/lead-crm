import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { admin, bearer } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { client, db } from "./mongodb";

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client,
  }),
  secret: process.env.BETTER_AUTH_SECRET || "5ea07b6d10147f98d065148ff76096c610181cf2da6e63e4d288b4051260271a",
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
    autoSignIn: true,
    minPasswordLength: 6,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
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
