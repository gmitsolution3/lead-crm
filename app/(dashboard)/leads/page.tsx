import { Suspense } from "react";
import { requireAuth } from "@/lib/auth-guard";
import LeadsGroupDashboard from "@/components/pages/LeadsGroupDashboard";

export const instant = false;

export default async function LeadsGroupPage() {
  const session = await requireAuth();
  return (
    <Suspense fallback={null}>
      <LeadsGroupDashboard user={session.user} />
    </Suspense>
  );
}
