"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { AnimatedButton } from "@/components/animation-kit";
import { useTheme } from "@/components/theme-provider";
import { getLearningSnapshot } from "@/lib/learning-insights";
import { useLearningStore } from "@/store/use-learning-store";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", detail: "Overview" },
  { href: "/ai-lab", label: "AI Lab", detail: "Transform" },
  { href: "/progress", label: "Progress", detail: "Metrics" },
  { href: "/activity", label: "Activity", detail: "Timeline" },
  { href: "/profile", label: "Profile", detail: "Settings" }
];

function isActiveRoute(pathname, href) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarLink({ href, label, detail, active }) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ x: 3 }}
        className={`rounded-[1.2rem] px-3 py-3 transition ${
          active
            ? "bg-white/[0.06] text-white"
            : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`h-2.5 w-2.5 rounded-full transition ${
                active ? "bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.35)]" : "bg-white/20"
              }`}
            />
            <span className={`text-[15px] font-black ${active ? "text-white" : "text-slate-300"}`}>{label}</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{detail}</span>
        </div>
      </motion.div>
    </Link>
  );
}

export function AppShell({ eyebrow, title, description, actions, children }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const snapshot = getLearningSnapshot(useLearningStore());

  return (
    <main className="min-h-screen bg-midnight text-white">
      <div className="fixed inset-0 bg-hero-grid bg-[length:42px_42px] opacity-[0.08]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(34,211,238,0.12),transparent_16%),radial-gradient(circle_at_78%_12%,rgba(139,92,246,0.11),transparent_14%),linear-gradient(180deg,rgba(5,8,18,0.92),rgba(5,8,18,1))]" />

      <div className="relative mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-8 xl:grid-cols-[248px_minmax(0,1fr)] xl:gap-10">
          <aside className="xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)] xl:pr-8">
            <div className="flex h-full flex-col">
              <div>
                <Link href="/dashboard" className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 via-sky-400 to-violet-500 text-sm font-black text-slate-950 shadow-[0_0_26px_rgba(34,211,238,0.16)]">
                    VM
                  </span>
                  <div>
                    <p className="text-lg font-black tracking-tight text-white">VisualMind</p>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Learning OS</p>
                  </div>
                </Link>
                <p className="mt-5 max-w-[18rem] text-sm leading-7 text-slate-400">
                  A calmer AI-native workspace for turning dense material into structured learning.
                </p>
              </div>

              <nav className="mt-8 space-y-1.5">
                {navigationItems.map((item) => (
                  <SidebarLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    detail={item.detail}
                    active={isActiveRoute(pathname, item.href)}
                  />
                ))}
              </nav>

              <div className="surface-muted mt-8 rounded-[1.5rem] p-4">
                <div className="flex items-start justify-between gap-4 py-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">XP earned</p>
                    <p className="mt-2 text-2xl font-black text-white">{snapshot.xp}</p>
                  </div>
                  <span className="h-10 w-px bg-white/[0.08]" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Streak</p>
                    <p className="mt-2 text-2xl font-black text-white">{snapshot.streak}d</p>
                  </div>
                </div>
                <div className="mt-3 border-t border-white/[0.08] pt-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Completed courses</p>
                  <p className="mt-2 text-xl font-black text-white">{snapshot.completedCourseCount}</p>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <AnimatedButton href="/ai-lab" className="w-full justify-center px-5 py-3">
                  Generate a course
                </AnimatedButton>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-full rounded-full bg-white/[0.04] px-5 py-3 text-sm font-black text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                >
                  Switch to {theme === "dark" ? "light" : "dark"} mode
                </button>
                <Link
                  href="/"
                  className="inline-flex w-full items-center justify-center px-5 py-2.5 text-sm font-black text-slate-500 transition hover:text-white"
                >
                  Back to landing page
                </Link>
              </div>
            </div>
          </aside>

          <section className="min-w-0 xl:border-l xl:border-white/[0.08] xl:pl-10">
            <div className="border-b border-white/[0.08] pb-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="flex flex-wrap gap-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    {pathname !== "/dashboard" ? (
                      <Link href="/dashboard" className="transition hover:text-white">
                        Back to dashboard
                      </Link>
                    ) : null}
                    <Link href="/" className="transition hover:text-white">
                      Back to landing page
                    </Link>
                  </div>
                  {eyebrow ? <p className="mt-5 text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300/90">{eyebrow}</p> : null}
                  <h1 className="mt-3 max-w-4xl text-[2.5rem] font-black tracking-tight text-white sm:text-[3.35rem]">
                    {title}
                  </h1>
                  {description ? <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">{description}</p> : null}
                </div>
                {actions ? <div className="shrink-0">{actions}</div> : null}
              </div>

              <div className="mt-6 flex gap-3 overflow-x-auto pb-1 xl:hidden">
                {navigationItems.map((item) => {
                  const active = isActiveRoute(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${
                        active
                          ? "bg-white text-slate-950"
                          : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="pt-8 sm:pt-10">{children}</div>
          </section>
        </div>
      </div>
    </main>
  );
}
