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
  const topicBase = result?.infographic?.[0]?.value || text.split(/\s+/).slice(0, 3).join(" ") || "Custom Topic";
  const topic = toTitleCase(topicBase);
  const id = `${slugify(topic)}-${timestamp}`;
  const summaryPoints = result?.summary?.length
    ? result.summary
    : ["Break the topic into smaller connected study moments."];
  const infographic = result?.infographic?.length
    ? result.infographic
    : [
        {
          label: "Core Idea",
          value: topic.toLowerCase(),
          detail: "Start with the central explanation before expanding outward."
        }
      ];

  const concepts = [
    ...summaryPoints,
    ...infographic.map((item) => `${item.label}: ${item.detail}`)
  ].filter(Boolean);

  const lessons = summaryPoints.slice(0, 3).map((item, index) => {
    const visualHook = infographic[index % infographic.length];
    const keywords = item
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);
    const lessonTitle = toTitleCase(keywords.slice(0, 4).join(" ")) || `Lesson ${index + 1}`;
    const distractors = [
      `Ignore ${topic.toLowerCase()} and only memorize raw terms`,
      "Remove the structure and study without checkpoints",
      "Skip examples and avoid any recall step"
    ];

    return {
      id: `${id}-lesson-${index + 1}`,
      title: lessonTitle,
      duration: `${8 + index * 3} min`,
      visual: visualHook.label,
      explanation: `This lesson turns ${topic.toLowerCase()} into a smaller visual step focused on ${lessonTitle.toLowerCase()}.`,
      bullets: [
        item,
        visualHook.detail,
        `Use ${visualHook.value} as the memory anchor for this step.`
      ],
      quiz: {
        question: `Which option best explains ${lessonTitle.toLowerCase()}?`,
        options: [item, ...distractors].slice(0, 4),
        answer: item
      }
    };
  });

  return {
    id,
    title: topic.endsWith("Basics") ? topic : `${topic} Basics`,
    description: result?.simplified || `A visual learning path generated from your topic on ${topic}.`,
    category: topic,
    level: "Adaptive",
    duration: `${Math.max(lessons.length * 12, 18)} min`,
    xp: 0,
    progress: 0,
    color: courseGradients[timestamp % courseGradients.length],
    summary: result?.simplified || `A visual learning path generated from your topic on ${topic}.`,
    lessons,
    concepts,
    createdAt: timestamp
  };
}
