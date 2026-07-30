import { Copy, Crosshair, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ElementRect } from "@/features/editor/hooks/useElementLocation";

interface CanvasStepToolbarProps {
  anchorRect: ElementRect | null;
  canvasSize: { width: number; height: number };
  onPick: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  isDuplicating: boolean;
}

export function CanvasStepToolbar({
  anchorRect,
  canvasSize,
  onPick,
  onDuplicate,
  onDelete,
  isDuplicating,
}: CanvasStepToolbarProps) {
  const top = anchorRect ? Math.max(anchorRect.top - 44, 8) : 12;
  const left = anchorRect
    ? Math.min(Math.max(anchorRect.left, 8), canvasSize.width - 140)
    : Math.max(canvasSize.width / 2 - 70, 8);

  return (
    <div
      className="absolute z-30 flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900/95 p-1 shadow-lg backdrop-blur"
      style={{ top, left }}
    >
      <Button
        variant="ghost"
        size="icon"
        className="size-7 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        aria-label="Re-pick target element"
        onClick={onPick}
      >
        <Crosshair className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        aria-label="Duplicate step"
        disabled={isDuplicating}
        onClick={onDuplicate}
      >
        <Copy className="size-3.5" />
      </Button>
      <div className="h-4 w-px bg-zinc-700" />
      <Button
        variant="ghost"
        size="icon"
        className="size-7 text-red-400 hover:bg-red-500/10 hover:text-red-300"
        aria-label="Delete step"
        onClick={onDelete}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}
