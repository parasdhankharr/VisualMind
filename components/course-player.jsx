"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AnimatedButton, HoverCard } from "@/components/animation-kit";
import { demoCourses } from "@/data/courses";
import { useLearningStore } from "@/store/use-learning-store";

const FEEDBACK_DELAY_MS = 650;
const COMPLETION_BADGE_MS = 2000;
const XP_PER_CORRECT = 20;
const DEFAULT_GRADIENT = "from-cyan-400 via-blue-500 to-violet-500";

function normalizeText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function ensureSentence(value = "") {
  const text = normalizeText(value).replace(/\.\.\.+$/g, "").trim();
  if (!text) return "";
  if (/[.!?]$/.test(text)) return text;
  return `${text}.`;
}

function uniqueBy(items, selector) {
  return items.filter((item, index, collection) => collection.findIndex((entry) => selector(entry) === selector(item)) === index);
}

function buildConceptCards(course) {
  const conceptCards = (course?.concepts || []).map((concept, index) => {
    const [title, detail] = String(concept).split(":");
    return {
      id: `${course.id}-concept-${index}`,
      title: normalizeText(detail ? title : `Concept ${index + 1}`),
      detail: ensureSentence(detail || title)
    };
  });

  const lessonCards = (course?.lessons || []).map((lesson, index) => ({
    id: `${course.id}-lesson-concept-${index}`,
    title: normalizeText(lesson.title || `Lesson ${index + 1}`),
    detail: ensureSentence(lesson.explanation || lesson.bullets?.[0] || course.summary || "Key idea for this lesson")
  }));

  return uniqueBy([...conceptCards, ...lessonCards], (item) => `${item.title}:${item.detail}`).slice(0, 5);
}

function ensureFourOptions(options = [], correctAnswer, courseTitle) {
  const cleaned = uniqueBy(
    options
      .map((option) => ensureSentence(option))
      .filter(Boolean),
    (option) => option.toLowerCase()
  );

  const base = cleaned.some((option) => option.toLowerCase() === correctAnswer.toLowerCase())
    ? cleaned
    : [correctAnswer, ...cleaned];

  const fillers = [
    `Memorize ${courseTitle} without understanding it.`,
    "Ignore the concept relationships.",
    "Skip feedback and guess.",
    "Treat every idea as unrelated."
  ];

  return uniqueBy([...base, ...fillers], (option) => option.toLowerCase()).slice(0, 4);
}

function normalizeQuestion(question, index, course) {
  const prompt = ensureSentence(question?.question || question?.prompt || "").replace(/\.$/, "?");
  const rawOptions = Array.isArray(question?.options) ? question.options : [];
  const safeCorrectIndex = Number.isInteger(question?.correctIndex) ? question.correctIndex : 0;
  const correctAnswer = ensureSentence(rawOptions[safeCorrectIndex] || rawOptions[0] || "");

  if (!prompt || !correctAnswer) return null;

  const options = ensureFourOptions(rawOptions, correctAnswer, course?.title || "this topic");
  const correctIndex = Math.max(0, options.findIndex((option) => option === correctAnswer));

  return {
    id: normalizeText(question?.id || `${course?.id || "course"}-question-${index}`),
    question: prompt,
    options,
    correctIndex
  };
}

function buildFallbackQuestions(course) {
  if (!course) return [];

  const lessonQuestions = (course?.lessons || []).map((lesson, index) => ({
    id: `${course.id}-lesson-question-${index}`,
    question: lesson.quiz?.question || `Which idea best matches ${lesson.title || `lesson ${index + 1}`}?`,
    options: lesson.quiz?.options || [
      lesson.bullets?.[0] || course.summary,
      lesson.bullets?.[1] || `Memorize ${course.title} without understanding it.`,
      lesson.bullets?.[2] || "Treat each idea as unrelated.",
      "Skip feedback and guess."
    ],
    correctIndex: 0
  }));

  const conceptQuestions = buildConceptCards(course).map((concept, index) => ({
    id: `${course.id}-concept-question-${index}`,
    question: `Which statement best explains ${concept.title.toLowerCase()}?`,
    options: [
      concept.detail,
      `Memorize ${concept.title.toLowerCase()} without context.`,
      "Ignore how the idea connects to the topic.",
      "Avoid checking misconceptions."
    ],
    correctIndex: 0
  }));

  const coreQuestions = [
    {
      id: `${course.id}-core-question`,
      question: `What is the core idea behind ${course.title}?`,
      options: [
        course.description || course.summary || `The main idea behind ${course.title}.`,
        `Memorize ${course.title} without applying it.`,
        "Treat every concept as isolated.",
        "Skip the visual structure."
      ],
      correctIndex: 0
    },
    {
      id: `${course.id}-recall-question`,
      question: "What helps strengthen recall after a lesson?",
      options: [
        "Answer questions and review mistakes.",
        "Read once and skip practice.",
        "Avoid checking what was correct.",
        "Ignore feedback to move faster."
      ],
      correctIndex: 0
    }
  ];

  return [...lessonQuestions, ...conceptQuestions, ...coreQuestions];
}

function getCourseQuestions(course) {
  if (!course) return [];

  const providedQuestions = Array.isArray(course?.questions) ? course.questions : [];
  const normalizedProvided = providedQuestions
    .map((question, index) => normalizeQuestion(question, index, course))
    .filter(Boolean);
  const normalizedFallback = buildFallbackQuestions(course)
    .map((question, index) => normalizeQuestion(question, index, course))
    .filter(Boolean);

  return uniqueBy([...normalizedProvided, ...normalizedFallback], (question) => question.question).slice(0, 5);
}

function CompletionBanner({ show }) {
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.96 }}
          className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-full border border-emerald-300/35 bg-emerald-400/15 px-5 py-3 text-sm font-black text-emerald-100 shadow-[0_20px_60px_rgba(16,185,129,0.18)] backdrop-blur"
        >
          Course Completed
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function SafeFallback({ eyebrow, title, description, ctaLabel = "Back to dashboard" }) {
  return (
    <main className="min-h-screen bg-midnight px-4 py-6 text-white sm:px-8">
      <div className="fixed inset-0 bg-hero-grid bg-[length:42px_42px] opacity-20" />
      <div className="relative mx-auto max-w-3xl">
        <motion.section
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="glass glow-ring rounded-[2rem] p-8 text-center"
        >
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-rose-300">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-black text-white">{title}</h1>
          <p className="mt-4 text-sm leading-6 text-slate-300">{description}</p>
          <div className="mt-6 flex justify-center">
            <AnimatedButton href="/dashboard" className="px-6 py-4">
              {ctaLabel}
            </AnimatedButton>
          </div>
        </motion.section>
      </div>
    </main>
  );
}

function QuizPanel({
  question,
  currentQuestion,
  totalQuestions,
  selectedAnswer,
  showFeedback,
  onSelect
}) {
  const progressPercent = Math.round(((currentQuestion + (showFeedback ? 1 : 0)) / totalQuestions) * 100);

  return (
    <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Resume learning</p>
        <h3 className="mt-3 text-2xl font-black text-white">
          Question {currentQuestion + 1} of {totalQuestions}
        </h3>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Stay focused on one checkpoint at a time and keep the momentum moving.
        </p>
        <div className="mt-5 h-2 rounded-full bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="h-2 rounded-full bg-gradient-to-r from-cyan-300 via-blue-500 to-violet-500"
          />
        </div>
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{progressPercent}% complete</p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -18 }}
          transition={{ duration: 0.28 }}
          className="overflow-hidden rounded-[1.9rem] border border-white/10 bg-white/[0.04] p-5"
        >
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-200">Interactive quiz</p>
          <h3 className="mt-3 max-w-[28ch] text-2xl font-black leading-9 text-white">{question.question}</h3>

          <div className="mt-6 grid gap-4">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === question.correctIndex;
              const showCorrect = showFeedback && isCorrect;
              const showWrong = showFeedback && isSelected && !isCorrect;

              let stateClass = "border-white/10 bg-white/[0.05] text-slate-100 hover:border-cyan-300/25 hover:bg-white/[0.1]";
              let animate = {};

              if (showCorrect) {
                stateClass = "border-emerald-300/45 bg-emerald-400/14 text-emerald-100 shadow-[0_0_0_1px_rgba(110,231,183,0.2),0_20px_40px_rgba(16,185,129,0.12)]";
                animate = isSelected ? { scale: [1, 1.03, 1] } : {};
              } else if (showWrong) {
                stateClass = "border-rose-300/45 bg-rose-500/14 text-rose-100";
                animate = { x: [-8, 8, -6, 6, 0] };
              } else if (isSelected) {
                stateClass = "border-cyan-300/45 bg-cyan-300/14 text-cyan-100";
              }

              return (
                <motion.button
                  key={`${question.id}-option-${index}`}
                  type="button"
                  disabled={showFeedback}
                  whileHover={{ scale: showFeedback ? 1 : 1.01, x: showFeedback ? 0 : 2 }}
                  whileTap={{ scale: showFeedback ? 1 : 0.99 }}
                  animate={animate}
                  transition={{ duration: 0.35 }}
                  onClick={() => onSelect(index)}
                  className={`w-full rounded-[1.15rem] border px-4 py-4 text-left text-sm font-bold transition ${stateClass}`}
                >
                  <span className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0 text-slate-400">{index + 1}.</span>
                    <span className="line-clamp-2 leading-6">{option}</span>
                  </span>
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {showFeedback ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={`mt-5 rounded-[1.25rem] border p-4 text-sm leading-6 ${
                  selectedAnswer === question.correctIndex
                    ? "border-emerald-300/35 bg-emerald-400/10 text-emerald-100"
                    : "border-rose-300/30 bg-rose-500/10 text-rose-100"
                }`}
              >
                <p className="font-black">
                  {selectedAnswer === question.correctIndex ? "Correct answer" : "Correct answer highlighted"}
                </p>
                <p className="mt-2">
                  {selectedAnswer === question.correctIndex
                    ? `Nice work. ${question.options[question.correctIndex]}`
                    : `The right choice was: ${question.options[question.correctIndex]}`}
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function CoursePlayer({ courseId }) {
  const router = useRouter();
  const {
    completeCourse,
    courseProgress,
    generatedCourses,
    recordCourseOpen,
    recordQuizAttempt,
    recordQuizResult
  } = useLearningStore();

  const [remoteCourse, setRemoteCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showCompletionBadge, setShowCompletionBadge] = useState(false);

  const advanceTimerRef = useRef(null);
  const badgeTimerRef = useRef(null);
  const openedCourseRef = useRef("");
  const redirectTimerRef = useRef(null);

  const localCourse = useMemo(() => {
    const allCourses = [...generatedCourses, ...demoCourses];
    return allCourses.find((item) => item.id === courseId) || null;
  }, [courseId, generatedCourses]);

  const course = remoteCourse || localCourse || null;
  const conceptCards = useMemo(() => buildConceptCards(course), [course]);
  const questions = useMemo(() => getCourseQuestions(course), [course]);
  const activeQuestion = questions[currentQuestion] || null;
  const answeredCount = answers.length;
  const quizXp = score * XP_PER_CORRECT;
  const earnedXp = course ? (courseProgress[course.id]?.xp ?? 0) : 0;

  useEffect(() => {
    let ignore = false;

    async function loadCourse() {
      setIsLoading(true);

      try {
        const response = await fetch(`/api/courses/${courseId}`);
        const data = await response.json().catch(() => ({}));

        if (!ignore) {
          setRemoteCourse(data?.course || null);
        }
      } catch {
        if (!ignore) {
          setRemoteCourse(null);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadCourse();

    return () => {
      ignore = true;
    };
  }, [courseId]);

  useEffect(() => {
    if (!course) return;

    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setScore(0);
    setShowFeedback(false);
    setShowCompletionBadge(false);
    setIsCompleted(false);
  }, [course?.id, questions.length]);

  useEffect(() => {
    console.log("[VisualMind Quiz]", {
      currentQuestion,
      selectedAnswer,
      score
    });
  }, [currentQuestion, score, selectedAnswer]);

  useEffect(() => {
    if (!course || openedCourseRef.current === course.id) return;
    openedCourseRef.current = course.id;
    recordCourseOpen({ courseId: course.id, title: course.title });
  }, [course, recordCourseOpen]);

  useEffect(() => {
    if (isLoading || course) return;

    redirectTimerRef.current = window.setTimeout(() => {
      router.replace("/dashboard");
    }, 1200);

    return () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, [course, isLoading, router]);

  useEffect(() => {
    function handleKeydown(event) {
      if (!activeQuestion || showFeedback || isCompleted) return;

      const index = Number(event.key) - 1;
      if (index >= 0 && index < 4 && activeQuestion.options[index]) {
        handleAnswer(index);
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [activeQuestion, isCompleted, showFeedback]);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
      if (badgeTimerRef.current) window.clearTimeout(badgeTimerRef.current);
      if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
    };
  }, []);

  function triggerCompletion(finalScore) {
    if (!course) return;

    setIsCompleted(true);
    setShowCompletionBadge(true);
    setShowFeedback(false);
    completeCourse({ courseId: course.id, title: course.title, xp: 0 });
    confetti({
      particleCount: 90,
      spread: 84,
      origin: { x: 0.5, y: 0.45 },
      scalar: 0.95
    });

    badgeTimerRef.current = window.setTimeout(() => {
      setShowCompletionBadge(false);
    }, COMPLETION_BADGE_MS);

    setScore(finalScore);
  }

  function handleAnswer(index) {
    if (!course || !activeQuestion || showFeedback || isCompleted) return;

    const isCorrect = index === activeQuestion.correctIndex;
    const nextScore = score + (isCorrect ? 1 : 0);
    const nextAnswers = [
      ...answers,
      {
        questionId: activeQuestion.id,
        selectedIndex: index,
        isCorrect
      }
    ];

    setSelectedAnswer(index);
    setAnswers(nextAnswers);
    setScore(nextScore);
    setShowFeedback(true);

    recordQuizAttempt({
      courseId: course.id,
      lessonId: activeQuestion.id,
      correct: isCorrect
    });

    if (isCorrect) {
      recordQuizResult({
        courseId: course.id,
        lessonId: activeQuestion.id,
        lessonCount: questions.length,
        correct: true,
        title: activeQuestion.question
      });
    }

    if (advanceTimerRef.current) {
      window.clearTimeout(advanceTimerRef.current);
    }

    advanceTimerRef.current = window.setTimeout(() => {
      const isLastQuestion = currentQuestion >= questions.length - 1;

      if (isLastQuestion) {
        triggerCompletion(nextScore);
        return;
      }

      setCurrentQuestion((value) => value + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    }, FEEDBACK_DELAY_MS);
  }

  if (!course && isLoading) {
    return (
      <SafeFallback
        eyebrow="Loading course"
        title="Preparing your quiz session"
        description="We are loading the course data and building a safe interactive flow."
        ctaLabel="Back to dashboard"
      />
    );
  }

  if (!course && !isLoading) {
    return (
      <SafeFallback
        eyebrow="Course unavailable"
        title="We couldn't find this course"
        description="The course link is missing or expired. Redirecting you back to the dashboard."
      />
    );
  }

  if (!questions.length || !activeQuestion && !isCompleted) {
    return (
      <SafeFallback
        eyebrow="No quiz available"
        title="This course needs fresh question data"
        description="The course opened safely, but it does not have enough quiz content to start an interactive session."
      />
    );
  }

  const displayProgress = isCompleted
    ? 100
    : Math.round(((currentQuestion + (showFeedback ? 1 : 0)) / Math.max(questions.length, 1)) * 100);

  return (
    <main className="min-h-screen bg-midnight px-4 py-6 text-white sm:px-8">
      <CompletionBanner show={showCompletionBadge} />
      <div className="fixed inset-0 bg-hero-grid bg-[length:42px_42px] opacity-20" />
      <div className="relative mx-auto max-w-7xl">
        <motion.section
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 flex flex-wrap items-center justify-between gap-4"
        >
          <Link href="/dashboard" className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/10">
            Back to dashboard
          </Link>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <span>{course.level || "Adaptive"}</span>
            <span className="h-1 w-1 rounded-full bg-slate-500" />
            <span>{course.duration || "Quick session"}</span>
            <span className="h-1 w-1 rounded-full bg-slate-500" />
            <span>{Math.max(earnedXp, quizXp)} XP</span>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
          className="glass glow-ring rounded-[2rem] p-5 sm:p-7"
        >
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className={`overflow-hidden rounded-[2rem] bg-gradient-to-br ${course.color || DEFAULT_GRADIENT} p-6 shadow-[0_18px_42px_rgba(0,0,0,0.2)]`}>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/80">Core idea</p>
              <h1 className="mt-3 max-w-xl text-4xl font-black leading-tight text-white sm:text-5xl">{course.title}</h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/90">
                {ensureSentence(course.description || course.summary || "Learn the key idea through interaction.")}
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.4rem] border border-white/20 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Progress</p>
                  <p className="mt-3 text-2xl font-black text-white">{displayProgress}%</p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-white/70">
                    {answeredCount}/{questions.length} answered
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-white/20 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Score</p>
                  <p className="mt-3 text-2xl font-black text-white">{score}/{questions.length}</p>
                </div>
                <div className="rounded-[1.4rem] border border-white/20 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">XP earned</p>
                  <p className="mt-3 text-2xl font-black text-white">{quizXp}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">Visual breakdown</p>
              <h2 className="mt-3 text-3xl font-black text-white">3-5 clean concepts</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {conceptCards.map((concept, index) => (
                  <HoverCard key={concept.id} className="rounded-[1.45rem] border border-white/10 bg-white/[0.06] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Concept {index + 1}</p>
                    <p className="mt-3 text-lg font-black text-white">{concept.title}</p>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">{concept.detail}</p>
                  </HoverCard>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-200">Quiz-driven learning</p>
            <h2 className="mt-3 text-3xl font-black text-white">Understanding comes from interaction.</h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
              Each answer moves you forward, gives instant feedback, and turns progress into something you can feel.
            </p>
          </div>

          {isCompleted ? (
            <div className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[1.8rem] border border-emerald-300/25 bg-emerald-400/10 p-5">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-200">Course completed</p>
                <h3 className="mt-3 text-3xl font-black text-white">You finished the full quiz flow.</h3>
                <p className="mt-3 text-base leading-7 text-emerald-50">
                  Score: {score}/{questions.length}. Your course progress is now locked at 100%.
                </p>
              </div>
              <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">Results</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.05] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Final score</p>
                    <p className="mt-3 text-2xl font-black text-white">{Math.round((score / questions.length) * 100)}%</p>
                  </div>
                  <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.05] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Correct answers</p>
                    <p className="mt-3 text-2xl font-black text-white">{score}</p>
                  </div>
                  <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.05] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Quiz XP</p>
                    <p className="mt-3 text-2xl font-black text-white">{quizXp}</p>
                  </div>
                </div>
                <div className="mt-5">
                  <AnimatedButton href="/dashboard" className="px-5 py-3">
                    Return to dashboard
                  </AnimatedButton>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <QuizPanel
                question={activeQuestion}
                currentQuestion={currentQuestion}
                totalQuestions={questions.length}
                selectedAnswer={selectedAnswer}
                showFeedback={showFeedback}
                onSelect={handleAnswer}
              />
            </div>
          )}
        </motion.section>
      </div>
    </main>
  );
}
