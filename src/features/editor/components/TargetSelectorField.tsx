import { Crosshair } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TargetSelectorFieldProps {
  value: string;
  onChange: (selector: string) => void;
  onRequestPick: () => void;
}

export function TargetSelectorField({ value, onChange, onRequestPick }: TargetSelectorFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="target-selector">Target element</Label>
      <div className="flex gap-2">
        <Input
          id="target-selector"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#signup-button or .nav-item:nth-of-type(2)"
          className="flex-1 font-mono text-xs"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Pick element on canvas"
          onClick={onRequestPick}
        >
          <Crosshair className="size-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Click the crosshair, then click the element on the canvas to the left.
      </p>
    </div>
  );
}
