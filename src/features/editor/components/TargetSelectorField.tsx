import { useState } from "react";
import { Crosshair } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ElementPickerCanvas } from "@/features/editor/components/ElementPickerCanvas";

interface TargetSelectorFieldProps {
  value: string;
  onChange: (selector: string) => void;
}

export function TargetSelectorField({ value, onChange }: TargetSelectorFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  function handlePick(selector: string) {
    onChange(selector);
    setPickerOpen(false);
  }

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
        <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
          <Button type="button" variant="outline" size="icon" onClick={() => setPickerOpen(true)}>
            <Crosshair className="size-4" />
          </Button>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Pick target element</DialogTitle>
              <DialogDescription>
                Load your page below and click the element this step should point at.
              </DialogDescription>
            </DialogHeader>
            <ElementPickerCanvas onPick={handlePick} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
