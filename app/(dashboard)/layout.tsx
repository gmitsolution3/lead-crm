import { requireAdminAuth } from "@/lib/auth-guard";
import { DashboardShell } from "@/components/layout";

export const instant = false;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminAuth();
  return <DashboardShell user={session.user}>{children}</DashboardShell>;
}
