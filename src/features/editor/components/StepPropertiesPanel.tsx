import { useEffect, useMemo, useState } from "react";
import { Redo2, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { updateStep } from "@/features/editor/api/stepQueries";
import { ButtonListEditor } from "@/features/editor/components/ButtonListEditor";
import { ChecklistItemsEditor } from "@/features/editor/components/ChecklistItemsEditor";
import { TargetSelectorField } from "@/features/editor/components/TargetSelectorField";
import { useAutosaveStep, type AutosaveStatus } from "@/features/editor/hooks/useAutosaveStep";
import { useStepHistory } from "@/features/editor/hooks/useStepHistory";
import { parseStepContent } from "@/features/editor/utils/parseStepContent";
import {
  STEP_TYPE_LABELS,
  STEP_TYPES,
  stepSupportsTargeting,
  type StepAnimation,
  type StepContent,
  type StepPlacement,
  type StepType,
} from "@/features/editor/types";
import type { Step } from "@/features/editor/api/stepQueries";

const PLACEMENTS: StepPlacement[] = ["top", "bottom", "left", "right", "center"];
const ANIMATIONS: StepAnimation[] = ["none", "fade", "slide"];

function AutosaveIndicator({ status }: { status: AutosaveStatus }) {
  if (status === "idle") return null;
  const label = { saving: "Saving...", saved: "Saved", error: "Failed to save" }[status];
  return (
    <span
      className={`text-xs ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}
    >
      {label}
    </span>
  );
}

interface HistorySnapshot {
  title: string;
  stepType: StepType;
  content: StepContent;
  targetSelector: string;
}

interface StepPropertiesPanelProps {
  step: Step;
  onSaved: () => void;
}

export function StepPropertiesPanel({ step, onSaved }: StepPropertiesPanelProps) {
  const [title, setTitle] = useState(step.title ?? "");
  const [stepType, setStepType] = useState<StepType>(step.step_type);
  const [content, setContent] = useState<StepContent>(() => parseStepContent(step.content));
  const [targetSelector, setTargetSelector] = useState(step.target_selector ?? "");
  const { status, scheduleSave } = useAutosaveStep(step, onSaved);

  useEffect(() => {
    setTitle(step.title ?? "");
    setStepType(step.step_type);
    setContent(parseStepContent(step.content));
    setTargetSelector(step.target_selector ?? "");
  }, [step.id, step.title, step.step_type, step.content, step.target_selector]);

  const historySnapshot = useMemo<HistorySnapshot>(
    () => ({ title, stepType, content, targetSelector }),
    [title, stepType, content, targetSelector],
  );
  const { canUndo, canRedo, undo, redo } = useStepHistory(step.id, historySnapshot);

  function applySnapshot(snapshot: HistorySnapshot) {
    setTitle(snapshot.title);
    setContent(snapshot.content);
    setTargetSelector(snapshot.targetSelector);
    scheduleSave(snapshot.title, snapshot.content, snapshot.targetSelector);
    if (snapshot.stepType !== stepType) {
      setStepType(snapshot.stepType);
      void updateStep({ id: step.id, stepType: snapshot.stepType }).then(onSaved);
    }
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod || e.key.toLowerCase() !== "z") return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      e.preventDefault();
      if (e.shiftKey) {
        redo(applySnapshot);
      } else {
        undo(applySnapshot);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undo, redo]);

  function update(next: Partial<StepContent>, nextTitle = title, nextSelector = targetSelector) {
    const merged = { ...content, ...next };
    setContent(merged);
    scheduleSave(nextTitle, merged, nextSelector);
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    scheduleSave(value, content, targetSelector);
  }

  function handleTargetSelectorChange(value: string) {
    setTargetSelector(value);
    scheduleSave(title, content, value);
  }

  async function handleStepTypeChange(nextType: StepType) {
    setStepType(nextType);
    try {
      await updateStep({ id: step.id, stepType: nextType });
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to change step type");
      setStepType(step.step_type);
    }
  }

  const showTargeting = stepSupportsTargeting(stepType);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Properties</h3>
        <div className="flex items-center gap-2">
          <AutosaveIndicator status={status} />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Undo"
              disabled={!canUndo}
              onClick={() => undo(applySnapshot)}
            >
              <Undo2 className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Redo"
              disabled={!canRedo}
              onClick={() => redo(applySnapshot)}
            >
              <Redo2 className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Step type</Label>
        <Select value={stepType} onValueChange={(value: StepType) => void handleStepTypeChange(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STEP_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {STEP_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="step-title">Title</Label>
        <Input
          id="step-title"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Step title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="step-body">Body</Label>
        <Textarea
          id="step-body"
          value={content.body}
          onChange={(e) => update({ body: e.target.value })}
          placeholder="What should users see in this step?"
          rows={4}
        />
      </div>

      {stepType === "checklist" && (
        <>
          <Separator />
          <ChecklistItemsEditor
            items={content.checklistItems}
            onChange={(checklistItems) => update({ checklistItems })}
          />
        </>
      )}

      {stepType === "confirmation" && (
        <>
          <Separator />
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="confirm-label">Confirm label</Label>
              <Input
                id="confirm-label"
                value={content.confirmLabel}
                onChange={(e) => update({ confirmLabel: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cancel-label">Cancel label</Label>
              <Input
                id="cancel-label"
                value={content.cancelLabel}
                onChange={(e) => update({ cancelLabel: e.target.value })}
              />
            </div>
          </div>
        </>
      )}

      <Separator />

      {showTargeting && (
        <div className="space-y-4">
          <TargetSelectorField value={targetSelector} onChange={handleTargetSelectorChange} />

          <div className="space-y-2">
            <Label>Placement</Label>
            <Select
              value={content.placement}
              onValueChange={(value: StepPlacement) => update({ placement: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLACEMENTS.map((placement) => (
                  <SelectItem key={placement} value={placement}>
                    {placement.charAt(0).toUpperCase() + placement.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="highlight-padding">Highlight padding</Label>
              <Input
                id="highlight-padding"
                type="number"
                min={0}
                max={64}
                value={content.highlightPadding}
                onChange={(e) => update({ highlightPadding: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="border-radius">Border radius</Label>
              <Input
                id="border-radius"
                type="number"
                min={0}
                max={48}
                value={content.borderRadius}
                onChange={(e) => update({ borderRadius: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="overlay-opacity">Overlay opacity</Label>
        <Input
          id="overlay-opacity"
          type="number"
          min={0}
          max={1}
          step={0.05}
          value={content.overlayOpacity}
          onChange={(e) => update({ overlayOpacity: Number(e.target.value) })}
        />
      </div>

      <div className="space-y-2">
        <Label>Animation</Label>
        <Select
          value={content.animation}
          onValueChange={(value: StepAnimation) => update({ animation: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ANIMATIONS.map((animation) => (
              <SelectItem key={animation} value={animation}>
                {animation.charAt(0).toUpperCase() + animation.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="step-progress">Show progress indicator</Label>
        <Switch
          id="step-progress"
          checked={content.showProgress}
          onCheckedChange={(checked) => update({ showProgress: checked })}
        />
      </div>

      <Separator />

      <ButtonListEditor buttons={content.buttons} onChange={(buttons) => update({ buttons })} />
    </div>
  );
}
