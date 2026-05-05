import { NextResponse } from "next/server";
import { demoCourses } from "@/data/courses";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";

export async function GET() {
  try {
    await connectDB();
    const courses = await Course.find({}).sort({ createdAt: -1, updatedAt: -1 }).lean();
    return NextResponse.json({ courses: courses.length ? courses : demoCourses });
  } catch {
    return NextResponse.json({ courses: demoCourses, source: "fallback" });
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();
    await connectDB();
    const course = await Course.findOneAndUpdate(
      { id: payload.id },
      payload,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const excessCourses = await Course.find({})
      .sort({ createdAt: -1, updatedAt: -1 })
      .skip(3)
      .select("_id");

    if (excessCourses.length) {
      await Course.deleteMany({
        _id: { $in: excessCourses.map((item) => item._id) }
      });
    }

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
