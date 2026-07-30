import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STEP_TYPES, STEP_TYPE_DESCRIPTIONS, STEP_TYPE_LABELS, type StepType } from "@/features/editor/types";
import { STEP_TYPE_ICONS } from "@/features/editor/utils/stepTypeIcons";

export function AddStepMenu({ onAdd }: { onAdd: (stepType: StepType) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          className="gap-1.5 bg-indigo-600 text-white hover:bg-indigo-500"
        >
          <Plus className="size-4" />
          Add step
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="dark w-80 border-zinc-800 bg-zinc-900 p-2">
        <DropdownMenuLabel className="px-2 text-xs uppercase tracking-wide text-zinc-500">
          Choose a step type
        </DropdownMenuLabel>
        {STEP_TYPES.map((stepType) => {
          const Icon = STEP_TYPE_ICONS[stepType];
          return (
            <DropdownMenuItem
              key={stepType}
              onSelect={() => onAdd(stepType)}
              className="items-start gap-3 rounded-md px-2 py-2 text-zinc-100 focus:bg-zinc-800"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-indigo-500/15 text-indigo-400">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{STEP_TYPE_LABELS[stepType]}</p>
                <p className="text-xs text-zinc-500">{STEP_TYPE_DESCRIPTIONS[stepType]}</p>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
