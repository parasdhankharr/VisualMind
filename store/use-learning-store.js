"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { buildSyntheticActiveDays, getMomentumSnapshot, registerActivityDay } from "@/data/streaks";

function createEmptyCourseProgress() {
  return {
    viewedLessons: {},
    completedLessons: {},
    completedQuizzes: {},
    xp: 0,
    progress: 0,
    completed: false
  };
}

function computeCourseProgress(progressState, lessonCount) {
  const safeCount = Math.max(lessonCount || 1, 1);
  const viewed = Object.keys(progressState.viewedLessons || {}).length;
  const quizzes = Object.keys(progressState.completedQuizzes || {}).length;
  const completed = Object.keys(progressState.completedLessons || {}).length;
  const achieved = viewed + quizzes + completed;
  return Math.min(100, Math.round((achieved / (safeCount * 3)) * 100));
}

const IDLE_THRESHOLD_MS = 20 * 1000;

function finalizeLessonSession(session, endedAt) {
  if (!session) return null;

  const safeEndedAt = Math.max(endedAt || Date.now(), session.startedAt || 0);
  const lastTouch = session.lastActiveAt || session.startedAt || safeEndedAt;
  const trailingDelta = Math.max(0, safeEndedAt - lastTouch);
  const activeMs = Math.min((session.activeMs || 0) + Math.min(trailingDelta, IDLE_THRESHOLD_MS), safeEndedAt - session.startedAt);
  const totalMs = Math.max(0, safeEndedAt - session.startedAt);

  return {
    courseId: session.courseId,
    lessonId: session.lessonId,
    title: session.title,
    startedAt: session.startedAt,
    endedAt: safeEndedAt,
    totalMs,
    activeMs,
    idleMs: Math.max(0, totalMs - activeMs),
    interactionCount: session.interactionCount || 0
  };
}

function createToast(payload) {
  return {
    id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    tone: "info",
    ...payload
  };
}

const XP_REWARDS = {
  transform: 50,
  quiz: 20,
  lesson: 30
};

export const useLearningStore = create(
  persist(
    (set, get) => ({
      completedLessons: {},
      xp: 0,
      streak: 0,
      longestStreak: 0,
      activeDays: [],
      generatedCourses: [],
      activities: [],
      courseProgress: {},
      completedCourses: {},
      lastOpenedCourseId: "",
      lessonSessions: [],
      activeLessonSession: null,
      quizAttempts: [],
      toasts: [],
      awardXp: (amount) => {
        if (!amount) return;
        set((state) => ({
          xp: state.xp + amount
        }));
      },
      addToast: (payload) => {
        const toast = createToast(payload);
        set((state) => ({
          toasts: [...state.toasts, toast].slice(-4)
        }));
        if (typeof window !== "undefined") {
          window.setTimeout(() => {
            get().dismissToast(toast.id);
          }, 2400);
        }
      },
      dismissToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id)
        }));
      },
      addActivity: ({ title, subtitle = "", xp = 0, type = "learning", timestamp = Date.now() }) => {
        set((state) => {
          const fallbackDays =
            Array.isArray(state.activeDays) && state.activeDays.length
              ? state.activeDays
              : buildSyntheticActiveDays(state.streak, timestamp);
          const nextActiveDays = registerActivityDay(fallbackDays, timestamp);
          const momentum = getMomentumSnapshot(
            {
              activeDays: nextActiveDays,
              streak: state.streak,
              longestStreak: state.longestStreak
            },
            timestamp
          );

          return {
            activities: [
              {
                id: `${type}-${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
                title,
                subtitle,
                xp,
                type,
                timestamp
              },
              ...state.activities
            ].slice(0, 20),
            activeDays: nextActiveDays,
            streak: momentum.currentStreak,
            longestStreak: momentum.longestStreak
          };
        });
      },
      addGeneratedCourse: (course) => {
        set((state) => ({
          generatedCourses: [
            {
              ...course,
              progress: state.courseProgress[course.id]?.progress ?? course.progress ?? 0,
              xp: state.courseProgress[course.id]?.xp ?? course.xp ?? 0
            },
            ...state.generatedCourses.filter((item) => item.id !== course.id)
          ]
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .slice(0, 3),
          courseProgress: {
            ...state.courseProgress,
            [course.id]: state.courseProgress[course.id] || createEmptyCourseProgress()
          }
        }));
      },
      syncGeneratedCourses: (courses) => {
        set((state) => ({
          generatedCourses: [...courses]
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .slice(0, 3),
          courseProgress: {
            ...state.courseProgress,
            ...courses.reduce((accumulator, course) => {
              accumulator[course.id] = state.courseProgress[course.id] || createEmptyCourseProgress();
              return accumulator;
            }, {})
          }
        }));
      },
      completeCourse: ({ courseId, title, xp = 40 }) => {
        const timestamp = Date.now();
        let awardedXp = 0;
        let shouldLog = false;

        set((state) => {
          if (state.completedCourses[courseId]) {
            return state;
          }

          shouldLog = true;
          awardedXp = xp;
          const current = state.courseProgress[courseId] || createEmptyCourseProgress();

          return {
            xp: state.xp + awardedXp,
            completedCourses: {
              ...state.completedCourses,
              [courseId]: true
            },
            courseProgress: {
              ...state.courseProgress,
              [courseId]: {
                ...current,
                completed: true,
                progress: 100,
                xp: current.xp + awardedXp
              }
            }
          };
        });

        if (shouldLog) {
          get().addActivity({
            title: "Course completed",
            subtitle: `Finished ${title}`,
            xp: awardedXp,
            type: "learning",
            timestamp
          });
          get().addToast({
            title: `+${awardedXp} XP`,
            detail: `${title} completed`,
            tone: "success"
          });
        }
      },
      startLessonSession: ({ courseId, lessonId, title }) => {
        const timestamp = Date.now();

        set((state) => {
          const existing = state.activeLessonSession;
          const finalized = existing ? finalizeLessonSession(existing, timestamp) : null;

          return {
            lessonSessions: finalized ? [...state.lessonSessions, finalized].slice(-40) : state.lessonSessions,
            activeLessonSession: {
              courseId,
              lessonId,
              title,
              startedAt: timestamp,
              lastActiveAt: timestamp,
              activeMs: 0,
              interactionCount: 0
            }
          };
        });
      },
      trackLessonActivity: ({ interaction = false } = {}) => {
        const timestamp = Date.now();

        set((state) => {
          const current = state.activeLessonSession;
          if (!current) return state;

          const delta = Math.max(0, timestamp - (current.lastActiveAt || current.startedAt || timestamp));
          const next = {
            ...current,
            lastActiveAt: timestamp,
            activeMs: (current.activeMs || 0) + Math.min(delta, IDLE_THRESHOLD_MS),
            interactionCount: (current.interactionCount || 0) + (interaction ? 1 : 0)
          };

          return {
            activeLessonSession: next
          };
        });
      },
      endLessonSession: () => {
        const timestamp = Date.now();

        set((state) => {
          const finalized = finalizeLessonSession(state.activeLessonSession, timestamp);
          if (!finalized) return state;

          return {
            lessonSessions: [...state.lessonSessions, finalized].slice(-40),
            activeLessonSession: null
          };
        });
      },
      recordCourseOpen: ({ courseId, title }) => {
        const timestamp = Date.now();
        set({ lastOpenedCourseId: courseId });
        get().addActivity({
          title: "Opened course",
          subtitle: `Resumed ${title}`,
          xp: 0,
          type: "learning",
          timestamp
        });
      },
      recordGeneratedCourse: (course) => {
        const timestamp = Date.now();
        get().addGeneratedCourse(course);
        get().awardXp(XP_REWARDS.transform);
        get().addActivity({
          title: "Generated course",
          subtitle: `Created course ${course.title}`,
          xp: XP_REWARDS.transform,
          type: "transform",
          timestamp
        });
        get().addToast({
          title: `+${XP_REWARDS.transform} XP`,
          detail: `${course.title} is ready to learn`,
          tone: "success"
        });
      },
      recordLessonView: ({ courseId, lessonId, lessonCount, title }) => {
        const timestamp = Date.now();
        let shouldLog = false;

        set((state) => {
          const current = state.courseProgress[courseId] || createEmptyCourseProgress();
          if (current.viewedLessons[lessonId]) {
            return state;
          }

          shouldLog = true;
          const next = {
            ...current,
            viewedLessons: { ...current.viewedLessons, [lessonId]: true }
          };
          next.progress = computeCourseProgress(next, lessonCount);

          return {
            courseProgress: {
              ...state.courseProgress,
              [courseId]: next
            }
          };
        });

        if (shouldLog) {
          get().addActivity({
            title: "Viewed lesson",
            subtitle: `Opened ${title}`,
            xp: 0,
            type: "learning",
            timestamp
          });
        }
      },
      recordQuizResult: ({ courseId, lessonId, lessonCount, correct, title }) => {
        if (!correct) return;

        const timestamp = Date.now();
        let awardedXp = 0;
        let shouldLog = false;

        set((state) => {
          const current = state.courseProgress[courseId] || createEmptyCourseProgress();
          const alreadyCompleted = Boolean(current.completedQuizzes[lessonId]);
          shouldLog = !alreadyCompleted;
          awardedXp = alreadyCompleted ? 0 : XP_REWARDS.quiz;

          const next = {
            ...current,
            completedQuizzes: { ...current.completedQuizzes, [lessonId]: true },
            xp: current.xp + awardedXp
          };
          next.progress = computeCourseProgress(next, lessonCount);

          return {
            xp: state.xp + awardedXp,
            courseProgress: {
              ...state.courseProgress,
              [courseId]: next
            }
          };
        });

        if (shouldLog) {
          get().addActivity({
            title: "Completed quiz",
            subtitle: `Answered correctly in ${title}`,
            xp: awardedXp,
            type: "quiz",
            timestamp
          });
          get().addToast({
            title: `+${awardedXp} XP`,
            detail: `Quiz cleared in ${title}`,
            tone: "success"
          });
        }
      },
      recordQuizAttempt: ({ courseId, lessonId, correct }) => {
        const timestamp = Date.now();

        set((state) => ({
          quizAttempts: [
            ...state.quizAttempts,
            {
              id: `${courseId}-${lessonId}-${timestamp}-${Math.random().toString(36).slice(2, 7)}`,
              courseId,
              lessonId,
              correct,
              timestamp
            }
          ].slice(-120)
        }));
      },
      completeLesson: async (courseId, lessonId, lessonCount, title, xp = XP_REWARDS.lesson) => {
        const timestamp = Date.now();
        let awardedXp = 0;
        let shouldLog = false;

        set((state) => {
          const current = state.courseProgress[courseId] || createEmptyCourseProgress();
          const alreadyCompleted = Boolean(current.completedLessons[lessonId]);
          shouldLog = !alreadyCompleted;
          awardedXp = alreadyCompleted ? 0 : xp;

          const next = {
            ...current,
            completedLessons: { ...current.completedLessons, [lessonId]: true },
            xp: current.xp + awardedXp
          };
          next.progress = computeCourseProgress(next, lessonCount);

          return {
            completedLessons: { ...state.completedLessons, [lessonId]: true },
            xp: state.xp + awardedXp,
            courseProgress: {
              ...state.courseProgress,
              [courseId]: next
            }
          };
        });

        if (shouldLog) {
          get().addActivity({
            title: "Completed lesson",
            subtitle: `Marked ${title} complete`,
            xp: awardedXp,
            type: "learning",
            timestamp
          });
          get().addToast({
            title: `+${awardedXp} XP`,
            detail: `Lesson completed: ${title}`,
            tone: "success"
          });
        }

        await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId, lessonId, completed: true })
        }).catch(() => null);
      }
    }),
    {
      name: "visualmind-learning-store",
      version: 3,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => {
        const state = persistedState && typeof persistedState === "object" ? persistedState : {};
        const activityList = Array.isArray(state.activities) ? state.activities.filter(Boolean) : [];
        const storedActiveDays = Array.isArray(state.activeDays) ? state.activeDays.filter(Boolean) : [];
        const inferredActiveDays =
          storedActiveDays.length
            ? storedActiveDays
            : activityList.length
              ? activityList.map((activity) => activity.timestamp)
              : buildSyntheticActiveDays(state.streak);
        const momentum = getMomentumSnapshot(
          {
            activeDays: inferredActiveDays,
            streak: state.streak,
            longestStreak: state.longestStreak
          }
        );

        return {
          ...state,
          completedLessons: state.completedLessons && typeof state.completedLessons === "object" ? state.completedLessons : {},
          xp: typeof state.xp === "number" ? state.xp : 0,
          streak: momentum.currentStreak,
          longestStreak: momentum.longestStreak,
          activeDays: momentum.activeDays,
          generatedCourses: Array.isArray(state.generatedCourses) ? state.generatedCourses.filter(Boolean) : [],
          activities: activityList,
          courseProgress: state.courseProgress && typeof state.courseProgress === "object" ? state.courseProgress : {},
          completedCourses: state.completedCourses && typeof state.completedCourses === "object" ? state.completedCourses : {},
          lastOpenedCourseId: typeof state.lastOpenedCourseId === "string" ? state.lastOpenedCourseId : "",
          lessonSessions: Array.isArray(state.lessonSessions) ? state.lessonSessions.filter(Boolean) : [],
          activeLessonSession: state.activeLessonSession && typeof state.activeLessonSession === "object" ? state.activeLessonSession : null,
          quizAttempts: Array.isArray(state.quizAttempts) ? state.quizAttempts.filter(Boolean) : [],
          toasts: Array.isArray(state.toasts) ? state.toasts.filter(Boolean) : []
        };
      }
    }
  )
);
