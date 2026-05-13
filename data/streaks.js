const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_TRACKED_DAYS = 540;

export const streakMilestones = [
  {
    title: "Spark",
    minDays: 1,
    description: "A first return is enough to change direction.",
    tone: "foundation"
  },
  {
    title: "Flow",
    minDays: 3,
    description: "Repetition begins to soften resistance and invite ease.",
    tone: "foundation"
  },
  {
    title: "Rhythm",
    minDays: 7,
    description: "Focus finds cadence and effort starts to feel natural.",
    tone: "growth"
  },
  {
    title: "Pulse",
    minDays: 14,
    description: "Learning starts to move with a reliable internal beat.",
    tone: "growth"
  },
  {
    title: "Momentum",
    minDays: 30,
    description: "Focus stops feeling forced and starts becoming identity.",
    tone: "growth"
  },
  {
    title: "Discipline",
    minDays: 60,
    description: "Consistency holds steady even when motivation turns quiet.",
    tone: "mastery"
  },
  {
    title: "Ascension",
    minDays: 100,
    description: "Daily effort begins to elevate how you think and work.",
    tone: "mastery"
  },
  {
    title: "Mastery",
    minDays: 180,
    description: "Discipline compounds into calm command over time.",
    tone: "elite"
  },
  {
    title: "Eternal",
    minDays: 365,
    description: "Consistency becomes part of who you are.",
    tone: "legendary"
  }
];

export function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

export function formatStreakLabel(days) {
  const safeDays = Math.max(0, Number(days) || 0);
  return `${safeDays.toLocaleString("en-US")} ${safeDays === 1 ? "Day" : "Days"} Streak`;
}

export function startOfDay(timestamp = Date.now()) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function normalizeActiveDays(dayValues = []) {
  return [...new Set(dayValues.map((value) => Number(value)).filter(Boolean))]
    .map((value) => startOfDay(value))
    .sort((left, right) => right - left)
    .slice(0, MAX_TRACKED_DAYS);
}

export function buildSyntheticActiveDays(streak, now = Date.now()) {
  const safeStreak = Math.max(0, Math.round(Number(streak) || 0));
  const today = startOfDay(now);

  return Array.from({ length: safeStreak }, (_, index) => today - index * DAY_MS);
}

export function registerActivityDay(existingDays = [], timestamp = Date.now()) {
  return normalizeActiveDays([startOfDay(timestamp), ...existingDays]);
}

export function computeCurrentStreak(dayValues = [], now = Date.now()) {
  const normalizedDays = normalizeActiveDays(dayValues);
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

export function computeLongestStreak(dayValues = []) {
  const normalizedDays = normalizeActiveDays(dayValues);
  if (!normalizedDays.length) return 0;

  let longest = 1;
  let current = 1;

  for (let index = 1; index < normalizedDays.length; index += 1) {
    if (normalizedDays[index] === normalizedDays[index - 1] - DAY_MS) {
      current += 1;
      longest = Math.max(longest, current);
      continue;
    }

    current = 1;
  }

  return longest;
}

export function getStreakMilestoneMeta(days) {
  const safeDays = Math.max(0, Math.round(Number(days) || 0));
  let currentMilestone = null;
  let currentIndex = -1;

  streakMilestones.forEach((milestone, index) => {
    if (safeDays >= milestone.minDays) {
      currentMilestone = milestone;
      currentIndex = index;
    }
  });

  const nextMilestone = streakMilestones[currentIndex + 1] || (currentIndex === -1 ? streakMilestones[0] : null);
  const currentFloor = currentMilestone?.minDays || 0;
  const progress = nextMilestone
    ? clampPercent(((safeDays - currentFloor) / Math.max(nextMilestone.minDays - currentFloor, 1)) * 100)
    : currentMilestone
      ? 100
      : 0;

  return {
    currentMilestone,
    nextMilestone,
    progress,
    daysToNext: nextMilestone ? Math.max(0, nextMilestone.minDays - safeDays) : 0,
    currentTitle: currentMilestone?.title || streakMilestones[0].title,
    currentDescription: currentMilestone?.description || streakMilestones[0].description,
    currentTone: currentMilestone?.tone || streakMilestones[0].tone
  };
}

export function getMomentumSnapshot(input = {}, now = Date.now()) {
  const fallbackDays =
    Array.isArray(input.activeDays) && input.activeDays.length
      ? input.activeDays
      : buildSyntheticActiveDays(input.streak, now);
  const activeDays = normalizeActiveDays(fallbackDays);
  const currentStreak = activeDays.length ? computeCurrentStreak(activeDays, now) : Math.max(0, Number(input.streak) || 0);
  const longestStreak = Math.max(
    Math.round(Number(input.longestStreak) || 0),
    computeLongestStreak(activeDays),
    currentStreak,
    Math.round(Number(input.streak) || 0)
  );
  const milestoneMeta = getStreakMilestoneMeta(currentStreak);
  const today = startOfDay(now);
  const lastActiveDay = activeDays[0] || null;
  const hasActivityToday = lastActiveDay === today;
  const isRecoveryWindow = lastActiveDay === today - DAY_MS;

  let statusLabel = "Momentum dormant";
  let statusDetail = "Consistency starts with a single deliberate return.";
  let recoveryInsight = "Start today to ignite Spark.";

  if (currentStreak > 0 && hasActivityToday) {
    statusLabel = "Active today";
    statusDetail = "Your cadence is protected for the day.";
    recoveryInsight = "Return tomorrow to keep the path unbroken.";
  } else if (currentStreak > 0 && isRecoveryWindow) {
    statusLabel = "Recovery window";
    statusDetail = "The cadence still holds if you return today.";
    recoveryInsight = "Complete one focused session today to preserve momentum.";
  } else if (currentStreak > 0) {
    statusLabel = "Momentum paused";
    statusDetail = "The last chain has cooled, but the rhythm can begin again.";
    recoveryInsight = "Begin again today. Daily returns rebuild the path.";
  }

  const finalMilestone = streakMilestones[streakMilestones.length - 1];
  const overallProgress = clampPercent((currentStreak / Math.max(finalMilestone.minDays, 1)) * 100);

  return {
    activeDays,
    currentStreak,
    longestStreak,
    lastActiveDay,
    hasActivityToday,
    isRecoveryWindow,
    overallProgress,
    statusLabel,
    statusDetail,
    recoveryInsight,
    ...milestoneMeta
  };
}
