import { requireAdminAuth } from "@/lib/auth-guard";
import LeadsDashboard from "@/components/pages/LeadsDashboard";

export const instant = false;

export default async function LeadsPage() {
  const session = await requireAdminAuth();
  return <LeadsDashboard user={session.user} />;
}
