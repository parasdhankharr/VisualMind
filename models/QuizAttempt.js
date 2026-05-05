import mongoose from "mongoose";

const QuizAttemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    courseId: String,
    lessonId: String,
    selected: String,
    correct: Boolean,
    score: Number
  },
  { timestamps: true }
);

export default mongoose.models.QuizAttempt ||
  mongoose.model("QuizAttempt", QuizAttemptSchema);
