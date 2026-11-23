import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export interface GuardOptions {
  /**
   * List of roles permitted to access this resource.
   * If omitted, any authenticated, active user is allowed.
   */
  allowedRoles?: string[];
  /**
   * Single role required to access this resource.
   */
  requiredRole?: string;
  /**
   * Destination path if unauthenticated or unauthorized. Defaults to "/login".
   */
  redirectTo?: string;
}

/**
 * Server-side Authentication & Authorization Guard.
 * Directly utilizes the authenticated session payload from Better Auth.
 * Avoids redundant per-navigation database queries and gracefully redirects on session errors.
 */
export async function requireAuth(options: GuardOptions = {}) {
  const { allowedRoles = ["admin", "moderator", "user"], requiredRole, redirectTo = "/login" } = options;

  let session: any = null;
  try {
    const headerList = await headers();
    session = await auth.api.getSession({
      headers: headerList,
    });
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    console.error("requireAuth: Failed to get session:", err);
    redirect(redirectTo);
  }

  // 1. Not authenticated -> Redirect to login
  if (!session?.user) {
    redirect(redirectTo);
  }

  // 2. Check if user is banned
  if ((session.user as any).banned) {
    redirect(`${redirectTo}?error=banned`);
  }

  // 3. Role Authorization check
  const userRole = ((session.user as any).role || "user").toLowerCase();

  // If specific single role is required
  if (requiredRole && userRole !== requiredRole.toLowerCase()) {
    redirect(`${redirectTo}?error=unauthorized`);
  }

  // If a list of allowed roles is specified
  if (allowedRoles && allowedRoles.length > 0) {
    const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());
    if (!normalizedAllowed.includes(userRole)) {
      redirect(`${redirectTo}?error=unauthorized`);
    }
  }

  return session;
}

/**
 * Convenience helper specifically for admin-protected pages (e.g. /users).
 */
export async function requireAdminAuth(redirectTo = "/login") {
  return requireAuth({ requiredRole: "admin", redirectTo });
}

/**
 * Optional helper for public pages (e.g. /login, /register)
 * If an active session exists, redirect immediately away to the dashboard.
 */
export async function requireGuest(redirectTo = "/") {
  try {
    const headerList = await headers();
    const session = await auth.api.getSession({
      headers: headerList,
    });
    if (session?.user) {
      redirect(redirectTo);
    }
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
  }
}
