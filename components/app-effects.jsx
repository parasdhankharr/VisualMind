"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { AnimatedBackground, PageTransition, ScrollProgress } from "@/components/animation-kit";

const TargetCursor = dynamic(() => import("./target-cursor"), { ssr: false });

export function AppEffects({ children }) {
  const pathname = usePathname();

  return (
    <>
      <AnimatedBackground />
      <ScrollProgress />
      <TargetCursor
        targetSelector="a, button, [data-cursor], .cursor-target"
        spinDuration={2}
        hideDefaultCursor={true}
        parallaxOn={true}
      />
      <PageTransition pathname={pathname}>{children}</PageTransition>
    </>
  );
}
