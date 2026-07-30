import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTourMutations } from "@/features/tours/hooks/useTourMutations";
import type { Tour } from "@/features/tours/api/tourQueries";

interface DeleteTourDialogProps {
  tour: Tour | null;
  onOpenChange: (open: boolean) => void;
}

export function DeleteTourDialog({ tour, onOpenChange }: DeleteTourDialogProps) {
  const { remove } = useTourMutations(tour?.project_id);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirm() {
    if (!tour) return;
    setIsDeleting(true);
    try {
      await remove.mutateAsync(tour.id);
      toast.success("Tour deleted");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete tour");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={!!tour} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete tour</DialogTitle>
          <DialogDescription>
            This will permanently delete &ldquo;{tour?.name}&rdquo;, all of its versions, steps,
            and analytics data. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => void handleConfirm()} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete tour"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
