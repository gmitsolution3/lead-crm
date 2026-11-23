import { requireAdminAuth } from "@/lib/auth-guard";
import SettingsDashboard from "@/components/pages/SettingsDashboard";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireAdminAuth("/");
  return <SettingsDashboard user={session.user} />;
}
