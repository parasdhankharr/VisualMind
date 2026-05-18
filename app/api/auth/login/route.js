import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncAuthUserProfile } from "@/lib/user-profile";

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    const supabase = await createClient();
    const {
      data: { user },
      error
    } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !user) {
      return NextResponse.json(
        { message: error?.message || "Invalid email or password." },
        { status: 401 }
      );
    }

    const profile = await syncAuthUserProfile(user);

    return NextResponse.json({
      user: profile
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
