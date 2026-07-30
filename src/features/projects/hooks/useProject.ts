import { useQuery } from "@tanstack/react-query";

import { fetchProjectById } from "@/features/projects/api/projectQueries";

export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProjectById(projectId!),
    enabled: !!projectId,
  });
}
