"use client";

import { usePathname } from "next/navigation";
import { AnimatedBackground, CustomCursor, PageTransition, ScrollProgress } from "@/components/animation-kit";

export function AppEffects({ children }) {
  const pathname = usePathname();

  return (
    <>
      <AnimatedBackground />
      <ScrollProgress />
      <CustomCursor />
      <PageTransition pathname={pathname}>{children}</PageTransition>
    </>
  );
}
