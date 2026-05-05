"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Reveal } from "@/components/motion-wrapper";
import { AnimatedButton, HoverCard, Stagger, StaggerItem } from "@/components/animation-kit";

const stats = [
  ["68%", "students multitask during online lectures"],
  ["3x", "higher recall with visual cues"],
  ["12 min", "ideal micro-learning sprint"]
];

const solution = [
  {
    title: "Animations",
    icon: "A",
    description:
      "Concepts explained through short, interactive visual animations that improve retention and reduce cognitive overload.",
    back: ["Visual storytelling", "Better memory retention", "Reduces boredom"],
    gradient: "from-cyan-300 via-blue-500 to-violet-500"
  },
  {
    title: "Infographics",
    icon: "I",
    description:
      "Complex topics simplified into structured visual diagrams and flow-based learning for quick understanding.",
    back: ["Flowcharts", "Diagrams", "Step-by-step visuals"],
    gradient: "from-lime-300 via-emerald-400 to-cyan-500"
  },
  {
    title: "Micro-learning",
    icon: "M",
    description:
      "Lessons broken into 3-5 minute chunks to match attention span and maximize focus.",
    back: ["Short lessons", "Focused topics", "Quick revision"],
    gradient: "from-fuchsia-400 via-rose-500 to-orange-400"
  },
  {
    title: "Gamification",
    icon: "G",
    description:
      "Earn XP, track streaks, and unlock achievements to stay motivated while learning.",
    back: ["XP points", "Badges", "Leaderboards"],
    gradient: "from-violet-400 via-indigo-500 to-cyan-400"
  }
];
const testimonials = [
  "It feels like Duolingo met my physics textbook.",
  "I finally understand trigonometry because it moves.",
  "The XP and streaks made revision weirdly addictive."
];

const engineSteps = ["Input", "Processing", "Output"];
const inputLines = [
  "Trigonometry studies relationships between",
  "angles and sides of triangles using sine,",
  "cosine, and tangent to solve measurements."
];
const demoModes = {
  Focus: {
    title: "Focus Mode",
    stat: "3 min sprint",
    cards: ["Key idea", "Formula", "Example"]
  },
  Recall: {
    title: "Recall Mode",
    stat: "86% retention",
    cards: ["Memory hook", "Pattern", "Quick recap"]
  },
  Quiz: {
    title: "Quiz Mode",
    stat: "+40 XP",
    cards: ["1 question", "Instant feedback", "Next step"]
  }
};

function VisualLearningEngineDemo() {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState("Focus");
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStep((current) => (current + 1) % engineSteps.length);
    }, 2300);

    return () => window.clearInterval(timer);
  }, []);

  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setTilt({
      rotateX: ((y / rect.height) - 0.5) * -7,
      rotateY: ((x / rect.width) - 0.5) * 7
    });
  }

  function resetTilt() {
    setTilt({ rotateX: 0, rotateY: 0 });
  }

  return (
    <motion.div
      initial={{ opacity: 0, rotateX: 20, y: 30 }}
      animate={{ opacity: 1, rotateX: tilt.rotateX, rotateY: tilt.rotateY, y: 0 }}
      transition={{ type: "spring", stiffness: 170, damping: 20 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTilt}
      className="glass glow-ring relative rounded-[2rem] p-1"
      data-cursor="card"
    >
      <div className="relative overflow-hidden rounded-[calc(2rem-4px)] bg-slate-950/85 p-5">
        <motion.div
          className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-400/25 blur-3xl"
          animate={{ scale: [1, 1.18, 1], x: [0, -18, 0], y: [0, 16, 0] }}
          transition={{ duration: 7, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-20 left-4 h-52 w-52 rounded-full bg-violet-500/25 blur-3xl"
          animate={{ scale: [1, 1.12, 1], x: [0, 22, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />

        <div className="relative z-10">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase text-cyan-200">Live product demo</span>
              <h3 className="mt-1 text-2xl font-black">Visual Learning Engine</h3>
            </div>
            <motion.span
              className="rounded-full bg-limeGlow/20 px-3 py-1 text-xs font-bold text-lime-200"
              animate={{ y: [0, -5, 0], scale: [1, 1.08, 1] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            >
              +40 XP
            </motion.span>
          </div>

          <div className="mb-5 h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              key={step}
              className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-violet-400 to-lime-300"
              initial={{ width: "0%" }}
              animate={{ width: `${((step + 1) / engineSteps.length) * 100}%` }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          <div className="mb-4 grid grid-cols-3 gap-2 text-xs">
            {engineSteps.map((label, index) => (
              <motion.div
                key={label}
                animate={{
                  opacity: step === index ? 1 : 0.55,
                  scale: step === index ? 1.03 : 1
                }}
                className={`rounded-2xl border px-3 py-2 text-center font-bold ${
                  step === index ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-100" : "border-white/10 bg-white/5 text-slate-400"
                }`}
              >
                {label}
              </motion.div>
            ))}
          </div>

          <div className="relative min-h-[270px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/10 p-5">
            <motion.div
              className="absolute inset-x-8 top-1/2 h-20 -translate-y-1/2 rounded-full bg-cyan-300/10 blur-2xl"
              animate={{ opacity: step === 1 ? [0.2, 0.75, 0.2] : 0.2, scale: step === 1 ? [1, 1.25, 1] : 1 }}
              transition={{ duration: 1.1, repeat: step === 1 ? Infinity : 0 }}
            />

            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -14, filter: "blur(8px)" }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="relative"
                >
                  <p className="text-xs font-bold uppercase text-slate-400">Dense input</p>
                  <div className="mt-4 rounded-2xl bg-slate-950/70 p-4 text-sm leading-6 text-slate-300">
                    {inputLines.map((line, index) => (
                      <motion.p
                        key={line}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.34, delay: index * 0.12, ease: "easeOut" }}
                        className="relative overflow-hidden"
                      >
                        <motion.span
                          className="absolute inset-y-0 left-0 rounded-full bg-cyan-200/10"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%", opacity: [0.8, 0] }}
                          transition={{ duration: 0.7, delay: index * 0.12, ease: "easeOut" }}
                        />
                        <span className="relative">{line}</span>
                      </motion.p>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-2">
                    {[86, 64, 78].map((width, index) => (
                      <div key={width} className="h-2 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          className="h-2 rounded-full bg-white/35"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: width / 100 }}
                          style={{ originX: 0 }}
                          transition={{ duration: 0.65, delay: 0.18 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, y: 18, scale: 0.97, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -14, scale: 0.98, filter: "blur(8px)" }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="relative grid min-h-[220px] place-items-center text-center"
                >
                  <div>
                    <p className="text-xs font-bold uppercase text-violet-200">Transforming</p>
                    <div className="mt-6 flex items-end justify-center gap-2">
                      {[24, 42, 68, 38, 56, 30].map((height, index) => (
                        <motion.div
                          key={height}
                          className="w-4 rounded-full bg-cyan-300"
                          animate={{ scaleY: [0.7, 1.25, 0.7], opacity: [0.45, 1, 0.45] }}
                          style={{ height, originY: 1 }}
                          transition={{ duration: 0.9, repeat: Infinity, delay: index * 0.08 }}
                        />
                      ))}
                    </div>
                    <motion.p
                      className="mt-6 text-sm text-slate-300"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    >
                      Extracting meaning, hierarchy, and memory hooks
                    </motion.p>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="output"
                  initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -14, filter: "blur(8px)" }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="relative"
                >
                  <p className="text-xs font-bold uppercase text-lime-300">{demoModes[mode].title}</p>
                  <h4 className="mt-3 text-2xl font-black">Trig becomes visual</h4>
                  <motion.ul className="mt-4 grid gap-2 text-sm text-slate-200">
                    {["Sine = opposite / hypotenuse", "Cosine = adjacent / hypotenuse", "Tangent = opposite / adjacent"].map((item, index) => (
                      <motion.li
                        key={item}
                        initial={{ opacity: 0, x: 18 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, ease: "easeOut" }}
                        className="rounded-2xl bg-white/10 px-3 py-2"
                      >
                        {item}
                      </motion.li>
                    ))}
                  </motion.ul>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {demoModes[mode].cards.map((item, index) => (
                      <motion.div
                        key={item}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 + index * 0.08, ease: "easeOut" }}
                        className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/18 to-white/5 p-3 text-center text-xs font-bold text-cyan-100"
                      >
                        {item}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {Object.keys(demoModes).map((label) => (
              <motion.button
                key={label}
                onClick={() => {
                  setMode(label);
                  setStep(2);
                }}
                whileHover={{ y: -4, scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className={`rounded-2xl border px-3 py-3 text-sm font-bold transition ${
                  mode === label ? "border-cyan-300/60 bg-cyan-300/20 text-cyan-100" : "border-white/10 bg-white/10 text-slate-300"
                }`}
              >
                <span className="block text-xs text-slate-400">{demoModes[label].stat}</span>
                {label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function FlipFeatureCard({ item }) {
  return (
    <div className="group h-[360px] [perspective:1200px]" data-cursor="card">
      <motion.div
        className="relative h-full rounded-3xl transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)_scale(1.04)]"
        whileHover={{ y: -8 }}
      >
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/25 via-white/10 to-white/5 p-px shadow-glow transition group-hover:shadow-[0_28px_110px_rgba(34,211,238,0.28)] [backface-visibility:hidden]">
          <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(1.5rem-1px)] border border-white/10 bg-slate-950/70 p-6 backdrop-blur-2xl">
            <motion.div
              className={`absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gradient-to-br ${item.gradient} opacity-30 blur-2xl`}
              animate={{ scale: [1, 1.14, 1], rotate: [0, 18, 0] }}
              transition={{ duration: 7, repeat: Infinity }}
            />
            <div className={`grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br ${item.gradient} text-2xl font-black text-white shadow-glow`}>
              {item.icon}
            </div>
            <div className="mt-auto">
              <h3 className="text-3xl font-black">{item.title}</h3>
              <p className="mt-4 text-sm leading-6 text-slate-300">{item.description}</p>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-300/40 via-violet-500/30 to-lime-300/25 p-px shadow-[0_28px_110px_rgba(139,92,246,0.25)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-[calc(1.5rem-1px)] border border-white/10 bg-slate-950/85 p-6 backdrop-blur-2xl">
            <div className={`absolute inset-x-8 -top-24 h-48 rounded-full bg-gradient-to-r ${item.gradient} opacity-25 blur-3xl`} />
            <div>
              <p className="text-xs font-bold uppercase text-cyan-200">Inside the experience</p>
              <h4 className="mt-4 text-3xl font-black">{item.title}</h4>
            </div>
            <ul className="grid gap-3">
              {item.back.map((point) => (
                <li key={point} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-slate-100">
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function HowItWorksCard({ step, index }) {
  const [light, setLight] = useState({ x: 50, y: 50 });
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setLight({ x, y });
    setTilt({
      rotateX: (y - 50) * -0.08,
      rotateY: (x - 50) * 0.08
    });
  }

  function resetTilt() {
    setLight({ x: 50, y: 50 });
    setTilt({ rotateX: 0, rotateY: 0 });
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTilt}
      whileHover={{
        scale: 1.06,
        y: -5,
        rotateX: tilt.rotateX,
        rotateY: tilt.rotateY
      }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      data-cursor="card"
      className="group relative overflow-hidden rounded-3xl p-px shadow-[0_18px_70px_rgba(15,23,42,0.28)] transition-shadow duration-300 hover:shadow-[0_28px_110px_rgba(34,211,238,0.22)]"
      style={{ transformStyle: "preserve-3d" }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-cyan-300/45 via-violet-500/45 to-cyan-300/45 opacity-45 blur-sm transition-opacity duration-300 group-hover:opacity-100"
        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        style={{ backgroundSize: "220% 220%" }}
      />
      <div className="relative min-h-72 overflow-hidden rounded-[calc(1.5rem-1px)] border border-white/10 bg-white/10 p-7 backdrop-blur-2xl">
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle at ${light.x}% ${light.y}%, rgba(34,211,238,0.18), rgba(139,92,246,0.1) 28%, transparent 55%)`
          }}
        />
        <motion.div
          className="absolute -right-14 -top-14 h-32 w-32 rounded-full bg-cyan-300/20 blur-2xl"
          animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.7, 0.35] }}
          transition={{ duration: 3.5, repeat: Infinity }}
        />
        <div className="relative z-10">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-sm font-black text-cyan-100">
            0{index + 1}
          </span>
          <h3 className="mt-7 text-3xl font-black">{step}</h3>
          <p className="mt-3 text-slate-300">
            {index === 0 && "Paste dense educational content."}
            {index === 1 && "Extract meaning, hierarchy, and memory hooks."}
            {index === 2 && "Generate summaries, cards, quizzes, and visuals."}
          </p>
          <div className="mt-8 flex items-center gap-2">
            {[0, 1, 2].map((dot) => (
              <motion.span
                key={dot}
                className="h-2 rounded-full bg-cyan-300"
                animate={{ width: dot === index ? 34 : 10, opacity: dot === index ? 1 : 0.35 }}
                transition={{ duration: 0.35 }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function LandingPage() {
  return (
    <div className="overflow-hidden bg-midnight text-white">
      <section className="relative flex min-h-screen items-center px-5 pt-28 sm:px-8">
        <div className="absolute inset-0 bg-hero-grid bg-[length:44px_44px] opacity-50" />
        <motion.div
          className="absolute left-1/2 top-24 h-80 w-80 rounded-full bg-cyan-400/25 blur-3xl"
          animate={{ y: [0, 35, 0], x: [0, -28, 0] }}
          transition={{ duration: 9, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-violet-500/30 blur-3xl"
          animate={{ y: [0, -42, 0], scale: [1, 1.12, 1] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <Reveal>
            <p className="mb-5 inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-cyan-100">
              Built for students with short attention windows
            </p>
            <h1 className="max-w-4xl text-balance text-6xl font-black leading-none tracking-tight sm:text-7xl lg:text-8xl">
              Learn Smarter, Not Harder
            </h1>
            <p className="mt-7 max-w-2xl text-xl text-slate-300">
              Turn boring content into visual learning with animations, infographics,
              micro-lessons, quizzes, XP, streaks, and instant feedback.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <AnimatedButton href="/auth/signup">
                Start Learning
              </AnimatedButton>
              <AnimatedButton href="#demo" variant="secondary">
                Watch Demo
              </AnimatedButton>
            </div>
          </Reveal>

          <VisualLearningEngineDemo />
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <p className="text-sm font-bold uppercase text-cyan-300">The problem</p>
            <h2 className="mt-3 max-w-4xl text-4xl font-black sm:text-6xl">
              Text-heavy learning loses attention before understanding begins.
            </h2>
          </Reveal>
          <Stagger className="mt-12 grid gap-4 md:grid-cols-3">
            {stats.map(([value, label], index) => (
              <StaggerItem key={value} variant={index === 1 ? "scale-in" : "fade-up"}>
                <HoverCard className="glass glow-ring rounded-3xl p-7">
                  <p className="text-5xl font-black text-white">{value}</p>
                  <p className="mt-3 text-slate-300">{label}</p>
                </HoverCard>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section id="solution" className="px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <p className="text-sm font-bold uppercase text-lime-300">The solution</p>
            <h2 className="mt-3 text-4xl font-black sm:text-6xl">
              Visual learning loops that feel alive.
            </h2>
          </Reveal>
          <Stagger className="mt-12 grid gap-5 md:grid-cols-4">
            {solution.map((item, index) => (
              <StaggerItem key={item.title} variant={index % 2 ? "slide-left" : "slide-right"}>
                <FlipFeatureCard item={item} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section id="demo" className="px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal className="glass rounded-[2rem] p-8 sm:p-12">
            <p className="text-sm font-bold uppercase text-violet-200">How it works</p>
            <div className="mt-8 grid items-center gap-6 md:grid-cols-3">
              {["Input", "AI", "Visual Output"].map((step, index) => (
                <HowItWorksCard key={step} step={step} index={index} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section id="features" className="px-5 py-24 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          {["Adaptive dashboards", "Animated course player", "Quiz feedback", "XP streak system"].map(
            (feature, index) => (
              <Reveal key={feature} delay={index * 0.06} variant={index % 2 ? "slide-left" : "slide-right"}>
                <HoverCard className="glow-ring min-h-80 rounded-[2rem] bg-gradient-to-br from-white/15 to-white/5 p-8">
                <span className="text-sm text-cyan-200">Feature 0{index + 1}</span>
                <h3 className="mt-8 text-4xl font-black">{feature}</h3>
                <p className="mt-4 max-w-md text-slate-300">
                  Premium interactions, loading states, and responsive layouts keep learners
                  moving from curiosity to completion.
                </p>
                </HoverCard>
              </Reveal>
            )
          )}
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <h2 className="text-4xl font-black sm:text-6xl">Loved by fast learners.</h2>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {testimonials.map((quote, index) => (
              <Reveal key={quote} delay={index * 0.08} variant="scale-in">
                <HoverCard className="glass glow-ring rounded-3xl p-7">
                <p className="text-xl font-bold">"{quote}"</p>
                <p className="mt-6 text-sm text-slate-400">Student beta tester</p>
                </HoverCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="px-5 py-24 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
          {["Starter", "Scholar", "Campus"].map((plan, index) => (
            <Reveal key={plan} delay={index * 0.08} variant="scale-in">
              <HoverCard className="glass glow-ring rounded-3xl p-7">
              <h3 className="text-3xl font-black">{plan}</h3>
              <p className="mt-3 text-slate-300">
                {index === 0 ? "Free" : index === 1 ? "$9/mo" : "Custom"}
              </p>
              <ul className="mt-8 space-y-3 text-sm text-slate-300">
                <li>Visual courses</li>
                <li>Quiz attempts</li>
                <li>Progress tracking</li>
              </ul>
              </HoverCard>
            </Reveal>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-12 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-4">
          {["VisualMind", "Product", "Company", "Resources"].map((title) => (
            <div key={title}>
              <h4 className="font-black">{title}</h4>
              <p className="mt-4 text-sm text-slate-400">
                Premium visual learning for students aged 14 to 22.
              </p>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
