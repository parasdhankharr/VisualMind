"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CountUpValue } from "@/components/dashboard-widgets";
import { AnimatedButton, HoverCard } from "@/components/animation-kit";

const activityToneStyles = {
  learning: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
  quiz: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
  transform: "border-violet-300/20 bg-violet-400/10 text-violet-100",
  profile: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  default: "border-white/10 bg-white/[0.08] text-slate-200"
};

export function SectionCard({ children, className = "" }) {
  return (
    <div
      className={`surface-panel rounded-[2rem] p-6 sm:p-7 ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionHeader({ eyebrow, title, detail, action }) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {eyebrow ? <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300/90">{eyebrow}</p> : null}
        <h2 className="mt-3 text-[1.9rem] font-black leading-tight text-white sm:text-[2.35rem]">{title}</h2>
        {detail ? <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">{detail}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  prefix = "",
  suffix = "",
  accent = "from-cyan-300 via-blue-500 to-violet-500",
  href,
  actionLabel
}) {
  return (
    <HoverCard className="surface-muted rounded-[1.5rem] p-5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
        <div className={`h-1.5 w-12 rounded-full bg-gradient-to-r ${accent}`} />
      </div>
      <p className="mt-4 text-[2rem] font-black tracking-tight text-white">
        <CountUpValue value={value} prefix={prefix} suffix={suffix} />
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-400">{detail}</p>
      {href && actionLabel ? (
        <Link href={href} className="mt-4 inline-flex text-sm font-black text-cyan-200 transition hover:text-white">
          {actionLabel}
        </Link>
      ) : null}
    </HoverCard>
  );
}

export function EmptyState({ eyebrow, title, detail, href, ctaLabel }) {
  return (
    <div className="surface-muted rounded-[1.8rem] border-dashed p-6 sm:p-7">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300">{eyebrow}</p>
      <h3 className="mt-3 text-2xl font-black text-white">{title}</h3>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">{detail}</p>
      {href && ctaLabel ? (
        <div className="mt-5">
          <AnimatedButton href={href} className="px-5 py-3">
            {ctaLabel}
          </AnimatedButton>
        </div>
      ) : null}
    </div>
  );
}

export function CourseRow({ course, primaryLabel = "Open course", secondaryHref = "/progress", secondaryLabel = "View progress" }) {
  return (
    <div className="surface-muted rounded-[1.75rem] p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-100">
              {course.category || "Custom"}
            </span>
            <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-300">
              {course.duration || "Quick path"}
            </span>
          </div>
          <h3 className="mt-4 text-[1.6rem] font-black tracking-tight text-white">{course.title}</h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">{course.summary || course.description}</p>
        </div>

        <div className="surface-muted rounded-[1.3rem] px-4 py-4 lg:min-w-[14rem]">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Progress</p>
          <p className="mt-2 text-2xl font-black text-white">{course.progress}%</p>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
            {course.completed ? "Completed" : `${course.completedLessons}/${course.totalLessons} lessons done`}
          </p>
        </div>
      </div>

      <div className="mt-5 h-2 rounded-full bg-white/8">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${course.progress}%` }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className={`h-2 rounded-full bg-gradient-to-r ${course.color || "from-cyan-300 via-blue-500 to-violet-500"}`}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <AnimatedButton href={`/courses/${course.id}`} className="px-5 py-3">
          {primaryLabel}
        </AnimatedButton>
        <AnimatedButton href={secondaryHref} variant="secondary" className="px-5 py-3">
          {secondaryLabel}
        </AnimatedButton>
      </div>
    </div>
  );
}

export function ActivityItem({ activity, index = 0 }) {
  const tone = activityToneStyles[activity.type] || activityToneStyles.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.04 }}
    >
      <Link
        href={activity.href}
        className="group block rounded-[1.5rem] border border-transparent bg-white/[0.025] px-4 py-4 transition hover:border-white/8 hover:bg-white/[0.05]"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-base font-black text-white transition group-hover:text-cyan-100">{activity.title}</p>
          <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${tone}`}>
            {activity.xp > 0 ? `+${activity.xp} XP` : activity.type}
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-400">{activity.subtitle || "Learning activity recorded."}</p>
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{activity.relativeLabel}</p>
      </Link>
    </motion.div>
  );
}

export function SegmentedTabs({ options, value, onChange }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-full bg-white/[0.04] p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-full px-4 py-2 text-sm font-bold transition ${
            value === option.value ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/8 hover:text-white"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function SparkBars({ data, valueSuffix = "", emptyLabel = "No activity yet" }) {
  const maxValue = Math.max(...data.map((item) => Number(item.value) || 0), 0);

  return (
    <div className="mt-6">
      {maxValue > 0 ? (
        <div className="grid gap-4">
          <div className="flex h-44 items-end gap-3">
            {data.map((item, index) => (
              <div key={item.label} className="flex flex-1 flex-col items-center gap-3">
                <div className="flex h-full w-full items-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${((Number(item.value) || 0) / maxValue) * 100}%` }}
                    transition={{ duration: 0.55, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full rounded-t-[1rem] bg-gradient-to-t from-cyan-400 via-blue-500 to-violet-500"
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-white">
                    {item.value}
                    {valueSuffix}
                  </p>
                  <p className="text-xs text-slate-400">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="surface-muted rounded-[1.5rem] border-dashed p-5 text-sm leading-7 text-slate-400">
          {emptyLabel}
        </div>
      )}
    </div>
  );
}

export function ToastStack({ toasts, onDismiss }) {
  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[95] flex w-full max-w-sm flex-col gap-3 sm:right-6">
      <AnimatePresence>
        {toasts.map((toast) => {
          const toneClass =
            toast.tone === "success"
              ? "border-emerald-300/25 bg-emerald-400/12 text-emerald-50"
              : toast.tone === "warning"
              ? "border-amber-300/25 bg-amber-300/12 text-amber-50"
              : "border-white/10 bg-[#131925]/92 text-white";

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              className={`pointer-events-auto rounded-[1.35rem] border px-4 py-4 shadow-[0_22px_60px_rgba(0,0,0,0.22)] backdrop-blur ${toneClass}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black">{toast.title}</p>
                  {toast.detail ? <p className="mt-1 text-sm opacity-90">{toast.detail}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => onDismiss(toast.id)}
                  className="rounded-full border border-white/10 px-2 py-1 text-xs font-bold transition hover:bg-white/10"
                >
                  Close
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
