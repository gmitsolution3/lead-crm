import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export interface GuardOptions {
  requiredRole?: "admin" | "user";
  redirectTo?: string;
}

/**
 * Server-side Authentication & Authorization Guard.
 * Checks session, MongoDB ban status, and role.
 * Redirects unauthorized users automatically before rendering server components.
 */
export async function requireAuth(options: GuardOptions = {}) {
  const { requiredRole = "admin", redirectTo = "/login" } = options;

  const headerList = await headers();
  const session = await auth.api.getSession({
    headers: headerList,
  });

  // 1. Not authenticated -> Redirect to login
  if (!session?.user) {
    redirect(redirectTo);
  }

  // 2. Fetch authoritative user record from MongoDB
  let userQuery: any = { id: session.user.id };
  if (ObjectId.isValid(session.user.id)) {
    userQuery = {
      $or: [
        { _id: new ObjectId(session.user.id) },
        { id: session.user.id },
        { _id: session.user.id },
      ],
    };
  }

  const dbUser = await db.collection("user").findOne(userQuery);

  if (!dbUser) {
    redirect(`${redirectTo}?error=notfound`);
  }

  // 3. Check if user is banned
  if (dbUser.banned) {
    redirect(`${redirectTo}?error=banned`);
  }

  // 4. Check required role
  const userRole = dbUser.role || (session.user as any).role || "user";
  if (requiredRole === "admin" && userRole !== "admin") {
    redirect(`${redirectTo}?error=pending`);
  }

  return {
    ...session,
    user: {
      ...session.user,
      role: userRole,
      phone: dbUser.phone || "",
    },
  };
}

/**
 * Convenience helper specifically for admin-protected pages.
 */
export async function requireAdminAuth(redirectTo = "/login") {
  return requireAuth({ requiredRole: "admin", redirectTo });
}

/**
 * Optional helper for public pages (e.g. /login, /register)
 * Redirects already logged-in admins to the dashboard.
 */
export async function redirectIfAuthenticated(redirectTo = "/") {
  try {
    const headerList = await headers();
    const session = await auth.api.getSession({
      headers: headerList,
    });

    if (session?.user && (session.user as any).role === "admin") {
      redirect(redirectTo);
    }
  } catch (err) {
    // If redirect throws Next.js NEXT_REDIRECT error, rethrow it
    if ((err as any)?.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    // Otherwise allow access to public page
  }
}
