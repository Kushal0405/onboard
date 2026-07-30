import { useQuery } from "@tanstack/react-query";

import { fetchSteps } from "@/features/editor/api/stepQueries";

export function useSteps(tourVersionId: string | undefined) {
  return useQuery({
    queryKey: ["steps", tourVersionId],
    queryFn: () => fetchSteps(tourVersionId!),
    enabled: !!tourVersionId,
  });
}
