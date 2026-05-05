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
  "Paste one complete paragraph from your notes to generate a clean explanation, key takeaways, and concept map.",
  "Use a paragraph with causes, effects, or steps so the lab can turn it into structured learning.",
  "Try a policy, science, or history paragraph that needs clearer teaching language."
];

const quickExamples = [
  {
    label: "Biology",
    text: sampleText
  },
  {
    label: "Economics",
    text:
      "Inflation rises when prices increase across many goods and services over time. It reduces purchasing power, so the same amount of money buys less than before. Central banks respond by adjusting interest rates to slow demand and stabilize prices. If inflation stays high for too long, households and businesses face more uncertainty when they plan spending and investment."
  },
  {
    label: "Policy",
    text:
      "Digital governance refers to the rules and institutions that shape how technology affects society. Governments use policy to expand access, protect privacy, and guide how data is collected and used. Good governance can reduce inequality by making digital tools more affordable and trustworthy. Weak governance can deepen existing gaps because some groups benefit from technology faster than others."
  }
];

const draftStorageKey = "visualmind-ai-draft";

const viewOptions = [
  ["mind", "Mind Map"],
  ["flow", "Concept Flow"],
  ["summary", "Study Notes"]
];

const mindMapSlots = [
  { col: 1, row: 1, x: 17, y: 18 },
  { col: 3, row: 1, x: 83, y: 18 },
  { col: 1, row: 3, x: 17, y: 82 },
  { col: 3, row: 3, x: 83, y: 82 }
];

const conceptColors = [
  "from-cyan-400 via-blue-500 to-violet-500",
  "from-lime-300 via-emerald-400 to-cyan-500",
  "from-amber-300 via-orange-400 to-rose-500",
  "from-fuchsia-400 via-violet-500 to-cyan-400"
];

function normalizeText(value = "") {
  return value.replace(/\s+/g, " ").trim();
}

function sanitizePhrase(value = "") {
  return normalizeText(value)
    .replace(/\.\.\.+$/g, "")
    .replace(/\s+[^\w\s]+$/g, "")
    .trim();
}

function finishSentence(value = "") {
  const text = sanitizePhrase(value);
  if (!text) return "";
  if (/[.!?]$/.test(text)) return text;
  return `${text}.`;
}

function toTitleCase(value = "") {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function uniqueStrings(items = []) {
  const seen = new Set();

  return items.filter((item) => {
    const key = normalizeText(item).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function limitWords(value = "", maxWords = 5) {
  return normalizeText(value)
    .split(" ")
    .filter(Boolean)
    .slice(0, maxWords)
    .join(" ");
}

function compactLabel(value = "", maxWords = 5) {
  return toTitleCase(
    limitWords(
      normalizeText(value)
        .replace(/[:;,]/g, " ")
        .replace(/\b(the|and|that|with|from|into|through|because|which|while|where|this|these|those)\b/gi, "")
        .replace(/\s+/g, " "),
      maxWords
    )
  );
}

function deriveFallbackTopic(text = "") {
  const firstSentence = normalizeText(text).split(/(?<=[.!?])\s+/)[0] || "";
  const definitionMatch = firstSentence.match(
    /^(.*?)\s+(?:is|are|means|refers to|describes|explains|happens when|occurs when|helps|allows)\b/i
  );
  const subject = definitionMatch?.[1]?.replace(/^(the|a|an)\s+/i, "").trim();

  if (subject) {
    return compactLabel(subject, 5) || "Core Concept";
  }

  const keywords = normalizeText(text)
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 4);

  return compactLabel(keywords.join(" "), 4) || "Core Concept";
}

function Panel({ children, className = "" }) {
  return <div className={`glass glow-ring overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 ${className}`}>{children}</div>;
}

function WorkspaceHeader({ result }) {
  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div>
        <p className="text-sm font-bold uppercase text-cyan-300">AI Transform Lab</p>
        <h1 className="mt-3 text-4xl font-black leading-none sm:text-5xl">Turn one paragraph into real learning.</h1>
        <p className="mt-4 max-w-3xl text-sm text-slate-300 sm:text-base">
          The lab now focuses on understanding content clearly: one clean explanation, meaningful takeaways, a concept breakdown, and a compact map of relationships.
        </p>
      </div>
      <div className="max-w-md rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Current output</p>
        <p className="mt-2 text-lg font-black text-white">{result ? result.topic : "Waiting for source material"}</p>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-300">
          {result ? result.summaryParagraph : "Paste a paragraph to generate a structured explanation."}
        </p>
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

function buildFallbackWorkspaceData(text = "") {
  const topic = deriveFallbackTopic(text);
  const takeaways = [
    "The lab rewrites the paragraph in simpler language without breaking sentences.",
    "Key takeaways stay tied to the source paragraph instead of using generic filler.",
    "The concept breakdown separates the paragraph into a few clear teaching ideas."
  ].map((item, index) => ({
    id: `takeaway-${index}`,
    text: finishSentence(item)
  }));

  const concepts = [
    {
      id: "concept-0",
      title: "Clear Explanation",
      relation: "explains",
      explanation: "The first section restates the paragraph in simple, complete language so the main idea stays intact."
    },
    {
      id: "concept-1",
      title: "Real Takeaways",
      relation: "highlights",
      explanation: "Important points are pulled directly from the paragraph and presented as useful study bullets."
    },
    {
      id: "concept-2",
      title: "Concept Structure",
      relation: "organizes",
      explanation: "The paragraph is grouped into a few logical concepts so it feels like a teacher-guided breakdown."
    }
  ].map((concept, index) => ({
    ...concept,
    fullTitle: concept.title,
    color: conceptColors[index % conceptColors.length]
  }));

  return {
    topic,
    coreExplanation: [
      "Paste a complete paragraph to generate a teacher-style explanation.",
      "The lab will keep sentences whole, extract meaningful takeaways, and build a compact concept map."
    ].map((item) => finishSentence(item)),
    summaryParagraph:
      "Paste a complete paragraph to generate a teacher-style explanation. The lab will keep sentences whole, extract meaningful takeaways, and build a compact concept map.",
    takeaways,
    concepts,
    mindMap: {
      core: topic,
      nodes: concepts.map((concept) => ({
        id: concept.id,
        title: concept.title,
        relation: concept.relation,
        explanation: concept.explanation,
        color: concept.color
      }))
    }
  };
}

function deriveWorkspaceData(text, result) {
  if (!result) {
    return buildFallbackWorkspaceData(text);
  }

  const topic = result.topic || deriveFallbackTopic(text);
  const coreExplanation = uniqueStrings(
    (result.coreExplanation || result.summary || [result.summaryParagraph || result.simplified || ""])
      .map((item) => finishSentence(item))
      .filter(Boolean)
  ).slice(0, 4);

  const summaryParagraph = finishSentence(result.summaryParagraph || result.simplified || coreExplanation.join(" "));
  const takeaways = uniqueStrings((result.takeaways || result.summary || coreExplanation).map((item) => finishSentence(item)))
    .slice(0, 5)
    .map((item, index) => ({
      id: `takeaway-${index}`,
      text: item
    }));

  const sourceConcepts = (result.concepts || []).length
    ? result.concepts
    : takeaways.map((item, index) => ({
        id: `concept-${index}`,
        title: compactLabel(item.text, 4),
        relation: "connects",
        explanation: item.text
      }));

  const concepts = sourceConcepts.slice(0, 4).map((concept, index) => ({
    id: concept.id || `concept-${index}`,
    title: compactLabel(concept.title || concept.label || topic, 5) || `Concept ${index + 1}`,
    fullTitle: toTitleCase(normalizeText(concept.title || concept.label || topic || `Concept ${index + 1}`)),
    relation: normalizeText(concept.relation || concept.label || "connects").toLowerCase(),
    explanation: finishSentence(concept.explanation || concept.detail || takeaways[index]?.text || coreExplanation[index] || summaryParagraph),
    color: conceptColors[index % conceptColors.length]
  }));

  return {
    topic,
    coreExplanation,
    summaryParagraph,
    takeaways,
    concepts,
    mindMap: {
      core: topic,
      nodes: concepts.map((concept) => ({
        id: concept.id,
        title: concept.title,
        relation: concept.relation,
        explanation: concept.explanation,
        color: concept.color
      }))
    }
  };
}

function resolveActiveDetail(data, activeNode) {
  if (activeNode === "core") {
    return {
      title: data.topic,
      detail: data.summaryParagraph,
      eyebrow: "Summary",
      meta: "Core explanation"
    };
  }

  const conceptNode = data.concepts.find((concept) => concept.id === activeNode);
  if (conceptNode) {
    return {
      title: conceptNode.fullTitle,
      detail: conceptNode.explanation,
      eyebrow: `Relation: ${conceptNode.relation}`,
      meta: "Concept focus"
    };
  }

  const takeawayNode = data.takeaways.find((item) => item.id === activeNode);
  if (takeawayNode) {
    return {
      title: "Key takeaway",
      detail: takeawayNode.text,
      eyebrow: "Study note",
      meta: "Important idea"
    };
  }

  return {
    title: "Select a concept",
    detail: "Choose a node, concept card, or takeaway to inspect its meaning in more detail.",
    eyebrow: "Focus panel",
    meta: "Awaiting selection"
  };
}

function MindMapNode({ node, isActive, onClick, className = "" }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -3 }}
      whileTap={{ scale: 0.99 }}
      className={`group relative w-full rounded-[1.45rem] border p-4 text-left backdrop-blur-xl transition ${
        isActive ? "border-cyan-200/60 bg-white/14" : "border-white/10 bg-white/8 hover:border-white/20"
      } ${className}`}
    >
      <div className={`h-1.5 w-14 rounded-full bg-gradient-to-r ${node.color}`} />
      <p className="mt-4 line-clamp-2 text-lg font-black leading-tight text-white">{node.title}</p>
      <span className="mt-3 inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">
        {node.relation}
      </span>
    </motion.button>
  );
}

function MindMapView({ data, activeNode, setActiveNode }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.96))] p-5 sm:p-7">
      <div className="relative hidden min-h-[31rem] lg:block">
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {data.mindMap.nodes.map((node, index) => {
            const slot = mindMapSlots[index];
            return (
              <motion.line
                key={node.id}
                x1="50"
                y1="50"
                x2={slot.x}
                y2={slot.y}
                stroke="rgba(103,232,249,0.4)"
                strokeWidth="0.45"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.7, delay: index * 0.08 }}
              />
            );
          })}
        </svg>

        <div className="grid min-h-[31rem] grid-cols-3 grid-rows-3 gap-8">
          {data.mindMap.nodes.map((node, index) => {
            const slot = mindMapSlots[index];

            return (
              <div
                key={node.id}
                className={`flex ${slot.col === 3 ? "justify-end" : "justify-start"} ${slot.row === 3 ? "items-end" : "items-start"}`}
                style={{ gridColumn: slot.col, gridRow: slot.row }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, x: slot.col === 1 ? -14 : 14, y: slot.row === 1 ? -14 : 14 }}
                  animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.14 + index * 0.08 }}
                  className="max-w-[13rem]"
                >
                  <MindMapNode node={node} isActive={activeNode === node.id} onClick={() => setActiveNode(node.id)} />
                </motion.div>
              </div>
            );
          })}

          <div className="flex items-center justify-center" style={{ gridColumn: 2, gridRow: 2 }}>
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45 }}
              whileHover={{ scale: 1.02 }}
              className="w-full max-w-[15rem] rounded-[1.85rem] border border-cyan-200/30 bg-slate-950/70 p-5 text-left shadow-[0_16px_42px_rgba(0,0,0,0.22)] backdrop-blur-xl"
              onClick={() => setActiveNode("core")}
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Core topic</p>
              <h3 className="mt-3 line-clamp-2 text-2xl font-black text-white">{data.topic}</h3>
              <p className="mt-4 text-sm text-slate-300">{data.mindMap.nodes.length} connected ideas</p>
            </motion.button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:hidden">
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          whileHover={{ scale: 1.01 }}
          className="rounded-[1.85rem] border border-cyan-200/30 bg-slate-950/70 p-5 text-left shadow-[0_16px_42px_rgba(0,0,0,0.22)] backdrop-blur-xl"
          onClick={() => setActiveNode("core")}
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Core topic</p>
          <h3 className="mt-3 text-2xl font-black text-white">{data.topic}</h3>
          <p className="mt-4 text-sm text-slate-300">{data.mindMap.nodes.length} connected ideas</p>
        </motion.button>

        <div className="grid gap-4 sm:grid-cols-2">
          {data.mindMap.nodes.map((node, index) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.12 + index * 0.08 }}
            >
              <MindMapNode node={node} isActive={activeNode === node.id} onClick={() => setActiveNode(node.id)} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConceptFlowView({ data, activeNode, setActiveNode }) {
  return (
    <div className="grid min-h-[31rem] gap-4 rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 lg:grid-cols-2">
      {data.concepts.map((concept, index) => (
        <motion.button
          key={concept.id}
          type="button"
          onClick={() => setActiveNode(concept.id)}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.08 }}
          whileHover={{ y: -4, scale: 1.01 }}
          className={`rounded-[1.75rem] border p-5 text-left transition ${
            activeNode === concept.id ? "border-cyan-200/50 bg-white/10" : "border-white/10 bg-white/5"
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Concept {index + 1}</p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <h3 className="text-2xl font-black text-white">{concept.fullTitle}</h3>
            <span className="shrink-0 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">
              {concept.relation}
            </span>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-300">{concept.explanation}</p>
        </motion.button>
      ))}
    </div>
  );
}

function StudyNotesView({ data, activeNode, setActiveNode }) {
  return (
    <div className="grid min-h-[31rem] gap-4 rounded-[2rem] border border-white/10 bg-slate-950/70 p-6">
      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Core explanation</p>
        <div className="mt-4 space-y-3">
          {data.coreExplanation.map((line, index) => (
            <motion.p
              key={`explanation-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.07 }}
              className="text-sm leading-7 text-slate-200"
            >
              {line}
            </motion.p>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {data.takeaways.map((item, index) => (
          <motion.button
            key={item.id}
            type="button"
            onClick={() => setActiveNode(item.id)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.12 + index * 0.06 }}
            whileHover={{ y: -3 }}
            className={`rounded-[1.45rem] border p-4 text-left transition ${
              activeNode === item.id ? "border-cyan-200/50 bg-white/10" : "border-white/10 bg-white/[0.04]"
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Takeaway {index + 1}</p>
            <p className="mt-3 text-sm leading-7 text-slate-200">{item.text}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function FocusPanel({ detail }) {
  return (
    <Panel className="p-5">
      <p className="text-sm font-bold uppercase text-amber-300">Selected focus</p>
      <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{detail.eyebrow}</p>
      <h3 className="mt-2 text-2xl font-black text-white">{detail.title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300">{detail.detail}</p>
    </Panel>
  );
}

function DetailPanel({ data, activeNode, setActiveNode }) {
  return (
    <Panel className="p-5">
      <p className="text-sm font-bold uppercase text-lime-300">Learning notes</p>

      <section className="mt-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Summary</p>
        <p className="mt-3 text-sm leading-7 text-slate-200">{data.summaryParagraph}</p>
      </section>

      <section className="mt-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Key takeaways</p>
        <div className="mt-4 space-y-3">
          {data.takeaways.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveNode(item.id)}
              className={`w-full rounded-[1.25rem] border p-4 text-left text-sm leading-7 transition ${
                activeNode === item.id ? "border-cyan-200/50 bg-white/10 text-white" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
              }`}
            >
              <span className="mr-2 text-cyan-200">{index + 1}.</span>
              {item.text}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Concept breakdown</p>
        <div className="mt-4 space-y-3">
          {data.concepts.map((concept, index) => (
            <button
              key={concept.id}
              type="button"
              onClick={() => setActiveNode(concept.id)}
              className={`w-full rounded-[1.35rem] border p-4 text-left transition ${
                activeNode === concept.id ? "border-cyan-200/50 bg-white/10" : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-white">{concept.fullTitle}</p>
                <span className="shrink-0 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">
                  {concept.relation}
                </span>
              </div>
              <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-300">{concept.explanation}</p>
              <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Concept {index + 1}</p>
            </button>
          ))}
        </div>
      </section>
    </Panel>
  );
}

function LoadingWorkspace() {
  return (
    <div className="grid min-h-[31rem] place-items-center rounded-[2rem] border border-white/10 bg-slate-950/70 p-6">
      <div className="w-full max-w-3xl space-y-6">
        <div className="h-6 w-48 animate-pulse rounded-full bg-white/10" />
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-40 animate-pulse rounded-[1.5rem] bg-white/10" />
          ))}
        </div>
        <div className="h-24 animate-pulse rounded-[1.75rem] bg-white/10" />
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
  const { addActivity, recordGeneratedCourse } = useLearningStore();

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
    if (view === "mind") {
      setActiveNode("core");
      return;
    }

    if (view === "flow") {
      setActiveNode(workspaceData.concepts[0]?.id || "core");
      return;
    }

    setActiveNode(workspaceData.takeaways[0]?.id || workspaceData.concepts[0]?.id || "core");
  }, [view, workspaceData.concepts, workspaceData.takeaways]);

  useEffect(() => {
    if (!result || !activeNode || activeNode === "core" || loggedNodes[activeNode]) return;

    const activeConcept = workspaceData.concepts.find((concept) => concept.id === activeNode);
    const activeTakeaway = workspaceData.takeaways.find((item) => item.id === activeNode);

    addActivity({
      title: activeConcept ? "Explored concept breakdown" : "Reviewed key takeaway",
      subtitle: activeConcept ? `Opened ${activeConcept.fullTitle}` : activeTakeaway?.text || "Reviewed an important idea",
      xp: 0,
      type: "transform"
    });

    setLoggedNodes((current) => ({ ...current, [activeNode]: true }));
  }, [activeNode, addActivity, loggedNodes, result, workspaceData.concepts, workspaceData.takeaways]);

  async function transform() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/ai/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Could not transform this content.");
        return;
      }

      const generatedCourse = createGeneratedCourseFromTransform({ text, result: data });
      recordGeneratedCourse(generatedCourse);

      await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generatedCourse)
      }).catch(() => null);

      setLoggedNodes({});
      setResult(data);
      setActiveNode("core");
      setView("mind");
    } catch (transformError) {
      setError(transformError?.message || "Could not transform this content.");
    } finally {
      setLoading(false);
    }
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

        <section className="mt-8 grid gap-6 xl:grid-cols-[0.96fr_1.52fr_0.94fr]">
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
                Paragraph mode
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
                  className="mt-3 text-sm leading-7 text-slate-300"
                >
                  {placeholderIdeas[placeholderIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={placeholderIdeas[placeholderIndex]}
              className="mt-5 min-h-[28rem] w-full resize-none rounded-[1.75rem] border border-white/10 bg-white/10 p-5 text-sm leading-7 text-white outline-none focus:border-cyan-300"
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
                  Teacher pass
                </motion.div>
              </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {quickExamples.map((example) => (
                <button
                  key={example.label}
                  type="button"
                  onClick={() => setText(example.text)}
                  className="rounded-[1.1rem] border border-white/10 px-3 py-3 text-left text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">{example.label}</p>
                  <p className="mt-2 line-clamp-3 leading-6">{example.text}</p>
                </button>
              ))}
            </div>

            {error ? <p className="mt-4 rounded-2xl bg-rose-500/15 p-3 text-sm text-rose-100">{error}</p> : null}

            <AnimatedButton onClick={transform} disabled={loading} className="mt-6 w-full justify-center px-6 py-4 disabled:opacity-60">
              {loading ? "Building study guide..." : "Generate structured learning"}
            </AnimatedButton>
          </Panel>

          <Panel className="p-6">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-bold uppercase text-lime-300">Structured learning view</p>
                <h2 className="mt-2 text-3xl font-black">Workspace</h2>
              </div>
              <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{activeDetail.meta}</p>
                <p className="mt-2 max-w-[18rem] font-semibold text-white">{activeDetail.title}</p>
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
                  {view === "mind" ? <MindMapView data={workspaceData} activeNode={activeNode} setActiveNode={setActiveNode} /> : null}
                  {view === "flow" ? <ConceptFlowView data={workspaceData} activeNode={activeNode} setActiveNode={setActiveNode} /> : null}
                  {view === "summary" ? <StudyNotesView data={workspaceData} activeNode={activeNode} setActiveNode={setActiveNode} /> : null}
                </motion.div>
              </AnimatePresence>
            )}
          </Panel>

          <div className="grid gap-6">
            {activeNode !== "core" ? <FocusPanel detail={activeDetail} /> : null}
            <DetailPanel data={workspaceData} activeNode={activeNode} setActiveNode={setActiveNode} />
          </div>
        </section>
      </div>
    </main>
  );
}
