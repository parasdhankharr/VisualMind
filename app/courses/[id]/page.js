import { CoursePlayer } from "@/components/course-player";
import { requireAuth } from "@/lib/auth-redirect";

export const dynamic = "force-dynamic";

export default async function CoursePage({ params }) {
  await requireAuth();
  const { id } = await params;
  return <CoursePlayer courseId={id} />;
}
