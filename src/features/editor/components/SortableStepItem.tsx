import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { STEP_TYPE_LABELS } from "@/features/editor/types";
import { STEP_TYPE_ICONS } from "@/features/editor/utils/stepTypeIcons";
import type { Step } from "@/features/editor/api/stepQueries";

interface SortableStepItemProps {
  step: Step;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function SortableStepItem({ step, index, isSelected, onSelect, onDelete }: SortableStepItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = STEP_TYPE_ICONS[step.step_type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2 rounded-lg border bg-card px-2 py-2 shadow-sm transition-colors",
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "hover:border-primary/40 hover:bg-accent/50",
        isDragging && "opacity-50",
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground/60 active:cursor-grabbing"
        aria-label={`Reorder step ${index + 1}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-md",
          isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-3.5" />
      </div>

      <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-medium leading-tight">
          {step.title || `Step ${index + 1}`}
        </p>
        <p className="text-xs text-muted-foreground">{STEP_TYPE_LABELS[step.step_type]}</p>
      </button>

      <Button
        variant="ghost"
        size="icon"
        className="size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
        aria-label={`Delete step ${index + 1}`}
        onClick={onDelete}
      >
        <Trash2 className="size-3.5 text-destructive" />
      </Button>
    </div>
  );
}
