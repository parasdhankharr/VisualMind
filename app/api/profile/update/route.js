import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, xp, streak, badges } = await request.json();

    const updateData = {};
    if (name !== undefined) {
      if (name.trim().length === 0) {
        return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
      }
      updateData.name = name.trim();
    }
    if (xp !== undefined) {
      updateData.xp = Math.max(0, Number(xp) || 0);
    }
    if (streak !== undefined) {
      updateData.streak = Math.max(0, Number(streak) || 0);
    }
    if (badges !== undefined && Array.isArray(badges)) {
      updateData.badges = badges;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: profile, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error in profile update API:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
