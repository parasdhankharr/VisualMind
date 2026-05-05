import { demoCourses } from "@/data/courses";

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "because",
  "been",
  "being",
  "by",
  "can",
  "could",
  "did",
  "do",
  "does",
  "for",
  "from",
  "had",
  "has",
  "have",
  "how",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "may",
  "might",
  "more",
  "most",
  "of",
  "on",
  "or",
  "our",
  "should",
  "since",
  "so",
  "than",
  "that",
  "the",
  "their",
  "there",
  "these",
  "they",
  "this",
  "those",
  "through",
  "to",
  "under",
  "use",
  "using",
  "was",
  "were",
  "what",
  "when",
  "where",
  "which",
  "while",
  "who",
  "why",
  "will",
  "with",
  "within",
  "would"
]);

const SIMPLE_REPLACEMENTS = [
  [/ is the process by which /gi, " is how "],
  [/ are the process by which /gi, " are how "],
  [/ in order to /gi, " to "],
  [/ due to the fact that /gi, " because "],
  [/ with the help of /gi, " using "],
  [/ facilitates /gi, " helps "],
  [/ utilize /gi, " use "],
  [/ demonstrates /gi, " shows "],
  [/ approximately /gi, " about "],
  [/ subsequently /gi, " then "],
  [/ moreover /gi, " also "],
  [/ therefore /gi, " so "],
  [/ enables /gi, " allows "],
  [/ occurs when /gi, " happens when "]
];

const ACTION_LABELS = [
  { pattern: /\b(captures?|absorbs?|stores?|gathers?)\b/i, relation: "captures", suffix: "Capture" },
  { pattern: /\b(converts?|changes?|transforms?|turns?)\b/i, relation: "transforms", suffix: "Conversion" },
  { pattern: /\b(releases?|emits?|outputs?)\b/i, relation: "releases", suffix: "Release" },
  { pattern: /\b(supports?|helps?|allows?|enables?)\b/i, relation: "supports", suffix: "Support" },
  { pattern: /\b(maintains?|balances?|regulates?|stabilizes?)\b/i, relation: "regulates", suffix: "Balance" },
  { pattern: /\b(creates?|produces?|builds?|forms?)\b/i, relation: "creates", suffix: "Creation" },
  { pattern: /\b(uses?|depends?|requires?|needs?)\b/i, relation: "depends on", suffix: "Use" },
  { pattern: /\b(explains?|describes?|defines?|means?|refers to)\b/i, relation: "explains", suffix: "Overview" }
];

export function findCourse(id) {
  return demoCourses.find((course) => course.id === id);
}

export function computeProgress(progress = {}) {
  const totalLessons = demoCourses.reduce((sum, course) => sum + course.lessons.length, 0);
  const completed = Object.keys(progress).filter((key) => progress[key]).length;
  return Math.round((completed / totalLessons) * 100);
}

function normalizeText(value = "") {
  return value.replace(/\s+/g, " ").trim();
}

function ensureSentence(value = "") {
  const text = normalizeText(value).replace(/\s+([,.;:!?])/g, "$1");
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

function splitSentences(value = "") {
  return normalizeText(value)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function simplifySentence(value = "") {
  let simplified = normalizeText(value)
    .replace(/;\s+/g, ". ")
    .replace(/,\s*which\s+/gi, ". This ")
    .replace(/,\s*allowing\s+/gi, ". This allows ")
    .replace(/,\s*leading to\s+/gi, ". This leads to ")
    .replace(/,\s*resulting in\s+/gi, ". This results in ");

  SIMPLE_REPLACEMENTS.forEach(([pattern, replacement]) => {
    simplified = simplified.replace(pattern, replacement);
  });

  return ensureSentence(simplified);
}

function buildReadableUnits(sentence = "") {
  return splitSentences(simplifySentence(sentence)).map((item) => ensureSentence(item));
}

function contentWords(value = "") {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

function uniqueByNormalized(items = []) {
  const seen = new Set();

  return items.filter((item) => {
    const key = normalizeText(item).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function wordFrequencies(sentences = []) {
  return sentences.reduce((accumulator, sentence) => {
    contentWords(sentence).forEach((word) => {
      accumulator[word] = (accumulator[word] || 0) + 1;
    });
    return accumulator;
  }, {});
}

function limitWords(value = "", maxWords = 4) {
  return normalizeText(value)
    .split(" ")
    .filter(Boolean)
    .slice(0, maxWords)
    .join(" ");
}

function cleanLabel(value = "", maxWords = 4) {
  return toTitleCase(
    limitWords(
      normalizeText(value)
        .replace(/[:;,]/g, " ")
        .replace(/\b(this|that|these|those|their|its|the|a|an)\b/gi, "")
        .replace(/\s+/g, " "),
      maxWords
    )
  );
}

function extractTopic(sentences = []) {
  const firstSentence = normalizeText(sentences[0] || "");
  const definitionMatch = firstSentence.match(
    /^(.*?)\s+(?:is|are|means|refers to|describes|explains|happens when|occurs when|works by|helps|allows)\b/i
  );
  const subject = definitionMatch?.[1]
    ?.replace(/^(the|a|an)\s+/i, "")
    .trim();

  if (subject) {
    return cleanLabel(subject, 5);
  }

  const rankedWords = Object.entries(wordFrequencies(sentences))
    .sort((left, right) => right[1] - left[1])
    .map(([word]) => word)
    .slice(0, 4);

  return cleanLabel(rankedWords.join(" "), 4) || "Core Concept";
}

function buildExplanation(sentences = []) {
  const lines = uniqueByNormalized(sentences.flatMap((sentence) => buildReadableUnits(sentence))).slice(0, 4);
  return lines.length ? lines : ["Add a complete paragraph to generate a clear explanation."];
}

function buildTakeaways(sentences = [], explanationLines = []) {
  const takeawayPool = [
    ...sentences.flatMap((sentence) => buildReadableUnits(sentence)),
    ...explanationLines
  ];

  return uniqueByNormalized(takeawayPool).slice(0, 5);
}

function leadingSubject(sentence = "") {
  return normalizeText(sentence)
    .replace(/^(this|these|those)\s+/i, "")
    .match(
      /^(.*?)\s+(?:is|are|uses?|captures?|absorbs?|stores?|converts?|changes?|transforms?|turns?|releases?|supports?|helps?|allows?|enables?|maintains?|balances?|regulates?|creates?|produces?|builds?|forms?|depends?|requires?|needs?|explains?|describes?|defines?|means?|refers to)\b/i
    )?.[1]
    ?.trim();
}

function extractAction(sentence = "") {
  return normalizeText(sentence).match(
    /\b(uses?|captures?|absorbs?|stores?|gathers?|converts?|changes?|transforms?|turns?|releases?|emits?|outputs?|supports?|helps?|allows?|enables?|maintains?|balances?|regulates?|stabilizes?|creates?|produces?|builds?|forms?|depends?|requires?|needs?|explains?|describes?|defines?|means?|refers to)\b\s+(.+?)(?:,|\.| because | so | that | to | by | with | while | when | if |$)/i
  );
}

function titleFromAction(sentence = "", topic = "") {
  const actionMatch = extractAction(sentence);
  if (!actionMatch) return "";

  const [, verb, rawObject] = actionMatch;
  const object = normalizeText(rawObject)
    .replace(/^(the|a|an)\s+/i, "")
    .replace(/\b(and|or)\b.*$/i, "")
    .trim();

  const actionConfig = ACTION_LABELS.find((item) => item.pattern.test(verb));
  const objectWords = contentWords(object);

  if (/\binto\b/i.test(rawObject)) {
    const target = rawObject.split(/\binto\b/i)[1];
    const targetWords = contentWords(target).slice(0, 3);
    if (targetWords.length) {
      return cleanLabel(`${targetWords.join(" ")} ${actionConfig?.suffix || "Concept"}`, 5);
    }
  }

  if (/releases?|emits?|outputs?/i.test(verb)) {
    const subject = leadingSubject(sentence);
    if (subject) {
      return cleanLabel(`${subject} ${actionConfig?.suffix || "Release"}`, 5);
    }
  }

  if (objectWords.length) {
    return cleanLabel(`${objectWords.slice(0, 3).join(" ")} ${actionConfig?.suffix || ""}`, 5);
  }

  const subject = leadingSubject(sentence);
  if (subject) {
    if (subject.toLowerCase() === topic.toLowerCase()) {
      return cleanLabel(`${subject} Process`, 5);
    }

    return cleanLabel(subject, 5);
  }

  return "";
}

function detectRelation(sentence = "") {
  const matched = ACTION_LABELS.find((item) => item.pattern.test(sentence));
  return matched?.relation || "connects";
}

function buildConcepts(sentences = [], topic = "", takeaways = []) {
  const conceptSources = uniqueByNormalized([
    ...sentences.map((sentence) => simplifySentence(sentence)),
    ...takeaways
  ]).slice(0, 4);

  return conceptSources.map((sentence, index) => ({
    id: `concept-${index}`,
    title: titleFromAction(sentence, topic) || cleanLabel(leadingSubject(sentence) || topic, 5) || `Concept ${index + 1}`,
    relation: detectRelation(sentence),
    explanation: ensureSentence(sentence)
  }));
}

function buildMindMap(topic = "", concepts = []) {
  return {
    core: topic,
    nodes: concepts.slice(0, 4).map((concept) => ({
      id: concept.id,
      label: cleanLabel(concept.title, 5),
      relation: concept.relation,
      detail: concept.explanation
    }))
  };
}

export function transformContent(text) {
  const clean = normalizeText(text);
  const sentences = splitSentences(clean);
  const topic = extractTopic(sentences);
  const coreExplanation = buildExplanation(sentences);
  const takeaways = buildTakeaways(sentences, coreExplanation);
  const concepts = buildConcepts(sentences, topic, takeaways);
  const summaryParagraph = coreExplanation.join(" ");
  const mindMap = buildMindMap(topic, concepts);

  return {
    topic,
    simplified: summaryParagraph,
    summary: coreExplanation,
    summaryParagraph,
    coreExplanation,
    takeaways,
    concepts,
    mindMap,
    infographic: mindMap.nodes.map((node) => ({
      label: node.relation,
      value: node.label,
      detail: node.detail
    }))
  };
}
