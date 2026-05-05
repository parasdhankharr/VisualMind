"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AnimatedButton, FadeUp } from "@/components/animation-kit";

export function AuthForm({ mode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.message || "Something went wrong.");
      return;
    }

    router.push("/dashboard");
  }

  const isSignup = mode === "signup";

  return (
    <div className="min-h-screen bg-midnight px-5 py-28 text-white">
      <div className="absolute inset-0 bg-hero-grid bg-[length:42px_42px] opacity-40" />
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        data-cursor="card"
        className="glass glow-ring relative mx-auto grid max-w-md gap-5 rounded-[2rem] p-8"
      >
        <Link href="/" className="text-sm text-cyan-200">
          Back to home
        </Link>
        <div>
          <p className="text-sm font-bold uppercase text-cyan-300">VisualMind</p>
          <h1 className="mt-2 text-4xl font-black">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
        </div>
        {isSignup && (
          <FadeUp delay={0.05}>
          <label className="grid gap-2 text-sm font-bold text-slate-300">
            Name
            <input
              name="name"
              required
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300"
            />
          </label>
          </FadeUp>
        )}
        <FadeUp delay={0.08}>
        <label className="grid gap-2 text-sm font-bold text-slate-300">
          Email
          <input
            name="email"
            type="email"
            required
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300"
          />
        </label>
        </FadeUp>
        <FadeUp delay={0.11}>
        <label className="grid gap-2 text-sm font-bold text-slate-300">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300"
          />
        </label>
        </FadeUp>
        {error && <p className="rounded-2xl bg-rose-500/15 p-3 text-sm text-rose-200">{error}</p>}
        <AnimatedButton
          as="button"
          disabled={loading}
          className="w-full px-5 py-4 disabled:opacity-60"
        >
          {loading ? "Working..." : isSignup ? "Start learning" : "Log in"}
        </AnimatedButton>
        <p className="text-center text-sm text-slate-400">
          {isSignup ? "Already have an account?" : "New here?"}{" "}
          <Link className="text-cyan-200" href={isSignup ? "/auth/login" : "/auth/signup"}>
            {isSignup ? "Log in" : "Create one"}
          </Link>
        </p>
      </motion.form>
    </div>
  );
}
