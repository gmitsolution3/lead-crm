import { requireAdminAuth } from "@/lib/auth-guard";
import GroupLeadsDashboard from "@/components/pages/GroupLeadsDashboard";

export const instant = false;

export default async function GroupLeadsPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const session = await requireAdminAuth();
  const { groupId } = await params;
  return <GroupLeadsDashboard user={session.user} groupId={groupId} />;
}
