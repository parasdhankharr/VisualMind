import { AiTransformer } from "@/components/ai-transformer";
import { requireAuth } from "@/lib/auth-redirect";

export const dynamic = "force-dynamic";

export default async function AiLabPage() {
  await requireAuth();
  return <AiTransformer />;
}
