import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { setAuthCookie, signToken } from "@/lib/auth";
import User from "@/models/User";

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password || password.length < 6) {
      return NextResponse.json(
        { message: "Name, email, and a 6+ character password are required." },
        { status: 400 }
      );
    }

    await connectDB();
    const existing = await User.findOne({ email });

    if (existing) {
      return NextResponse.json({ message: "Email is already registered." }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashed });
    const token = signToken({ id: user._id.toString(), name: user.name, email: user.email });
    await setAuthCookie(token);

    return NextResponse.json({
      user: { id: user._id, name: user.name, email: user.email, xp: user.xp, streak: user.streak }
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
