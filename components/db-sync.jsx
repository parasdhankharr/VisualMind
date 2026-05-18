"use client";

import { useEffect, useRef } from "react";
import { useLearningStore } from "@/store/use-learning-store";

export function DatabaseSync() {
  const hydrateStore = useLearningStore((state) => state.hydrateStore);
  
  const name = useLearningStore((state) => state.name);
  const email = useLearningStore((state) => state.email);
  const xp = useLearningStore((state) => state.xp);
  const streak = useLearningStore((state) => state.streak);
  const longestStreak = useLearningStore((state) => state.longestStreak);
  const activeDays = useLearningStore((state) => state.activeDays);
  const activities = useLearningStore((state) => state.activities);
  const lessonSessions = useLearningStore((state) => state.lessonSessions);
  const quizAttempts = useLearningStore((state) => state.quizAttempts);
  const generatedCourses = useLearningStore((state) => state.generatedCourses);
  const completedLessons = useLearningStore((state) => state.completedLessons);
  const courseProgress = useLearningStore((state) => state.courseProgress);
  const badges = useLearningStore((state) => state.badges);

  const initialHydrationRef = useRef(false);

  // 1. Hydrate the local Zustand store from the database on initial mount
  useEffect(() => {
    let active = true;

    async function sync() {
      try {
        const response = await fetch("/api/profile/sync");
        if (!response.ok) return;

        const data = await response.json();
        if (active && data.profile) {
          hydrateStore(data.profile, data.progress);
          // Flag that database-to-client hydration is completed, preventing early state overwrites
          initialHydrationRef.current = true;
        }
      } catch (error) {
        console.error("Failed to sync profile with database:", error);
      }
    }

    sync();

    return () => {
      active = false;
    };
  }, [hydrateStore]);

  // 2. Debounced auto-save: Persists all user metrics and state items back to the database on change
  useEffect(() => {
    if (!initialHydrationRef.current || !email) return;

    const timer = setTimeout(async () => {
      // Serialize all nested store collections as string components inside badges to maintain structural integrity
      const serializedBadges = [
        ...(badges || []),
        `__longestStreak__:${longestStreak || 0}`,
        `__activeDays__:${JSON.stringify(activeDays || [])}`,
        `__activities__:${JSON.stringify(activities || [])}`,
        `__lessonSessions__:${JSON.stringify(lessonSessions || [])}`,
        `__quizAttempts__:${JSON.stringify(quizAttempts || [])}`,
        `__generatedCourses__:${JSON.stringify(generatedCourses || [])}`,
        `__completedLessons__:${JSON.stringify(completedLessons || {})}`,
        `__courseProgress__:${JSON.stringify(courseProgress || {})}`
      ];

      try {
        await fetch("/api/profile/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            xp,
            streak,
            badges: serializedBadges
          })
        });
      } catch (err) {
        console.error("Failed to auto-save store to database:", err);
      }
    }, 2000); // 2-second debounce to prevent high-frequency write spam

    return () => clearTimeout(timer);
  }, [
    name,
    email,
    xp,
    streak,
    longestStreak,
    JSON.stringify(activeDays),
    JSON.stringify(activities),
    JSON.stringify(lessonSessions),
    JSON.stringify(quizAttempts),
    JSON.stringify(generatedCourses),
    JSON.stringify(completedLessons),
    JSON.stringify(courseProgress),
    JSON.stringify(badges)
  ]);

  return null;
}
