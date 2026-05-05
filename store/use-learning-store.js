"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

function createEmptyCourseProgress() {
  return {
    viewedLessons: {},
    completedLessons: {},
    completedQuizzes: {},
    xp: 0,
    progress: 0
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

function createToast(payload) {
  return {
    id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    tone: "info",
    ...payload
  };
}

export const useLearningStore = create(
  persist(
    (set, get) => ({
      completedLessons: {},
      xp: 0,
      streak: 0,
      generatedCourses: [],
      activities: [],
      courseProgress: {},
      lastOpenedCourseId: "",
      toasts: [],
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
        set((state) => ({
          xp: state.xp + xp,
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
          ].slice(0, 20)
        }));
      },
      addGeneratedCourse: (course) => {
        set((state) => ({
          generatedCourses: [
            { ...course, progress: 0 },
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
          awardedXp = alreadyCompleted ? 0 : 20;

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
      completeLesson: async (courseId, lessonId, lessonCount, title, xp = 30) => {
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
      storage: createJSONStorage(() => localStorage)
    }
  )
);
