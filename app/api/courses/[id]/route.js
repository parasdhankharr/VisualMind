import { NextResponse } from "next/server";
import { findCourse } from "@/lib/api";

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const course = findCourse(id);
    return NextResponse.json({ course });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const payload = await request.json();
    return NextResponse.json({ course: payload });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
