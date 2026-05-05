import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Progress from "@/models/Progress";

export async function GET() {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ progress: [] });
    }

    await connectDB();
    const progress = await Progress.find({ userId: user.id }).lean();
    return NextResponse.json({ progress });
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
    await connectDB();
    const progress = await Progress.findOneAndUpdate(
      { userId: user.id, courseId, lessonId },
      { completed },
      { upsert: true, new: true }
    );

    return NextResponse.json({ progress });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
