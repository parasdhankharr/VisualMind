import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    let { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    const { data: progress } = await supabase
      .from("progress")
      .select("*")
      .eq("user_id", user.id);

    return NextResponse.json({
      profile: profile || {
        id: user.id,
        name: user.name,
        email: user.email,
        xp: user.xp,
        streak: user.streak,
        badges: user.badges
      },
      progress: progress || []
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
