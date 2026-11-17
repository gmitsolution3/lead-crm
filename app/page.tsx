import { requireAdminAuth } from "@/lib/auth-guard";
import MainDashboard from "@/components/pages/MainDashboard";

export const instant = false;

export default async function DashboardPage() {
  const session = await requireAdminAuth();

  return <MainDashboard user={session.user} />;
}
