"use client";

import { motion } from "framer-motion";
export { FadeUp as Reveal, PageTransition } from "@/components/animation-kit";

export function LegacyPageTransition({ children }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      {children}
    </motion.main>
  );
}
