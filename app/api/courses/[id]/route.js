import { NextResponse } from "next/server";
import { findCourse } from "@/lib/api";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    await connectDB();
    const course = await Course.findOne({ id }).lean();
    return NextResponse.json({ course: course || findCourse(id) });
  } catch {
    const { id } = await params;
    return NextResponse.json({ course: findCourse(id), source: "fallback" });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const payload = await request.json();
    await connectDB();
    const course = await Course.findOneAndUpdate({ id }, payload, {
      new: true,
      upsert: true
    });
    return NextResponse.json({ course });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    await connectDB();
    await Course.findOneAndDelete({ id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
