"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform
} from "framer-motion";

const revealVariants = {
  "fade-up": { opacity: 0, y: 34 },
  "fade-in": { opacity: 0 },
  "slide-left": { opacity: 0, x: 46 },
  "slide-right": { opacity: 0, x: -46 },
  "scale-in": { opacity: 0, scale: 0.92 }
};

function motionComponent(as) {
  const components = {
    div: motion.div,
    section: motion.section,
    article: motion.article,
    aside: motion.aside,
    ul: motion.ul,
    li: motion.li,
    main: motion.main,
    form: motion.form
  };

  return components[as] || motion.div;
}

export function FadeUp({ children, className = "", delay = 0, variant = "fade-up", as = "div", ...props }) {
  const Component = motionComponent(as);
  return (
    <Component
      initial={revealVariants[variant]}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-90px" }}
      transition={{ duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
}

export function Stagger({ children, className = "", delay = 0, as = "div", ...props }) {
  const Component = motionComponent(as);
  return (
    <Component
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: {},
        show: { transition: { delayChildren: delay, staggerChildren: 0.08 } }
      }}
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
}

export function StaggerItem({ children, className = "", variant = "fade-up", as = "div", ...props }) {
  const Component = motionComponent(as);
  return (
    <Component
      variants={{
        hidden: revealVariants[variant],
        show: {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          transition: { duration: 0.64, ease: [0.22, 1, 0.36, 1] }
        }
      }}
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
}

export function HoverCard({ children, className = "", as = "div" }) {
  const Component = motionComponent(as);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const background = useMotionTemplate`radial-gradient(420px circle at ${mouseX}px ${mouseY}px, rgba(34, 211, 238, 0.18), transparent 42%)`;

  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    mouseX.set(event.clientX - rect.left);
    mouseY.set(event.clientY - rect.top);
  }

  return (
    <Component
      onMouseMove={handleMouseMove}
      whileHover={{ y: -8, scale: 1.03 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      data-cursor="card"
      className={`group relative overflow-hidden ${className}`}
    >
      <motion.div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background }} />
      <div className="relative z-10">{children}</div>
    </Component>
  );
}

export function AnimatedButton({ children, href, className = "", variant = "primary", wrapperClassName = "", ...props }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 180, damping: 15 });
  const springY = useSpring(y, { stiffness: 180, damping: 15 });
  const Component = href ? Link : "button";
  const base =
    "relative inline-flex items-center justify-center overflow-hidden rounded-full px-6 py-4 font-black transition-colors";
  const variants = {
    primary: "bg-white text-slate-950 shadow-glow",
    secondary: "border border-white/15 bg-white/5 text-white hover:bg-white/10",
    cyan: "bg-cyan-300 text-slate-950 shadow-glow"
  };

  function handleMove(event) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((event.clientX - rect.left - rect.width / 2) * 0.18);
    y.set((event.clientY - rect.top - rect.height / 2) * 0.18);
  }

  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 300, damping: 18 }}
      data-cursor="button"
      className={`inline-flex ${wrapperClassName}`}
    >
      <Component href={href} className={`${base} ${variants[variant]} ${className}`} {...props}>
        <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-cyan-200/45 to-transparent transition-transform duration-700 hover:translate-x-[120%]" />
        <span className="relative z-10">{children}</span>
      </Component>
    </motion.div>
  );
}

export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState(false);
  const [hidden, setHidden] = useState(true);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const smoothX = useSpring(x, { stiffness: 260, damping: 28, mass: 0.35 });
  const smoothY = useSpring(y, { stiffness: 260, damping: 28, mass: 0.35 });
  const trailX = useSpring(x, { stiffness: 90, damping: 26, mass: 0.8 });
  const trailY = useSpring(y, { stiffness: 90, damping: 26, mass: 0.8 });

  useEffect(() => {
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    setEnabled(canHover);
    if (!canHover) return undefined;

    function move(event) {
      x.set(event.clientX);
      y.set(event.clientY);
      setHidden(false);
      setActive(Boolean(event.target.closest("a, button, [data-cursor]")));
    }

    function leave() {
      setHidden(true);
    }

    window.addEventListener("mousemove", move);
    document.documentElement.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("mousemove", move);
      document.documentElement.removeEventListener("mouseleave", leave);
    };
  }, [x, y]);

  if (!enabled) return null;

  return (
    <>
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[100] h-7 w-7 rounded-full border border-cyan-200/70 mix-blend-difference"
        style={{ x: smoothX, y: smoothY, translateX: "-50%", translateY: "-50%" }}
        animate={{ scale: active ? 2.45 : 1, opacity: hidden ? 0 : 1 }}
      />
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[99] h-16 w-16 rounded-full bg-cyan-300/20 blur-xl"
        style={{ x: trailX, y: trailY, translateX: "-50%", translateY: "-50%" }}
        animate={{ scale: active ? 1.45 : 1, opacity: hidden ? 0 : 1 }}
      />
    </>
  );
}

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });

  return (
    <motion.div
      className="fixed left-0 top-0 z-[90] h-1 origin-left bg-gradient-to-r from-cyan-300 via-violet-400 to-lime-300"
      style={{ scaleX }}
    />
  );
}

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <motion.div
        className="absolute -left-24 top-20 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl"
        animate={{ x: [0, 70, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 14, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-10 right-0 h-96 w-96 rounded-full bg-fuchsia-500/15 blur-3xl"
        animate={{ x: [0, -60, 0], y: [0, -48, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 16, repeat: Infinity }}
      />
    </div>
  );
}

export function PageTransition({ children, pathname }) {
  const y = useTransform(useMotionValue(1), [0, 1], [10, 0]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        style={{ y }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
