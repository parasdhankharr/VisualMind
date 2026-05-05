"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AnimatedButton } from "@/components/animation-kit";
import { useTheme } from "@/components/theme-provider";

export function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-4 py-4 sm:px-8">
      <div className="glass mx-auto flex max-w-7xl items-center justify-between rounded-full px-4 py-3">
        <Link href="/" className="flex items-center gap-3 font-black tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-aquaGlow to-violetGlow text-sm text-white shadow-glow">
            VM
          </span>
          <span>VisualMind</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
          {[
            ["Solution", "/#solution"],
            ["Features", "/#features"],
            ["Pricing", "/#pricing"],
            ["Dashboard", "/dashboard"]
          ].map(([label, href]) => (
            <Link key={label} href={href} className="group relative transition-colors hover:text-white">
              {label}
              <motion.span
                className="absolute -bottom-1 left-0 h-px w-full origin-left bg-cyan-300"
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.25 }}
              />
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={toggleTheme}
            whileHover={{ scale: 1.06, rotate: theme === "dark" ? 2 : -2 }}
            whileTap={{ scale: 0.94 }}
            className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            aria-label="Toggle color theme"
          >
            {theme === "dark" ? "Light" : "Dark"}
          </motion.button>
          <AnimatedButton href="/auth/signup" className="px-4 py-2 text-sm">
            Start
          </AnimatedButton>
        </div>
      </div>
    </header>
  );
}
