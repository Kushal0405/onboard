import { ChevronLeft, ChevronRight, MousePointerClick, SlidersHorizontal, Type } from "lucide-react";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type SettingsSection = "element" | "placement" | "behavior";

interface SettingsRow {
  id: SettingsSection;
  label: string;
  icon: typeof Type;
  available: boolean;
}

const ROWS: SettingsRow[] = [
  { id: "element", label: "Element", icon: Type, available: true },
  { id: "placement", label: "Placement", icon: MousePointerClick, available: true },
  { id: "behavior", label: "Behavior", icon: SlidersHorizontal, available: true },
];

interface SettingsDrillDownProps {
  elementPanel: ReactNode;
  placementPanel: ReactNode;
  behaviorPanel: ReactNode;
  placementAvailable: boolean;
}

export function SettingsDrillDown({
  elementPanel,
  placementPanel,
  behaviorPanel,
  placementAvailable,
}: SettingsDrillDownProps) {
  const [section, setSection] = useState<SettingsSection | null>(null);

  if (section === null) {
    return (
      <div className="space-y-1">
        {ROWS.map((row) => {
          const disabled = row.id === "placement" && !placementAvailable;
          const Icon = row.icon;
          return (
            <button
              key={row.id}
              type="button"
              disabled={disabled}
              onClick={() => setSection(row.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition-colors",
                disabled
                  ? "cursor-not-allowed text-zinc-600"
                  : "text-zinc-100 hover:bg-zinc-800",
              )}
            >
              <span className="flex items-center gap-2.5">
                <Icon className="size-4 text-zinc-500" />
                {row.label}
                {disabled && (
                  <span className="text-xs text-zinc-600">(not applicable to this step type)</span>
                )}
              </span>
              {!disabled && <ChevronRight className="size-4 text-zinc-600" />}
            </button>
          );
        })}
      </div>
    );
  }

  const panel = { element: elementPanel, placement: placementPanel, behavior: behaviorPanel }[section];
  const label = ROWS.find((r) => r.id === section)!.label;

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setSection(null)}
        className="flex items-center gap-1.5 text-sm font-medium text-zinc-300 hover:text-white"
      >
        <ChevronLeft className="size-4" />
        {label}
      </button>
      {panel}
    </div>
  );
}
