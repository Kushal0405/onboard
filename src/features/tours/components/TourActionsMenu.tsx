import { Copy, History, MoreVertical, RotateCcw, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useTourMutations } from "@/features/tours/hooks/useTourMutations";
import type { Tour } from "@/features/tours/api/tourQueries";

interface TourActionsMenuProps {
  tour: Tour;
  onDelete: (tour: Tour) => void;
  onViewHistory: (tour: Tour) => void;
}

export function TourActionsMenu({ tour, onDelete, onViewHistory }: TourActionsMenuProps) {
  const { user } = useAuth();
  const { duplicate, publish, archive, restoreToDraft } = useTourMutations(tour.project_id);

  async function handleDuplicate() {
    try {
      await duplicate.mutateAsync({ tour, createdBy: user!.id });
      toast.success("Tour duplicated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to duplicate tour");
    }
  }

  async function handlePublish() {
    try {
      await publish.mutateAsync(tour.id);
      toast.success("Tour published");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to publish tour");
    }
  }

  async function handleArchive() {
    try {
      await archive.mutateAsync(tour.id);
      toast.success("Tour archived");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to archive tour");
    }
  }

  async function handleRestore() {
    try {
      await restoreToDraft.mutateAsync(tour.id);
      toast.success("Tour restored to draft");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to restore tour");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Actions for ${tour.name}`}>
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {tour.status !== "published" && (
          <DropdownMenuItem onSelect={() => void handlePublish()}>
            <Upload className="size-4" />
            Publish
          </DropdownMenuItem>
        )}
        {tour.status === "archived" ? (
          <DropdownMenuItem onSelect={() => void handleRestore()}>
            <RotateCcw className="size-4" />
            Restore to draft
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => void handleArchive()}>
            <RotateCcw className="size-4" />
            Archive
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => void handleDuplicate()}>
          <Copy className="size-4" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onViewHistory(tour)}>
          <History className="size-4" />
          Version history
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => onDelete(tour)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
