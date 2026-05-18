import { NextResponse } from "next/server";
import { findCourse } from "@/lib/api";
import { getAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  try {
    const user = await getAuthUser();
    const { courseId, lessonId, selected } = await request.json();
    const course = findCourse(courseId);

    const lesson = course?.lessons.find((item) => item.id === lessonId);
    const correct = selected === lesson?.quiz.answer;
    const score = correct ? 100 : 0;

    if (user) {
      const supabase = await createClient();

      await supabase.from("quiz_attempts").insert({
        user_id: user.id,
        course_id: courseId,
        lesson_id: lessonId,
        selected,
        correct,
        score
      });

      if (correct) {
        const { data: previousAttempts } = await supabase
          .from("quiz_attempts")
          .select("id")
          .eq("user_id", user.id)
          .eq("course_id", courseId)
          .eq("lesson_id", lessonId)
          .eq("correct", true);

        if (previousAttempts && previousAttempts.length <= 1) {
          const { data: currentProfile } = await supabase
            .from("profiles")
            .select("xp")
            .eq("id", user.id)
            .maybeSingle();

          const currentXp = currentProfile?.xp ?? 0;
          await supabase
            .from("profiles")
            .update({ xp: currentXp + 20 })
            .eq("id", user.id);
        }
      }
    }

    return NextResponse.json({
      correct,
      score,
      answer: lesson?.quiz.answer,
      message: correct ? "Nice! You nailed it." : "Close. Review the visual and try again."
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
