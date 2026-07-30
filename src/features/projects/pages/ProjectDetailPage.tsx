import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Code2, Route } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProject } from "@/features/projects/hooks/useProject";
import { CreateTourDialog } from "@/features/tours/components/CreateTourDialog";
import { DeleteTourDialog } from "@/features/tours/components/DeleteTourDialog";
import { TourActionsMenu } from "@/features/tours/components/TourActionsMenu";
import { TourStatusBadge } from "@/features/tours/components/TourStatusBadge";
import { VersionHistoryDialog } from "@/features/tours/components/VersionHistoryDialog";
import { useTours } from "@/features/tours/hooks/useTours";
import type { Tour } from "@/features/tours/api/tourQueries";

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading: isProjectLoading } = useProject(projectId);
  const { data: tours, isLoading: isToursLoading } = useTours(projectId);

  const [tourToDelete, setTourToDelete] = useState<Tour | null>(null);
  const [tourForHistory, setTourForHistory] = useState<Tour | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link to="/dashboard/projects">
            <ArrowLeft className="size-4" />
            Projects
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              {isProjectLoading ? <Skeleton className="h-8 w-48" /> : project?.name}
            </h1>
            {project?.description && <p className="text-muted-foreground">{project.description}</p>}
          </div>
          <div className="flex gap-2">
            {projectId && (
              <Button variant="outline" asChild>
                <Link to={`/dashboard/projects/${projectId}/install`}>
                  <Code2 className="size-4" />
                  Install
                </Link>
              </Button>
            )}
            {projectId && <CreateTourDialog projectId={projectId} />}
          </div>
        </div>
      </div>

      {isToursLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : !tours || tours.length === 0 ? (
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex size-10 items-center justify-center rounded-md bg-muted">
              <Route className="size-5 text-muted-foreground" />
            </div>
            <CardTitle>No tours yet</CardTitle>
            <CardDescription>Create your first tour to guide users through this product.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-3">
          {tours.map((tour) => (
            <Card key={tour.id}>
              <CardContent className="flex items-center justify-between py-4">
                <Link
                  to={`/dashboard/tours/${tour.id}/edit`}
                  className="flex flex-1 items-center gap-3"
                >
                  <span className="font-medium">{tour.name}</span>
                  <TourStatusBadge status={tour.status} />
                </Link>
                <TourActionsMenu
                  tour={tour}
                  onDelete={setTourToDelete}
                  onViewHistory={setTourForHistory}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DeleteTourDialog tour={tourToDelete} onOpenChange={(open) => !open && setTourToDelete(null)} />
      <VersionHistoryDialog
        tour={tourForHistory}
        onOpenChange={(open) => !open && setTourForHistory(null)}
      />
    </div>
  );
}
