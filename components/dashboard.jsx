"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { leaderboard } from "@/data/courses";
import { getRelativeTimeLabel } from "@/lib/learning";
import { useLearningStore } from "@/store/use-learning-store";

const sidebarLinks = ["Home", "My Courses", "Progress", "Activity", "Profile"];

const defaultGoals = [
  { id: "lessons", label: "Complete 2 lessons", detail: "Push your active path forward with two focused lesson completions." },
  { id: "quiz", label: "Finish 1 quiz", detail: "Lock in recall with one checkpoint quiz before you stop." },
  { id: "review", label: "Review previous topic", detail: "Spend five minutes revisiting your most recent concept map." }
];

const achievementBadges = [
  { title: "Streak Master", detail: "7 days in a row", color: "from-cyan-400 via-blue-500 to-violet-500" },
  { title: "Fast Learner", detail: "3 lessons finished this week", color: "from-lime-300 via-emerald-400 to-cyan-500" },
  { title: "Quiz Pro", detail: "Average score above 85%", color: "from-fuchsia-400 via-rose-500 to-orange-400" }
];

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value || 0)));
}

function clampValue(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function formatTrend(change) {
  if (change > 3) return { arrow: "↑", label: "improving", tone: "text-emerald-200" };
  if (change < -3) return { arrow: "↓", label: "dropping", tone: "text-rose-200" };
  return { arrow: "→", label: "steady", tone: "text-slate-300" };
}

function computeEngagementScore(sessions) {
  if (!sessions.length) return null;

  const totalActiveMs = sessions.reduce((sum, session) => sum + (session.activeMs || 0), 0);
  const totalMs = sessions.reduce((sum, session) => sum + (session.totalMs || 0), 0);
  const interactions = sessions.reduce((sum, session) => sum + (session.interactionCount || 0), 0);

  if (!totalMs || !totalActiveMs) return null;

  const activeRatio = totalActiveMs / totalMs;
  const activeMinutes = totalActiveMs / 60000;
  const interactionRate = interactions / Math.max(activeMinutes, 1);
  const interactionFactor = clampValue(interactionRate / 6, 0.45, 1.15);
  const score = clampPercent(activeRatio * interactionFactor * 100);

  return {
    value: score,
    detail: "Based on active lesson time, interactions, and idle periods.",
    activeRatio,
    interactionRate
  };
}

function computeRecallStrength(quizAttempts, courseProgress) {
  if (!quizAttempts.length) return null;

  const correctAnswers = quizAttempts.filter((attempt) => attempt.correct).length;
  const totalQuestions = quizAttempts.length;
  const groupedAttempts = quizAttempts.reduce((accumulator, attempt) => {
    accumulator[attempt.lessonId] = (accumulator[attempt.lessonId] || 0) + 1;
    return accumulator;
  }, {});
  const retries = Object.values(groupedAttempts).reduce((sum, count) => sum + Math.max(0, count - 1), 0);
  const viewedLessons = Object.values(courseProgress).reduce((sum, item) => sum + Object.keys(item.viewedLessons || {}).length, 0);
  const completedLessons = Object.values(courseProgress).reduce((sum, item) => sum + Object.keys(item.completedLessons || {}).length, 0);
  const accuracy = correctAnswers / Math.max(totalQuestions, 1);
  const retryRate = retries / Math.max(totalQuestions, 1);
  const completionConsistency = viewedLessons ? completedLessons / viewedLessons : 0;
  const consistencyFactor = clampValue((completionConsistency + (1 - retryRate)) / 2, 0, 1);
  const score = clampPercent(accuracy * consistencyFactor * 100);

  return {
    value: score,
    detail: "Based on quiz accuracy, retries, and lesson completion consistency.",
    accuracy,
    retries
  };
}

function GlassPanel({ children, className = "" }) {
  return <div className={`glass rounded-[2rem] border border-white/10 bg-[#1b2029]/92 ${className}`}>{children}</div>;
}

function CountUpNumber({ value, suffix = "", prefix = "" }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    let animationFrame = 0;
    const totalFrames = 28;

    function tick() {
      frame += 1;
      const progress = 1 - (1 - frame / totalFrames) ** 3;
      setDisplayValue(Math.round(value * progress));
      if (frame < totalFrames) {
        animationFrame = window.requestAnimationFrame(tick);
      }
    }

    animationFrame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [value]);

  return (
    <span>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}

function CourseCard({ course, progress, earnedXp, delay = 0 }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -18, scale: 0.92 }}
      transition={{ duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="rounded-[2rem] border border-white/10 bg-[#1b2029]/96 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.18)]"
    >
      <div className={`h-40 rounded-[1.7rem] bg-gradient-to-br ${course.color} p-5`}>
        <p className="text-base font-bold text-white/90">{course.category}</p>
        <div className="flex h-full items-end">
          <p className="text-[3rem] font-black tracking-tight text-white">{earnedXp} XP</p>
        </div>
      </div>

      <h3 className="mt-5 text-[2rem] font-black leading-none text-white">{course.title}</h3>
      <p className="mt-3 min-h-[4.2rem] text-base leading-7 text-slate-300">{course.summary}</p>

      <div className="mt-5 h-2 rounded-full bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="h-2 rounded-full bg-[#69e4ef]"
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-sm font-semibold text-slate-400">
        <span>{progress}% complete</span>
        <span>{course.lessons?.length || 0} visual lessons</span>
      </div>

      <Link
        href={`/courses/${course.id}`}
        className="mt-5 inline-flex rounded-full bg-white px-6 py-3 text-base font-black text-slate-950 transition hover:scale-[1.02]"
      >
        Continue learning
      </Link>
    </motion.article>
  );
}

function AchievementCard({ badge, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="rounded-[1.75rem] border border-white/10 bg-[#262b34] p-4"
    >
      <div className={`h-28 rounded-[1.3rem] bg-gradient-to-br ${badge.color}`} />
      <p className="mt-4 text-lg font-black text-white">{badge.title}</p>
      <p className="mt-1 text-sm text-slate-400">{badge.detail}</p>
    </motion.div>
  );
}

function MetricCard({ label, value, suffix = "", detail, gradient, trend }) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5">
      <div className={`h-1.5 w-16 rounded-full bg-gradient-to-r ${gradient}`} />
      <p className="mt-4 text-sm font-medium text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">
        <CountUpNumber value={value} suffix={suffix} />
      </p>
      {trend ? <p className={`mt-2 text-xs font-bold uppercase tracking-[0.16em] ${trend.tone}`}>{trend.arrow} {trend.label}</p> : null}
      <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
    </div>
  );
}

function AnalyticsChart({ data, engagementMetric, recallMetric }) {
  if (!data.length && !engagementMetric && !recallMetric) {
    return (
      <div className="mt-6 rounded-[1.7rem] border border-dashed border-white/10 bg-white/[0.04] p-6">
        <p className="text-lg font-black text-white">Start learning to see your stats</p>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
          Engagement Score and Recall Strength appear after you spend time in lessons and submit quizzes.
        </p>
      </div>
    );
  }

  const maxValue = Math.max(...(data.length ? data.map((item) => item.minutes) : [1]), 1);

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-slate-300">Weekly learning time</p>
          <p className="text-xs text-slate-500">7 day trend</p>
        </div>
        {data.length ? (
          <div className="mt-5 flex h-44 items-end gap-3">
            {data.map((item, index) => (
              <div key={item.label} className="flex flex-1 flex-col items-center gap-3">
                <div className="flex h-full w-full items-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(item.minutes / maxValue) * 100}%` }}
                    transition={{ duration: 0.7, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full rounded-t-[1rem] bg-gradient-to-t from-cyan-400 via-blue-500 to-violet-500"
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-white">{item.minutes}m</p>
                  <p className="text-xs text-slate-400">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-[1.3rem] border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-300">
            Finish a lesson session to start building your weekly learning trend.
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
        {engagementMetric ? (
          <MetricCard
            label="Engagement Score"
            value={engagementMetric.value}
            suffix="%"
            detail={`${engagementMetric.detail} Based on your recent lesson activity.`}
            gradient="from-cyan-400 via-blue-500 to-violet-500"
            trend={engagementMetric.trend}
          />
        ) : (
          <div className="rounded-[1.6rem] border border-dashed border-white/10 bg-white/[0.04] p-5 text-sm leading-6 text-slate-300">
            Start a lesson to unlock your Engagement Score.
          </div>
        )}
        {recallMetric ? (
          <MetricCard
            label="Recall Strength"
            value={recallMetric.value}
            suffix="%"
            detail={`${recallMetric.detail} Based on your recent activity and quiz performance.`}
            gradient="from-lime-300 via-emerald-400 to-cyan-500"
            trend={recallMetric.trend}
          />
        ) : (
          <div className="rounded-[1.6rem] border border-dashed border-white/10 bg-white/[0.04] p-5 text-sm leading-6 text-slate-300">
            Answer quiz questions to unlock your Recall Strength.
          </div>
        )}
      </div>
    </div>
  );
}

function GoalItem({ goal, onToggle, index }) {
  return (
    <motion.button
      type="button"
      onClick={() => onToggle(goal.id)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.06 }}
      whileHover={{ scale: 1.01 }}
      className={`flex w-full items-start gap-4 rounded-[1.5rem] border p-4 text-left transition ${
        goal.done ? "border-cyan-300/25 bg-cyan-300/10" : "border-white/10 bg-white/[0.04]"
      }`}
    >
      <motion.span
        animate={{
          backgroundColor: goal.done ? "rgba(103,232,249,1)" : "rgba(255,255,255,0.04)",
          borderColor: goal.done ? "rgba(103,232,249,1)" : "rgba(255,255,255,0.12)"
        }}
        className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-black text-slate-950"
      >
        {goal.done ? "✓" : ""}
      </motion.span>
      <div>
        <p className="text-lg font-black text-white">{goal.label}</p>
        <p className="mt-1 text-sm leading-6 text-slate-400">{goal.detail}</p>
      </div>
    </motion.button>
  );
}

function ActivityRow({ activity, index }) {
  const toneStyles = {
    learning: "bg-cyan-300/18 text-cyan-100 border-cyan-300/20",
    quiz: "bg-violet-400/18 text-violet-100 border-violet-400/20",
    default: "bg-lime-300/18 text-lime-100 border-lime-300/20"
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="relative pl-8"
    >
      <div className="absolute left-0 top-1 h-full w-px bg-white/10" />
      <div className="absolute left-[-5px] top-2 h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.55)]" />
      <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-base font-black text-white">{activity.title}</p>
          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${toneStyles[activity.type] || toneStyles.default}`}>
            {activity.xp > 0 ? `+${activity.xp} XP` : activity.type}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-300">{activity.subtitle || "Learning activity recorded."}</p>
        <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">{getRelativeTimeLabel(activity.timestamp)}</p>
      </div>
    </motion.div>
  );
}

function LeaderboardRow({ item, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.05 }}
      className="flex items-center justify-between rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4"
    >
      <div className="flex items-center gap-4">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-white/8 text-sm font-black text-white">{index + 1}</div>
        <div>
          <p className="text-base font-black text-white">{item.name}</p>
          <p className="text-sm text-slate-400">{item.streak} day streak</p>
        </div>
      </div>
      <p className="text-lg font-black text-cyan-200">{item.xp} XP</p>
    </motion.div>
  );
}

export function Dashboard() {
  const {
    xp,
    streak,
    generatedCourses,
    courseProgress,
    activities,
    lastOpenedCourseId,
    lessonSessions,
    quizAttempts,
    completedCourses,
    syncGeneratedCourses
  } = useLearningStore();
  const safeGeneratedCourses = Array.isArray(generatedCourses) ? generatedCourses.filter(Boolean) : [];
  const safeCourseProgress = courseProgress && typeof courseProgress === "object" ? courseProgress : {};
  const safeActivities = Array.isArray(activities) ? activities.filter(Boolean) : [];
  const safeLessonSessions = Array.isArray(lessonSessions) ? lessonSessions.filter(Boolean) : [];
  const safeQuizAttempts = Array.isArray(quizAttempts) ? quizAttempts.filter(Boolean) : [];
  const safeCompletedCourses = completedCourses && typeof completedCourses === "object" ? completedCourses : {};
  const [draft, setDraft] = useState(
    "Paste a dense topic and turn it into a visual sprint with bullets, hooks, and a recap prompt."
  );
  const [dailyGoals, setDailyGoals] = useState(defaultGoals.map((goal, index) => ({ ...goal, done: index !== 1 })));

  useEffect(() => {
    let ignore = false;

    async function syncCourses() {
      try {
        const response = await fetch("/api/courses");
        const data = await response.json();
        const dynamicCourses = (data?.courses || []).filter((course) => Boolean(course.createdAt));
        if (!ignore && dynamicCourses.length) {
          syncGeneratedCourses(dynamicCourses);
        }
      } catch {
        return;
      }
    }

    syncCourses();
    return () => {
      ignore = true;
    };
  }, [syncGeneratedCourses]);

  const visibleCourses = useMemo(() => {
    return safeGeneratedCourses.slice(0, 3).map((course) => {
      const savedProgress = safeCourseProgress[course.id]?.progress;
      const progress = clampPercent(savedProgress ?? course.progress ?? 0);
      const earnedXp = safeCourseProgress[course.id]?.xp || course.xp || 0;
      const answeredCount = new Set(
        safeQuizAttempts.filter((attempt) => attempt.courseId === course.id).map((attempt) => attempt.lessonId)
      ).size;
      const totalQuestions = 5;
      const nextQuestion = safeCompletedCourses[course.id] ? totalQuestions : Math.min(answeredCount + 1, totalQuestions);

      return { ...course, progress, earnedXp, nextQuestion, totalQuestions };
    });
  }, [safeCompletedCourses, safeCourseProgress, safeGeneratedCourses, safeQuizAttempts]);

  const resumeCourse = useMemo(() => {
    return (
      visibleCourses.find((course) => course.id === lastOpenedCourseId) ||
      visibleCourses.find((course) => course.progress > 0) ||
      visibleCourses[0]
    );
  }, [lastOpenedCourseId, visibleCourses]);

  const weeklyLearningData = useMemo(() => {
    if (!safeLessonSessions.length) return [];

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const buckets = Array.from({ length: 7 }, (_, offset) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - offset));
      return {
        key: date.toDateString(),
        label: dayNames[date.getDay()],
        minutes: 0
      };
    });

    const bucketMap = buckets.reduce((accumulator, bucket) => {
      accumulator[bucket.key] = bucket;
      return accumulator;
    }, {});

    safeLessonSessions.forEach((session) => {
      const dateKey = new Date(session.endedAt || session.startedAt).toDateString();
      if (bucketMap[dateKey]) {
        bucketMap[dateKey].minutes += Math.round((session.activeMs || 0) / 60000);
      }
    });

    return buckets;
  }, [safeLessonSessions]);

  const engagementMetric = useMemo(() => {
    if (!safeLessonSessions.length) return null;
    const metric = computeEngagementScore(safeLessonSessions);
    if (!metric) return null;

    const recent = computeEngagementScore(safeLessonSessions.slice(-3));
    const previous = computeEngagementScore(safeLessonSessions.slice(-6, -3));
    const trend = formatTrend((recent?.value || metric.value) - (previous?.value || recent?.value || metric.value));

    return { ...metric, trend };
  }, [safeLessonSessions]);

  const recallMetric = useMemo(() => {
    if (!safeQuizAttempts.length) return null;
    const metric = computeRecallStrength(safeQuizAttempts, safeCourseProgress);
    if (!metric) return null;

    const recent = computeRecallStrength(safeQuizAttempts.slice(-4), safeCourseProgress);
    const previous = computeRecallStrength(safeQuizAttempts.slice(-8, -4), safeCourseProgress);
    const trend = formatTrend((recent?.value || metric.value) - (previous?.value || recent?.value || metric.value));

    return { ...metric, trend };
  }, [safeCourseProgress, safeQuizAttempts]);

  const todayProgress = useMemo(() => {
    const doneCount = dailyGoals.filter((goal) => goal.done).length;
    return clampPercent((doneCount / dailyGoals.length) * 100);
  }, [dailyGoals]);

  const completedLessonsCount = useMemo(() => {
    return Object.values(safeCourseProgress).reduce((sum, item) => sum + Object.keys(item.completedLessons || {}).length, 0);
  }, [safeCourseProgress]);

  const recentActivities = useMemo(() => {
    return safeActivities.slice(0, 5);
  }, [safeActivities]);

  const leaderboardData = useMemo(() => {
    const currentUser = { name: "You", xp, streak };
    return [currentUser, ...leaderboard]
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 5);
  }, [streak, xp]);

  const aiPreviewBullets = useMemo(() => {
    return [
      "Break the topic into a visual sprint with bullets, hooks, and one recap.",
      "Generate short checkpoints that reduce overload and improve retention.",
      "Keep the structure simple enough to revise quickly before a quiz."
    ];
  }, []);

  function toggleGoal(id) {
    setDailyGoals((current) => current.map((goal) => (goal.id === id ? { ...goal, done: !goal.done } : goal)));
  }

  return (
    <main className="min-h-screen bg-midnight text-white">
      <div className="fixed inset-0 bg-hero-grid bg-[length:42px_42px] opacity-[0.14]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_62%_18%,rgba(103,232,249,0.14),transparent_10%),linear-gradient(180deg,rgba(5,8,18,0.92),rgba(5,8,18,1))]" />

      <div className="relative mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[250px_minmax(0,1fr)]">
          <GlassPanel className="p-6 lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)]">
            <Link href="/" className="text-[2.15rem] font-black tracking-tight text-white">
              VisualMind
            </Link>

            <nav className="mt-12 space-y-3">
              {sidebarLinks.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                  className="block rounded-2xl px-4 py-3 text-base font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                  {item}
                </a>
              ))}
            </nav>

            <div className="mt-10 rounded-[1.9rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-black uppercase tracking-[0.12em] text-lime-300">Today</p>
              <p className="mt-3 text-5xl font-black text-white">{todayProgress}%</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Daily plan complete across lessons, quizzes, and revision.
              </p>
            </div>

            <Link
              href="/ai-lab"
              className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-[#68dfee] px-5 py-4 text-lg font-black text-slate-950 transition hover:scale-[1.02]"
            >
              AI Transform Lab
            </Link>

            <div className="mt-6 grid gap-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm font-semibold text-slate-400">Learning XP</p>
                <p className="mt-2 text-2xl font-black text-white">
                  <CountUpNumber value={xp} />
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm font-semibold text-slate-400">Current streak</p>
                <p className="mt-2 text-2xl font-black text-white">
                  <CountUpNumber value={streak} suffix="d" />
                </p>
              </div>
            </div>

            <div className="mt-auto hidden pt-10 xl:block">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black text-sm font-black text-white">
                N
              </div>
            </div>
          </GlassPanel>

          <section className="min-w-0">
            <div id="my-courses" className="px-1 pt-2">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#71dff0]">My Courses</p>
              <h1 className="mt-2 text-5xl font-black tracking-tight text-white">Pick up where you left off.</h1>
              <p className="mt-4 max-w-3xl text-lg text-slate-300">
                Your visual curriculum stays organized around active momentum and revision readiness.
              </p>
            </div>

            {resumeCourse ? (
              <GlassPanel id="continue-learning" className="mt-7 overflow-hidden p-0">
                <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="p-7">
                    <p className="text-sm font-black uppercase tracking-[0.16em] text-[#71dff0]">Continue Learning</p>
                    <h2 className="mt-3 text-[3rem] font-black leading-[1.02] text-white">Resume {resumeCourse.title}</h2>
                    <p className="mt-4 max-w-2xl text-lg text-slate-300">
                      Jump straight back into the quiz flow and continue from your next active checkpoint.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-3 text-sm font-bold text-slate-300">
                      <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">{resumeCourse.category}</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">{resumeCourse.duration}</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">{resumeCourse.progress}% complete</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                        {safeCompletedCourses[resumeCourse.id]
                          ? "Assessment completed"
                          : `Question ${resumeCourse.nextQuestion} of ${resumeCourse.totalQuestions}`}
                      </span>
                    </div>
                    <div className="mt-6 h-3 rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${resumeCourse.progress}%` }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="h-3 rounded-full bg-gradient-to-r from-cyan-300 via-blue-500 to-violet-500"
                      />
                    </div>
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <Link
                        href={`/courses/${resumeCourse.id}`}
                        className="inline-flex rounded-full bg-white px-6 py-3 text-base font-black text-slate-950 transition hover:scale-[1.02]"
                      >
                        Resume Now
                      </Link>
                      <motion.span
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 2.1, repeat: Infinity }}
                        className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100"
                      >
                        Last active path
                      </motion.span>
                    </div>
                  </div>

                  <div className={`min-h-[18rem] bg-gradient-to-br ${resumeCourse.color} p-7`}>
                    <div className="flex h-full flex-col justify-between">
                      <div>
                        <p className="text-sm font-bold uppercase tracking-[0.12em] text-white/85">Current path</p>
                        <p className="mt-4 text-5xl font-black text-white">{resumeCourse.earnedXp} XP</p>
                      </div>
                      <div className="rounded-[1.6rem] border border-white/15 bg-slate-950/20 p-5 backdrop-blur">
                        <p className="text-sm font-bold text-white/85">Next move</p>
                        <p className="mt-2 text-base leading-7 text-white/85">
                          {safeCompletedCourses[resumeCourse.id]
                            ? "Review the finished assessment or start a fresh AI-generated course."
                            : `You are on Question ${resumeCourse.nextQuestion} of ${resumeCourse.totalQuestions}.`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassPanel>
            ) : null}

            <AnimatePresence mode="popLayout">
              {visibleCourses.length ? (
                <div className="mt-7 grid gap-5 xl:grid-cols-3">
                  {visibleCourses.map((course, index) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      progress={course.progress}
                      earnedXp={course.earnedXp}
                      delay={index * 0.06}
                    />
                  ))}
                </div>
              ) : (
                <motion.div
                  key="empty-courses"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-7 rounded-[2rem] border border-dashed border-white/12 bg-white/[0.03] p-8"
                >
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300">No live courses yet</p>
                  <h3 className="mt-3 text-3xl font-black text-white">Generate your first AI learning path.</h3>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
                    Your latest three AI-generated courses will appear here with real progress, XP, and activity.
                  </p>
                  <Link
                    href="/ai-lab"
                    className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-base font-black text-slate-950 transition hover:scale-[1.02]"
                  >
                    Open AI Transform
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
              <GlassPanel id="ai-transform-lab-preview" className="p-7">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#71dff0]">AI Transform Lab Preview</p>
                <h2 className="mt-3 max-w-2xl text-[3rem] font-black leading-[1.05] text-white">
                  Turn a rough topic into a visual brief
                </h2>
                <p className="mt-4 max-w-2xl text-lg text-slate-300">
                  Draft the next concept and preview how the lab will reshape it for faster learning.
                </p>

                <div className="mt-6 rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
                  <p className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-slate-400">Paste content to transform</p>
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    className="min-h-[118px] w-full resize-none bg-transparent text-base leading-7 text-slate-200 outline-none placeholder:text-slate-500"
                  />
                </div>

                <div className="mt-5 grid gap-3">
                  {aiPreviewBullets.map((item, index) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.06 }}
                      className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-slate-300"
                    >
                      {item}
                    </motion.div>
                  ))}
                </div>
              </GlassPanel>

              <GlassPanel id="achievements" className="p-7">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#71dff0]">Achievements</p>
                <h2 className="mt-3 text-[3rem] font-black leading-[1.05] text-white">Badges earned this week</h2>
                <p className="mt-4 max-w-2xl text-lg text-slate-300">
                  Momentum markers that reinforce consistency and learning quality.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {achievementBadges.map((badge, index) => (
                    <AchievementCard key={badge.title} badge={badge} delay={index * 0.06} />
                  ))}
                </div>
              </GlassPanel>
            </div>

            <div className="mt-8 grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
              <GlassPanel id="progress" className="p-7">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#71dff0]">Learning Analytics</p>
                <h2 className="mt-3 text-[2.5rem] font-black leading-[1.06] text-white">
                  Focus, time, and retention at a glance
                </h2>
                <p className="mt-4 max-w-3xl text-lg text-slate-300">
                  The system tracks how consistently you learn, not just how often you open a course.
                </p>
                <AnalyticsChart
                  data={weeklyLearningData}
                  engagementMetric={engagementMetric}
                  recallMetric={recallMetric}
                />
              </GlassPanel>

              <GlassPanel id="tasks" className="p-7">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#71dff0]">Daily Goals</p>
                <h2 className="mt-3 text-[2.5rem] font-black leading-[1.06] text-white">Today’s active study plan</h2>
                <p className="mt-4 max-w-2xl text-lg text-slate-300">
                  Treat this as your light operating system: a few small wins that keep the streak alive.
                </p>

                <div className="mt-6 space-y-3">
                  {dailyGoals.map((goal, index) => (
                    <GoalItem key={goal.id} goal={goal} onToggle={toggleGoal} index={index} />
                  ))}
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-300">Completion</span>
                    <span className="font-bold text-cyan-200">{todayProgress}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/10">
                    <motion.div
                      animate={{ width: `${todayProgress}%` }}
                      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                      className="h-3 rounded-full bg-gradient-to-r from-cyan-300 via-blue-500 to-violet-500"
                    />
                  </div>
                </div>
              </GlassPanel>
            </div>

            <div className="mt-8 grid gap-5 xl:grid-cols-[1.02fr_0.98fr]">
              <GlassPanel id="activity" className="p-7">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#71dff0]">Recent Activity</p>
                <h2 className="mt-3 text-[2.5rem] font-black leading-[1.06] text-white">What moved recently</h2>
                <p className="mt-4 max-w-2xl text-lg text-slate-300">
                  A quick timeline of lessons completed, quiz performance, and XP gained.
                </p>

                {recentActivities.length ? (
                  <div className="mt-8 space-y-4">
                    {recentActivities.map((activity, index) => (
                      <ActivityRow key={activity.id} activity={activity} index={index} />
                    ))}
                  </div>
                ) : (
                  <div className="mt-8 rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-slate-300">
                    Activity starts appearing here as soon as you generate a course, open a lesson, or complete a quiz.
                  </div>
                )}
              </GlassPanel>

              <GlassPanel className="p-7">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#71dff0]">Leaderboard</p>
                <h2 className="mt-3 text-[2.5rem] font-black leading-[1.06] text-white">Top learners this week</h2>
                <p className="mt-4 max-w-2xl text-lg text-slate-300">
                  A little competition helps make daily progress feel more tangible and social.
                </p>

                <div className="mt-8 space-y-3">
                  {leaderboardData.map((item, index) => (
                    <LeaderboardRow key={`${item.name}-${index}`} item={item} index={index} />
                  ))}
                </div>

                <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-sm font-semibold text-slate-400">Lessons completed</p>
                  <p className="mt-2 text-3xl font-black text-white">
                    <CountUpNumber value={completedLessonsCount} />
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    You’ve closed real lessons, not just browsed the catalog.
                  </p>
                </div>
              </GlassPanel>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
