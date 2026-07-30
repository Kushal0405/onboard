import { useEffect, useState } from "react";
import { toast } from "sonner";

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
import { useAutosaveStep, type AutosaveStatus } from "@/features/editor/hooks/useAutosaveStep";
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

interface StepPropertiesPanelProps {
  step: Step;
  onSaved: () => void;
}

export function StepPropertiesPanel({ step, onSaved }: StepPropertiesPanelProps) {
  const [title, setTitle] = useState(step.title ?? "");
  const [stepType, setStepType] = useState<StepType>(step.step_type);
  const [content, setContent] = useState<StepContent>(() => parseStepContent(step.content));
  const { status, scheduleSave } = useAutosaveStep(step, onSaved);

  useEffect(() => {
    setTitle(step.title ?? "");
    setStepType(step.step_type);
    setContent(parseStepContent(step.content));
  }, [step.id, step.title, step.step_type, step.content]);

  function update(next: Partial<StepContent>, nextTitle = title) {
    const merged = { ...content, ...next };
    setContent(merged);
    scheduleSave(nextTitle, merged);
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    scheduleSave(value, content);
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
        <AutosaveIndicator status={status} />
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
