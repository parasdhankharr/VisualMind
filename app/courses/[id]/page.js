import { CoursePlayer } from "@/components/course-player";

export default async function CoursePage({ params }) {
  const { id } = await params;
  return <CoursePlayer courseId={id} />;
}
