import { NextResponse } from "next/server";
import { findCourse } from "@/lib/api";
import { getAuthUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import QuizAttempt from "@/models/QuizAttempt";

export async function POST(request) {
  try {
    const user = await getAuthUser();
    const { courseId, lessonId, selected } = await request.json();
    let course = findCourse(courseId);
    let dbReady = false;

    try {
      await connectDB();
      dbReady = true;
      course = (await Course.findOne({ id: courseId }).lean()) || course;
    } catch {
      course = findCourse(courseId);
    }

    const lesson = course?.lessons.find((item) => item.id === lessonId);
    const correct = selected === lesson?.quiz.answer;
    const score = correct ? 100 : 0;

    if (user && dbReady) {
      await QuizAttempt.create({ userId: user.id, courseId, lessonId, selected, correct, score });
    }

    return NextResponse.json({
      correct,
      score,
      answer: lesson?.quiz.answer,
      message: correct ? "Nice! You nailed it." : "Close. Review the visual and try again."
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
