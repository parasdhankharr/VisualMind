export const rankRoadmap = [
  {
    title: "Initiate",
    minXp: 0,
    description: "Begins turning curiosity into disciplined attention.",
    tone: "foundation"
  },
  {
    title: "Seeker",
    minXp: 1500,
    description: "Commits to steady study with deliberate momentum.",
    tone: "foundation"
  },
  {
    title: "Catalyst",
    minXp: 4000,
    description: "Turns repetition into real comprehension and traction.",
    tone: "growth"
  },
  {
    title: "Vector",
    minXp: 7500,
    description: "Directs knowledge with precision, range, and control.",
    tone: "growth"
  },
  {
    title: "Ascendant",
    minXp: 12000,
    description: "Builds durable recall through measured consistency.",
    tone: "growth"
  },
  {
    title: "Luminary",
    minXp: 18000,
    description: "Transforms understanding into clarity, judgment, and consistency.",
    tone: "mastery"
  },
  {
    title: "Nexus",
    minXp: 25000,
    description: "Integrates knowledge across domains into a coherent mental system.",
    tone: "mastery"
  },
  {
    title: "Vanguard",
    minXp: 45000,
    description: "Advances through rare discipline, strategic depth, and intellectual range.",
    tone: "elite"
  },
  {
    title: "Zenith",
    minXp: 70000,
    description: "Operates near mastery with expansive command and calm authority.",
    tone: "elite"
  },
  {
    title: "Overmind",
    minXp: 100000,
    description: "Represents complete learning evolution through synthesis, wisdom, and restraint.",
    tone: "legendary"
  }
];

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value || 0)));
}

export function getRankMeta(xp) {
  const safeXp = Math.max(0, Number(xp) || 0);
  let currentRank = rankRoadmap[0];
  let currentIndex = 0;

  rankRoadmap.forEach((rank, index) => {
    if (safeXp >= rank.minXp) {
      currentRank = rank;
      currentIndex = index;
    }
  });

  const nextRank = rankRoadmap[currentIndex + 1] || null;
  const progress = nextRank
    ? clampPercent(((safeXp - currentRank.minXp) / Math.max(nextRank.minXp - currentRank.minXp, 1)) * 100)
    : 100;

  return {
    ...currentRank,
    index: currentIndex + 1,
    nextRank,
    progress,
    xpToNext: nextRank ? Math.max(0, nextRank.minXp - safeXp) : 0
  };
}
