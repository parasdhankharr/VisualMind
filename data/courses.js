export const demoCourses = [
  {
    id: "trigonometry-basics",
    title: "Trigonometry Basics",
    category: "Mathematics",
    level: "Beginner",
    duration: "42 min",
    xp: 480,
    color: "from-cyan-400 via-blue-500 to-violet-500",
    summary: "Understand angles, ratios, identities, and real-world triangle thinking.",
    lessons: [
      {
        id: "tri-1",
        title: "Sine, Cosine, Tangent",
        duration: "12 min",
        visual: "Wave ratios",
        bullets: [
          "Sine compares opposite side to hypotenuse.",
          "Cosine compares adjacent side to hypotenuse.",
          "Tangent compares opposite side to adjacent side."
        ],
        quiz: {
          question: "Which ratio is opposite divided by hypotenuse?",
          options: ["Sine", "Cosine", "Tangent", "Secant"],
          answer: "Sine"
        }
      },
      {
        id: "tri-2",
        title: "Unit Circle Memory Map",
        duration: "15 min",
        visual: "Circle compass",
        bullets: [
          "The unit circle has radius 1.",
          "Coordinates map to cosine and sine.",
          "Special angles repeat in predictable patterns."
        ],
        quiz: {
          question: "On the unit circle, x-coordinate represents what?",
          options: ["Cosine", "Sine", "Tangent", "Cotangent"],
          answer: "Cosine"
        }
      }
    ]
  },
  {
    id: "physics-motion",
    title: "Physics Motion",
    category: "Physics",
    level: "Intermediate",
    duration: "55 min",
    xp: 620,
    color: "from-lime-300 via-emerald-400 to-cyan-500",
    summary: "Master displacement, velocity, acceleration, and motion graphs.",
    lessons: [
      {
        id: "phy-1",
        title: "Velocity vs Speed",
        duration: "14 min",
        visual: "Motion trail",
        bullets: [
          "Speed is how fast something moves.",
          "Velocity includes speed and direction.",
          "Displacement measures change in position."
        ],
        quiz: {
          question: "What makes velocity different from speed?",
          options: ["Direction", "Mass", "Color", "Temperature"],
          answer: "Direction"
        }
      },
      {
        id: "phy-2",
        title: "Acceleration Graphs",
        duration: "18 min",
        visual: "Graph pulse",
        bullets: [
          "Acceleration is change in velocity over time.",
          "A steeper velocity-time graph means greater acceleration.",
          "Negative acceleration can mean slowing or changing direction."
        ],
        quiz: {
          question: "Acceleration measures change in what?",
          options: ["Velocity", "Mass", "Energy", "Volume"],
          answer: "Velocity"
        }
      }
    ]
  },
  {
    id: "biology-cells",
    title: "Biology Cells",
    category: "Biology",
    level: "Beginner",
    duration: "38 min",
    xp: 430,
    color: "from-pink-400 via-rose-500 to-orange-400",
    summary: "Explore cell structure, organelles, membranes, and energy systems.",
    lessons: [
      {
        id: "bio-1",
        title: "Organelles as a City",
        duration: "13 min",
        visual: "Cell city",
        bullets: [
          "The nucleus stores instructions.",
          "Mitochondria release usable energy.",
          "Ribosomes build proteins."
        ],
        quiz: {
          question: "Which organelle is often called the powerhouse?",
          options: ["Mitochondria", "Nucleus", "Ribosome", "Golgi body"],
          answer: "Mitochondria"
        }
      },
      {
        id: "bio-2",
        title: "Cell Membrane Gatekeeping",
        duration: "11 min",
        visual: "Membrane gates",
        bullets: [
          "The membrane controls what enters and leaves.",
          "Diffusion moves particles from high to low concentration.",
          "Selective permeability protects the cell."
        ],
        quiz: {
          question: "What does selective permeability mean?",
          options: [
            "Only some substances pass",
            "Everything passes",
            "Nothing passes",
            "Cells stop growing"
          ],
          answer: "Only some substances pass"
        }
      }
    ]
  }
];

export const leaderboard = [
  { name: "Aarav", xp: 4820, streak: 18 },
  { name: "Maya", xp: 4590, streak: 15 },
  { name: "Zoya", xp: 4210, streak: 12 },
  { name: "Kabir", xp: 3970, streak: 10 }
];
