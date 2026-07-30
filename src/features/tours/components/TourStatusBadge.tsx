import { Badge } from "@/components/ui/badge";
import type { Database } from "@/types/supabase";

type TourStatus = Database["public"]["Enums"]["tour_status"];

const STATUS_CONFIG: Record<TourStatus, { label: string; variant: "secondary" | "default" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  published: { label: "Published", variant: "default" },
  archived: { label: "Archived", variant: "outline" },
};

export function TourStatusBadge({ status }: { status: TourStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
