import { Metadata } from "next";
import { requireAuth } from "@/lib/auth-guard";
import ProfileDashboard from "@/components/pages/ProfileDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Profile | GM Lead Workspace",
  description: "View and update your personal profile, photo, and security credentials.",
};

export default async function ProfilePage() {
  const session = await requireAuth({
    allowedRoles: ["admin", "moderator", "user"],
  });
  return <ProfileDashboard user={session.user} />;
}
