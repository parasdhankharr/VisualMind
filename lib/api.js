import { demoCourses } from "@/data/courses";

export function findCourse(id) {
  return demoCourses.find((course) => course.id === id);
}

export function computeProgress(progress = {}) {
  const totalLessons = demoCourses.reduce((sum, course) => sum + course.lessons.length, 0);
  const completed = Object.keys(progress).filter((key) => progress[key]).length;
  return Math.round((completed / totalLessons) * 100);
}

export function transformContent(text) {
  const clean = text.replace(/\s+/g, " ").trim();
  const sentences = clean
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const keywords = clean
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(" ")
    .filter((word) => word.length > 5)
    .slice(0, 8);

  return {
    summary: sentences.slice(0, 4).map((sentence) => sentence.replace(/[.!?]$/, "")),
    simplified:
      sentences[0]?.replace(/[.!?]$/, "") ||
      "This concept can be learned faster by breaking it into small visual steps.",
    infographic: [
      {
        label: "Core Idea",
        value: keywords[0] || "concept",
        detail: "The central topic learners should remember first."
      },
      {
        label: "Visual Hook",
        value: keywords[1] || "pattern",
        detail: "Turn the idea into a chart, analogy, or motion sequence."
      },
      {
        label: "Micro Step",
        value: `${Math.max(3, sentences.length)} bites`,
        detail: "Teach the material as short checkpoints with feedback."
      }
    ]
  };
}
