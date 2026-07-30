import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ChecklistItem } from "@/features/editor/types";

interface ChecklistItemsEditorProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
}

export function ChecklistItemsEditor({ items, onChange }: ChecklistItemsEditorProps) {
  function updateItem(id: string, label: string) {
    onChange(items.map((item) => (item.id === id ? { ...item, label } : item)));
  }

  function removeItem(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  function addItem() {
    onChange([...items, { id: crypto.randomUUID(), label: "" }]);
  }

  return (
    <div className="space-y-2">
      <Label>Checklist items</Label>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <Input
              value={item.label}
              onChange={(e) => updateItem(item.id, e.target.value)}
              placeholder="Item label"
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              aria-label="Remove item"
              onClick={() => removeItem(item.id)}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        <Plus className="size-4" />
        Add item
      </Button>
    </div>
  );
}
