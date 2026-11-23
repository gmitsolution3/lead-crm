import { requireAuth } from "@/lib/auth-guard";
import AdminDashboard from "@/components/pages/AdminDashboard";
import ModeratorDashboard from "@/components/pages/ModeratorDashboard";
import UserDashboard from "@/components/pages/UserDashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireAuth({
    allowedRoles: ["admin", "moderator", "user"],
  });

  const role = ((session.user as any)?.role || "user").toLowerCase();

  if (role === "admin") {
    return <AdminDashboard user={session.user} />;
  }

  if (role === "moderator") {
    return <ModeratorDashboard user={session.user} />;
  }

  // Pending user role onboarding / approval state
  return <UserDashboard user={session.user} />;
}
