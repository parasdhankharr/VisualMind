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
    questions: [
      {
        id: "trig-q1",
        question: "Which ratio compares the opposite side to the hypotenuse?",
        options: ["Sine", "Cosine", "Tangent", "Secant"],
        correctIndex: 0
      },
      {
        id: "trig-q2",
        question: "What does cosine represent in a right triangle?",
        options: [
          "Adjacent divided by hypotenuse",
          "Opposite divided by hypotenuse",
          "Opposite divided by adjacent",
          "Hypotenuse divided by opposite"
        ],
        correctIndex: 0
      },
      {
        id: "trig-q3",
        question: "Why is the unit circle useful in trigonometry?",
        options: [
          "It links angles to cosine and sine coordinates",
          "It removes the need for ratios",
          "It works only for triangles with equal sides",
          "It replaces every trigonometric identity"
        ],
        correctIndex: 0
      },
      {
        id: "trig-q4",
        question: "If a learner needs the opposite-to-adjacent ratio, which function should they use?",
        options: ["Tangent", "Cosine", "Sine", "Secant"],
        correctIndex: 0
      },
      {
        id: "trig-q5",
        question: "What is the strongest way to use trigonometry in a new problem?",
        options: [
          "Match the triangle sides to the right ratio",
          "Memorize formulas without checking the diagram",
          "Ignore angle positions and guess",
          "Use every ratio at once"
        ],
        correctIndex: 0
      }
    ],
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
    questions: [
      {
        id: "motion-q1",
        question: "What makes velocity different from speed?",
        options: ["Velocity includes direction", "Velocity measures only time", "Velocity ignores displacement", "Velocity depends on mass"],
        correctIndex: 0
      },
      {
        id: "motion-q2",
        question: "What does acceleration describe?",
        options: [
          "Change in velocity over time",
          "Distance covered in one instant",
          "Force divided by area",
          "Energy stored in motion"
        ],
        correctIndex: 0
      },
      {
        id: "motion-q3",
        question: "What does a steeper velocity-time graph usually indicate?",
        options: ["Greater acceleration", "Lower displacement", "No motion", "Constant mass"],
        correctIndex: 0
      },
      {
        id: "motion-q4",
        question: "A car slows while moving forward. Which statement is most accurate?",
        options: [
          "It has negative acceleration relative to its direction",
          "Its velocity becomes zero instantly",
          "Its displacement stops changing",
          "Its speed and velocity must both increase"
        ],
        correctIndex: 0
      },
      {
        id: "motion-q5",
        question: "What is the best way to interpret a motion graph?",
        options: [
          "Connect the graph shape to how velocity changes",
          "Focus only on the color of the line",
          "Assume every straight line means acceleration",
          "Ignore the axes and estimate from memory"
        ],
        correctIndex: 0
      }
    ],
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
    questions: [
      {
        id: "cells-q1",
        question: "Which organelle stores the cell's genetic instructions?",
        options: ["Nucleus", "Ribosome", "Mitochondria", "Cell membrane"],
        correctIndex: 0
      },
      {
        id: "cells-q2",
        question: "Why are mitochondria called the powerhouse of the cell?",
        options: [
          "They release usable energy for the cell",
          "They store all DNA",
          "They control what enters the cell",
          "They build every protein directly"
        ],
        correctIndex: 0
      },
      {
        id: "cells-q3",
        question: "What is the main role of the cell membrane?",
        options: [
          "Control what enters and leaves the cell",
          "Produce all proteins",
          "Store all energy molecules",
          "Create the nucleus"
        ],
        correctIndex: 0
      },
      {
        id: "cells-q4",
        question: "What does diffusion describe in cell transport?",
        options: [
          "Particles moving from high to low concentration",
          "Particles moving only with a pump",
          "DNA moving into the nucleus",
          "Water turning into energy"
        ],
        correctIndex: 0
      },
      {
        id: "cells-q5",
        question: "Which idea best explains selective permeability?",
        options: [
          "The membrane allows some substances through but not all",
          "Every substance can pass freely",
          "Nothing can cross the membrane",
          "Only energy leaves the cell"
        ],
        correctIndex: 0
      }
    ],
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
  { name: "Aarav", xp: 4820, streak: 18, weeklyXp: 320, movement: 1 },
  { name: "Maya", xp: 4590, streak: 15, weeklyXp: 260, movement: 0 },
  { name: "Zoya", xp: 4210, streak: 12, weeklyXp: 210, movement: 1 },
  { name: "Kabir", xp: 3970, streak: 10, weeklyXp: 170, movement: -1 }
];
