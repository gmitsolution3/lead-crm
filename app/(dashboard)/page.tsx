import { requireAuth } from "@/lib/auth-guard";
import OverviewDashboard from "@/components/pages/OverviewDashboard";

export const instant = false;

export default async function DashboardPage() {
  const session = await requireAuth({
    allowedRoles: ["admin", "moderator", "user"],
  });
  return <OverviewDashboard user={session.user} />;
}
