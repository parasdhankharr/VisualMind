"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AnimatedButton } from "@/components/animation-kit";
import { createGeneratedCourseFromTransform } from "@/lib/learning";
import { useLearningStore } from "@/store/use-learning-store";

const sampleText =
  "Photosynthesis is the process by which green plants use sunlight to synthesize food from carbon dioxide and water. Chlorophyll captures light energy, which helps convert carbon dioxide and water into glucose. Oxygen is released as a byproduct. This process supports most life on Earth because it creates food energy and maintains oxygen levels in the atmosphere.";

const placeholderIdeas = [
  "Paste a science chapter and turn it into a visual study map.",
  "Drop a dense economics topic to break it into clear steps.",
  "Use class notes and generate a mind map with micro-learning checkpoints."
];

const draftStorageKey = "visualmind-ai-draft";

const viewOptions = [
  ["mind", "Mind Map"],
  ["flow", "Flow View"],
  ["summary", "Summary View"]
];

const mindMapSlots = [
  { col: 1, row: 1, x: 17, y: 18, textAlign: "text-left" },
  { col: 3, row: 1, x: 83, y: 18, textAlign: "text-left" },
  { col: 1, row: 3, x: 17, y: 82, textAlign: "text-left" },
  { col: 3, row: 3, x: 83, y: 82, textAlign: "text-left" }
];

function Panel({ children, className = "" }) {
  return <div className={`glass glow-ring rounded-[2rem] border border-white/10 bg-white/5 ${className}`}>{children}</div>;
}

function WorkspaceHeader({ result }) {
  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div>
        <p className="text-sm font-bold uppercase text-cyan-300">AI Transform Lab</p>
        <h1 className="mt-3 text-4xl font-black leading-none sm:text-5xl">Think visually. Learn structurally.</h1>
        <p className="mt-4 max-w-3xl text-sm text-slate-300 sm:text-base">
          A full-screen workspace for turning dense text into connected ideas, guided flows, and short learning loops.
        </p>
      </div>
      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Current output</p>
        <p className="mt-2 text-lg font-black text-white">{result ? result.simplified : "Waiting for source material"}</p>
      </div>
    </div>
  );
}

function ViewSwitcher({ view, setView }) {
  return (
    <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
      {viewOptions.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => setView(id)}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            view === id ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function deriveWorkspaceData(text, result) {
  const words = text
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const topic = result?.infographic?.[0]?.value || words.slice(0, 2).join(" ") || "Concept";
  const summary = result?.summary?.length ? result.summary : ["Add content and generate a visual breakdown."];
  const keyIdeas = summary.slice(0, 4).map((item, index) => ({
    id: `idea-${index}`,
    title: item.split(" ").slice(0, 4).join(" "),
    detail: item,
    color: [
      "from-cyan-400 via-blue-500 to-violet-500",
      "from-lime-300 via-emerald-400 to-cyan-500",
      "from-fuchsia-400 via-rose-500 to-orange-400",
      "from-violet-400 via-indigo-500 to-cyan-400"
    ][index % 4]
  }));

  const steps = summary.slice(0, 3).map((item, index) => ({
    title: `Step ${index + 1}`,
    detail: item,
    cue: ["Observe", "Connect", "Recall"][index] || "Apply"
  }));

  const visualBlocks = (result?.infographic || []).map((block, index) => ({
    ...block,
    icon: ["CI", "VH", "MS"][index] || "BL"
  }));

  const quizPreview = {
    question: `What best explains ${topic}?`,
    options: summary.slice(0, 3).map((item) => item.split(" ").slice(0, 6).join(" ")),
    answer: summary[0]
  };

  const quizQuestions = [
    {
      id: "quiz-1",
      question: `Which statement best captures the core idea behind ${topic}?`,
      options: [
        result?.simplified || summary[0],
        `Ignore ${topic} and memorize isolated terms only`,
        `Treat ${topic} as unrelated facts with no structure`,
        `Focus only on definitions and skip visual meaning`
      ],
      answer: result?.simplified || summary[0]
    },
    {
      id: "quiz-2",
      question: "What is the strongest visual learning move for this topic?",
      options: [
        result?.infographic?.[1]?.detail || "Turn the idea into a chart, analogy, or motion sequence.",
        "Study only by rereading the same paragraph repeatedly",
        "Remove all structure and avoid chunking the content",
        "Skip examples and test yourself immediately"
      ],
      answer: result?.infographic?.[1]?.detail || "Turn the idea into a chart, analogy, or motion sequence."
    },
    {
      id: "quiz-3",
      question: "What should happen next in the micro-learning flow?",
      options: [
        steps[0]?.detail || summary[0],
        "End the lesson before any recall step happens",
        "Combine every idea into one long block with no checkpoints",
        "Avoid feedback until the final exam"
      ],
      answer: steps[0]?.detail || summary[0]
    }
  ];

  return {
    topic,
    keyIdeas,
    steps,
    visualBlocks,
    quizPreview,
    quizQuestions,
    coreIdea: result?.simplified || "Generate a transformation to reveal the core idea.",
    takeaways: summary,
    microLessons: steps.map((step) => `${step.cue}: ${step.detail}`)
  };
}

function resolveActiveDetail(data, activeNode) {
  if (activeNode === "core") {
    return {
      title: data.topic,
      detail: data.coreIdea,
      eyebrow: "Core topic",
      meta: "Central concept"
    };
  }

  const ideaNode = data.keyIdeas.find((node) => node.id === activeNode);
  if (ideaNode) {
    return {
      title: ideaNode.title,
      detail: ideaNode.detail,
      eyebrow: "Key idea",
      meta: "Mind map node"
    };
  }

  const stepIndex = Number(activeNode.replace("step-", ""));
  if (Number.isFinite(stepIndex) && data.steps[stepIndex]) {
    return {
      title: data.steps[stepIndex].cue,
      detail: data.steps[stepIndex].detail,
      eyebrow: data.steps[stepIndex].title,
      meta: "Flow sequence"
    };
  }

  const blockIndex = Number(activeNode.replace("block-", ""));
  if (Number.isFinite(blockIndex) && data.visualBlocks[blockIndex]) {
    return {
      title: data.visualBlocks[blockIndex].label,
      detail: data.visualBlocks[blockIndex].detail,
      eyebrow: data.visualBlocks[blockIndex].value,
      meta: "Summary block"
    };
  }

  return {
    title: "Select a node",
    detail: "Hover or click any block to inspect more context.",
    eyebrow: "Detail inspector",
    meta: "Awaiting selection"
  };
}

function MindMapView({ data, activeNode, setActiveNode }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.96))] p-4 sm:p-6">
      <div className="relative hidden min-h-[30rem] lg:block">
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {data.keyIdeas.map((node, index) => {
            const slot = mindMapSlots[index];
            return (
              <motion.line
                key={node.id}
                x1="50"
                y1="50"
                x2={slot.x}
                y2={slot.y}
                stroke="rgba(103,232,249,0.45)"
                strokeWidth="0.4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.7, delay: index * 0.1 }}
              />
            );
          })}
        </svg>

        <div className="grid min-h-[30rem] grid-cols-3 grid-rows-3 gap-8">
          {data.keyIdeas.map((node, index) => {
            const slot = mindMapSlots[index];
            const isActive = activeNode === node.id;

            return (
              <div
                key={node.id}
                className={`flex ${slot.col === 3 ? "justify-end" : "justify-start"} ${
                  slot.row === 3 ? "items-end" : "items-start"
                }`}
                style={{ gridColumn: slot.col, gridRow: slot.row }}
              >
                <motion.button
                  type="button"
                  onClick={() => setActiveNode(node.id)}
                  drag
                  dragMomentum={false}
                  dragElastic={0.12}
                  initial={{ opacity: 0, scale: 0.88, x: slot.col === 1 ? -16 : 16, y: slot.row === 1 ? -16 : 16 }}
                  animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.18 + index * 0.08 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  className={`w-full max-w-[13rem] rounded-[1.5rem] border p-4 ${slot.textAlign} backdrop-blur-xl transition ${
                    isActive ? "border-cyan-200/60 bg-white/14" : "border-white/10 bg-white/8"
                  }`}
                >
                  <div className={`h-1.5 w-16 rounded-full bg-gradient-to-r ${node.color}`} />
                  <p className="mt-3 text-lg font-black capitalize text-white">{node.title}</p>
                  <p className="mt-2 text-sm text-slate-300">{node.detail}</p>
                </motion.button>
              </div>
            );
          })}

          <div className="flex items-center justify-center" style={{ gridColumn: 2, gridRow: 2 }}>
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.86 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: 1.04 }}
              className="w-full max-w-[15rem] rounded-[1.75rem] border border-cyan-200/35 bg-slate-950/70 p-5 text-left shadow-glow backdrop-blur-xl"
              onClick={() => setActiveNode("core")}
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Core topic</p>
              <h3 className="mt-3 text-2xl font-black capitalize text-white">{data.topic}</h3>
              <p className="mt-3 text-sm text-slate-300">{data.coreIdea}</p>
            </motion.button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:hidden">
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45 }}
          whileHover={{ scale: 1.02 }}
          className="rounded-[1.75rem] border border-cyan-200/35 bg-slate-950/70 p-5 text-left shadow-glow backdrop-blur-xl"
          onClick={() => setActiveNode("core")}
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Core topic</p>
          <h3 className="mt-3 text-2xl font-black capitalize text-white">{data.topic}</h3>
          <p className="mt-3 text-sm text-slate-300">{data.coreIdea}</p>
        </motion.button>

        <div className="grid gap-4 sm:grid-cols-2">
          {data.keyIdeas.map((node, index) => {
            const isActive = activeNode === node.id;

            return (
              <motion.button
                key={node.id}
                type="button"
                onClick={() => setActiveNode(node.id)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.12 + index * 0.08 }}
                whileHover={{ y: -2, scale: 1.02 }}
                className={`rounded-[1.5rem] border p-4 text-left backdrop-blur-xl transition ${
                  isActive ? "border-cyan-200/60 bg-white/14" : "border-white/10 bg-white/8"
                }`}
              >
                <div className={`h-1.5 w-16 rounded-full bg-gradient-to-r ${node.color}`} />
                <p className="mt-3 text-lg font-black capitalize text-white">{node.title}</p>
                <p className="mt-2 text-sm text-slate-300">{node.detail}</p>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function QuizCard({ questions }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState("");
  const [status, setStatus] = useState("idle");
  const [score, setScore] = useState(0);
  const [awarded, setAwarded] = useState({});

  useEffect(() => {
    setCurrentIndex(0);
    setSelectedOption("");
    setStatus("idle");
    setScore(0);
    setAwarded({});
  }, [questions]);

  const currentQuestion = questions[currentIndex];
  const isComplete = currentIndex >= questions.length;

  function handleOptionClick(option) {
    if (!currentQuestion || status === "correct") return;

    setSelectedOption(option);
    if (option === currentQuestion.answer) {
      setStatus("correct");
      if (!awarded[currentQuestion.id]) {
        setScore((current) => current + 1);
        setAwarded((current) => ({ ...current, [currentQuestion.id]: true }));
      }
      return;
    }

    setStatus("wrong");
  }

  function handleNext() {
    if (currentIndex === questions.length - 1) {
      setCurrentIndex(questions.length);
      return;
    }

    setCurrentIndex((current) => current + 1);
    setSelectedOption("");
    setStatus("idle");
  }

  function handleRetry() {
    setCurrentIndex(0);
    setSelectedOption("");
    setStatus("idle");
    setScore(0);
    setAwarded({});
  }

  if (isComplete) {
    return (
      <div className="rounded-[1.25rem] border border-emerald-400/25 bg-emerald-400/10 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">Quiz complete</p>
        <h3 className="mt-3 text-2xl font-black text-white">
          Score: {score}/{questions.length}
        </h3>
        <p className="mt-2 text-sm text-slate-200">Nice work. You just earned a quick retrieval rep for this concept.</p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 inline-flex rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm font-bold text-emerald-100"
        >
          +30 XP
        </motion.div>
        <button
          type="button"
          onClick={handleRetry}
          className="mt-4 block rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
        >
          Restart quiz
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
          Question {currentIndex + 1}/{questions.length}
        </p>
        <p className="text-sm font-semibold text-cyan-200">Score {score}</p>
      </div>
      <div className="mb-4 h-2 rounded-full bg-white/10">
        <motion.div
          className="h-2 rounded-full bg-gradient-to-r from-cyan-300 via-blue-500 to-violet-500"
          animate={{ width: `${((currentIndex + (status === "correct" ? 1 : 0)) / questions.length) * 100}%` }}
          transition={{ duration: 0.35 }}
        />
      </div>

      <div className="[perspective:1200px]">
        <motion.div
          animate={{
            rotateY: status === "correct" ? 180 : 0,
            scale: status === "correct" ? 1.01 : 1,
            x: status === "wrong" ? [-10, 10, -10, 10, 0] : 0
          }}
          transition={{ duration: status === "wrong" ? 0.4 : 0.55 }}
          className="relative min-h-[22rem] rounded-[1.5rem]"
          style={{ transformStyle: "preserve-3d" }}
          onAnimationComplete={() => {
            if (status === "wrong") {
              setStatus("idle");
            }
          }}
        >
          <div
            className="absolute inset-0 rounded-[1.5rem] border border-white/10 bg-white/5 p-5"
            style={{ backfaceVisibility: "hidden" }}
          >
            <h3 className="text-lg font-black text-white">{currentQuestion.question}</h3>
            <div className="mt-4 grid gap-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedOption === option;
                const isCorrect = option === currentQuestion.answer;
                let optionClass = "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10";

                if (isSelected && status === "wrong") {
                  optionClass = "border-rose-300/40 bg-rose-500/15 text-rose-100";
                }

                if (isCorrect && status === "correct") {
                  optionClass = "border-emerald-300/40 bg-emerald-400/15 text-emerald-100 shadow-glow";
                }

                return (
                  <motion.button
                    key={option}
                    type="button"
                    whileHover={{ scale: status === "correct" ? 1 : 1.01 }}
                    onClick={() => handleOptionClick(option)}
                    className={`rounded-[1rem] border px-4 py-3 text-left text-sm transition ${optionClass}`}
                  >
                    <span className="mr-2 font-black text-slate-400">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {selectedOption && status === "wrong" ? (
                <motion.p
                  key="wrong"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mt-4 rounded-[1rem] border border-rose-300/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100"
                >
                  Wrong. Try again.
                </motion.p>
              ) : null}
            </AnimatePresence>
          </div>

          <div
            className="absolute inset-0 rounded-[1.5rem] border border-emerald-300/35 bg-emerald-400/10 p-5"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">Correct</p>
            <h3 className="mt-3 text-2xl font-black text-white">Nice! You got it.</h3>
            <p className="mt-3 text-sm text-slate-100">{currentQuestion.answer}</p>
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-5 inline-flex rounded-full border border-emerald-300/35 bg-emerald-300/10 px-4 py-2 text-sm font-bold text-emerald-100"
            >
              Correct ✅
            </motion.div>
          </div>
        </motion.div>
      </div>

      {status === "correct" ? (
        <button
          type="button"
          onClick={handleNext}
          className="mt-4 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
        >
          {currentIndex === questions.length - 1 ? "See results" : "Next question"}
        </button>
      ) : null}
    </div>
  );
}

function FlowView({ data, activeNode, setActiveNode }) {
  return (
    <div className="grid min-h-[30rem] gap-4 rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 lg:grid-cols-3">
      {data.steps.map((step, index) => {
        const id = `step-${index}`;
        const isCurrent = activeNode === id;

        return (
          <div key={id} className="relative">
            {index < data.steps.length - 1 ? (
              <div className="pointer-events-none absolute right-[-1rem] top-1/2 hidden h-px w-8 bg-gradient-to-r from-cyan-300 to-violet-400 lg:block" />
            ) : null}
            <motion.button
              type="button"
              onClick={() => setActiveNode(id)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className={`h-full w-full rounded-[1.75rem] border p-5 text-left transition ${
                isCurrent ? "border-cyan-200/50 bg-white/10" : "border-white/10 bg-white/5"
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{step.title}</p>
              <h3 className="mt-4 text-2xl font-black text-white">{step.cue}</h3>
              <p className="mt-3 text-sm text-slate-300">{step.detail}</p>
            </motion.button>
          </div>
        );
      })}
    </div>
  );
}

function SummaryView({ data, activeNode, setActiveNode }) {
  return (
    <div className="grid min-h-[30rem] gap-4 rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 sm:grid-cols-2 xl:grid-cols-3">
      {data.visualBlocks.map((block, index) => {
        const id = `block-${index}`;
        const isActive = activeNode === id;

        return (
          <motion.button
            key={block.label}
            type="button"
            onClick={() => setActiveNode(id)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: index * 0.08 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className={`rounded-[1.75rem] border p-5 text-left transition ${
              isActive ? "border-cyan-200/50 bg-white/10" : "border-white/10 bg-white/5"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300/25 via-blue-500/25 to-violet-500/25 text-sm font-black text-cyan-100">
                {block.icon}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{block.label}</p>
                <h3 className="text-xl font-black capitalize text-white">{block.value}</h3>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-300">{block.detail}</p>
          </motion.button>
        );
      })}
    </div>
  );
}

function LoadingWorkspace() {
  return (
    <div className="grid min-h-[30rem] place-items-center rounded-[2rem] border border-white/10 bg-slate-950/70 p-6">
      <div className="w-full max-w-3xl space-y-6">
        <div className="h-6 w-48 animate-pulse rounded-full bg-white/10" />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-40 animate-pulse rounded-[1.5rem] bg-white/10" />
          ))}
        </div>
        <div className="h-56 animate-pulse rounded-[2rem] bg-white/10" />
      </div>
    </div>
  );
}

export function AiLab() {
  const [text, setText] = useState(sampleText);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState("mind");
  const [activeNode, setActiveNode] = useState("core");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [loggedNodes, setLoggedNodes] = useState({});
  const { addActivity, addGeneratedCourse } = useLearningStore();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedDraft = window.localStorage.getItem(draftStorageKey);
    if (savedDraft && savedDraft.trim()) {
      setText(savedDraft);
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPlaceholderIndex((current) => (current + 1) % placeholderIdeas.length);
    }, 2400);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(draftStorageKey, text);
  }, [text]);

  const workspaceData = useMemo(() => deriveWorkspaceData(text, result), [result, text]);
  const activeDetail = useMemo(() => resolveActiveDetail(workspaceData, activeNode), [activeNode, workspaceData]);

  useEffect(() => {
    if (view === "mind") setActiveNode("core");
    if (view === "flow") setActiveNode("step-0");
    if (view === "summary") setActiveNode("block-0");
  }, [view]);

  useEffect(() => {
    if (!result || !activeNode || activeNode === "core" || loggedNodes[activeNode]) return;

    const isTakeaway = activeNode.startsWith("block-");
    addActivity({
      title: isTakeaway ? "Viewed key takeaways" : "Explored visual nodes",
      subtitle: isTakeaway
        ? `Opened ${workspaceData.visualBlocks[Number(activeNode.replace("block-", ""))]?.label || "summary block"}`
        : `Expanded ${workspaceData.keyIdeas[Number(activeNode.replace("idea-", ""))]?.title || "learning node"}`,
      xp: 5,
      type: "transform"
    });
    setLoggedNodes((current) => ({ ...current, [activeNode]: true }));
  }, [activeNode, addActivity, loggedNodes, result, workspaceData.keyIdeas, workspaceData.visualBlocks]);

  async function transform() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/ai/transform", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.message || "Could not transform this content.");
      return;
    }

    const generatedCourse = createGeneratedCourseFromTransform({ text, result: data });
    addGeneratedCourse(generatedCourse);
    await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(generatedCourse)
    }).catch(() => null);
    addActivity({
      title: "Generated course",
      subtitle: `Created course ${generatedCourse.title}`,
      xp: 50,
      type: "transform"
    });
    setLoggedNodes({});
    setResult(data);
  }

  return (
    <main className="min-h-screen bg-midnight px-4 py-6 text-white sm:px-6 xl:px-8">
      <div className="fixed inset-0 bg-hero-grid bg-[length:42px_42px] opacity-20" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_25%_10%,rgba(34,211,238,0.16),transparent_24%),radial-gradient(circle_at_72%_20%,rgba(168,85,247,0.12),transparent_18%),linear-gradient(180deg,rgba(7,10,18,1),rgba(3,6,15,1))]" />
      <div className="relative">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/10"
          >
            Back to dashboard
          </Link>
          <ViewSwitcher view={view} setView={setView} />
        </div>

        <WorkspaceHeader result={result} />

        <section className="mt-8 grid gap-6 xl:grid-cols-[0.92fr_1.55fr_0.92fr]">
          <Panel className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase text-cyan-300">Source input</p>
                <h2 className="mt-2 text-2xl font-black">Paste content to transform</h2>
              </div>
              <motion.div
                animate={{ opacity: [0.35, 1, 0.35] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan-100"
              >
                Live prompt
              </motion.div>
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Suggestion</p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={placeholderIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-3 text-sm text-slate-300"
                >
                  {placeholderIdeas[placeholderIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={placeholderIdeas[placeholderIndex]}
              className="mt-5 min-h-[28rem] w-full resize-none rounded-[1.75rem] border border-white/10 bg-white/10 p-5 text-sm text-white outline-none focus:border-cyan-300"
            />

            <div className="mt-4 rounded-[1.3rem] border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Input readiness</p>
                  <p className="mt-2 text-lg font-black text-white">{Math.max(text.trim().split(/\s+/).filter(Boolean).length, 0)} words loaded</p>
                </div>
                <motion.div
                  animate={{ opacity: [0.45, 1, 0.45] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                  className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100"
                >
                  Typing mode
                </motion.div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {placeholderIdeas.map((idea, index) => (
                <button
                  key={idea}
                  type="button"
                  onClick={() => setText(idea)}
                  className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
                >
                  Prompt {index + 1}
                </button>
              ))}
            </div>

            {error ? <p className="mt-4 rounded-2xl bg-rose-500/15 p-3 text-sm text-rose-100">{error}</p> : null}

            <AnimatedButton onClick={transform} disabled={loading} className="mt-6 w-full justify-center px-6 py-4 disabled:opacity-60">
              {loading ? "Transforming..." : "Generate visual learning"}
            </AnimatedButton>
          </Panel>

          <Panel className="p-6">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-bold uppercase text-lime-300">Visual thinking mode</p>
                <h2 className="mt-2 text-3xl font-black">Workspace view</h2>
              </div>
              <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{activeDetail.meta}</p>
                <p className="mt-2 font-semibold text-white capitalize">{activeDetail.title}</p>
              </div>
            </div>

            {loading ? (
              <LoadingWorkspace />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={view}
                  initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -8, filter: "blur(8px)" }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  {view === "mind" ? (
                    <MindMapView data={workspaceData} activeNode={activeNode} setActiveNode={setActiveNode} />
                  ) : null}
                  {view === "flow" ? (
                    <FlowView data={workspaceData} activeNode={activeNode} setActiveNode={setActiveNode} />
                  ) : null}
                  {view === "summary" ? (
                    <SummaryView data={workspaceData} activeNode={activeNode} setActiveNode={setActiveNode} />
                  ) : null}
                </motion.div>
              </AnimatePresence>
            )}
          </Panel>

          <div className="grid gap-6">
            <Panel className="p-5">
              <p className="text-sm font-bold uppercase text-amber-300">Detail inspector</p>
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{activeDetail.eyebrow}</p>
              <h3 className="mt-2 text-2xl font-black capitalize text-white">{activeDetail.title}</h3>
              <p className="mt-3 text-sm text-slate-300">{activeDetail.detail}</p>
            </Panel>

            <Panel className="p-5">
              <p className="text-sm font-bold uppercase text-cyan-300">Core idea</p>
              <h3 className="mt-3 text-2xl font-black capitalize">{workspaceData.topic}</h3>
              <p className="mt-3 text-sm text-slate-300">{workspaceData.coreIdea}</p>
            </Panel>

            <Panel className="p-5">
              <p className="text-sm font-bold uppercase text-lime-300">Key takeaways</p>
              <div className="mt-4 grid gap-3">
                {workspaceData.takeaways.map((item, index) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.07 }}
                    className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4 text-sm text-slate-200"
                  >
                    {item}
                  </motion.div>
                ))}
              </div>
            </Panel>

            <Panel className="p-5">
              <p className="text-sm font-bold uppercase text-violet-300">Micro-learning steps</p>
              <div className="mt-4 space-y-3">
                {workspaceData.microLessons.map((item, index) => (
                  <div key={item} className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Sprint {index + 1}</p>
                    <p className="mt-2 text-sm text-slate-200">{item}</p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel className="p-5">
              <p className="text-sm font-bold uppercase text-amber-300">Quiz preview</p>
              <div className="mt-4">
                <QuizCard questions={workspaceData.quizQuestions} />
              </div>
            </Panel>
          </div>
        </section>
      </div>
    </main>
  );
}
