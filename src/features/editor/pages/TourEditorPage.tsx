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
import { SortableContext, arrayMove, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTour, useLatestTourVersion } from "@/features/tours/hooks/useTour";
import { useTourMutations } from "@/features/tours/hooks/useTourMutations";
import { TourStatusBadge } from "@/features/tours/components/TourStatusBadge";
import { AddStepMenu } from "@/features/editor/components/AddStepMenu";
import { EditorBottomBar } from "@/features/editor/components/EditorBottomBar";
import { EditorCanvas } from "@/features/editor/components/EditorCanvas";
import { SortableStepChip } from "@/features/editor/components/SortableStepChip";
import { StepPropertiesPanel } from "@/features/editor/components/StepPropertiesPanel";
import { useSteps } from "@/features/editor/hooks/useSteps";
import { useStepMutations } from "@/features/editor/hooks/useStepMutations";
import { updateStep } from "@/features/editor/api/stepQueries";
import { parseStepContent } from "@/features/editor/utils/parseStepContent";
import type { StepContent, StepType } from "@/features/editor/types";
import type { Step } from "@/features/editor/api/stepQueries";

export function TourEditorPage() {
  const { tourId } = useParams<{ tourId: string }>();
  const { data: tour, isLoading: isTourLoading } = useTour(tourId);
  const { data: latestVersion, isLoading: isVersionLoading } = useLatestTourVersion(tourId);
  const tourVersionId = latestVersion?.id;

  const { data: steps, isLoading: isStepsLoading } = useSteps(tourVersionId);
  const { create, remove, reorder, duplicate } = useStepMutations(tourVersionId);
  const { publish } = useTourMutations(tour?.project_id);

  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [orderedSteps, setOrderedSteps] = useState<Step[]>([]);
  const [pickRequestToken, setPickRequestToken] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  const [liveEdit, setLiveEdit] = useState<{
    title: string;
    stepType: StepType;
    content: StepContent;
  } | null>(null);

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

  async function handleDuplicateStep(step: Step) {
    try {
      const copy = await duplicate.mutateAsync(step);
      setSelectedStepId(copy.id);
      toast.success("Step duplicated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to duplicate step");
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

  async function handlePublish() {
    if (!tourId) return;
    try {
      await publish.mutateAsync(tourId);
      toast.success("Tour published");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to publish tour");
    }
  }

  const selectedStepIndex = orderedSteps.findIndex((s) => s.id === selectedStepId);
  const selectedStep = selectedStepIndex >= 0 ? orderedSteps[selectedStepIndex]! : null;
  const isLoading = isTourLoading || isVersionLoading || isStepsLoading;

  const canvasStep = selectedStep
    ? {
        ...selectedStep,
        liveTitle: liveEdit?.title ?? selectedStep.title ?? "",
        liveStepType: liveEdit?.stepType ?? selectedStep.step_type,
        liveContent: liveEdit?.content ?? parseStepContent(selectedStep.content),
      }
    : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="flex shrink-0 items-center gap-3 border-b border-zinc-800 px-4 py-2">
        <Button variant="ghost" size="sm" asChild className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100">
          <Link to={tour ? `/dashboard/projects/${tour.project_id}` : "/dashboard/projects"}>
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
        <div className="h-4 w-px bg-zinc-800" />
        <h1 className="text-sm font-semibold">
          {isTourLoading ? <Skeleton className="h-4 w-32 bg-zinc-800" /> : tour?.name}
        </h1>
        {tour && <TourStatusBadge status={tour.status} />}
        {previewMode && (
          <span className="ml-auto rounded-full bg-indigo-500/15 px-2.5 py-1 text-xs font-medium text-indigo-400">
            Previewing
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex-1 p-4">
          <Skeleton className="h-full w-full bg-zinc-900" />
        </div>
      ) : (
        <>
          {!previewMode && (
            <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-zinc-800 bg-zinc-900/50 px-4 py-2">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => void handleDragEnd(e)}
              >
                <SortableContext
                  items={orderedSteps.map((s) => s.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  <div className="flex items-center gap-2">
                    {orderedSteps.map((step, index) => (
                      <SortableStepChip
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
              <AddStepMenu onAdd={(stepType) => void handleAddStep(stepType)} />
            </div>
          )}

          <div
            className={
              previewMode
                ? "flex-1 overflow-hidden"
                : "grid flex-1 grid-cols-[1fr_340px] overflow-hidden"
            }
          >
            <EditorCanvas
              step={canvasStep}
              stepIndex={selectedStepIndex >= 0 ? selectedStepIndex : 0}
              totalSteps={orderedSteps.length}
              onPick={(selector) => {
                if (!selectedStep) return;
                // Optimistically patch local state so the properties panel and
                // canvas reflect the pick immediately; updateStep persists it
                // (the panel's own autosave will also pick up target_selector
                // on its next edit, but a pick should save right away).
                setOrderedSteps((prev) =>
                  prev.map((s) => (s.id === selectedStep.id ? { ...s, target_selector: selector } : s)),
                );
                void updateStep({ id: selectedStep.id, targetSelector: selector });
              }}
              pickRequestToken={pickRequestToken}
              previewMode={previewMode}
              onDuplicateStep={() => selectedStep && void handleDuplicateStep(selectedStep)}
              onDeleteStep={() => selectedStep && void handleDeleteStep(selectedStep)}
              isDuplicating={duplicate.isPending}
            />

            {!previewMode && (
              <div className="overflow-hidden border-l border-zinc-800">
                {selectedStep ? (
                  <StepPropertiesPanel
                    key={selectedStep.id}
                    step={selectedStep}
                    onSaved={() => {}}
                    onRequestPick={() => setPickRequestToken((t) => t + 1)}
                    onLiveChange={setLiveEdit}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-6 text-center">
                    <p className="text-sm text-zinc-500">
                      Select a step to edit its properties, or add a new one.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <EditorBottomBar
            stepIndex={selectedStepIndex >= 0 ? selectedStepIndex : 0}
            totalSteps={orderedSteps.length}
            onSelectIndex={(index) => {
              const step = orderedSteps[index];
              if (step) setSelectedStepId(step.id);
            }}
            onPreview={() => setPreviewMode((v) => !v)}
            isPreviewing={previewMode}
            onPublish={() => void handlePublish()}
            isPublishing={publish.isPending}
            isPublished={tour?.status === "published"}
          />
        </>
      )}
    </div>
  );
}
