import type { StepPlacement } from "./types";

export interface Position {
  top: number;
  left: number;
}

const CARD_GAP = 12;

export function computeCardPosition(
  target: Element | null,
  placement: StepPlacement,
  cardWidth: number,
  cardHeight: number,
): Position {
  if (!target || placement === "center") {
    return {
      top: (window.innerHeight - cardHeight) / 2,
      left: (window.innerWidth - cardWidth) / 2,
    };
  }

  const rect = target.getBoundingClientRect();

  switch (placement) {
    case "top":
      return {
        top: rect.top - cardHeight - CARD_GAP,
        left: rect.left + rect.width / 2 - cardWidth / 2,
      };
    case "bottom":
      return {
        top: rect.bottom + CARD_GAP,
        left: rect.left + rect.width / 2 - cardWidth / 2,
      };
    case "left":
      return {
        top: rect.top + rect.height / 2 - cardHeight / 2,
        left: rect.left - cardWidth - CARD_GAP,
      };
    case "right":
      return {
        top: rect.top + rect.height / 2 - cardHeight / 2,
        left: rect.right + CARD_GAP,
      };
  }
}

export function clampToViewport(position: Position, width: number, height: number): Position {
  const margin = 8;
  return {
    top: Math.min(Math.max(position.top, margin), window.innerHeight - height - margin),
    left: Math.min(Math.max(position.left, margin), window.innerWidth - width - margin),
  };
}
