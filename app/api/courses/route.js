import { NextResponse } from "next/server";
import { demoCourses } from "@/data/courses";

export async function GET() {
  return NextResponse.json({ courses: demoCourses });
}

export async function POST(request) {
  try {
    const payload = await request.json();
    return NextResponse.json({ course: payload }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
