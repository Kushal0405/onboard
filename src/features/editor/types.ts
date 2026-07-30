import type { Database } from "@/types/supabase";

export type StepType = Database["public"]["Enums"]["step_type"];

export type StepPlacement = "top" | "bottom" | "left" | "right" | "center";

export interface StepButtonConfig {
  label: string;
  action: "next" | "previous" | "dismiss" | "finish";
}

export interface StepContent {
  body: string;
  placement: StepPlacement;
  highlightPadding: number;
  borderRadius: number;
  overlayOpacity: number;
  showProgress: boolean;
  buttons: StepButtonConfig[];
}

export const DEFAULT_STEP_CONTENT: StepContent = {
  body: "",
  placement: "bottom",
  highlightPadding: 8,
  borderRadius: 8,
  overlayOpacity: 0.5,
  showProgress: true,
  buttons: [{ label: "Next", action: "next" }],
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
