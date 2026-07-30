import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAutosaveStep, type AutosaveStatus } from "@/features/editor/hooks/useAutosaveStep";
import { parseStepContent } from "@/features/editor/utils/parseStepContent";
import type { StepContent, StepPlacement } from "@/features/editor/types";
import type { Step } from "@/features/editor/api/stepQueries";

const PLACEMENTS: StepPlacement[] = ["top", "bottom", "left", "right", "center"];

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
  const [content, setContent] = useState<StepContent>(() => parseStepContent(step.content));
  const { status, scheduleSave } = useAutosaveStep(step, onSaved);

  useEffect(() => {
    setTitle(step.title ?? "");
    setContent(parseStepContent(step.content));
  }, [step.id, step.title, step.content]);

  function update(next: Partial<StepContent>, nextTitle = title) {
    const merged = { ...content, ...next };
    setContent(merged);
    scheduleSave(nextTitle, merged);
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    scheduleSave(value, content);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Properties</h3>
        <AutosaveIndicator status={status} />
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

      <div className="flex items-center justify-between">
        <Label htmlFor="step-progress">Show progress indicator</Label>
        <Switch
          id="step-progress"
          checked={content.showProgress}
          onCheckedChange={(checked) => update({ showProgress: checked })}
        />
      </div>
    </div>
  );
}
