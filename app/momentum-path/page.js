import { MomentumPath } from "@/components/momentum-path";
import { requireAuth } from "@/lib/auth-redirect";

export const metadata = {
  title: "VisualMind | Momentum Path",
  description: "A premium progression view for learning consistency, rhythm, and long-term focus."
};

export const dynamic = "force-dynamic";

export default async function MomentumPathPage() {
  await requireAuth();
  return <MomentumPath />;
}
