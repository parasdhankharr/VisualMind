"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { getLearningSnapshot } from "@/lib/learning-insights";
import { useLearningStore } from "@/store/use-learning-store";
import { DatabaseSync } from "@/components/db-sync";
import { getRankMeta } from "@/data/ranks";

const HEADING_CLASS = "font-black tracking-tight";
const LABEL_CLASS = "text-[11px] font-bold uppercase tracking-[0.18em]";
const GLASS_CARD_CLASS = "border border-white/[0.05] bg-white/[0.05] backdrop-blur-[16px]";
const PRIMARY_BUTTON_CLASS = "inline-flex h-11 items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(79,172,254,0.3)] transition hover:opacity-90";
const BRAND_GRADIENT = "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)";
const SIDEBAR_EXPANDED_WIDTH = 248;
const SIDEBAR_COLLAPSED_WIDTH = 96;

function clampPercent(value) {
  return Math.min(100, Math.max(0, value));
}

function ShellIcon({ children, className = "h-5 w-5" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function HomeIcon(props) {
  return (
    <ShellIcon {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9 21v-6h6v6" />
    </ShellIcon>
  );
}

function LibraryIcon(props) {
  return (
    <ShellIcon {...props}>
      <path d="M5 4h13a2 2 0 0 1 2 2v13H7a2 2 0 0 0-2 2V4Z" />
      <path d="M7 19V6" />
      <path d="M10 8h6" />
      <path d="M10 12h6" />
    </ShellIcon>
  );
}

function ChartIcon(props) {
  return (
    <ShellIcon {...props}>
      <path d="M4 19h16" />
      <path d="M7 16V9" />
      <path d="M12 16V5" />
      <path d="M17 16v-4" />
    </ShellIcon>
  );
}

function PulseIcon(props) {
  return (
    <ShellIcon {...props}>
      <path d="M3 12h4l2.5-5 4 10 2.5-5H21" />
    </ShellIcon>
  );
}

function UsersIcon(props) {
  return (
    <ShellIcon {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="3" />
      <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16.5 4.13a3 3 0 0 1 0 5.74" />
    </ShellIcon>
  );
}

function UserIcon(props) {
  return (
    <ShellIcon {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </ShellIcon>
  );
}

function BoltIcon(props) {
  return (
    <ShellIcon {...props}>
      <path d="M13 2 5 14h6l-1 8 8-12h-6l1-8Z" />
    </ShellIcon>
  );
}

function SparkIcon(props) {
  return (
    <ShellIcon {...props}>
      <path d="m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3Z" />
      <path d="m18 15 .9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9L18 15Z" />
    </ShellIcon>
  );
}

const sidebarLinks = [
  { id: "home", label: "Home", icon: HomeIcon, href: "/dashboard" },
  { id: "courses", label: "Courses", icon: LibraryIcon, href: "/dashboard#courses" },
  { id: "analytics", label: "Analytics", icon: ChartIcon, href: "/dashboard#analytics" },
  { id: "activity", label: "Activity", icon: PulseIcon, href: "/dashboard#activity" },
  { id: "social", label: "Social", icon: UsersIcon, href: "/dashboard#social" },
  { id: "profile", label: "Profile", icon: UserIcon, href: "/profile" }
];

function TodayRing({ value, expanded }) {
  const size = expanded ? 120 : 60;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (clampPercent(value) / 100) * circumference;

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center transition-[width,height] duration-200 ${expanded ? "h-[120px] w-[120px]" : "h-[60px] w-[60px]"
        }`}
      style={{ width: size, height: size }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 h-full w-full -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#today-ring-gradient-shell)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          style={{ filter: "drop-shadow(0 0 10px rgba(79, 172, 254, 0.35))" }}
        />
        <defs>
          <linearGradient id="today-ring-gradient-shell" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4facfe" />
            <stop offset="100%" stopColor="#00f2fe" />
          </linearGradient>
        </defs>
      </svg>

      <div className="relative flex flex-col items-center justify-center text-center">
        <span className={`${LABEL_CLASS} text-zinc-500`}>TODAY</span>
        <span className={`text-white ${expanded ? "text-[1.9rem]" : "text-base"} ${HEADING_CLASS}`}>
          {value}%
        </span>
      </div>
    </div>
  );
}

function SidebarItem({ item, expanded, isActive }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-label={item.label}
      className={`group flex items-center gap-4 rounded-[12px] px-3 py-3 transition duration-150 ${isActive
        ? "bg-white/[0.08] text-white"
        : "text-zinc-300 hover:bg-white/[0.08] hover:text-white"
        }`}
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#1a1a1a] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] ${isActive ? "text-cyan-400" : "text-zinc-200"
        }`}>
        <Icon className="h-5 w-5" />
      </span>
      <span
        className={`min-w-0 overflow-hidden text-sm font-semibold tracking-[0.01em] opacity-100 transition-all duration-200 ${expanded ? "xl:max-w-[120px] xl:opacity-100" : "xl:max-w-0 xl:opacity-0"
          }`}
      >
        {item.label}
      </span>
    </Link>
  );
}

export function AppShell({ eyebrow, title, description, actions, children }) {
  const pathname = usePathname();
  const store = useLearningStore();
  const snapshot = getLearningSnapshot(store);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const todayProgress = useMemo(() => {
    if ((store.xp || 0) === 0) return 0;
    return 67;
  }, [store.xp]);

  const userInitial = (store.name || "L").charAt(0).toUpperCase();
  const currentRank = useMemo(() => {
    return getRankMeta(store.xp ?? 0);
  }, [store.xp]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050505] text-white">
      <DatabaseSync />
      <style jsx global>{`
        html {
          scrollbar-width: thin;
          scrollbar-color: #222 transparent;
        }
        ::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #222;
          border-radius: 999px;
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,172,254,0.08),transparent_26%),radial-gradient(circle_at_85%_10%,rgba(0,242,254,0.06),transparent_18%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.88),rgba(5,5,5,1))]" />

      <div className="relative mx-auto max-w-[1600px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
        <div className="relative">
          {/* Collapsible Sidebar */}
          <motion.aside
            onMouseEnter={() => setSidebarExpanded(true)}
            onMouseLeave={() => setSidebarExpanded(false)}
            onFocusCapture={() => setSidebarExpanded(true)}
            onBlurCapture={() => setSidebarExpanded(false)}
            className={`z-30 w-full overflow-y-auto overflow-x-hidden scrollbar-none rounded-[24px] border border-white/[0.05] bg-white/[0.05] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-[16px] transition-[width] duration-200 xl:fixed xl:left-8 xl:top-5 xl:h-[calc(100vh-2.5rem)] ${sidebarExpanded ? "xl:w-[248px]" : "xl:w-[96px]"
              }`}
            style={{ zIndex: 40, scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div className="flex h-full flex-col">
              <Link href="/" className="flex items-center gap-3 select-none hover:opacity-80 transition duration-150">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#1a1a1a] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                  <BoltIcon />
                </div>
                <div
                  className={`min-w-0 overflow-hidden opacity-100 transition-all duration-200 ${sidebarExpanded ? "xl:max-w-[130px] xl:opacity-100" : "xl:max-w-0 xl:opacity-0"
                    }`}
                >
                  <p className={`text-lg text-white ${HEADING_CLASS}`}>VisualMind</p>
                  <p className={`${LABEL_CLASS} text-zinc-500`}>Learning OS</p>
                </div>
              </Link>

              <nav className="mt-8 space-y-2.5">
                {sidebarLinks.map((item) => {
                  const isActive = item.id === "profile" && pathname === "/profile";
                  return (
                    <SidebarItem
                      key={item.id}
                      item={item}
                      expanded={sidebarExpanded}
                      isActive={isActive}
                    />
                  );
                })}
              </nav>

              <div className={`flex flex-col items-center rounded-[12px] border border-white/[0.05] bg-[#1a1a1a] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] backdrop-blur-[16px] transition-all duration-200 ${sidebarExpanded ? "mt-8 p-5" : "mt-4 p-3"
                }`}>
                <TodayRing value={todayProgress} expanded={sidebarExpanded} />
                <p
                  className={`mt-4 overflow-hidden text-center text-xs leading-5 text-zinc-400 transition-all duration-200 ${sidebarExpanded ? "xl:max-h-10 xl:opacity-100" : "xl:max-h-0 xl:opacity-0"
                    }`}
                >
                  Two wins down. Keep the streak alive.
                </p>
              </div>

              <Link
                href="/ai-lab"
                className={`justify-center ${PRIMARY_BUTTON_CLASS} transition-all duration-200 ${sidebarExpanded ? "mt-5" : "mt-3"
                  }`}
                style={{ backgroundImage: BRAND_GRADIENT }}
              >
                <SparkIcon className="h-4 w-4" />
                <span
                  className={`overflow-hidden opacity-100 transition-all duration-200 ${sidebarExpanded ? "xl:max-w-[120px] xl:opacity-100" : "xl:max-w-0 xl:opacity-0"
                    }`}
                >
                  AI Lab
                </span>
              </Link>

              <div className={`mt-auto transition-all duration-200 ${sidebarExpanded ? "pt-8" : "pt-4"}`}>
                <div className={`flex items-center rounded-[12px] border border-white/[0.05] bg-[#1a1a1a] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] backdrop-blur-[16px] transition-all duration-200 ${sidebarExpanded ? "p-4 gap-3" : "p-2 gap-0"
                  }`}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-black text-sm font-semibold text-white">
                    {userInitial}
                  </div>
                  <div
                    className={`min-w-0 overflow-hidden opacity-100 transition-all duration-200 ${sidebarExpanded ? "xl:max-w-[120px] xl:opacity-100" : "xl:max-w-0 xl:opacity-0"
                      }`}
                  >
                    <p className="text-sm font-semibold text-white truncate">{store.name || "Learner"}</p>
                    <p className="text-xs text-zinc-500 truncate">{currentRank.title} / Focus mode</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>

          {/* Content Area */}
          <div className={`transition-all duration-200 xl:pl-[120px] ${sidebarExpanded ? "xl:pl-[272px]" : "xl:pl-[120px]"
            }`}>
            <div className="pt-2 sm:pt-4">
              {/* Header */}
              <div className="border-b border-white/[0.08] pb-7 mb-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    {eyebrow && <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-400">{eyebrow}</p>}
                    <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">{title}</h1>
                    {description && <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400">{description}</p>}
                  </div>
                  {actions && <div className="shrink-0">{actions}</div>}
                </div>
              </div>
              {/* Main Content */}
              {children}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
