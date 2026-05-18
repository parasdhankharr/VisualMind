"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { leaderboard } from "@/data/courses";
import { getRankMeta, rankRoadmap } from "@/data/ranks";
import { useLearningStore } from "@/store/use-learning-store";

const BRAND_GRADIENT = "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)";
const DAY_MS = 24 * 60 * 60 * 1000;
const LABEL_CLASS = "text-[10px] font-semibold uppercase tracking-[0.14em]";
const HEADING_CLASS = "font-extrabold tracking-[-0.03em]";
const surfaceClassName =
  "rounded-[28px] border border-white/[0.06] bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-[18px]";

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value || 0)));
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function startOfDay(timestamp = Date.now()) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function buildWeeklyXpMeta(activities) {
  const today = startOfDay();
  const currentWeekStart = today - DAY_MS * 6;
  const previousWeekStart = today - DAY_MS * 13;
  const previousWeekEnd = currentWeekStart - DAY_MS;

  return activities.reduce(
    (summary, activity) => {
      const day = startOfDay(activity.timestamp);
      const value = Number(activity.xp) || 0;

      if (day >= currentWeekStart && day <= today) {
        summary.current += value;
      } else if (day >= previousWeekStart && day <= previousWeekEnd) {
        summary.previous += value;
      }

      return summary;
    },
    { current: 0, previous: 0 }
  );
}

function GlowBar({ value, trackClassName = "" }) {
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-black/25 ${trackClassName}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="h-full rounded-full"
        style={{
          backgroundImage: BRAND_GRADIENT,
          filter: "drop-shadow(0 0 12px rgba(79, 172, 254, 0.42))"
        }}
      />
    </div>
  );
}

function RoadmapStat({ label, value, detail, strong = false }) {
  return (
    <div className="rounded-[18px] border border-white/[0.06] bg-[#101010] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <p className={`${LABEL_CLASS} text-zinc-500`}>{label}</p>
      <p className={`mt-3 text-xl text-white ${strong ? HEADING_CLASS : "font-semibold"}`}>{value}</p>
      {detail ? <p className="mt-2 text-sm leading-6 text-zinc-400">{detail}</p> : null}
    </div>
  );
}

function RankMilestone({ item, index }) {
  const isLeft = index % 2 === 0;
  const isElite = item.tone === "elite" || item.tone === "legendary";
  const isLegendary = item.tone === "legendary";
  const stateClassName = item.isCurrent
    ? isLegendary
      ? "border-cyan-300/25 bg-cyan-500/[0.09] shadow-[0_0_34px_rgba(0,242,254,0.1)]"
      : isElite
        ? "border-cyan-400/22 bg-cyan-500/[0.085] shadow-[0_0_30px_rgba(0,242,254,0.09)]"
        : "border-cyan-400/20 bg-cyan-500/[0.08] shadow-[0_0_26px_rgba(0,242,254,0.08)]"
    : item.isUnlocked
      ? isElite
        ? "border-white/[0.09] bg-white/[0.06] shadow-[0_0_22px_rgba(255,255,255,0.02)]"
        : "border-white/[0.08] bg-white/[0.055]"
      : isLegendary
        ? "border-white/[0.07] bg-white/[0.035] opacity-72"
        : isElite
          ? "border-white/[0.06] bg-white/[0.032] opacity-68"
          : "border-white/[0.05] bg-white/[0.03] opacity-60";
  const badgeClassName = item.isCurrent
    ? isLegendary
      ? "border-cyan-300/25 bg-cyan-500/[0.12] text-cyan-50"
      : "border-cyan-400/20 bg-cyan-500/[0.1] text-cyan-100"
    : item.isUnlocked
      ? isElite
        ? "border-white/[0.09] bg-white/[0.075] text-white"
        : "border-white/[0.08] bg-white/[0.06] text-zinc-200"
      : "border-white/[0.06] bg-black/20 text-zinc-500";
  const dotClassName = item.isCurrent
    ? isLegendary
      ? "border-cyan-200/60 bg-cyan-200 shadow-[0_0_28px_rgba(0,242,254,0.45)]"
      : "border-cyan-300/50 bg-cyan-300 shadow-[0_0_24px_rgba(0,242,254,0.4)]"
    : item.isUnlocked
      ? isElite
        ? "border-cyan-400/24 bg-cyan-400/78 shadow-[0_0_18px_rgba(0,242,254,0.26)]"
        : "border-cyan-400/20 bg-cyan-400/70 shadow-[0_0_16px_rgba(0,242,254,0.22)]"
      : "border-white/[0.08] bg-[#1b1b1b]";
  const statusLabel = item.isCurrent ? "Current" : item.isUnlocked ? "Unlocked" : "Locked";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55, delay: index * 0.03, ease: [0.22, 1, 0.36, 1] }}
      className={`relative ${isLegendary ? "pt-10 md:pt-14" : isElite ? "pt-4 md:pt-8" : ""}`}
    >
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_96px_minmax(0,1fr)] md:items-center">
        <div className={`${isLeft ? "md:col-start-1" : "md:col-start-3"} pl-14 md:pl-0 ${isLeft ? "md:pr-8" : "md:pl-8"}`}>
          <motion.article
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={`relative overflow-hidden rounded-[24px] border px-6 py-6 backdrop-blur-[16px] transition-[border-color,background-color,box-shadow] duration-200 ${stateClassName}`}
          >
            {item.isCurrent ? (
              <motion.div
                animate={{
                  opacity: [0.55, 0.9, 0.55]
                }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                className={`pointer-events-none absolute inset-0 ${isLegendary
                  ? "bg-[radial-gradient(circle_at_top_right,rgba(0,242,254,0.18),transparent_46%)]"
                  : "bg-[radial-gradient(circle_at_top_right,rgba(0,242,254,0.14),transparent_44%)]"
                  }`}
              />
            ) : null}

            <div className="relative">
              <div className="flex items-center justify-between gap-4">
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${badgeClassName}`}>
                  {statusLabel}
                </span>
                <span className="text-xs font-medium text-zinc-500">{formatNumber(item.minXp)} XP required</span>
              </div>

              <h3 className={`mt-5 text-3xl text-white ${HEADING_CLASS}`}>{item.title}</h3>
              <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-300">"{item.description}"</p>
              {isElite ? (
                <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                  {isLegendary ? "Final mastery threshold" : "Elite mastery threshold"}
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
                    "0 0 0 rgba(0,242,254,0.2)",
                    "0 0 24px rgba(0,242,254,0.45)",
                    "0 0 0 rgba(0,242,254,0.2)"
                  ]
                }
                : {}
            }
            transition={{ duration: 2.4, repeat: item.isCurrent ? Infinity : 0, ease: "easeInOut" }}
            className={`relative z-10 h-6 w-6 rounded-full border ${dotClassName}`}
          >
            <div className="absolute inset-[5px] rounded-full bg-white/90" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export function RanksRoadmap() {
  const { xp, streak, activities } = useLearningStore();
  const safeActivities = Array.isArray(activities) ? activities.filter(Boolean) : [];

  const weeklyXpMeta = useMemo(() => buildWeeklyXpMeta(safeActivities), [safeActivities]);
  const currentRank = useMemo(() => getRankMeta(xp), [xp]);

  const leaderboardEntries = useMemo(() => {
    const currentMovement =
      weeklyXpMeta.current > weeklyXpMeta.previous ? 1 : weeklyXpMeta.current < weeklyXpMeta.previous ? -1 : 0;

    return [
      {
        name: "You",
        xp,
        streak,
        weeklyXp: weeklyXpMeta.current,
        movement: currentMovement,
        isCurrentUser: true
      },
      ...leaderboard
    ]
      .map((item) => {
        const rank = getRankMeta(item.xp);
        return {
          ...item,
          rankTitle: rank.title,
          rankIndex: rank.index
        };
      })
      .sort((left, right) => {
        if (right.rankIndex !== left.rankIndex) return right.rankIndex - left.rankIndex;
        if (right.xp !== left.xp) return right.xp - left.xp;
        return (right.weeklyXp || 0) - (left.weeklyXp || 0);
      })
      .map((item, index) => ({
        ...item,
        position: index + 1
      }));
  }, [streak, weeklyXpMeta.current, weeklyXpMeta.previous, xp]);

  const currentUser = useMemo(() => {
    return leaderboardEntries.find((item) => item.isCurrentUser) || { position: 1 };
  }, [leaderboardEntries]);

  const roadmapItems = useMemo(() => {
    return rankRoadmap.map((rank) => ({
      ...rank,
      isUnlocked: xp >= rank.minXp,
      isCurrent: rank.title === currentRank.title
    }));
  }, [currentRank.title, xp]);

  const overallProgress = useMemo(() => {
    if (rankRoadmap.length <= 1) return 100;
    return clampPercent((((currentRank.index - 1) + currentRank.progress / 100) / (rankRoadmap.length - 1)) * 100);
  }, [currentRank.index, currentRank.progress]);

  const progressCopy = currentRank.nextRank
    ? `${formatNumber(currentRank.xpToNext)} XP to ${currentRank.nextRank.title}`
    : "Overmind tier secured";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050505] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(79,172,254,0.11),transparent_28%),radial-gradient(circle_at_88%_12%,rgba(0,242,254,0.09),transparent_22%),linear-gradient(180deg,rgba(5,5,5,0.86),rgba(5,5,5,1))]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_18%)]" />

      <div className="relative mx-auto max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <motion.header initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            <Link href="/dashboard" className="transition hover:text-white">
              Back to dashboard
            </Link>
            <span className="h-1 w-1 rounded-full bg-zinc-700" />
            <span>Ranks Roadmap</span>
          </div>

          <div className={`mt-8 overflow-hidden p-6 sm:p-8 lg:p-10 ${surfaceClassName}`}>
            <div className="grid gap-10 xl:grid-cols-[0.96fr_1.04fr] xl:items-end">
              <div>
                <p className={`${LABEL_CLASS} text-zinc-500`}>Learning Evolution</p>
                <h1 className={`mt-3 max-w-3xl text-4xl leading-[1.05] text-white sm:text-[4.2rem] ${HEADING_CLASS}`}>
                  The long arc of focused mastery.
                </h1>
                <p className="mt-5 max-w-2xl text-sm leading-8 text-zinc-300 sm:text-base">
                  A calmer view of rank progression, designed to make learning momentum feel directional, intentional, and enduring.
                </p>
              </div>

              <div className="rounded-[26px] border border-white/[0.06] bg-[#0f0f0f] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:p-7">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className={`${LABEL_CLASS} text-zinc-500`}>Current Rank</p>
                    <h2 className={`mt-3 text-4xl text-white sm:text-[3.2rem] ${HEADING_CLASS}`}>{currentRank.title}</h2>
                    <p className="mt-4 text-sm leading-7 text-zinc-300">"{currentRank.description}"</p>
                  </div>
                  <div className="rounded-[18px] border border-cyan-400/15 bg-cyan-500/[0.07] px-4 py-3 text-right shadow-[0_0_18px_rgba(0,242,254,0.08)]">
                    <p className={`${LABEL_CLASS} text-cyan-100/70`}>Global Position</p>
                    <p className="mt-2 text-lg font-semibold text-white">Top #{currentUser.position}</p>
                  </div>
                </div>

                <p className={`mt-8 text-5xl text-white sm:text-[4.4rem] ${HEADING_CLASS}`}>{formatNumber(xp)} XP</p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <RoadmapStat
                    label="Next Rank"
                    value={progressCopy}
                    detail={
                      currentRank.nextRank
                        ? `${currentRank.title} to ${currentRank.nextRank.title}`
                        : "Highest cognitive tier reached"
                    }
                    strong
                  />
                  <RoadmapStat
                    label="Progress"
                    value={`${currentRank.progress}%`}
                    detail={
                      currentRank.nextRank
                        ? `${formatNumber(currentRank.minXp)} to ${formatNumber(currentRank.nextRank.minXp)} XP band`
                        : `${formatNumber(currentRank.minXp)} XP mastery threshold`
                    }
                  />
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between gap-4 text-xs font-medium text-zinc-500">
                    <span>{currentRank.title}</span>
                    <span>{currentRank.nextRank ? currentRank.nextRank.title : "Overmind"}</span>
                  </div>
                  <div className="mt-3">
                    <GlowBar value={currentRank.progress} trackClassName="bg-black/35" />
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
              <p className={`${LABEL_CLASS} text-zinc-500`}>Progression Path</p>
              <h2 className={`mt-3 text-3xl text-white sm:text-[3rem] ${HEADING_CLASS}`}>Ten tiers from curiosity to synthesis.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300">
                Each milestone reflects a deeper layer of learning maturity, with the final tiers reserved for sustained mastery over time.
              </p>
            </div>
            <div className="rounded-[18px] border border-white/[0.06] bg-white/[0.04] px-5 py-4 backdrop-blur-[16px]">
              <p className={`${LABEL_CLASS} text-zinc-500`}>Roadmap Completion</p>
              <p className={`mt-2 text-2xl text-white ${HEADING_CLASS}`}>{overallProgress}%</p>
            </div>
          </div>

          <div className="relative mt-12">
            <div className="absolute bottom-0 left-[23px] top-0 w-px bg-white/[0.07] md:left-1/2 md:-translate-x-px" />
            <motion.div
              initial={{ height: 0 }}
              whileInView={{ height: `${overallProgress}%` }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-[23px] top-0 w-px bg-gradient-to-b from-cyan-300 via-cyan-400/85 to-cyan-400/0 md:left-1/2 md:-translate-x-px"
            />

            <div className="space-y-8 md:space-y-10">
              {roadmapItems.map((item, index) => (
                <RankMilestone key={item.title} item={item} index={index} />
              ))}
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
