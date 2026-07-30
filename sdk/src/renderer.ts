import { clampToViewport, computeCardPosition } from "./position";
import { ensureStylesInjected } from "./styles";
import type { PublicStep, StepButtonConfig } from "./types";

export type StepButtonAction = StepButtonConfig["action"];

export interface RendererCallbacks {
  onButtonAction: (action: StepButtonAction) => void;
  onDismiss: () => void;
}

let activeElements: HTMLElement[] = [];
let repositionHandler: (() => void) | null = null;

function clearActive(): void {
  for (const el of activeElements) el.remove();
  activeElements = [];
  if (repositionHandler) {
    window.removeEventListener("resize", repositionHandler);
    window.removeEventListener("scroll", repositionHandler, true);
    repositionHandler = null;
  }
}

function resolveTarget(step: PublicStep): Element | null {
  if (!step.targetSelector) return null;
  try {
    return document.querySelector(step.targetSelector);
  } catch {
    return null;
  }
}

function buildButtons(step: PublicStep, callbacks: RendererCallbacks): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.className = "onboardflow-buttons";

  if (step.stepType === "confirmation") {
    const cancel = document.createElement("button");
    cancel.className = "onboardflow-button onboardflow-button--secondary";
    cancel.textContent = step.content.cancelLabel || "Cancel";
    cancel.onclick = () => callbacks.onButtonAction("dismiss");

    const confirm = document.createElement("button");
    confirm.className = "onboardflow-button onboardflow-button--primary";
    confirm.textContent = step.content.confirmLabel || "Confirm";
    confirm.onclick = () => callbacks.onButtonAction("finish");

    wrap.append(cancel, confirm);
    return wrap;
  }

  step.content.buttons.forEach((button, index) => {
    const el = document.createElement("button");
    const isPrimary = index === step.content.buttons.length - 1;
    el.className = `onboardflow-button ${isPrimary ? "onboardflow-button--primary" : "onboardflow-button--secondary"}`;
    el.textContent = button.label;
    el.onclick = () => callbacks.onButtonAction(button.action);
    wrap.appendChild(el);
  });

  return wrap;
}

function buildProgress(stepIndex: number, totalSteps: number): HTMLDivElement | null {
  if (totalSteps <= 1) return null;
  const wrap = document.createElement("div");
  wrap.className = "onboardflow-progress";
  for (let i = 0; i < totalSteps; i++) {
    const dot = document.createElement("div");
    dot.className = `onboardflow-progress-dot${i === stepIndex ? " onboardflow-progress-dot--active" : ""}`;
    wrap.appendChild(dot);
  }
  return wrap;
}

function buildCardBody(step: PublicStep): HTMLElement[] {
  const nodes: HTMLElement[] = [];

  if (step.title) {
    const title = document.createElement("p");
    title.className = "onboardflow-title";
    title.textContent = step.title;
    nodes.push(title);
  }

  if (step.content.body) {
    const body = document.createElement("p");
    body.className = "onboardflow-body";
    body.textContent = step.content.body;
    nodes.push(body);
  }

  if (step.stepType === "checklist" && step.content.checklistItems.length > 0) {
    const list = document.createElement("ul");
    list.className = "onboardflow-checklist";
    for (const item of step.content.checklistItems) {
      const li = document.createElement("li");
      li.className = "onboardflow-checklist-item";
      const dot = document.createElement("span");
      dot.className = "onboardflow-checklist-dot";
      const label = document.createElement("span");
      label.textContent = item.label;
      li.append(dot, label);
      list.appendChild(li);
    }
    nodes.push(list);
  }

  return nodes;
}

function renderHighlight(target: Element, padding: number): HTMLDivElement {
  const rect = target.getBoundingClientRect();
  const box = document.createElement("div");
  box.className = "onboardflow-highlight";
  box.style.top = `${rect.top - padding}px`;
  box.style.left = `${rect.left - padding}px`;
  box.style.width = `${rect.width + padding * 2}px`;
  box.style.height = `${rect.height + padding * 2}px`;
  box.style.borderRadius = `${target instanceof HTMLElement ? getComputedStyle(target).borderRadius : "0px"}`;
  return box;
}

function renderCard(
  step: PublicStep,
  stepIndex: number,
  totalSteps: number,
  target: Element | null,
  callbacks: RendererCallbacks,
): HTMLDivElement {
  const card = document.createElement("div");
  card.className = `onboardflow-card onboardflow-card--${step.content.animation === "none" ? "" : step.content.animation}`.trim();
  card.style.borderRadius = `${step.content.borderRadius}px`;
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-live", "polite");

  const close = document.createElement("button");
  close.className = "onboardflow-close";
  close.textContent = "×";
  close.setAttribute("aria-label", "Dismiss");
  close.onclick = () => callbacks.onDismiss();
  card.appendChild(close);

  const progress = buildProgress(stepIndex, totalSteps);
  if (progress && step.content.showProgress) card.appendChild(progress);

  for (const node of buildCardBody(step)) card.appendChild(node);
  card.appendChild(buildButtons(step, callbacks));

  const width = 360;
  const height = 220;
  const raw = computeCardPosition(target, step.content.placement, width, height);
  const clamped = clampToViewport(raw, width, height);
  card.style.top = `${clamped.top}px`;
  card.style.left = `${clamped.left}px`;

  return card;
}

function renderBanner(step: PublicStep, callbacks: RendererCallbacks): HTMLDivElement {
  const banner = document.createElement("div");
  banner.className = "onboardflow-banner";

  const text = document.createElement("span");
  text.textContent = step.content.body || step.title || "";
  banner.appendChild(text);

  const close = document.createElement("button");
  close.className = "onboardflow-close";
  close.style.position = "static";
  close.style.color = "#fff";
  close.textContent = "×";
  close.setAttribute("aria-label", "Dismiss");
  close.onclick = () => callbacks.onDismiss();
  banner.appendChild(close);

  return banner;
}

function renderBeacon(target: Element, onActivate: () => void): HTMLDivElement {
  const rect = target.getBoundingClientRect();
  const beacon = document.createElement("div");
  beacon.className = "onboardflow-beacon";
  beacon.style.top = `${rect.top + rect.height / 2 - 7}px`;
  beacon.style.left = `${rect.left + rect.width / 2 - 7}px`;
  beacon.onclick = onActivate;
  return beacon;
}

export function renderStep(
  step: PublicStep,
  stepIndex: number,
  totalSteps: number,
  callbacks: RendererCallbacks,
): void {
  clearActive();
  ensureStylesInjected();

  const target = resolveTarget(step);
  const elements: HTMLElement[] = [];

  if (step.stepType === "banner") {
    elements.push(renderBanner(step, callbacks));
  } else if (step.stepType === "beacon" && target) {
    let expanded = false;
    const beacon = renderBeacon(target, () => {
      if (expanded) return;
      expanded = true;
      const card = renderCard(step, stepIndex, totalSteps, target, callbacks);
      document.body.appendChild(card);
      activeElements.push(card);
    });
    elements.push(beacon);
  } else {
    if (step.stepType !== "modal" && step.stepType !== "announcement" && step.stepType !== "confirmation") {
      if (target) {
        elements.push(renderHighlight(target, step.content.highlightPadding));
      }
    }
    if (step.content.overlayOpacity > 0) {
      const overlay = document.createElement("div");
      overlay.className = "onboardflow-overlay";
      overlay.style.background = `rgba(15, 15, 15, ${step.content.overlayOpacity})`;
      overlay.onclick = () => callbacks.onDismiss();
      elements.push(overlay);
    }
    elements.push(renderCard(step, stepIndex, totalSteps, target, callbacks));
  }

  for (const el of elements) document.body.appendChild(el);
  activeElements = elements;

  if (target) {
    repositionHandler = () => renderStep(step, stepIndex, totalSteps, callbacks);
    window.addEventListener("resize", repositionHandler);
    window.addEventListener("scroll", repositionHandler, true);
  }
}

export function clearStep(): void {
  clearActive();
}
