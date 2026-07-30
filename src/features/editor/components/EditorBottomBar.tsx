import { ChevronLeft, ChevronRight, Eye, Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditorBottomBarProps {
  stepIndex: number;
  totalSteps: number;
  onSelectIndex: (index: number) => void;
  onPreview: () => void;
  isPreviewing: boolean;
  onPublish: () => void;
  isPublishing: boolean;
  isPublished: boolean;
}

export function EditorBottomBar({
  stepIndex,
  totalSteps,
  onSelectIndex,
  onPreview,
  isPreviewing,
  onPublish,
  isPublishing,
  isPublished,
}: EditorBottomBarProps) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-900 px-4 py-2">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          aria-label="Previous step"
          disabled={stepIndex <= 0}
          onClick={() => onSelectIndex(stepIndex - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>

        {totalSteps > 0 ? (
          <Select
            value={String(stepIndex)}
            onValueChange={(value) => onSelectIndex(Number(value))}
          >
            <SelectTrigger className="h-7 w-40 border-zinc-700 bg-zinc-800 text-xs text-zinc-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <SelectItem key={i} value={String(i)}>
                  Step {i + 1} of {totalSteps}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-xs text-zinc-500">No steps yet</span>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          aria-label="Next step"
          disabled={stepIndex >= totalSteps - 1}
          onClick={() => onSelectIndex(stepIndex + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={isPreviewing ? "secondary" : "outline"}
          size="sm"
          className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
          onClick={onPreview}
          disabled={totalSteps === 0}
        >
          <Eye className="size-4" />
          {isPreviewing ? "Exit preview" : "Preview"}
        </Button>
        <Button
          size="sm"
          className="bg-indigo-600 text-white hover:bg-indigo-500"
          onClick={onPublish}
          disabled={isPublishing || isPublished || totalSteps === 0}
        >
          {isPublishing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {isPublished ? "Published" : "Publish"}
        </Button>
      </div>
    </div>
  );
}
