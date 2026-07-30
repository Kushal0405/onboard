import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTour, useLatestTourVersion } from "@/features/tours/hooks/useTour";
import { TourStatusBadge } from "@/features/tours/components/TourStatusBadge";
import { AddStepMenu } from "@/features/editor/components/AddStepMenu";
import { SortableStepItem } from "@/features/editor/components/SortableStepItem";
import { StepPropertiesPanel } from "@/features/editor/components/StepPropertiesPanel";
import { useSteps } from "@/features/editor/hooks/useSteps";
import { useStepMutations } from "@/features/editor/hooks/useStepMutations";
import type { StepType } from "@/features/editor/types";
import type { Step } from "@/features/editor/api/stepQueries";

export function TourEditorPage() {
  const { tourId } = useParams<{ tourId: string }>();
  const { data: tour, isLoading: isTourLoading } = useTour(tourId);
  const { data: latestVersion, isLoading: isVersionLoading } = useLatestTourVersion(tourId);
  const tourVersionId = latestVersion?.id;

  const { data: steps, isLoading: isStepsLoading } = useSteps(tourVersionId);
  const { create, remove, reorder } = useStepMutations(tourVersionId);

  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [orderedSteps, setOrderedSteps] = useState<Step[]>([]);

  useEffect(() => {
    if (steps) {
      setOrderedSteps(steps);
      if (!selectedStepId && steps.length > 0) {
        setSelectedStepId(steps[0]!.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  async function handleAddStep(stepType: StepType) {
    if (!tourVersionId) return;
    try {
      const step = await create.mutateAsync({
        tourVersionId,
        position: orderedSteps.length,
        stepType,
      });
      setSelectedStepId(step.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add step");
    }
  }

  async function handleDeleteStep(step: Step) {
    try {
      await remove.mutateAsync(step.id);
      if (selectedStepId === step.id) setSelectedStepId(null);
      toast.success("Step deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete step");
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedSteps.findIndex((s) => s.id === active.id);
    const newIndex = orderedSteps.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(orderedSteps, oldIndex, newIndex);
    setOrderedSteps(reordered);

    try {
      await reorder.mutateAsync(reordered.map((s, index) => ({ id: s.id, position: index })));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reorder steps");
      setOrderedSteps(steps ?? []);
    }
  }

  const selectedStep = orderedSteps.find((s) => s.id === selectedStepId) ?? null;
  const isLoading = isTourLoading || isVersionLoading || isStepsLoading;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 shrink-0">
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link to={tour ? `/dashboard/projects/${tour.project_id}` : "/dashboard/projects"}>
            <ArrowLeft className="size-4" />
            {tour ? "Back to project" : "Back"}
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {isTourLoading ? <Skeleton className="h-8 w-48" /> : tour?.name}
          </h1>
          {tour && <TourStatusBadge status={tour.status} />}
        </div>
      </div>

      {isLoading ? (
        <div className="grid flex-1 grid-cols-[300px_1fr] gap-4">
          <Skeleton className="h-full w-full" />
          <Skeleton className="h-full w-full" />
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-[300px_1fr] gap-4 overflow-hidden">
          <div className="flex flex-col gap-3 overflow-y-auto rounded-xl border bg-muted/20 p-3">
            <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Steps &middot; {orderedSteps.length}
            </p>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => void handleDragEnd(e)}
            >
              <SortableContext
                items={orderedSteps.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {orderedSteps.map((step, index) => (
                    <SortableStepItem
                      key={step.id}
                      step={step}
                      index={index}
                      isSelected={step.id === selectedStepId}
                      onSelect={() => setSelectedStepId(step.id)}
                      onDelete={() => void handleDeleteStep(step)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            {orderedSteps.length === 0 && (
              <p className="px-1 text-sm text-muted-foreground">No steps yet.</p>
            )}
            <AddStepMenu onAdd={(stepType) => void handleAddStep(stepType)} />
          </div>

          <div className="overflow-y-auto rounded-xl border bg-card p-6 shadow-sm">
            {selectedStep ? (
              <StepPropertiesPanel key={selectedStep.id} step={selectedStep} onSaved={() => {}} />
            ) : (
              <div className="flex h-full items-center justify-center text-center">
                <p className="text-sm text-muted-foreground">
                  Select a step to edit its properties, or add a new one.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
