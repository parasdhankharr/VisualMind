"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AnimatedButton, FadeUp, HoverCard, Stagger, StaggerItem } from "@/components/animation-kit";
import { demoCourses } from "@/data/courses";
import { useLearningStore } from "@/store/use-learning-store";

function VisualPanel({ course, lesson }) {
  return (
    <motion.div
      whileHover={{ scale: 1.015, rotateX: 2, rotateY: -2 }}
      transition={{ type: "spring", stiffness: 180, damping: 20 }}
      data-cursor="card"
      className={`relative min-h-[360px] overflow-hidden rounded-[2rem] bg-gradient-to-br ${course.color} p-6 shadow-glow`}
    >
      <div className="absolute inset-0 bg-hero-grid bg-[length:34px_34px] opacity-30" />
      <motion.div
        className="absolute right-10 top-10 h-32 w-32 rounded-full border border-white/35"
        animate={{ rotate: 360, scale: [1, 1.06, 1] }}
        transition={{ rotate: { duration: 18, repeat: Infinity, ease: "linear" }, scale: { duration: 4, repeat: Infinity } }}
      />
      <div className="relative z-10 flex h-full min-h-[310px] flex-col justify-between">
        <div>
          <p className="text-sm font-bold uppercase text-white/75">{lesson.visual}</p>
          <h1 className="mt-4 max-w-xl text-5xl font-black leading-none text-white sm:text-6xl">
            {lesson.title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-white/80">{lesson.explanation || course.summary}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {lesson.bullets.map((item, index) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="rounded-2xl border border-white/20 bg-white/15 p-4 backdrop-blur"
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Concept {index + 1}</p>
              <p className="mt-3 text-sm font-medium text-white">{item}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function CoursePlayer({ courseId }) {
  const {
    generatedCourses,
    completedLessons,
    completeLesson,
    courseProgress,
    recordCourseOpen,
    recordLessonView,
    recordQuizResult
  } = useLearningStore();
  const [remoteCourse, setRemoteCourse] = useState(null);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const allCourses = useMemo(() => {
    const merged = remoteCourse ? [remoteCourse, ...generatedCourses, ...demoCourses] : [...generatedCourses, ...demoCourses];
    return merged.filter((course, index, collection) => collection.findIndex((item) => item.id === course.id) === index);
  }, [generatedCourses, remoteCourse]);
  const course = allCourses.find((item) => item.id === courseId) || remoteCourse || allCourses[0];
  const lessons = course?.lessons || [];
  const lesson = lessons[lessonIndex];

  useEffect(() => {
    let ignore = false;

    async function loadCourse() {
      try {
        const response = await fetch(`/api/courses/${courseId}`);
        const data = await response.json();
        if (!ignore && data?.course) {
          setRemoteCourse(data.course);
        }
      } catch {
        if (!ignore) {
          setRemoteCourse(null);
        }
      }
    }

    loadCourse();
    return () => {
      ignore = true;
    };
  }, [courseId]);

  useEffect(() => {
    if (lessonIndex <= Math.max(lessons.length - 1, 0)) {
      return;
    }

    setLessonIndex(0);
  }, [lessonIndex, lessons.length]);

  if (!course || !lesson) {
    return (
      <main className="min-h-screen bg-midnight px-4 py-6 text-white sm:px-8">
        <div className="fixed inset-0 bg-hero-grid bg-[length:42px_42px] opacity-25" />
        <div className="relative mx-auto max-w-3xl">
          <FadeUp className="glass glow-ring rounded-[2rem] p-8 text-center">
            <p className="text-sm font-bold uppercase text-rose-300">Course unavailable</p>
            <h1 className="mt-3 text-4xl font-black">We couldn&apos;t load this lesson.</h1>
            <p className="mt-4 text-sm text-slate-300">
              The course link may be invalid or the lesson data is incomplete. Head back to the dashboard and choose another course.
            </p>
            <div className="mt-6 flex justify-center">
              <AnimatedButton href="/dashboard" className="px-6 py-4">
                Back to dashboard
              </AnimatedButton>
            </div>
          </FadeUp>
        </div>
      </main>
    );
  }
  const completed = Boolean(completedLessons[lesson.id]);
  const dynamicProgress = courseProgress[course.id]?.progress ?? 0;
  const earnedXp = courseProgress[course.id]?.xp ?? course.xp;
  const progress = useMemo(
    () => Math.max(dynamicProgress, Math.round(((lessonIndex + (completed ? 1 : 0.45)) / lessons.length) * 100)),
    [completed, dynamicProgress, lessonIndex, lessons.length]
  );
  const conceptCards = useMemo(() => {
    if (course?.concepts?.length) {
      return course.concepts;
    }
    return lessons.flatMap((item) => item.bullets || []);
  }, [course?.concepts, lessons]);

  useEffect(() => {
    recordCourseOpen({ courseId: course.id, title: course.title });
  }, [course.id, course.title, recordCourseOpen]);

  useEffect(() => {
    recordLessonView({
      courseId: course.id,
      lessonId: lesson.id,
      lessonCount: lessons.length,
      title: lesson.title
    });
  }, [course.id, lesson.id, lesson.title, lessons.length, recordLessonView]);

  async function submitQuiz(option) {
    setSelected(option);
    setSubmitting(true);
    try {
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id, lessonId: lesson.id, selected: option })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Quiz submission failed.");
      }

      setFeedback(data);
      recordQuizResult({
        courseId: course.id,
        lessonId: lesson.id,
        lessonCount: lessons.length,
        correct: data.correct,
        title: lesson.title
      });
    } catch (error) {
      setFeedback({
        correct: false,
        answer: lesson.quiz.answer,
        message: error.message || "Something went wrong while submitting the quiz."
      });
    } finally {
      setSubmitting(false);
    }
  }

  function move(direction) {
    const nextIndex = Math.min(Math.max(lessonIndex + direction, 0), lessons.length - 1);
    setLessonIndex(nextIndex);
    setSelected("");
    setFeedback(null);
  }

  return (
    <main className="min-h-screen bg-midnight px-4 py-6 text-white sm:px-8">
      <div className="fixed inset-0 bg-hero-grid bg-[length:42px_42px] opacity-25" />
      <div className="relative mx-auto max-w-7xl">
        <FadeUp className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link href="/dashboard" className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/10">
            Back to dashboard
          </Link>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <span>{course.level}</span>
            <span className="h-1 w-1 rounded-full bg-slate-500" />
            <span>{course.duration}</span>
            <span className="h-1 w-1 rounded-full bg-slate-500" />
            <span>{earnedXp} XP</span>
          </div>
        </FadeUp>

        <FadeUp as="section" className="glass glow-ring rounded-[2rem] p-4 sm:p-6" variant="scale-in">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase text-cyan-300">{course.title}</p>
              <h2 className="mt-2 text-3xl font-black sm:text-4xl">Lesson {lessonIndex + 1} of {lessons.length}</h2>
              {course.description ? <p className="mt-3 max-w-2xl text-sm text-slate-300">{course.description}</p> : null}
            </div>
            <div className="min-w-56">
              <div className="mb-2 flex justify-between text-xs text-slate-400">
                <span>Progress</span>
                <span>{Math.min(progress, 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
              <motion.div className="h-2 rounded-full bg-cyan-300" animate={{ width: `${Math.min(progress, 100)}%` }} />
              </div>
            </div>
          </div>

          <div className={`mb-6 rounded-[2rem] bg-gradient-to-br ${course.color} p-6 shadow-glow`}>
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/75">Main topic card</p>
                <h2 className="mt-3 text-4xl font-black leading-tight text-white sm:text-5xl">{course.title}</h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/85">{course.summary}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/20 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Subject</p>
                  <p className="mt-3 text-xl font-black text-white">{course.category}</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/20 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Created lessons</p>
                  <p className="mt-3 text-xl font-black text-white">{lessons.length}</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/20 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Structured XP</p>
                  <p className="mt-3 text-xl font-black text-white">{course.xp || 0}</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/20 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Progress</p>
                  <p className="mt-3 text-xl font-black text-white">{Math.min(progress, 100)}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <VisualPanel course={course} lesson={lesson} />
            <aside className="grid gap-4">
              <HoverCard className="rounded-[1.5rem] bg-white/10 p-5">
                <p className="text-sm font-bold uppercase text-lime-300">Summary</p>
                <h3 className="mt-3 text-2xl font-black">Key takeaways</h3>
                <Stagger as="ul" className="mt-4 space-y-3 text-sm text-slate-300">
                  {lesson.bullets.map((item) => (
                    <StaggerItem key={item} as="li" variant="slide-left" className="rounded-2xl bg-white/10 p-3">
                      {item}
                    </StaggerItem>
                  ))}
                </Stagger>
              </HoverCard>

              <HoverCard className="rounded-[1.5rem] bg-white/10 p-5">
                <p className="text-sm font-bold uppercase text-violet-200">Quiz</p>
                <h3 className="mt-3 text-xl font-black">{lesson.quiz.question}</h3>
                <div className="mt-4 grid gap-3">
                  {lesson.quiz.options.map((option) => (
                    <motion.button
                      key={option}
                      onClick={() => submitQuiz(option)}
                      disabled={submitting}
                      whileHover={{ x: 6, scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold transition hover:scale-[1.02] ${
                        selected === option
                          ? "border-cyan-300 bg-cyan-300/20 text-cyan-100"
                          : "border-white/10 bg-white/10 text-slate-200"
                      }`}
                    >
                      {option}
                    </motion.button>
                  ))}
                </div>
                {feedback && (
                  <p className={`mt-4 rounded-2xl p-3 text-sm ${feedback.correct ? "bg-lime-300/15 text-lime-100" : "bg-rose-500/15 text-rose-100"}`}>
                    {feedback.message} Answer: {feedback.answer}
                  </p>
                )}
              </HoverCard>
            </aside>
          </div>

          <div className="mt-6">
            <p className="text-sm font-bold uppercase text-cyan-300">Concept cards</p>
            <Stagger as="div" className="mt-4 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
              {conceptCards.map((concept, index) => (
                <StaggerItem key={`${concept}-${index}`}>
                  <HoverCard className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Concept {index + 1}</p>
                    <p className="mt-3 text-base font-semibold text-white">{concept}</p>
                  </HoverCard>
                </StaggerItem>
              ))}
            </Stagger>
          </div>

          <div className="mt-6">
            <p className="text-sm font-bold uppercase text-cyan-300">Structured content</p>
            <div className="mt-4 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
              {lesson.bullets.map((item, index) => (
                <HoverCard key={`${lesson.id}-${index}`} className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Breakdown {index + 1}</p>
                  <p className="mt-3 text-base leading-7 text-white">{item}</p>
                </HoverCard>
              ))}
              {lessons.map((item, index) => (
                <HoverCard key={item.id} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Lesson path {index + 1}</p>
                  <p className="mt-3 text-lg font-black text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.explanation || item.bullets?.[0]}</p>
                </HoverCard>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-3">
              <motion.button
                onClick={() => move(-1)}
                disabled={lessonIndex === 0}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-full border border-white/10 px-5 py-3 font-bold text-slate-200 disabled:opacity-40"
              >
                Previous
              </motion.button>
              <motion.button
                onClick={() => move(1)}
                disabled={lessonIndex === lessons.length - 1}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-full border border-white/10 px-5 py-3 font-bold text-slate-200 disabled:opacity-40"
              >
                Next
              </motion.button>
            </div>
            <AnimatedButton
              onClick={() => completeLesson(course.id, lesson.id, lessons.length, lesson.title, 30)}
              className="px-5 py-3"
            >
              {completed ? "Completed" : "Mark complete"}
            </AnimatedButton>
          </div>
        </FadeUp>
      </div>
    </main>
  );
}
