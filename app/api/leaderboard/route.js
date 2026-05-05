import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  try {
    await connectDB();

    // Fetch top 10 users by XP, including name, xp, streak
    const leaderboard = await User.find({})
      .sort({ xp: -1 })
      .limit(10)
      .select("name xp streak")
      .lean();

    // Calculate focus as in the component: 84 + Math.floor(streak / 2)
    const leaderboardWithFocus = leaderboard.map(user => ({
      name: user.name,
      xp: user.xp,
      streak: user.streak,
      focus: 84 + Math.floor(user.streak / 2)
    }));

    return new Response(JSON.stringify(leaderboardWithFocus), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch leaderboard" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}