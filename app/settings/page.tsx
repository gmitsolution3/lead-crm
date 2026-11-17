import { requireAdminAuth } from "@/lib/auth-guard";
import SettingsDashboard from "@/components/pages/SettingsDashboard";

export const instant = false;

export default async function SettingsPage() {
  const session = await requireAdminAuth();

  return <SettingsDashboard user={session.user} />;
}
