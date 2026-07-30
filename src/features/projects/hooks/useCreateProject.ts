import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createProject } from "@/features/projects/api/projectQueries";

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProject,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["projects", variables.workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ["project-count", variables.workspaceId] });
    },
  });
}
