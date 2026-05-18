import { NextResponse } from "next/server";
import { leaderboard as fallbackLeaderboard } from "@/data/courses";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Query profiles directly from database sorted by XP descending
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, name, xp, streak, email")
      .order("xp", { ascending: false });

    if (error) throw error;

    const dbUsers = Array.isArray(profiles) ? profiles.map((p) => ({
      id: p.id,
      name: p.name || "Learner",
      xp: p.xp ?? 0,
      streak: p.streak ?? 0,
      email: p.email || "",
      weeklyXp: 180, // Simulated weekly progression
      movement: 0,
      isReal: true
    })) : [];

    const seedUsers = fallbackLeaderboard.map((item, index) => ({
      id: `seed-${index}`,
      name: item.name,
      xp: item.xp,
      streak: item.streak,
      email: `${item.name.toLowerCase()}@visualmind.edu`,
      weeklyXp: item.weeklyXp || 120,
      movement: item.movement || 0,
      isReal: false
    }));

    // Merge databases and seed, avoiding duplicates
    const combined = [...dbUsers];
    seedUsers.forEach((seed) => {
      const isNameDup = combined.some((u) => u.name.toLowerCase() === seed.name.toLowerCase());
      const isEmailDup = combined.some((u) => u.email.toLowerCase() === seed.email.toLowerCase());
      if (!isNameDup && !isEmailDup) {
        combined.push(seed);
      }
    });

    // Sort by total XP descending
    combined.sort((a, b) => b.xp - a.xp);

    return NextResponse.json(combined);
  } catch (error) {
    console.error("Error in GET /api/leaderboard:", error);
    // Safe robust fallback
    return NextResponse.json(fallbackLeaderboard);
  }
}