import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ElementRect } from "@/features/editor/hooks/useElementLocation";
import { CENTERED_STEP_TYPES, type StepContent, type StepType } from "@/features/editor/types";

interface StepOverlayPreviewProps {
  stepType: StepType;
  title: string;
  content: StepContent;
  stepIndex: number;
  totalSteps: number;
  targetRect: ElementRect | null;
  canvasSize: { width: number; height: number };
  hasTargetSelector: boolean;
  snippetDetected: boolean;
}

const CARD_WIDTH = 320;
const GAP = 12;

function computePosition(
  rect: ElementRect | null,
  placement: StepContent["placement"],
  canvasSize: { width: number; height: number },
) {
  if (!rect || placement === "center") {
    return { top: canvasSize.height / 2 - 90, left: canvasSize.width / 2 - CARD_WIDTH / 2 };
  }
  switch (placement) {
    case "top":
      return { top: rect.top - GAP, left: rect.left + rect.width / 2 - CARD_WIDTH / 2, translateY: "-100%" };
    case "bottom":
      return { top: rect.top + rect.height + GAP, left: rect.left + rect.width / 2 - CARD_WIDTH / 2 };
    case "left":
      return { top: rect.top + rect.height / 2, left: rect.left - GAP, translateX: "-100%", translateY: "-50%" };
    case "right":
      return { top: rect.top + rect.height / 2, left: rect.left + rect.width + GAP, translateY: "-50%" };
  }
}

export function StepOverlayPreview({
  stepType,
  title,
  content,
  stepIndex,
  totalSteps,
  targetRect,
  canvasSize,
  hasTargetSelector,
  snippetDetected,
}: StepOverlayPreviewProps) {
  const isCentered = CENTERED_STEP_TYPES.includes(stepType) || content.placement === "center";
  const isBanner = stepType === "banner";
  const needsTarget = !isCentered && !isBanner;
  const cannotLocate = needsTarget && hasTargetSelector && !targetRect;

  if (needsTarget && !hasTargetSelector) {
    return (
      <div className="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-md bg-amber-500/90 px-3 py-1.5 text-xs font-medium text-amber-950 shadow-lg">
        No target element set — use &ldquo;Pick element&rdquo; or paste a selector in the panel.
      </div>
    );
  }

  if (needsTarget && !snippetDetected) {
    return (
      <div className="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-md bg-amber-500/90 px-3 py-1.5 text-xs font-medium text-amber-950 shadow-lg">
        This page hasn&apos;t loaded the OnboardFlow snippet, so the step can&apos;t be positioned
        here. Install it, then reload the page.
      </div>
    );
  }

  if (cannotLocate) {
    return (
      <div className="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-md bg-red-500/90 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
        Target selector not found on this page.
      </div>
    );
  }

  if (isBanner) {
    return (
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-4 bg-zinc-900 px-4 py-2.5 text-sm text-white shadow-lg">
        <span>{title || "Untitled step"}</span>
        <X className="size-3.5 opacity-70" />
      </div>
    );
  }

  const position = computePosition(targetRect, content.placement, canvasSize);
  const transform = [
    position.translateX ? `translateX(${position.translateX})` : "",
    position.translateY ? `translateY(${position.translateY})` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {!isCentered && targetRect && (
        <div
          className="pointer-events-none absolute z-10 rounded-md border-2 border-indigo-500 bg-indigo-500/10 transition-all duration-150"
          style={{
            top: targetRect.top - content.highlightPadding,
            left: targetRect.left - content.highlightPadding,
            width: targetRect.width + content.highlightPadding * 2,
            height: targetRect.height + content.highlightPadding * 2,
          }}
        />
      )}
      {content.overlayOpacity > 0 && (
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{ background: `rgba(15, 15, 15, ${content.overlayOpacity})` }}
        />
      )}
      <div
        className="absolute z-20 w-80 overflow-hidden rounded-lg border bg-white p-4 text-sm text-zinc-900 shadow-2xl transition-all duration-150"
        style={{
          top: position.top,
          left: position.left,
          width: CARD_WIDTH,
          borderRadius: `${content.borderRadius}px`,
          transform: transform || undefined,
        }}
      >
        <button className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-900" aria-hidden>
          <X className="size-3.5" />
        </button>

        {content.showProgress && totalSteps > 1 && (
          <div className="mb-3 flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn("h-1 flex-1 rounded-full", i === stepIndex ? "bg-indigo-500" : "bg-zinc-200")}
              />
            ))}
          </div>
        )}

        <p className="break-words pr-4 font-semibold">{title || "Untitled step"}</p>
        {content.body && (
          <p className="mt-1 whitespace-pre-wrap break-words text-zinc-600">{content.body}</p>
        )}

        {stepType === "checklist" && content.checklistItems.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {content.checklistItems.map((item) => (
              <li key={item.id} className="flex items-center gap-2">
                <span className="size-3.5 shrink-0 rounded-full border border-zinc-300" />
                {item.label || "Untitled item"}
              </li>
            ))}
          </ul>
        )}

        {stepType === "confirmation" ? (
          <div className="mt-4 flex justify-end gap-2">
            <Button size="sm" variant="outline">
              {content.cancelLabel || "Cancel"}
            </Button>
            <Button size="sm">{content.confirmLabel || "Confirm"}</Button>
          </div>
        ) : content.buttons.length > 0 ? (
          <div className="mt-4 flex justify-end gap-2">
            {content.buttons.map((button, i) => (
              <Button key={i} size="sm" variant={i === content.buttons.length - 1 ? "default" : "outline"}>
                {button.label || "Button"}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}
