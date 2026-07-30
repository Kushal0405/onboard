import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { STEP_TYPE_ICONS } from "@/features/editor/utils/stepTypeIcons";
import type { Step } from "@/features/editor/api/stepQueries";

interface SortableStepChipProps {
  step: Step;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function SortableStepChip({ step, index, isSelected, onSelect, onDelete }: SortableStepChipProps) {
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
        "group flex shrink-0 items-center gap-1.5 rounded-full border py-1 pl-1.5 pr-2 text-xs font-medium transition-colors",
        isSelected
          ? "border-indigo-500 bg-indigo-500/15 text-white"
          : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-700",
        isDragging && "opacity-50",
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-zinc-500 active:cursor-grabbing"
        aria-label={`Reorder step ${index + 1}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3" />
      </button>
      <button type="button" onClick={onSelect} className="flex items-center gap-1.5">
        <Icon className="size-3" />
        <span className="max-w-28 truncate">{step.title || `Step ${index + 1}`}</span>
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete step ${index + 1}`}
        className="text-zinc-500 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}
