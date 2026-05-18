import { Dashboard } from "@/components/dashboard";
import { requireAuth } from "@/lib/auth-redirect";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireAuth();
  return <Dashboard />;
}
