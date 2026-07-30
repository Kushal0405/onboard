import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  archiveTour,
  createTour,
  deleteTour,
  duplicateTour,
  publishTourLatestVersion,
  restoreTourToDraft,
} from "@/features/tours/api/tourQueries";
import type { Tour } from "@/features/tours/api/tourQueries";

export function useTourMutations(projectId: string | undefined) {
  const queryClient = useQueryClient();

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["tours", projectId] });
  }

  const create = useMutation({
    mutationFn: createTour,
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (tourId: string) => deleteTour(tourId),
    onSuccess: invalidate,
  });

  const duplicate = useMutation({
    mutationFn: (params: { tour: Tour; createdBy: string }) => duplicateTour(params),
    onSuccess: invalidate,
  });

  const archive = useMutation({
    mutationFn: (tourId: string) => archiveTour(tourId),
    onSuccess: invalidate,
  });

  const restoreToDraft = useMutation({
    mutationFn: (tourId: string) => restoreTourToDraft(tourId),
    onSuccess: invalidate,
  });

  const publish = useMutation({
    mutationFn: (tourId: string) => publishTourLatestVersion(tourId),
    onSuccess: invalidate,
  });

  return { create, remove, duplicate, archive, restoreToDraft, publish };
}
