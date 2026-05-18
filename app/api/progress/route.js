import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ progress: [] });
    }

    const supabase = await createClient();
    const { data: progress, error } = await supabase
      .from("progress")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching progress from Supabase:", error);
      return NextResponse.json({ progress: [] });
    }

    const formattedProgress = progress.map((item) => ({
      courseId: item.course_id,
      lessonId: item.lesson_id,
      completed: item.completed
    }));

    return NextResponse.json({ progress: formattedProgress });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }

    const { courseId, lessonId, completed = true } = await request.json();
    const supabase = await createClient();

    const { data: existing } = await supabase
      .from("progress")
      .select("completed")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .eq("lesson_id", lessonId)
      .maybeSingle();

    const { data: progress, error } = await supabase
      .from("progress")
      .upsert(
        {
          user_id: user.id,
          course_id: courseId,
          lesson_id: lessonId,
          completed,
          updated_at: new Date().toISOString()
        },
        { onConflict: "user_id,course_id,lesson_id" }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    const isNewCompletion = (!existing || !existing.completed) && completed;
    if (isNewCompletion) {
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("xp")
        .eq("id", user.id)
        .maybeSingle();

      const currentXp = currentProfile?.xp ?? 0;
      await supabase
        .from("profiles")
        .update({ xp: currentXp + 30 })
        .eq("id", user.id);
    }

    return NextResponse.json({
      progress: {
        courseId: progress.course_id,
        lessonId: progress.lesson_id,
        completed: progress.completed
      }
    });
  } catch (error) {
    console.error("Error in POST progress:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
