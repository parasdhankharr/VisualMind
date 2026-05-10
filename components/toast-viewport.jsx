"use client";

import { useLearningStore } from "@/store/use-learning-store";
import { ToastStack } from "@/components/learning-surfaces";

export function ToastViewport() {
  const { toasts, dismissToast } = useLearningStore();

  if (!Array.isArray(toasts) || !toasts.length) {
    return null;
  }

  return <ToastStack toasts={toasts} onDismiss={dismissToast} />;
}
