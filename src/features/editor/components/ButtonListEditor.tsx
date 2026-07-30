import { Plus, X } from "lucide-react";

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
import type { StepButtonConfig } from "@/features/editor/types";

const ACTIONS: StepButtonConfig["action"][] = ["next", "previous", "dismiss", "finish"];

interface ButtonListEditorProps {
  buttons: StepButtonConfig[];
  onChange: (buttons: StepButtonConfig[]) => void;
}

export function ButtonListEditor({ buttons, onChange }: ButtonListEditorProps) {
  function updateButton(index: number, next: Partial<StepButtonConfig>) {
    onChange(buttons.map((button, i) => (i === index ? { ...button, ...next } : button)));
  }

  function removeButton(index: number) {
    onChange(buttons.filter((_, i) => i !== index));
  }

  function addButton() {
    onChange([...buttons, { label: "Button", action: "next" }]);
  }

  return (
    <div className="space-y-2">
      <Label>Buttons</Label>
      <div className="space-y-2">
        {buttons.map((button, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={button.label}
              onChange={(e) => updateButton(index, { label: e.target.value })}
              placeholder="Label"
              className="flex-1"
            />
            <Select
              value={button.action}
              onValueChange={(value: StepButtonConfig["action"]) => updateButton(index, { action: value })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTIONS.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action.charAt(0).toUpperCase() + action.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              aria-label={`Remove button ${index + 1}`}
              onClick={() => removeButton(index)}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addButton}>
        <Plus className="size-4" />
        Add button
      </Button>
    </div>
  );
}
