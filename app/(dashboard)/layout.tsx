import { requireAdminAuth } from "@/lib/auth-guard";
import { DashboardShell } from "@/components/layout";

export const instant = false;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminAuth();
  return <DashboardShell>{children}</DashboardShell>;
}
