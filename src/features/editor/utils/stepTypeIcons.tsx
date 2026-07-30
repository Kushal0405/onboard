import {
  AlertTriangle,
  CheckSquare,
  CircleDot,
  Layers,
  type LucideIcon,
  MessageSquare,
  MessageSquareText,
  MonitorPlay,
  Sparkles,
  SquareStack,
} from "lucide-react";

import type { StepType } from "@/features/editor/types";

export const STEP_TYPE_ICONS: Record<StepType, LucideIcon> = {
  tooltip: MessageSquare,
  modal: MonitorPlay,
  hotspot: CircleDot,
  beacon: Sparkles,
  checklist: CheckSquare,
  announcement: MessageSquareText,
  banner: AlertTriangle,
  floating_card: SquareStack,
  confirmation: Layers,
};
