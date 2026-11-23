import { Suspense } from "react";
import LeadsDashboard from "@/components/pages/LeadsDashboard";
import { requireAuth } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export default async function GroupLeadsPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const session = await requireAuth({
    allowedRoles: ["admin", "moderator"],
    redirectTo: "/",
  });
  const { groupId } = await params;
  return (
    <Suspense fallback={null}>
      <LeadsDashboard user={session.user} groupId={groupId} />
    </Suspense>
  );
}
