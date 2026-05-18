import { RanksRoadmap } from "@/components/ranks-roadmap";
import { requireAuth } from "@/lib/auth-redirect";

export const metadata = {
  title: "VisualMind | Ranks Roadmap",
  description: "A premium roadmap for long-term learning progression inside VisualMind."
};

export const dynamic = "force-dynamic";

export default async function RanksRoadmapPage() {
  await requireAuth();
  return <RanksRoadmap />;
}
