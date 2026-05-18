"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { formatStreakLabel, getMomentumSnapshot, streakMilestones } from "@/data/streaks";
import { useLearningStore } from "@/store/use-learning-store";

const LABEL_CLASS = "text-[10px] font-semibold uppercase tracking-[0.14em]";
const HEADING_CLASS = "font-extrabold tracking-[-0.03em]";
const surfaceClassName =
  "rounded-[28px] border border-white/[0.06] bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-[18px]";
const ambientOrbs = [
  {
    className: "left-[-6%] top-[4%] h-56 w-56 bg-cyan-400/[0.08]",
    x: [0, 22, 0],
    y: [0, -16, 0],
    duration: 18
  },
  {
    className: "right-[4%] top-[18%] h-64 w-64 bg-indigo-500/[0.09]",
    x: [0, -26, 0],
    y: [0, 18, 0],
    duration: 22
  },
  {
    className: "left-[28%] bottom-[8%] h-44 w-44 bg-teal-400/[0.07]",
    x: [0, 18, 0],
    y: [0, 20, 0],
    duration: 16
  },
  {
    className: "right-[16%] bottom-[2%] h-52 w-52 bg-violet-500/[0.08]",
    x: [0, 16, 0],
    y: [0, -18, 0],
    duration: 20
  }
];
const particles = [
  { left: "8%", top: "18%", size: 4, delay: 0 },
  { left: "18%", top: "62%", size: 6, delay: 0.8 },
  { left: "38%", top: "26%", size: 5, delay: 0.4 },
  { left: "56%", top: "74%", size: 4, delay: 1.1 },
  { left: "72%", top: "34%", size: 5, delay: 0.2 },
  { left: "84%", top: "58%", size: 6, delay: 0.9 }
];

function GlowBar({ value, trackClassName = "" }) {
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-black/25 ${trackClassName}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400"
        style={{
          filter: "drop-shadow(0 0 12px rgba(96, 165, 250, 0.32))"
        }}
      />
    </div>
  );
}

function MomentumStatCard({ label, value, detail, strong = false, valueClassName = "" }) {
  return (
    <div className="rounded-[18px] border border-white/[0.06] bg-[#101019] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <p className={`${LABEL_CLASS} text-zinc-500`}>{label}</p>
      <p className={`mt-3 text-xl text-white ${strong ? HEADING_CLASS : "font-semibold"} ${valueClassName}`}>{value}</p>
      {detail ? <p className="mt-2 text-sm leading-6 text-zinc-400">{detail}</p> : null}
    </div>
  );
}

function getToneVisuals(tone) {
  const map = {
    foundation: {
      currentShadow: "0 0 28px rgba(34, 211, 238, 0.08)",
      unlockedShadow: "0 0 18px rgba(20, 184, 166, 0.05)",
      overlay: "bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.12),transparent_46%)]"
    },
    growth: {
      currentShadow: "0 0 30px rgba(96, 165, 250, 0.1)",
      unlockedShadow: "0 0 18px rgba(96, 165, 250, 0.05)",
      overlay: "bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.13),transparent_46%)]"
    },
    mastery: {
      currentShadow: "0 0 32px rgba(99, 102, 241, 0.1)",
      unlockedShadow: "0 0 18px rgba(99, 102, 241, 0.05)",
      overlay: "bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_48%)]"
    },
    elite: {
      currentShadow: "0 0 34px rgba(129, 140, 248, 0.11)",
      unlockedShadow: "0 0 20px rgba(129, 140, 248, 0.06)",
      overlay: "bg-[radial-gradient(circle_at_top_right,rgba(129,140,248,0.16),transparent_50%)]"
    },
    legendary: {
      currentShadow: "0 0 38px rgba(167, 139, 250, 0.13)",
      unlockedShadow: "0 0 22px rgba(167, 139, 250, 0.07)",
      overlay: "bg-[radial-gradient(circle_at_top_right,rgba(167,139,250,0.18),transparent_52%)]"
    }
  };

  return map[tone] || map.foundation;
}

function MomentumMilestone({ item, index }) {
  const isLeft = index % 2 === 0;
  const isElite = item.tone === "elite" || item.tone === "legendary";
  const isLegendary = item.tone === "legendary";
  const visuals = getToneVisuals(item.tone);
  const stateClassName = item.isCurrent
    ? "border-cyan-300/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.04))]"
    : item.isUnlocked
      ? "border-white/[0.08] bg-white/[0.05]"
      : isLegendary
        ? "border-white/[0.06] bg-white/[0.028] opacity-72"
        : "border-white/[0.05] bg-white/[0.03] opacity-62";
  const badgeClassName = item.isCurrent
    ? "border-cyan-300/25 bg-cyan-400/[0.12] text-cyan-50"
    : item.isUnlocked
      ? "border-white/[0.09] bg-white/[0.07] text-white"
      : "border-white/[0.06] bg-black/20 text-zinc-500";
  const dotClassName = item.isCurrent
    ? "border-cyan-200/60 bg-cyan-200"
    : item.isUnlocked
      ? "border-sky-300/35 bg-sky-300/85"
      : "border-white/[0.08] bg-[#191925]";
  const statusLabel = item.isCurrent ? "Current" : item.isUnlocked ? "Unlocked" : "Locked";
  const daysLabel = `${item.minDays.toLocaleString("en-US")} ${item.minDays === 1 ? "Day" : "Days"} Required`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.58, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className={`relative ${isLegendary ? "pt-10 md:pt-14" : isElite ? "pt-4 md:pt-8" : ""}`}
    >
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_96px_minmax(0,1fr)] md:items-center">
        <div className={`${isLeft ? "md:col-start-1" : "md:col-start-3"} pl-14 md:pl-0 ${isLeft ? "md:pr-8" : "md:pl-8"}`}>
          <motion.article
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={`relative overflow-hidden rounded-[24px] border px-6 py-6 backdrop-blur-[16px] transition-[border-color,background-color,box-shadow] duration-200 ${stateClassName}`}
            style={{
              boxShadow: item.isCurrent ? visuals.currentShadow : item.isUnlocked ? visuals.unlockedShadow : "none"
            }}
          >
            <motion.div
              animate={{ opacity: item.isCurrent ? [0.45, 0.85, 0.45] : item.isUnlocked ? 0.4 : 0.2 }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              className={`pointer-events-none absolute inset-0 ${visuals.overlay}`}
            />

            <div className="relative">
              <div className="flex items-center justify-between gap-4">
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${badgeClassName}`}>
                  {statusLabel}
                </span>
                <span className="text-xs font-medium text-zinc-500">{daysLabel}</span>
              </div>

              <h3 className={`mt-5 text-3xl text-white ${HEADING_CLASS}`}>{item.title}</h3>
              <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-300">"{item.description}"</p>
              {isElite ? (
                <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                  {isLegendary ? "Final momentum threshold" : "Long-form consistency threshold"}
                </p>
              ) : null}
            </div>
          </motion.article>
        </div>

        <div className="pointer-events-none absolute left-[23px] top-7 md:static md:col-start-2 md:flex md:justify-center">
          <motion.div
            animate={
              item.isCurrent
                ? {
                  scale: [1, 1.08, 1],
                  boxShadow: [
                    "0 0 0 rgba(96,165,250,0.16)",
                    "0 0 26px rgba(129,140,248,0.34)",
                    "0 0 0 rgba(96,165,250,0.16)"
                  ]
                }
                : {}
            }
            transition={{ duration: 2.6, repeat: item.isCurrent ? Infinity : 0, ease: "easeInOut" }}
            className={`relative z-10 h-6 w-6 rounded-full border ${dotClassName}`}
          >
            <div className="absolute inset-[5px] rounded-full bg-white/92" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export function MomentumPath() {
  const { streak, longestStreak, activeDays } = useLearningStore();
  const safeActiveDays = Array.isArray(activeDays) ? activeDays.filter(Boolean) : [];

  const snapshot = useMemo(() => {
    return getMomentumSnapshot({
      activeDays: safeActiveDays,
      streak,
      longestStreak
    });
  }, [longestStreak, safeActiveDays, streak]);

  const roadmapItems = useMemo(() => {
    return streakMilestones.map((milestone) => ({
      ...milestone,
      isUnlocked: snapshot.currentStreak >= milestone.minDays,
      isCurrent: snapshot.currentMilestone?.title === milestone.title
    }));
  }, [snapshot.currentMilestone?.title, snapshot.currentStreak]);

  const nextMilestoneCopy = snapshot.nextMilestone
    ? `${snapshot.daysToNext} ${snapshot.daysToNext === 1 ? "day" : "days"} to ${snapshot.nextMilestone.title}`
    : "Eternal threshold sustained";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#05050b] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_18%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(45,212,191,0.1),transparent_26%),radial-gradient(circle_at_72%_10%,rgba(99,102,241,0.11),transparent_24%),radial-gradient(circle_at_88%_78%,rgba(167,139,250,0.09),transparent_28%),linear-gradient(180deg,rgba(5,5,11,0.88),rgba(5,5,11,1))]" />

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {ambientOrbs.map((orb) => (
          <motion.div
            key={orb.className}
            animate={{ x: orb.x, y: orb.y }}
            transition={{ duration: orb.duration, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute rounded-full blur-3xl ${orb.className}`}
          />
        ))}
        {particles.map((particle) => (
          <motion.div
            key={`${particle.left}-${particle.top}`}
            initial={{ opacity: 0.2, y: 0 }}
            animate={{ opacity: [0.14, 0.38, 0.14], y: [0, -14, 0] }}
            transition={{ duration: 5 + particle.delay * 2, repeat: Infinity, delay: particle.delay, ease: "easeInOut" }}
            className="absolute rounded-full bg-cyan-100/30 blur-[1px]"
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <motion.header initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            <Link href="/dashboard" className="transition hover:text-white">
              Back to dashboard
            </Link>
            <span className="h-1 w-1 rounded-full bg-zinc-700" />
            <span>Momentum Path</span>
          </div>

          <div className={`relative mt-8 overflow-hidden p-6 sm:p-8 lg:p-10 ${surfaceClassName}`}>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(129,140,248,0.09),transparent_32%)]" />

            <div className="relative grid gap-10 xl:grid-cols-[0.96fr_1.04fr] xl:items-end">
              <div>
                <p className={`${LABEL_CLASS} text-zinc-500`}>Momentum Progression</p>
                <h1 className={`mt-3 max-w-3xl text-4xl leading-[1.05] text-white sm:text-[4.2rem] ${HEADING_CLASS}`}>
                  Consistency becomes identity.
                </h1>
                <p className="mt-5 max-w-2xl text-sm leading-8 text-zinc-300 sm:text-base">
                  A cinematic view of daily learning rhythm, where discipline deepens quietly and momentum becomes part of who you are.
                </p>
              </div>

              <div className="rounded-[26px] border border-white/[0.06] bg-[#0f0f18] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:p-7">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className={`${LABEL_CLASS} text-zinc-500`}>Current Path</p>
                    <h2 className={`mt-3 text-4xl text-white sm:text-[3.1rem] ${HEADING_CLASS}`}>{snapshot.currentTitle}</h2>
                    <p className={`mt-4 text-3xl text-white sm:text-[2.2rem] ${HEADING_CLASS}`}>{formatStreakLabel(snapshot.currentStreak)}</p>
                  </div>
                  <div className="rounded-[18px] border border-cyan-300/15 bg-cyan-400/[0.07] px-4 py-3 text-right shadow-[0_0_18px_rgba(96,165,250,0.08)]">
                    <p className={`${LABEL_CLASS} text-cyan-100/70`}>Momentum Status</p>
                    <p className="mt-2 text-lg font-semibold text-white">{snapshot.statusLabel}</p>
                  </div>
                </div>

                <p className="mt-6 text-sm leading-7 text-zinc-300">"{snapshot.currentDescription}"</p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <MomentumStatCard
                    label="Longest Streak"
                    value={formatStreakLabel(snapshot.longestStreak)}
                    detail="Your strongest sustained rhythm so far."
                    strong
                  />
                  <MomentumStatCard
                    label="Next Threshold"
                    value={nextMilestoneCopy}
                    detail={snapshot.nextMilestone ? `Toward ${snapshot.nextMilestone.title}` : "Final path secured"}
                  />
                  <MomentumStatCard
                    label="Recovery Insight"
                    value={snapshot.recoveryInsight}
                    detail={snapshot.statusDetail}
                    valueClassName="text-base leading-7"
                  />
                  <MomentumStatCard
                    label="Path Illumination"
                    value={`${snapshot.overallProgress}%`}
                    detail="Measured against the Eternal horizon."
                  />
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between gap-4 text-xs font-medium text-zinc-500">
                    <span>{snapshot.currentTitle}</span>
                    <span>{snapshot.nextMilestone ? snapshot.nextMilestone.title : "Eternal"}</span>
                  </div>
                  <div className="mt-3">
                    <GlowBar value={snapshot.progress} trackClassName="bg-black/35" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className={`${LABEL_CLASS} text-zinc-500`}>Momentum Roadmap</p>
              <h2 className={`mt-3 text-3xl text-white sm:text-[3rem] ${HEADING_CLASS}`}>Nine thresholds of sustained focus.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300">
                Each milestone reflects a deeper form of consistency, from the first spark of return to the rare stillness of a year-long path.
              </p>
            </div>
            <div className="rounded-[18px] border border-white/[0.06] bg-white/[0.04] px-5 py-4 backdrop-blur-[16px]">
              <p className={`${LABEL_CLASS} text-zinc-500`}>Path Completion</p>
              <p className={`mt-2 text-2xl text-white ${HEADING_CLASS}`}>{snapshot.overallProgress}%</p>
            </div>
          </div>

          <div className="relative mt-12">
            <div className="absolute bottom-0 left-[23px] top-0 w-px bg-white/[0.07] md:left-1/2 md:-translate-x-px" />
            <motion.div
              initial={{ height: 0 }}
              whileInView={{ height: `${snapshot.overallProgress}%` }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-[23px] top-0 w-px bg-gradient-to-b from-cyan-300 via-sky-400 via-45% to-violet-400/0 md:left-1/2 md:-translate-x-px"
            />

            <div className="space-y-8 md:space-y-10">
              {roadmapItems.map((item, index) => (
                <MomentumMilestone key={item.title} item={item} index={index} />
              ))}
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
