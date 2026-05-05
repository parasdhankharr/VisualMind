import { NextResponse } from "next/server";
import { transformContent } from "@/lib/api";

export async function POST(request) {
  const { text } = await request.json();

  if (!text || text.trim().length < 40) {
    return NextResponse.json(
      { message: "Paste at least 40 characters of learning content." },
      { status: 400 }
    );
  }

  return NextResponse.json(transformContent(text));
}
