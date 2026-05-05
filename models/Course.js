import mongoose from "mongoose";

const LessonSchema = new mongoose.Schema(
  {
    id: String,
    title: String,
    duration: String,
    visual: String,
    explanation: String,
    bullets: [String],
    quiz: {
      question: String,
      options: [String],
      answer: String
    }
  },
  { _id: false }
);

const QuestionSchema = new mongoose.Schema(
  {
    id: String,
    question: String,
    options: [String],
    correctIndex: Number
  },
  { _id: false }
);

const CourseSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: String,
    category: String,
    level: String,
    duration: String,
    xp: Number,
    progress: Number,
    color: String,
    summary: String,
    description: String,
    concepts: [String],
    questions: [QuestionSchema],
    createdAt: Number,
    lessons: [LessonSchema]
  },
  { timestamps: true }
);

export default mongoose.models.Course || mongoose.model("Course", CourseSchema);
