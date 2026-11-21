import type { auth } from "@/lib/auth";

/**
 * Authoritative User and Session types inferred directly from Better Auth.
 * Includes all additionalFields (phone, imagePublicId) and plugin extensions (role, banned, etc.).
 */
export type User = typeof auth.$Infer.Session.user;
export type Session = typeof auth.$Infer.Session.session;
