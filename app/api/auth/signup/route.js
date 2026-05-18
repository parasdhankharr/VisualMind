import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncAuthUserProfile } from "@/lib/user-profile";

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password || password.length < 6) {
      return NextResponse.json(
        { message: "Name, email, and a 6+ character password are required." },
        { status: 400 }
      );
    }

    const origin = new URL(request.url).origin;
    const supabase = await createClient();
    const {
      data: { user, session },
      error
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${origin}/auth/confirm?next=/dashboard`
      }
    });

    if (error) {
      console.error("Supabase Signup Error Details:", error);
      const status = error.message.toLowerCase().includes("already") ? 409 : 400;
      return NextResponse.json({ message: error.message }, { status });
    }

    const profile = user ? await syncAuthUserProfile(user) : null;

    return NextResponse.json({
      requiresEmailConfirmation: !session,
      user: profile
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
