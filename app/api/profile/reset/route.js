import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // 1. Reset profile row to baseline zeros
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        xp: 0,
        streak: 0,
        badges: []
      })
      .eq("id", user.id);

    if (profileError) throw profileError;

    // 2. Delete all course and lesson progress
    const { error: progressError } = await supabase
      .from("progress")
      .delete()
      .eq("user_id", user.id);

    if (progressError) throw progressError;

    // 3. Delete all quiz attempts
    const { error: quizError } = await supabase
      .from("quiz_attempts")
      .delete()
      .eq("user_id", user.id);

    if (quizError) throw quizError;

    return NextResponse.json({ success: true, message: "All metrics and database items have been reset to zero." });
  } catch (error) {
    console.error("Error in profile reset API:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
