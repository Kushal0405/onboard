import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { STEP_TYPE_LABELS } from "@/features/editor/types";
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2 rounded-md border bg-background px-2 py-2",
        isSelected && "border-primary ring-1 ring-primary",
        isDragging && "opacity-50",
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        aria-label={`Reorder step ${index + 1}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <button type="button" onClick={onSelect} className="flex-1 truncate text-left text-sm">
        <span className="font-medium">{step.title || `Step ${index + 1}`}</span>
        <span className="ml-2 text-xs text-muted-foreground">{STEP_TYPE_LABELS[step.step_type]}</span>
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 opacity-0 transition-opacity group-hover:opacity-100"
        aria-label={`Delete step ${index + 1}`}
        onClick={onDelete}
      >
        <Trash2 className="size-3.5 text-destructive" />
      </Button>
    </div>
  );
}
