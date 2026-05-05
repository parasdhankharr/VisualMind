import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { setAuthCookie, signToken } from "@/lib/auth";
import User from "@/models/User";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    await connectDB();
    const user = await User.findOne({ email });
    const valid = user ? await bcrypt.compare(password, user.password) : false;

    if (!valid) {
      return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
    }

    const token = signToken({ id: user._id.toString(), name: user.name, email: user.email });
    await setAuthCookie(token);

    return NextResponse.json({
      user: { id: user._id, name: user.name, email: user.email, xp: user.xp, streak: user.streak }
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
