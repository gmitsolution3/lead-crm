import { Suspense } from "react";
import { requireAdminAuth } from "@/lib/auth-guard";
import UsersDashboard from "@/components/pages/UsersDashboard";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await requireAdminAuth();
  return (
    <Suspense fallback={null}>
      <UsersDashboard user={session.user} />
    </Suspense>
  );
}
