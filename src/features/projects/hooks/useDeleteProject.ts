import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteProject } from "@/features/projects/api/projectQueries";

export function useDeleteProject(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => deleteProject(projectId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ["project-count", workspaceId] });
    },
  });
}
