import { DEFAULT_STEP_CONTENT, type StepContent } from "@/features/editor/types";
import type { Json } from "@/types/supabase";

export function parseStepContent(raw: Json): StepContent {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return DEFAULT_STEP_CONTENT;
  }
  const candidate = raw as Record<string, unknown>;
  return {
    body: typeof candidate.body === "string" ? candidate.body : DEFAULT_STEP_CONTENT.body,
    placement:
      candidate.placement === "top" ||
      candidate.placement === "bottom" ||
      candidate.placement === "left" ||
      candidate.placement === "right" ||
      candidate.placement === "center"
        ? candidate.placement
        : DEFAULT_STEP_CONTENT.placement,
    highlightPadding:
      typeof candidate.highlightPadding === "number"
        ? candidate.highlightPadding
        : DEFAULT_STEP_CONTENT.highlightPadding,
    borderRadius:
      typeof candidate.borderRadius === "number"
        ? candidate.borderRadius
        : DEFAULT_STEP_CONTENT.borderRadius,
    overlayOpacity:
      typeof candidate.overlayOpacity === "number"
        ? candidate.overlayOpacity
        : DEFAULT_STEP_CONTENT.overlayOpacity,
    showProgress:
      typeof candidate.showProgress === "boolean"
        ? candidate.showProgress
        : DEFAULT_STEP_CONTENT.showProgress,
    buttons: Array.isArray(candidate.buttons)
      ? (candidate.buttons as StepContent["buttons"])
      : DEFAULT_STEP_CONTENT.buttons,
  };
}
