import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTourVersions } from "@/features/tours/hooks/useTourVersions";
import type { Tour } from "@/features/tours/api/tourQueries";

interface VersionHistoryDialogProps {
  tour: Tour | null;
  onOpenChange: (open: boolean) => void;
}

export function VersionHistoryDialog({ tour, onOpenChange }: VersionHistoryDialogProps) {
  const { data: versions, isLoading } = useTourVersions(tour?.id);

  return (
    <Dialog open={!!tour} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Version history — {tour?.name}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !versions || versions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No versions yet.</p>
        ) : (
          <ul className="space-y-2">
            {versions.map((version) => (
              <li
                key={version.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">Version {version.version_number}</p>
                  <p className="text-muted-foreground">
                    Created {new Date(version.created_at).toLocaleString()}
                  </p>
                </div>
                {version.is_published && <Badge>Published</Badge>}
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
