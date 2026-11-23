import { AppShell } from "@/components/layout";
import { requireAuth } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();
  return <AppShell user={session.user}>{children}</AppShell>;
}
