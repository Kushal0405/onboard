import { useQuery } from "@tanstack/react-query";

import { fetchToursForProject } from "@/features/tours/api/tourQueries";

export function useTours(projectId: string | undefined) {
  return useQuery({
    queryKey: ["tours", projectId],
    queryFn: () => fetchToursForProject(projectId!),
    enabled: !!projectId,
  });
}
