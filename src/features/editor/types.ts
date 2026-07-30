import type { Database } from "@/types/supabase";

export type StepType = Database["public"]["Enums"]["step_type"];

export type StepPlacement = "top" | "bottom" | "left" | "right" | "center";

export type StepAnimation = "none" | "fade" | "slide";

export interface StepButtonConfig {
  label: string;
  action: "next" | "previous" | "dismiss" | "finish";
}

export interface ChecklistItem {
  id: string;
  label: string;
}

export interface StepContent {
  body: string;
  placement: StepPlacement;
  highlightPadding: number;
  borderRadius: number;
  overlayOpacity: number;
  showProgress: boolean;
  animation: StepAnimation;
  buttons: StepButtonConfig[];
  checklistItems: ChecklistItem[];
  confirmLabel: string;
  cancelLabel: string;
}

export const DEFAULT_STEP_CONTENT: StepContent = {
  body: "",
  placement: "bottom",
  highlightPadding: 8,
  borderRadius: 8,
  overlayOpacity: 0.5,
  showProgress: true,
  animation: "fade",
  buttons: [{ label: "Next", action: "next" }],
  checklistItems: [],
  confirmLabel: "Confirm",
  cancelLabel: "Cancel",
};

export const STEP_TYPE_LABELS: Record<StepType, string> = {
  tooltip: "Tooltip",
  modal: "Modal",
  hotspot: "Hotspot",
  beacon: "Beacon",
  checklist: "Checklist",
  announcement: "Announcement",
  banner: "Banner",
  floating_card: "Floating Card",
  confirmation: "Confirmation",
};

export const STEP_TYPE_DESCRIPTIONS: Record<StepType, string> = {
  tooltip: "Contextual guidance pointing at a specific element",
  modal: "Global announcement centered on the page, grabs full attention",
  hotspot: "A subtle marker users can click to reveal more info",
  beacon: "A pulsing dot that expands into a tooltip on click",
  checklist: "A list of tasks for users to complete in order",
  announcement: "Centered message for broad updates or news",
  banner: "A slim bar pinned to the top of the page",
  floating_card: "A card anchored near an element, less disruptive than a modal",
  confirmation: "Ask users to confirm or cancel before proceeding",
};

export const STEP_TYPES: StepType[] = [
  "tooltip",
  "modal",
  "hotspot",
  "beacon",
  "checklist",
  "announcement",
  "banner",
  "floating_card",
  "confirmation",
];

/** Step types anchored to a target DOM element (need placement + highlight styling). */
export const TARGETED_STEP_TYPES: StepType[] = ["tooltip", "hotspot", "beacon", "floating_card"];

/** Step types that render as a centered overlay (placement is always "center"). */
export const CENTERED_STEP_TYPES: StepType[] = ["modal", "announcement", "confirmation"];

export function stepSupportsTargeting(stepType: StepType): boolean {
  return TARGETED_STEP_TYPES.includes(stepType);
}
