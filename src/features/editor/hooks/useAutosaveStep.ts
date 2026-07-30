import { useEffect, useRef, useState } from "react";

import { updateStep, type Step } from "@/features/editor/api/stepQueries";
import type { StepContent } from "@/features/editor/types";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_DELAY_MS = 800;

export function useAutosaveStep(step: Step | null, onSaved: () => void) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestPayloadRef = useRef<{ title: string; content: StepContent } | null>(null);

  useEffect(() => {
    setStatus("idle");
    latestPayloadRef.current = null;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, [step?.id]);

  function scheduleSave(title: string, content: StepContent) {
    if (!step) return;
    latestPayloadRef.current = { title, content };
    setStatus("saving");

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const payload = latestPayloadRef.current;
      if (!payload) return;
      updateStep({ id: step.id, title: payload.title || null, content: payload.content })
        .then(() => {
          setStatus("saved");
          onSaved();
        })
        .catch(() => setStatus("error"));
    }, AUTOSAVE_DELAY_MS);
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { status, scheduleSave };
}
