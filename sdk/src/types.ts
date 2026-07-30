export type StepType =
  | "tooltip"
  | "modal"
  | "hotspot"
  | "beacon"
  | "checklist"
  | "announcement"
  | "banner"
  | "floating_card"
  | "confirmation";

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

export interface PublicStep {
  id: string;
  stepType: StepType;
  position: number;
  title: string | null;
  content: StepContent;
  targetSelector: string | null;
}

export interface PublicTour {
  id: string;
  name: string;
  tourVersionId: string;
  steps: PublicStep[];
}

export interface GetTourResponse {
  tours: PublicTour[];
}

export interface OnboardFlowUser {
  id: string;
  email?: string;
  name?: string;
  [key: string]: unknown;
}
