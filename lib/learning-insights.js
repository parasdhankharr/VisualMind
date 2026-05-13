import { getRelativeTimeLabel } from "@/lib/learning";
import { getMomentumSnapshot } from "@/data/streaks";

const DAY_MS = 24 * 60 * 60 * 1000;

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeObject(value) {
  return value && typeof value === "object" ? value : {};
}

function startOfDay(timestamp = Date.now()) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

export function getActivityHref(activity) {
  if (activity?.href) return activity.href;
  if (activity?.courseId) return `/courses/${activity.courseId}`;
  if (activity?.type === "transform") return "/ai-lab";
  if (activity?.type === "quiz" || activity?.type === "learning") return "/progress";
  return "/dashboard";
}

export function computeActiveStreak(dayValues = [], now = Date.now()) {
  const normalizedDays = [...new Set(safeArray(dayValues).map((value) => Number(value)).filter(Boolean))]
    .sort((left, right) => right - left);

  if (!normalizedDays.length) return 0;

  const today = startOfDay(now);
  const latestDay = normalizedDays[0];

  if (latestDay !== today && latestDay !== today - DAY_MS) {
    return 0;
  }

  let streak = 1;
  let cursor = latestDay;

  for (let index = 1; index < normalizedDays.length; index += 1) {
    if (normalizedDays[index] === cursor - DAY_MS) {
      streak += 1;
      cursor = normalizedDays[index];
      continue;
    }

    if (normalizedDays[index] < cursor - DAY_MS) {
      break;
    }
  }

  return streak;
}

function buildActivityDays(activities = []) {
  return [...new Set(activities.map((activity) => startOfDay(activity.timestamp)).filter(Boolean))].sort(
    (left, right) => right - left
  );
}

function buildSevenDayBuckets(labelFormatter) {
  return Array.from({ length: 7 }, (_, index) => {
    const timestamp = startOfDay(Date.now() - (6 - index) * DAY_MS);
    return {
      key: timestamp,
      label: labelFormatter(timestamp),
      value: 0
    };
  });
}

function shortDayLabel(timestamp) {
  return new Date(timestamp).toLocaleDateString("en-US", { weekday: "short" });
}

function buildWeeklyActivitySeries(activities = []) {
  const buckets = buildSevenDayBuckets(shortDayLabel);
  const bucketMap = buckets.reduce((accumulator, bucket) => {
    accumulator[bucket.key] = bucket;
    return accumulator;
  }, {});

  activities.forEach((activity) => {
    const bucket = bucketMap[startOfDay(activity.timestamp)];
    if (bucket) {
      bucket.value += Number(activity.xp) || 0;
    }
  });

  return buckets;
}

function buildWeeklyMinutesSeries(sessions = []) {
  const buckets = buildSevenDayBuckets(shortDayLabel);
  const bucketMap = buckets.reduce((accumulator, bucket) => {
    accumulator[bucket.key] = bucket;
    return accumulator;
  }, {});

  sessions.forEach((session) => {
    const timestamp = session.endedAt || session.startedAt;
    const bucket = bucketMap[startOfDay(timestamp)];
    if (bucket) {
      bucket.value += Math.round((Number(session.activeMs) || 0) / 60000);
    }
  });

  return buckets;
}

function buildCourseSnapshot(course, courseProgressState, completedCourses) {
  const progressState = safeObject(courseProgressState[course.id]);
  const completedLessons = Object.keys(safeObject(progressState.completedLessons)).length;
  const viewedLessons = Object.keys(safeObject(progressState.viewedLessons)).length;
  const quizCheckpoints = Object.keys(safeObject(progressState.completedQuizzes)).length;
  const totalLessons = safeArray(course.lessons).length;
  const totalQuizQuestions = safeArray(course.questions).length;

  return {
    ...course,
    progress: clampPercent(progressState.progress ?? course.progress ?? 0),
    earnedXp: Number(progressState.xp ?? course.xp ?? 0),
    completedLessons,
    viewedLessons,
    quizCheckpoints,
    totalLessons,
    totalQuizQuestions,
    completed: Boolean(progressState.completed || completedCourses[course.id])
  };
}

export function getLearningSnapshot(state) {
  const safeState = safeObject(state);
  const generatedCourses = safeArray(safeState.generatedCourses);
  const courseProgress = safeObject(safeState.courseProgress);
  const activities = safeArray(safeState.activities);
  const lessonSessions = safeArray(safeState.lessonSessions);
  const completedCourses = safeObject(safeState.completedCourses);
  const activeDays = safeArray(safeState.activeDays);

  const recentCourses = generatedCourses
    .slice()
    .sort((left, right) => (Number(right.createdAt) || 0) - (Number(left.createdAt) || 0))
    .slice(0, 3)
    .map((course) => buildCourseSnapshot(course, courseProgress, completedCourses));

  const recentActivity = activities.slice(0, 12).map((activity) => ({
    ...activity,
    href: getActivityHref(activity),
    relativeLabel: getRelativeTimeLabel(activity.timestamp)
  }));

  const derivedActiveDays = activeDays.length ? activeDays : buildActivityDays(activities);
  const momentum = getMomentumSnapshot({
    activeDays: derivedActiveDays,
    streak: safeState.streak,
    longestStreak: safeState.longestStreak
  });
  const streak = momentum.currentStreak;
  const completedLessonsCount = Object.values(courseProgress).reduce(
    (total, item) => total + Object.keys(safeObject(item.completedLessons)).length,
    0
  );
  const quizCheckpointCount = Object.values(courseProgress).reduce(
    (total, item) => total + Object.keys(safeObject(item.completedQuizzes)).length,
    0
  );
  const completedCourseCount = Object.values(completedCourses).filter(Boolean).length;
  const totalMinutes = lessonSessions.reduce((total, session) => total + Math.round((Number(session.activeMs) || 0) / 60000), 0);

  const resumeCourse =
    recentCourses.find((course) => course.id === safeState.lastOpenedCourseId) ||
    recentCourses.find((course) => course.progress > 0 && !course.completed) ||
    recentCourses[0] ||
    null;

  return {
    xp: Number(safeState.xp) || 0,
    streak,
    longestStreak: momentum.longestStreak,
    completedLessonsCount,
    quizCheckpointCount,
    completedCourseCount,
    totalMinutes,
    recentCourses,
    recentActivity,
    resumeCourse,
    weeklyXp: buildWeeklyActivitySeries(activities),
    weeklyMinutes: buildWeeklyMinutesSeries(lessonSessions)
  };
}
