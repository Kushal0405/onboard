import { useQuery } from "@tanstack/react-query";

import { fetchProjects } from "@/features/projects/api/projectQueries";

export function useProjects(workspaceId: string | undefined, page: number, search: string) {
  return useQuery({
    queryKey: ["projects", workspaceId, page, search],
    queryFn: () => fetchProjects({ workspaceId: workspaceId!, page, search }),
    enabled: !!workspaceId,
    placeholderData: (previousData) => previousData,
  });
}
