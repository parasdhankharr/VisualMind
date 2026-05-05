const courseGradients = [
  "from-cyan-400 via-blue-500 to-violet-500",
  "from-lime-300 via-emerald-400 to-cyan-500",
  "from-fuchsia-400 via-rose-500 to-orange-400",
  "from-violet-400 via-indigo-500 to-cyan-400"
];

function toTitleCase(value = "") {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function slugify(value = "") {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function normalizeText(value = "") {
  return value.replace(/\s+/g, " ").trim();
}

function sanitizePhrase(value = "") {
  return normalizeText(value)
    .replace(/\.\.\.+$/g, "")
    .replace(/\s+[^\w\s]+$/g, "")
    .trim();
}

function completeWords(value = "", maxWords = 10) {
  const words = sanitizePhrase(value).split(" ").filter(Boolean);
  return words.slice(0, maxWords).join(" ");
}

function finishSentence(value = "") {
  const text = sanitizePhrase(value);
  if (!text) return "";
  if (/[.!?]$/.test(text)) return text;
  return `${text}.`;
}

function sentenceParts(value = "") {
  return sanitizePhrase(value)
    .split(/[.!?]/)
    .map((part) => normalizeText(part))
    .filter(Boolean);
}

function compactLabel(value, maxWords = 4) {
  const cleaned = sanitizePhrase(value)
    .replace(/[:;,]/g, " ")
    .replace(/\b(the|and|that|with|from|into|through|because|which|while|where)\b/gi, "")
    .replace(/\s+/g, " ");
  return completeWords(cleaned, maxWords);
}

function firstSentence(value = "") {
  const [sentence] = sentenceParts(value);
  return finishSentence(sentence || sanitizePhrase(value));
}

function validateReadableText(value, fallback) {
  const text = finishSentence(value);
  if (!text || /\.\.\.$/.test(text) || /[A-Za-z]{2,}\.\.$/.test(text)) {
    return finishSentence(fallback);
  }
  return text;
}

function buildCourseQuestions(topic, lessons, ideas, summary) {
  const primary = ideas[0];
  const secondary = ideas[1] || ideas[0];
  const tertiary = ideas[2] || ideas[1] || ideas[0];
  const quaternary = ideas[3] || ideas[2] || ideas[0];

  const lessonQuestions = lessons.map((lesson, index) => {
    const correct = validateReadableText(lesson.bullets?.[0] || lesson.explanation || summary, `${lesson.title} explains the main idea.`);
    const options = [
      correct,
      validateReadableText(lesson.bullets?.[1] || `Memorize ${topic} without understanding it.`, `Memorize ${topic} without understanding it.`),
      validateReadableText(lesson.bullets?.[2] || "Treat every concept as unrelated.", "Treat every concept as unrelated."),
      `Ignore ${lesson.title.toLowerCase()} and guess the answer.`
    ];

    return {
      id: `${lesson.id}-q-${index}`,
      question: lesson.quiz?.question || `Which idea best matches ${lesson.title.toLowerCase()}?`,
      options,
      correctIndex: 0
    };
  });

  const generatedQuestions = [
    {
      id: `${slugify(topic)}-core-question`,
      question: `What is the core idea behind ${topic}?`,
      options: [
        primary?.detail || summary,
        `Memorize ${topic} without understanding it.`,
        "Treat the concepts as unrelated facts.",
        "Skip the structure and guess."
      ],
      correctIndex: 0
    },
    {
      id: `${slugify(topic)}-application-question`,
      question: `How should you apply ${secondary?.title || "this concept"}?`,
      options: [
        `Use ${secondary?.title || "the idea"} in a new example.`,
        "Repeat the definition without applying it.",
        "Avoid checking whether the idea fits.",
        "Ignore the visual model."
      ],
      correctIndex: 0
    },
    {
      id: `${slugify(topic)}-misconception-question`,
      question: `Which option shows a misconception about ${tertiary?.title || topic}?`,
      options: [
        "It should be studied as isolated facts only.",
        tertiary?.detail || summary,
        "It works better when concepts stay connected.",
        "Questions reveal weak understanding."
      ],
      correctIndex: 0
    },
    {
      id: `${slugify(topic)}-visual-question`,
      question: `Why does the visual breakdown help in ${topic}?`,
      options: [
        quaternary?.detail || summary,
        "It adds decoration without helping meaning.",
        "It replaces practice completely.",
        "It should be ignored once the paragraph is read."
      ],
      correctIndex: 0
    },
    {
      id: `${slugify(topic)}-recall-question`,
      question: "What is the best next step for stronger recall?",
      options: [
        "Answer questions and review mistakes.",
        "Read once and skip feedback.",
        "Avoid checking correct answers.",
        "Memorize random terms only."
      ],
      correctIndex: 0
    }
  ];

  return [...lessonQuestions, ...generatedQuestions]
    .filter((question, index, collection) => collection.findIndex((entry) => entry.question === question.question) === index)
    .slice(0, 5)
    .map((question) => ({
      ...question,
      question: finishSentence(question.question).replace(/\.$/, "?"),
      options: question.options.map((option) => finishSentence(option))
    }));
}

function buildCourseIdeas(topic, result, summaryPoints) {
  const conceptIdeas = (result?.concepts || []).map((item) => ({
    title: compactLabel(item.title || item.label || topic, 4),
    line: validateReadableText(firstSentence(item.explanation || item.detail || item.title || topic), `${item.title || topic} supports understanding.`),
    detail: finishSentence(item.explanation || item.detail || item.title || topic)
  }));

  const infographicIdeas = (result?.mindMap?.nodes || result?.infographic || []).map((item) => ({
    title: compactLabel(item.value || item.label || item.title || topic, 4),
    line: validateReadableText(firstSentence(item.detail || item.label || item.title || topic), `${item.label || topic} supports understanding.`),
    detail: finishSentence(item.detail || item.label || item.title || topic)
  }));

  const summaryIdeas = summaryPoints.map((item) => ({
    title: compactLabel(item, 4),
    line: validateReadableText(firstSentence(item), `${topic} has a key idea.`),
    detail: finishSentence(item)
  }));

  return [...conceptIdeas, ...infographicIdeas, ...summaryIdeas]
    .filter((item) => item.title && item.line)
    .filter((item, index, collection) => collection.findIndex((entry) => entry.title === item.title) === index)
    .slice(0, 5);
}

export function getRelativeTimeLabel(timestamp) {
  const diff = Math.max(0, Date.now() - timestamp);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "Just now";
  if (diff < hour) return `${Math.round(diff / minute)} min ago`;
  if (diff < day) return `${Math.round(diff / hour)} hr ago`;
  return `${Math.round(diff / day)} day ago`;
}

export function createGeneratedCourseFromTransform({ text, result }) {
  const timestamp = Date.now();
  const topicBase = result?.topic || result?.mindMap?.core || result?.infographic?.[0]?.value || text.split(/\s+/).slice(0, 3).join(" ") || "Custom Topic";
  const topic = toTitleCase(topicBase);
  const id = `${slugify(topic)}-${timestamp}`;
  const summaryPoints = result?.takeaways?.length
    ? result.takeaways
    : result?.coreExplanation?.length
    ? result.coreExplanation
    : result?.summary?.length
    ? result.summary
    : ["Break the topic into smaller connected study moments."];
  const infographic = result?.mindMap?.nodes?.length
    ? result.mindMap.nodes.map((node) => ({
        label: node.relation || "concept",
        value: node.label,
        detail: node.detail
      }))
    : result?.infographic?.length
    ? result.infographic
    : [
        {
          label: "Core Idea",
          value: topic.toLowerCase(),
          detail: "Start with the central explanation before expanding outward."
        }
      ];

  const ideas = buildCourseIdeas(topic, result, summaryPoints);
  const concepts = ideas.map((item) => `${item.title}: ${item.line}`);
  const description = finishSentence(result?.summaryParagraph || result?.simplified || summaryPoints[0] || `A visual learning path generated from your topic on ${topic}.`);

  const lessons = ideas.slice(0, 3).map((idea, index) => {
    const visualHook = infographic[index % infographic.length];
    const lessonTitle = toTitleCase(idea.title) || `Lesson ${index + 1}`;
    const distractors = [
      `Memorize ${compactLabel(topic.toLowerCase(), 3)} without structure`,
      "Remove checkpoints and chunking",
      "Skip examples and recall"
    ];

    return {
      id: `${id}-lesson-${index + 1}`,
      title: lessonTitle,
      duration: `${8 + index * 3} min`,
      visual: compactLabel(visualHook.value || visualHook.label, 3),
      explanation: validateReadableText(firstSentence(idea.detail), `${lessonTitle} explains the core idea.`),
      bullets: [
        validateReadableText(firstSentence(idea.detail), `${lessonTitle} covers a key idea.`),
        validateReadableText(firstSentence(visualHook.detail), `${visualHook.label} adds a visual cue.`),
        validateReadableText(
          finishSentence(summaryPoints[index] || `Use ${visualHook.value || visualHook.label} as a memory anchor.`),
          "Use the visual as a memory anchor."
        )
      ],
      quiz: {
        question: `Which option best explains ${lessonTitle.toLowerCase()}?`,
        options: [validateReadableText(firstSentence(idea.detail), `${lessonTitle} explains the core idea.`), ...distractors].slice(0, 4),
        answer: validateReadableText(firstSentence(idea.detail), `${lessonTitle} explains the core idea.`)
      }
    };
  });
  const questions = buildCourseQuestions(topic, lessons, ideas, description);

  return {
    id,
    title: topic,
    category: topic,
    level: "Adaptive",
    duration: `${Math.max(lessons.length * 12, 18)} min`,
    xp: 0,
    progress: 0,
    color: courseGradients[Math.abs(timestamp) % courseGradients.length],
    summary: description,
    description,
    lessons,
    questions,
    concepts,
    createdAt: timestamp
  };
}
