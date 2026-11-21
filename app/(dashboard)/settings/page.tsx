import { requireAuth } from "@/lib/auth-guard";
import SettingsDashboard from "@/components/pages/SettingsDashboard";

export const instant = false;

export default async function SettingsPage() {
  const session = await requireAuth();
  return <SettingsDashboard user={session.user} />;
}
