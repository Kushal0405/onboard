import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STEP_TYPES, STEP_TYPE_LABELS, type StepType } from "@/features/editor/types";

export function AddStepMenu({ onAdd }: { onAdd: (stepType: StepType) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Plus className="size-4" />
          Add step
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {STEP_TYPES.map((stepType) => (
          <DropdownMenuItem key={stepType} onSelect={() => onAdd(stepType)}>
            {STEP_TYPE_LABELS[stepType]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
