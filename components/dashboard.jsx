"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { leaderboard } from "@/data/courses";
import { getRelativeTimeLabel } from "@/lib/learning";
import { useLearningStore } from "@/store/use-learning-store";

const sidebarLinks = [
  { id: "home", label: "Home", icon: HomeIcon },
  { id: "courses", label: "Courses", icon: LibraryIcon },
  { id: "analytics", label: "Analytics", icon: ChartIcon },
  { id: "activity", label: "Activity", icon: PulseIcon },
  { id: "social", label: "Social", icon: UsersIcon }
];

const defaultGoals = [
  { id: "lessons", label: "Complete 2 lessons", detail: "Two focused lesson closures." },
  { id: "quiz", label: "Finish 1 quiz", detail: "Lock recall before you stop." },
  { id: "review", label: "Review previous topic", detail: "Five minutes of revision." }
];

const sectionVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.42,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const SIDEBAR_COLLAPSED_WIDTH = 96;
const SIDEBAR_EXPANDED_WIDTH = 248;
const SIDEBAR_GAP = 24;
const MAIN_DASHBOARD_MARGIN = 112;

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value || 0)));
}

function clampValue(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function parseMinutes(value) {
  const match = String(value || "").match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function formatMinutes(minutes) {
  if (minutes <= 0) return "Review ready";
  if (minutes < 60) return `${minutes} min left`;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (!remainder) return `${hours} hr left`;
  return `${hours}h ${remainder}m left`;
}

function getTrendMeta(change) {
  const delta = Math.round(change || 0);

  if (delta <= -4) {
    return {
      delta,
      label: "dropping",
      arrow: "↓",
      tone: "text-rose-200",
      badgeClass: "border-rose-500/30 bg-rose-500/12 text-rose-100",
      emphasis: "Revision risk"
    };
  }

  if (delta >= 4) {
    return {
      delta,
      label: "improving",
      arrow: "↑",
      tone: "text-[#00ff87]",
      badgeClass: "border-[#00ff87]/20 bg-[rgba(0,255,135,0.1)] text-[#00ff87] shadow-[0_0_18px_rgba(0,255,135,0.08)]",
      emphasis: "Momentum building"
    };
  }

  return {
    delta,
    label: "steady",
    arrow: "→",
    tone: "text-zinc-300",
    badgeClass: "border-white/10 bg-white/[0.04] text-zinc-300",
    emphasis: "Stable"
  };
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
    accuracy,
    retries,
    completionConsistency
  };
}

function buildRecallSeries(quizAttempts) {
  if (!quizAttempts.length) return [];

  const sortedAttempts = [...quizAttempts].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  const values = [];

  sortedAttempts.forEach((_, index) => {
    const windowStart = Math.max(0, index - 3);
    const sample = sortedAttempts.slice(windowStart, index + 1);
    const correctCount = sample.filter((attempt) => attempt.correct).length;
    values.push(clampPercent((correctCount / sample.length) * 100));
  });

  return values.slice(-8);
}

function getCourseStatus(course, state, isCompleted) {
  const lessons = Array.isArray(course.lessons) ? course.lessons : [];
  const completedLessons = state?.completedLessons || {};
  const nextLesson = lessons.find((lesson) => !completedLessons[lesson.id]) || lessons[lessons.length - 1];
  const remainingMinutes = lessons
    .filter((lesson) => !completedLessons[lesson.id])
    .reduce((sum, lesson) => sum + parseMinutes(lesson.duration), 0);

  if (!lessons.length) {
    return {
      nextLessonTitle: "AI path ready",
      timeRemaining: formatMinutes(parseMinutes(course.duration))
    };
  }

  if (isCompleted) {
    return {
      nextLessonTitle: "Assessment review",
      timeRemaining: "Review ready"
    };
  }

  return {
    nextLessonTitle: nextLesson?.title || "Start first lesson",
    timeRemaining: formatMinutes(remainingMinutes || parseMinutes(nextLesson?.duration) || parseMinutes(course.duration))
  };
}

function resolveActivityMeta(activity) {
  const title = String(activity.title || "");

  if (activity.type === "transform" && /explored concept breakdown|reviewed key takeaway/i.test(title)) {
    return {
      key: "concept-sprint",
      title: "Concept Sprint",
      subtitle: (count) => `${count} topics refined`
    };
  }

  if (/completed lesson/i.test(title)) {
    return {
      key: "lesson-sprint",
      title: "Lesson Sprint",
      subtitle: (count) => `${count} lessons completed`
    };
  }

  if (/completed quiz/i.test(title)) {
    return {
      key: "quiz-run",
      title: "Checkpoint Run",
      subtitle: (count) => `${count} quizzes cleared`
    };
  }

  if (/viewed lesson|opened course/i.test(title)) {
    return {
      key: "study-warmup",
      title: "Study Warm-up",
      subtitle: (count) => `${count} learning sessions resumed`
    };
  }

  return {
    key: activity.id,
    title,
    subtitle: () => activity.subtitle || "Learning activity recorded."
  };
}

function groupActivities(activities) {
  const groups = [];

  activities.slice(0, 10).forEach((activity) => {
    const meta = resolveActivityMeta(activity);
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && lastGroup.key === meta.key && activity.type === lastGroup.type) {
      lastGroup.count += 1;
      lastGroup.totalXp += activity.xp || 0;
      lastGroup.timestamp = Math.max(lastGroup.timestamp, activity.timestamp || 0);
      lastGroup.activities.push(activity);
      return;
    }

    groups.push({
      key: meta.key,
      type: activity.type,
      count: 1,
      totalXp: activity.xp || 0,
      timestamp: activity.timestamp || 0,
      meta,
      activities: [activity]
    });
  });

  return groups.slice(0, 6).map((group) => {
    if (group.count === 1 && group.key === group.activities[0].id) {
      const [activity] = group.activities;
      return {
        id: activity.id,
        title: activity.title,
        subtitle: activity.subtitle || "Learning activity recorded.",
        type: activity.type,
        timestamp: activity.timestamp,
        xp: activity.xp || 0
      };
    }

    return {
      id: `${group.key}-${group.timestamp}`,
      title: group.meta.title,
      subtitle: group.meta.subtitle(group.count, group.activities),
      type: group.type,
      timestamp: group.timestamp,
      xp: group.totalXp
    };
  });
}

function ShellIcon({ children, className = "h-5 w-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function HomeIcon(props) {
  return (
    <ShellIcon {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9 21v-6h6v6" />
    </ShellIcon>
  );
}

function LibraryIcon(props) {
  return (
    <ShellIcon {...props}>
      <path d="M5 4h13a2 2 0 0 1 2 2v13H7a2 2 0 0 0-2 2V4Z" />
      <path d="M7 19V6" />
      <path d="M10 8h6" />
      <path d="M10 12h6" />
    </ShellIcon>
  );
}

function ChartIcon(props) {
  return (
    <ShellIcon {...props}>
      <path d="M4 19h16" />
      <path d="M7 16V9" />
      <path d="M12 16V5" />
      <path d="M17 16v-4" />
    </ShellIcon>
  );
}

function PulseIcon(props) {
  return (
    <ShellIcon {...props}>
      <path d="M3 12h4l2.5-5 4 10 2.5-5H21" />
    </ShellIcon>
  );
}

function UsersIcon(props) {
  return (
    <ShellIcon {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="3" />
      <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16.5 4.13a3 3 0 0 1 0 5.74" />
    </ShellIcon>
  );
}

function BoltIcon(props) {
  return (
    <ShellIcon {...props}>
      <path d="M13 2 5 14h6l-1 8 8-12h-6l1-8Z" />
    </ShellIcon>
  );
}

function PlayIcon(props) {
  return (
    <ShellIcon {...props}>
      <path d="m8 5 11 7-11 7V5Z" />
    </ShellIcon>
  );
}

function SparkIcon(props) {
  return (
    <ShellIcon {...props}>
      <path d="m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3Z" />
      <path d="m18 15 .9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9L18 15Z" />
    </ShellIcon>
  );
}

function Surface({ children, className = "", layer = 2 }) {
  return (
    <div
      className={`rounded-[24px] ${
        layer === 3 ? "bg-[#151515]" : "bg-[#111111]"
      } shadow-[0_18px_60px_rgba(0,0,0,0.28)] ${className}`}
    >
      {children}
    </div>
  );
}

function SectionKick({ label, title, detail, action }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">{label}</p>
        <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-white sm:text-[2rem]">{title}</h2>
        {detail ? <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-300">{detail}</p> : null}
      </div>
      {action}
    </div>
  );
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

function GlowBar({ value, className = "", trackClassName = "" }) {
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-black/25 ${trackClassName}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={`h-full rounded-full bg-gradient-to-r from-[#4facfe] via-[#3d8bff] to-[#5b2cff] ${className}`}
        style={{ filter: "drop-shadow(0 0 10px rgba(79, 172, 254, 0.7)) drop-shadow(0 0 22px rgba(91, 44, 255, 0.35))" }}
      />
    </div>
  );
}

function SidebarItem({ item, expanded }) {
  const Icon = item.icon;

  return (
    <a
      href={`#${item.id}`}
      aria-label={item.label}
      className="group flex items-center gap-3 rounded-[12px] px-3 py-3 text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#1a1a1a] text-zinc-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <Icon />
      </span>
      <span
        className={`min-w-0 overflow-hidden text-sm font-semibold tracking-[0.01em] opacity-100 transition-all duration-200 ${
          expanded ? "xl:max-w-[120px] xl:opacity-100" : "xl:max-w-0 xl:opacity-0"
        }`}
      >
        {item.label}
      </span>
    </a>
  );
}

function StatPill({ label, value, tone = "text-white" }) {
  return (
    <div className="rounded-[12px] bg-[#1a1a1a] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.02),inset_0_-10px_24px_rgba(0,0,0,0.2)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className={`mt-2 text-lg font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function TodayRing({ value, expanded }) {
  const size = expanded ? 120 : 60;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (clampPercent(value) / 100) * circumference;

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center transition-[width,height] duration-200 ${
        expanded ? "h-[120px] w-[120px]" : "h-[60px] w-[60px]"
      }`}
      style={{ width: size, height: size }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 h-full w-full -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#today-ring-gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          style={{ filter: "drop-shadow(0 0 10px rgba(79, 172, 254, 0.35))" }}
        />
        <defs>
          <linearGradient id="today-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4facfe" />
            <stop offset="100%" stopColor="#6b46ff" />
          </linearGradient>
        </defs>
      </svg>

      <div className="relative flex flex-col items-center justify-center text-center">
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-500">TODAY</span>
        <span className={`font-bold tracking-[-0.05em] text-white ${expanded ? "text-[1.9rem]" : "text-base"}`}>
          {value}%
        </span>
      </div>
    </div>
  );
}

function CourseCard({ course, delay = 0 }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[24px] bg-[#111111] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{course.category}</p>
          <h3 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-white">{course.title}</h3>
        </div>
        <div className="rounded-[12px] bg-[#1a1a1a] px-3 py-2 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">XP</p>
          <p className="mt-1 text-lg font-bold text-white">{course.earnedXp}</p>
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.08]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${course.progress}%` }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full bg-gradient-to-r from-[#4facfe] to-[#00f2fe]"
        />
      </div>

      <div className="mt-4 grid gap-3 rounded-[12px] bg-[#1a1a1a] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:grid-cols-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Progress</p>
          <p className="mt-2 text-sm font-semibold text-white">{course.progress}% complete</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Next Lesson</p>
          <p className="mt-2 text-sm font-semibold text-white">{course.nextLessonTitle}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Time Remaining</p>
          <p className="mt-2 text-sm font-semibold text-white">{course.timeRemaining}</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-black px-3 py-1.5 text-xs font-medium text-zinc-300">
            {course.lessons?.length || 0} lessons
          </span>
          <span className="rounded-full bg-black px-3 py-1.5 text-xs font-medium text-zinc-300">
            {course.duration}
          </span>
        </div>
        <Link
          href={`/courses/${course.id}`}
          className="inline-flex items-center gap-2 rounded-full bg-[#1a1a1a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#222222]"
        >
          <PlayIcon className="h-4 w-4" />
          Open Path
        </Link>
      </div>
    </motion.article>
  );
}

function LearningBars({ data }) {
  const maxValue = Math.max(...(data.length ? data.map((item) => item.minutes) : [1]), 1);

  return (
    <div className="rounded-[24px] bg-[#111111] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.24)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Focus Time</p>
          <p className="mt-2 text-xl font-bold text-white">Weekly learning load</p>
        </div>
        <p className="text-sm text-zinc-400">Last 7 days</p>
      </div>

      {data.length ? (
        <div className="mt-6 flex h-44 items-end gap-3">
          {data.map((item) => (
            <div key={item.label} className="flex flex-1 flex-col items-center gap-3">
              <div className="flex h-full w-full items-end rounded-t-[20px] bg-black/30">
                <div
                  className="w-full rounded-t-[20px]"
                  style={{
                    height: `${Math.max((item.minutes / maxValue) * 100, item.minutes ? 12 : 4)}%`,
                    background:
                      "linear-gradient(180deg, rgba(0,242,254,1) 0%, rgba(79,172,254,1) 48%, rgba(66,92,255,1) 100%)",
                    filter: "drop-shadow(0 0 10px rgba(0,242,254,0.26))"
                  }}
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-white">{item.minutes}m</p>
                <p className="text-xs text-zinc-500">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-[12px] bg-[#1a1a1a] p-4 text-sm text-zinc-400">
          Finish a lesson session to start building your weekly load profile.
        </div>
      )}
    </div>
  );
}

function Sparkline({ values, tone = "steady" }) {
  if (!values.length) return null;

  const width = 260;
  const height = 88;
  const padding = 8;
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values, minValue + 1);

  const points = values.map((value, index) => {
    const x = padding + (index / Math.max(values.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - ((value - minValue) / Math.max(maxValue - minValue, 1)) * (height - padding * 2);
    return { x, y };
  });

  const pointString = points.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPath = `M ${points[0].x} ${height - padding} L ${pointString
    .split(" ")
    .join(" L ")} L ${points[points.length - 1].x} ${height - padding} Z`;
  const lastPoint = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-24 w-full" role="img" aria-label="Recall strength trend">
      <defs>
        <linearGradient id={`recall-fill-${tone}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,229,255,0.34)" />
          <stop offset="100%" stopColor="rgba(0,229,255,0)" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#recall-fill-${tone})`} />
      <polyline
        points={pointString}
        fill="none"
        stroke="#00E5FF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: "drop-shadow(0 0 5px rgba(0, 229, 255, 0.4))" }}
      />
      <circle
        cx={lastPoint.x}
        cy={lastPoint.y}
        r="4"
        fill="#00E5FF"
        style={{ filter: "drop-shadow(0 0 5px rgba(0, 229, 255, 0.4))" }}
      />
    </svg>
  );
}

function RecallWidget({ metric, resumeHref }) {
  if (!metric) {
    return (
      <Surface layer={3} className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Recall Strength</p>
            <p className="mt-2 text-xl font-bold text-white">Trend locked</p>
          </div>
          <span className="rounded-full bg-[#1a1a1a] px-3 py-1 text-xs font-medium text-zinc-400">
            No data yet
          </span>
        </div>

        <div className="mt-5 space-y-3">
          <div className="skeleton h-20 rounded-[12px] bg-white/[0.06]" />
          <div className="skeleton h-3 w-3/4 rounded-full bg-white/[0.06]" />
          <div className="skeleton h-3 w-1/2 rounded-full bg-white/[0.06]" />
        </div>

        <Link
          href={resumeHref}
          className="mt-5 inline-flex rounded-full bg-gradient-to-r from-[#4facfe] to-[#6b46ff] px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:brightness-110"
        >
          Complete your first lesson to unlock trends
        </Link>
      </Surface>
    );
  }

  const riskCopy =
    metric.trend.label === "dropping" ? `${Math.abs(metric.trend.delta)}pt drop. Revise now.` : metric.trend.emphasis;

  return (
    <Surface layer={3} className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Recall Strength</p>
          <p className="mt-2 text-3xl font-bold text-white">{metric.value}%</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${metric.trend.badgeClass}`}>
          {metric.trend.arrow} {riskCopy}
        </span>
      </div>

      <motion.div
        animate={
          metric.trend.label === "dropping"
            ? {
                boxShadow: [
                  "0 0 0 rgba(0,242,254,0.08)",
                  "0 0 22px rgba(0,242,254,0.22)",
                  "0 0 0 rgba(0,242,254,0.08)"
                ]
              }
            : { boxShadow: "0 0 0 rgba(0,242,254,0)" }
        }
        transition={{ duration: 1.8, repeat: metric.trend.label === "dropping" ? Infinity : 0 }}
        className="mt-5 rounded-[12px] bg-[#1a1a1a] p-3"
      >
        <Sparkline values={metric.series} tone={metric.trend.label} />
      </motion.div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-zinc-400">Accuracy {metric.accuracyLabel}</span>
        <span className={metric.trend.tone}>
          {metric.trend.label === "dropping" ? "Loss aversion active" : metric.trend.emphasis}
        </span>
      </div>
    </Surface>
  );
}

function ActivityRow({ item, index }) {
  const toneClasses = {
    learning: "bg-[#1a1a1a] text-white",
    quiz: "bg-[#1a1a1a] text-white",
    transform: "bg-cyan-500/[0.08] text-cyan-100"
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="rounded-[24px] bg-[#111111] p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-white">{item.title}</p>
          <p className="mt-1 text-sm text-zinc-300">{item.subtitle}</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${toneClasses[item.type] || toneClasses.learning}`}>
          {item.xp > 0 ? `+${item.xp} XP` : item.type}
        </span>
      </div>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {getRelativeTimeLabel(item.timestamp)}
      </p>
    </motion.div>
  );
}

function GoalRow({ goal, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(goal.id)}
      className={`flex w-full items-start gap-3 rounded-[12px] p-4 text-left transition ${
        goal.done ? "bg-white/[0.08]" : "bg-[#1a1a1a]"
      }`}
    >
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
          goal.done ? "border-[#00f2fe] bg-[#00f2fe] text-black" : "border-white/12 bg-black text-transparent"
        }`}
      >
        ✓
      </span>
      <div>
        <p className="text-sm font-semibold text-white">{goal.label}</p>
        <p className="mt-1 text-sm text-zinc-400">{goal.detail}</p>
      </div>
    </button>
  );
}

function SocialRow({ item, index }) {
  return (
    <div className="flex items-center justify-between rounded-[12px] bg-white/[0.05] px-4 py-3 backdrop-blur-[20px]">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/35 text-xs font-semibold text-zinc-300">
          {index + 1}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{item.name}</p>
          <p className="text-xs text-zinc-500">{item.streak} day streak</p>
        </div>
      </div>
      <p className="text-sm font-semibold text-zinc-200">{item.xp} XP</p>
    </div>
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
  const [dailyGoals, setDailyGoals] = useState(defaultGoals.map((goal, index) => ({ ...goal, done: index !== 1 })));
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

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
    return safeGeneratedCourses.slice(0, 4).map((course) => {
      const state = safeCourseProgress[course.id];
      const progress = clampPercent(state?.progress ?? course.progress ?? 0);
      const earnedXp = state?.xp || course.xp || 0;
      const status = getCourseStatus(course, state, Boolean(safeCompletedCourses[course.id]));
      return { ...course, progress, earnedXp, ...status };
    });
  }, [safeCompletedCourses, safeCourseProgress, safeGeneratedCourses]);

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
    const metric = computeEngagementScore(safeLessonSessions);
    if (!metric) return null;

    const recent = computeEngagementScore(safeLessonSessions.slice(-3));
    const previous = computeEngagementScore(safeLessonSessions.slice(-6, -3));

    return {
      ...metric,
      trend: getTrendMeta((recent?.value || metric.value) - (previous?.value || recent?.value || metric.value))
    };
  }, [safeLessonSessions]);

  const recallMetric = useMemo(() => {
    const metric = computeRecallStrength(safeQuizAttempts, safeCourseProgress);
    if (!metric) return null;

    const series = buildRecallSeries(safeQuizAttempts);
    const recentAverage = series.slice(-3).reduce((sum, value) => sum + value, 0) / Math.max(series.slice(-3).length, 1);
    const previousAverage = series.slice(-6, -3).reduce((sum, value) => sum + value, 0) / Math.max(series.slice(-6, -3).length, 1);

    return {
      ...metric,
      series,
      accuracyLabel: `${clampPercent(metric.accuracy * 100)}%`,
      trend: getTrendMeta(recentAverage - previousAverage)
    };
  }, [safeCourseProgress, safeQuizAttempts]);

  const todayProgress = useMemo(() => {
    const doneCount = dailyGoals.filter((goal) => goal.done).length;
    return clampPercent((doneCount / dailyGoals.length) * 100);
  }, [dailyGoals]);

  const completedLessonsCount = useMemo(() => {
    return Object.values(safeCourseProgress).reduce((sum, item) => sum + Object.keys(item.completedLessons || {}).length, 0);
  }, [safeCourseProgress]);

  const focusMinutes = useMemo(() => {
    return weeklyLearningData.reduce((sum, item) => sum + item.minutes, 0);
  }, [weeklyLearningData]);

  const groupedActivities = useMemo(() => {
    return groupActivities(safeActivities);
  }, [safeActivities]);

  const leaderboardData = useMemo(() => {
    const currentUser = { name: "You", xp, streak };
    return [currentUser, ...leaderboard]
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 5);
  }, [streak, xp]);

  const sidebarWidth = sidebarExpanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH;

  function toggleGoal(id) {
    setDailyGoals((current) => current.map((goal) => (goal.id === id ? { ...goal, done: !goal.done } : goal)));
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050505] text-white">
      <style jsx global>{`
        html {
          scrollbar-width: thin;
          scrollbar-color: #222 transparent;
        }

        ::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: #222;
          border-radius: 999px;
        }
      `}</style>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,172,254,0.08),transparent_26%),radial-gradient(circle_at_85%_10%,rgba(0,242,254,0.06),transparent_18%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.88),rgba(5,5,5,1))]" />

      <div className="relative mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="relative">
          <motion.aside
            animate={{}}
            onMouseEnter={() => setSidebarExpanded(true)}
            onMouseLeave={() => setSidebarExpanded(false)}
            onFocusCapture={() => setSidebarExpanded(true)}
            onBlurCapture={() => setSidebarExpanded(false)}
            className={`z-30 w-full overflow-hidden rounded-[24px] bg-white/[0.05] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-[20px] transition-[width] duration-200 xl:fixed xl:left-8 xl:top-4 xl:h-[calc(100vh-2rem)] ${
              sidebarExpanded ? "xl:w-[248px]" : "xl:w-[96px]"
            }`}
            style={{ zIndex: 40 }}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[#1a1a1a] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                  <BoltIcon />
                </div>
                <div
                  className={`min-w-0 overflow-hidden opacity-100 transition-all duration-200 ${
                    sidebarExpanded ? "xl:max-w-[130px] xl:opacity-100" : "xl:max-w-0 xl:opacity-0"
                  }`}
                >
                  <p className="text-lg font-bold tracking-[-0.03em] text-white">VisualMind</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Learning OS</p>
                </div>
              </div>

              <nav className="mt-6 space-y-2">
                {sidebarLinks.map((item) => (
                  <SidebarItem key={item.id} item={item} expanded={sidebarExpanded} />
                ))}
              </nav>

              <div className="mt-6 flex flex-col items-center rounded-[12px] bg-[#1a1a1a] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                <TodayRing value={todayProgress} expanded={sidebarExpanded} />
                <p
                  className={`mt-3 overflow-hidden text-center text-xs text-zinc-400 transition-all duration-200 ${
                    sidebarExpanded ? "xl:max-h-10 xl:opacity-100" : "xl:max-h-0 xl:opacity-0"
                  }`}
                >
                  Two wins down. Keep the streak alive.
                </p>
              </div>

              <Link
                href="/ai-lab"
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#4facfe] to-[#6b46ff] px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
              >
                <SparkIcon className="h-4 w-4" />
                <span
                  className={`overflow-hidden opacity-100 transition-all duration-200 ${
                    sidebarExpanded ? "xl:max-w-[120px] xl:opacity-100" : "xl:max-w-0 xl:opacity-0"
                  }`}
                >
                  AI Lab
                </span>
              </Link>

              <div className="mt-auto pt-6">
                <div className="flex items-center gap-3 rounded-[12px] bg-[#1a1a1a] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                    N
                  </div>
                  <div
                    className={`min-w-0 overflow-hidden opacity-100 transition-all duration-200 ${
                      sidebarExpanded ? "xl:max-w-[120px] xl:opacity-100" : "xl:max-w-0 xl:opacity-0"
                    }`}
                  >
                    <p className="text-sm font-semibold text-white">Operator</p>
                    <p className="text-xs text-zinc-500">Deep work mode</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>

          <div
            className="transition-[padding,margin] duration-200 xl:ml-[112px] xl:pl-[var(--sidebar-offset)] xl:pr-[324px]"
            style={{ "--sidebar-offset": `${Math.max(sidebarWidth + SIDEBAR_GAP - MAIN_DASHBOARD_MARGIN, 0)}px` }}
          >
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            animate="show"
            className="z-10 min-w-0 space-y-4"
          >
            <motion.section variants={cardVariants} id="home">
              <Surface className="overflow-hidden p-6 sm:p-7">
                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[-0.02em] leading-[1.2] text-zinc-500">Operational View</p>
                    <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-[-0.02em] leading-[1.15] text-white sm:text-[3.5rem]">
                      Production-grade learning, tuned for deep work.
                    </h1>
                    <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-300">
                      VisualMind now prioritizes active paths, revision risk, and next actions over decorative noise.
                    </p>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      <StatPill label="Learning XP" value={<CountUpNumber value={xp} />} />
                      <StatPill label="Current Streak" value={<CountUpNumber value={streak} suffix="d" />} />
                      <StatPill label="Lessons Closed" value={<CountUpNumber value={completedLessonsCount} />} />
                    </div>
                  </div>

                  <div className="rounded-[24px] bg-gradient-to-br from-[#4facfe] via-[#3f78ff] to-[#6b46ff] p-5 text-white shadow-[0_20px_50px_rgba(79,172,254,0.2)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">Resume Path</p>
                    <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white sm:text-[2.8rem]">
                      {resumeCourse ? `Resume ${resumeCourse.title}` : "Create your first path"}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-white/85">
                      {resumeCourse
                        ? `${resumeCourse.nextLessonTitle} is next. Stay inside the same path and protect recall momentum.`
                        : "Generate a course in the AI Lab to unlock your active workspace."}
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[12px] bg-white/14 px-4 py-3 backdrop-blur-md">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">Progress</p>
                        <p className="mt-2 text-lg font-bold text-white">{resumeCourse ? `${resumeCourse.progress}%` : "0%"}</p>
                      </div>
                      <div className="rounded-[12px] bg-white/14 px-4 py-3 backdrop-blur-md">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">Next Lesson</p>
                        <p className="mt-2 text-lg font-bold text-white">{resumeCourse ? resumeCourse.nextLessonTitle : "Not started"}</p>
                      </div>
                      <div className="rounded-[12px] bg-white/14 px-4 py-3 backdrop-blur-md">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">Time Left</p>
                        <p className="mt-2 text-lg font-bold text-white">{resumeCourse ? resumeCourse.timeRemaining : "0 min"}</p>
                      </div>
                    </div>

                    {resumeCourse ? (
                      <>
                        <div className="mt-5">
                          <GlowBar value={resumeCourse.progress} trackClassName="bg-white/20" className="from-white via-[#9fe8ff] to-[#d5c4ff]" />
                        </div>
                        <Link
                          href={`/courses/${resumeCourse.id}`}
                          className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 transition-[transform,box-shadow,filter] duration-200 hover:scale-[1.02] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.35),0_0_24px_rgba(79,172,254,0.2),0_0_36px_rgba(107,70,255,0.18)]"
                        >
                          <PlayIcon className="h-4 w-4" />
                          Resume
                        </Link>
                      </>
                    ) : (
                      <Link
                        href="/ai-lab"
                        className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 transition-[transform,box-shadow,filter] duration-200 hover:scale-[1.02] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.35),0_0_24px_rgba(79,172,254,0.2),0_0_36px_rgba(107,70,255,0.18)]"
                      >
                        <SparkIcon className="h-4 w-4" />
                        Open AI Lab
                      </Link>
                    )}
                  </div>
                </div>
              </Surface>
            </motion.section>

            <motion.section variants={cardVariants} id="courses">
              <Surface className="p-6 sm:p-7">
                <SectionKick
                  label="Active Courses"
                  title="Keep every live path visible."
                  detail="Descriptions are stripped back so the next lesson, progress, and time cost stay instantly scannable."
                />

                {visibleCourses.length ? (
                  <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    {visibleCourses.map((course, index) => (
                      <CourseCard key={course.id} course={course} delay={index * 0.05} />
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-[24px] bg-[#111111] p-6">
                    <p className="text-lg font-bold text-white">No active paths yet.</p>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-300">
                      Generate your first AI course and this workspace will fill with progress bars, next lessons, and recall signals.
                    </p>
                    <Link
                      href="/ai-lab"
                      className="mt-4 inline-flex rounded-full bg-gradient-to-r from-[#4facfe] to-[#6b46ff] px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:brightness-110"
                    >
                      Generate a path
                    </Link>
                  </div>
                )}
              </Surface>
            </motion.section>

            <motion.section variants={cardVariants} id="analytics">
              <Surface className="p-6 sm:p-7">
                <SectionKick
                  label="Analytics"
                  title="Focus and retention in one pass."
                  detail="Progress momentum stays bright. Risk signals stay obvious."
                />

                <div className="mt-6 grid gap-4 2xl:grid-cols-[1.05fr_0.95fr]">
                  <LearningBars data={weeklyLearningData} />

                  <div className="space-y-4">
                    <Surface layer={3} className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Engagement Score</p>
                          <p className="mt-2 text-3xl font-bold text-white">
                            {engagementMetric ? <CountUpNumber value={engagementMetric.value} suffix="%" /> : "—"}
                          </p>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${engagementMetric?.trend.badgeClass || "border-white/10 bg-white/[0.04] text-zinc-400"}`}>
                          {engagementMetric ? `${engagementMetric.trend.arrow} ${engagementMetric.trend.emphasis}` : "Start a lesson"}
                        </span>
                      </div>
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <StatPill
                          label="Focus Minutes"
                          value={`${focusMinutes}m`}
                          tone="text-zinc-100"
                        />
                        <StatPill
                          label="Active Ratio"
                          value={engagementMetric ? `${clampPercent(engagementMetric.activeRatio * 100)}%` : "0%"}
                          tone="text-zinc-100"
                        />
                      </div>
                    </Surface>

                    <RecallWidget
                      metric={recallMetric}
                      resumeHref={resumeCourse ? `/courses/${resumeCourse.id}` : "/ai-lab"}
                    />
                  </div>
                </div>
              </Surface>
            </motion.section>

            <motion.section variants={cardVariants} id="activity">
              <Surface className="p-6 sm:p-7">
                <SectionKick
                  label="Activity Feed"
                  title="What moved most recently."
                  detail="Repeated actions are collapsed into sprints so the feed stays useful under pressure."
                />

                {groupedActivities.length ? (
                  <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    {groupedActivities.map((item, index) => (
                      <ActivityRow key={item.id} item={item} index={index} />
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-[24px] bg-[#111111] p-6 text-sm text-zinc-400">
                    Activity appears here after you generate a course, open a lesson, or clear a quiz.
                  </div>
                )}
              </Surface>
            </motion.section>
          </motion.div>

          <motion.aside
            variants={sectionVariants}
            initial="hidden"
            animate="show"
            className="z-10 mt-4 space-y-4 xl:fixed xl:right-8 xl:top-4 xl:w-[300px]"
            id="social"
          >
            <motion.section variants={cardVariants}>
              <Surface className="bg-white/[0.05] p-5 backdrop-blur-[20px]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Daily Plan</p>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-white">{todayProgress}% Today</h2>
                <p className="mt-2 text-sm text-zinc-400">Small wins, high carry-over.</p>
                <div className="mt-4">
                  <GlowBar value={todayProgress} />
                </div>

                <div className="mt-4 space-y-3">
                  {dailyGoals.map((goal) => (
                    <GoalRow key={goal.id} goal={goal} onToggle={toggleGoal} />
                  ))}
                </div>
              </Surface>
            </motion.section>

            <motion.section variants={cardVariants}>
              <Surface className="bg-white/[0.05] p-5 backdrop-blur-[20px]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Social</p>
                    <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-white">Leaderboard</h2>
                  </div>
                  <UsersIcon className="h-5 w-5 text-zinc-500" />
                </div>

                <div className="mt-4 space-y-3">
                  {leaderboardData.map((item, index) => (
                    <SocialRow key={`${item.name}-${index}`} item={item} index={index} />
                  ))}
                </div>
              </Surface>
            </motion.section>

            <motion.section variants={cardVariants}>
              <Surface className="bg-white/[0.05] p-5 backdrop-blur-[20px]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">AI Workflow</p>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-white">Refine another concept.</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  Use the lab when you need a new learning path or a tighter concept breakdown.
                </p>
                <Link
                  href="/ai-lab"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#4facfe] to-[#6b46ff] px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:brightness-110"
                >
                  <SparkIcon className="h-4 w-4" />
                  Open AI Lab
                </Link>
              </Surface>
            </motion.section>
          </motion.aside>
          </div>
        </div>
      </div>
    </main>
  );
}
