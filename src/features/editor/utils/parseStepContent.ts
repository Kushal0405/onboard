import { DEFAULT_STEP_CONTENT, type ChecklistItem, type StepContent } from "@/features/editor/types";
import type { Json } from "@/types/supabase";

function isChecklistItem(value: unknown): value is ChecklistItem {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ChecklistItem).id === "string" &&
    typeof (value as ChecklistItem).label === "string"
  );
}

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
    animation:
      candidate.animation === "none" || candidate.animation === "fade" || candidate.animation === "slide"
        ? candidate.animation
        : DEFAULT_STEP_CONTENT.animation,
    buttons: Array.isArray(candidate.buttons)
      ? (candidate.buttons as StepContent["buttons"])
      : DEFAULT_STEP_CONTENT.buttons,
    checklistItems: Array.isArray(candidate.checklistItems)
      ? candidate.checklistItems.filter(isChecklistItem)
      : DEFAULT_STEP_CONTENT.checklistItems,
    confirmLabel:
      typeof candidate.confirmLabel === "string"
        ? candidate.confirmLabel
        : DEFAULT_STEP_CONTENT.confirmLabel,
    cancelLabel:
      typeof candidate.cancelLabel === "string"
        ? candidate.cancelLabel
        : DEFAULT_STEP_CONTENT.cancelLabel,
  };
}
