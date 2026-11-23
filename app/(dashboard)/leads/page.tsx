import { Suspense } from "react";
import { requireAuth } from "@/lib/auth-guard";
import LeadsGroupDashboard from "@/components/pages/LeadsGroupDashboard";

export const dynamic = "force-dynamic";

export default async function LeadsGroupPage() {
  const session = await requireAuth({
    allowedRoles: ["admin", "moderator"],
    redirectTo: "/",
  });
  return (
    <Suspense fallback={null}>
      <LeadsGroupDashboard user={session.user} />
    </Suspense>
  );
}
