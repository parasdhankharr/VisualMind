"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useLearningStore } from "@/store/use-learning-store";
import { AnimatedButton } from "@/components/animation-kit";

export function ProfileDetails() {
  const store = useLearningStore();
  const [name, setName] = useState(store.name || "Learner");
  const [isSaving, setIsSaving] = useState(false);

  const availableBadges = [
    {
      id: "First Spark",
      title: "First Spark",
      description: "Ignited your visual learning journey.",
      icon: "⚡",
      color: "from-cyan-400 to-blue-500"
    },
    {
      id: "Streak Master",
      title: "Streak Master",
      description: "Held a active daily streak of focus.",
      icon: "🔥",
      color: "from-orange-400 to-red-500"
    },
    {
      id: "Visual Voyager",
      title: "Visual Voyager",
      description: "Completed 5+ visual lessons.",
      icon: "🪐",
      color: "from-purple-400 to-pink-500"
    },
    {
      id: "Elite Thinker",
      title: "Elite Thinker",
      description: "Surpassed 500+ XP points.",
      icon: "👑",
      color: "from-yellow-400 to-amber-500"
    }
  ];

  const userBadges = Array.isArray(store.badges) ? store.badges : ["First Spark"];

  // Streak master badge is earned if streak > 1
  const activeBadges = [...userBadges];
  if (store.streak > 1 && !activeBadges.includes("Streak Master")) {
    activeBadges.push("Streak Master");
  }
  // Elite thinker earned if XP > 500
  if (store.xp >= 500 && !activeBadges.includes("Elite Thinker")) {
    activeBadges.push("Elite Thinker");
  }

  const [isResetting, setIsResetting] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() })
      });

      if (!response.ok) throw new Error("Failed to update profile name");

      const data = await response.json();
      if (data.profile) {
        store.updateProfileName(data.profile.name);
        store.addToast({
          message: "Profile updated successfully!",
          type: "success"
        });
      }
    } catch (error) {
      console.error(error);
      store.addToast({
        message: "Failed to update profile.",
        type: "error"
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReset() {
    if (!window.confirm("Are you absolutely sure you want to reset all of your progress, XP, streaks, and generated courses? This action is permanent and cannot be undone.")) {
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch("/api/profile/reset", {
        method: "POST"
      });

      if (!response.ok) throw new Error("Failed to reset metrics");

      store.resetStore();
      setName("Learner");
      store.addToast({
        message: "All metrics and database items have been reset to zero!",
        type: "success"
      });
    } catch (error) {
      console.error(error);
      store.addToast({
        message: "Failed to reset metrics.",
        type: "error"
      });
    } finally {
      setIsResetting(false);
    }
  }

  const userInitial = (store.name || "L").charAt(0).toUpperCase();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto px-4 py-8">
      {/* Left Column: Account Details & Avatar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="lg:col-span-4 flex flex-col gap-6"
      >
        <div className="relative overflow-hidden rounded-2xl bg-slate-900/60 border border-white/10 p-6 backdrop-blur-md">
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-transparent pointer-events-none" />

          {/* Profile Header Avatar */}
          <div className="flex flex-col items-center text-center gap-4 py-6">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-400 to-violet-600 opacity-60 blur-md group-hover:opacity-80 transition duration-300" />
              <div className="relative w-24 h-24 rounded-full bg-slate-950 flex items-center justify-center border border-white/20 text-white text-4xl font-bold bg-gradient-to-tr from-cyan-900/40 to-slate-950">
                {userInitial}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">{store.name || "Learner"}</h2>
              <p className="text-sm text-cyan-400/80 font-medium">Rank: Apprentice Voyager</p>
            </div>
          </div>

          <hr className="border-white/10 my-4" />

          {/* Edit Form */}
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg bg-slate-950/60 border border-white/10 px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 transition duration-200"
                placeholder="Enter your name"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={store.email || "student@example.com"}
                className="w-full rounded-lg bg-slate-950/20 border border-white/5 px-4 py-2.5 text-slate-500 cursor-not-allowed select-none"
                disabled
              />
            </div>

            <AnimatedButton
              type="submit"
              disabled={isSaving || !name.trim() || name === store.name}
              className="w-full mt-2"
              variant="cyan"
            >
              {isSaving ? "Saving changes..." : "Save Changes"}
            </AnimatedButton>

            <button
              type="button"
              disabled={isResetting}
              onClick={handleReset}
              className="w-full mt-2 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none"
            >
              {isResetting ? "Resetting metrics..." : "Reset All Progress (0 XP)"}
            </button>
          </form>
        </div>
      </motion.div>

      {/* Right Column: Stats & Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="lg:col-span-8 flex flex-col gap-8"
      >
        {/* Core Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* XP Card */}
          <div className="relative overflow-hidden rounded-2xl bg-slate-900/60 border border-white/10 p-6 backdrop-blur-md">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Total Focus XP</p>
            <h3 className="text-4xl font-extrabold text-white tracking-tight flex items-baseline gap-2">
              {store.xp}{" "}
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">XP</span>
            </h3>
            {/* Level meter progress bar */}
            <div className="w-full bg-slate-950/60 rounded-full h-1.5 mt-4 overflow-hidden border border-white/5">
              <div
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (store.xp % 1000) / 10)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              {1000 - (store.xp % 1000)} XP to next Voyager Rank
            </p>
          </div>

          {/* Current Streak */}
          <div className="relative overflow-hidden rounded-2xl bg-slate-900/60 border border-white/10 p-6 backdrop-blur-md">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Focus Streak</p>
            <h3 className="text-4xl font-extrabold text-orange-400 tracking-tight flex items-baseline gap-2">
              {store.streak}{" "}
              <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Days</span>
            </h3>
            <p className="text-xs text-slate-400 mt-4 flex items-center gap-1.5">
              <span>🔥 Keep it up! Focus daily to build momentum.</span>
            </p>
          </div>

          {/* Longest Streak */}
          <div className="relative overflow-hidden rounded-2xl bg-slate-900/60 border border-white/10 p-6 backdrop-blur-md">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl pointer-events-none" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Longest Streak</p>
            <h3 className="text-4xl font-extrabold text-violet-400 tracking-tight flex items-baseline gap-2">
              {Math.max(store.streak, store.longestStreak || 1)}{" "}
              <span className="text-xs font-bold text-violet-500 uppercase tracking-widest">Days</span>
            </h3>
            <p className="text-xs text-slate-400 mt-4">👑 Your personal record daily focus mark.</p>
          </div>
        </div>

        {/* Badges Grid Section */}
        <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-6 backdrop-blur-md relative overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-violet-500/5 to-transparent pointer-events-none" />

          <h3 className="text-lg font-bold text-white tracking-tight mb-1">Achievements Badges</h3>
          <p className="text-sm text-slate-400 mb-6">Earn points, streaks, and complete courses to unlock rare badges.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableBadges.map((badge) => {
              const isEarned = activeBadges.includes(badge.id);

              return (
                <div
                  key={badge.id}
                  className={`relative flex items-center gap-4 rounded-xl border p-4 transition-all duration-300 ${
                    isEarned
                      ? "bg-slate-950/40 border-white/10 hover:border-cyan-400/30"
                      : "bg-slate-950/10 border-white/5 opacity-40 select-none"
                  }`}
                >
                  {/* Badge Icon */}
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl font-bold bg-gradient-to-tr ${
                      isEarned ? badge.color : "from-slate-800 to-slate-900"
                    }`}
                  >
                    {badge.icon}
                  </div>

                  {/* Badge Description */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">{badge.title}</h4>
                      {isEarned && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 tracking-wider">
                          Unlocked
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{badge.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
