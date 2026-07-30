import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createStep, deleteStep, reorderSteps, updateStep } from "@/features/editor/api/stepQueries";

export function useStepMutations(tourVersionId: string | undefined) {
  const queryClient = useQueryClient();

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["steps", tourVersionId] });
  }

  const create = useMutation({
    mutationFn: createStep,
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: updateStep,
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteStep(id),
    onSuccess: invalidate,
  });

  const reorder = useMutation({
    mutationFn: reorderSteps,
    onSuccess: invalidate,
  });

  return { create, update, remove, reorder };
}
