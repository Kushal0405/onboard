import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createApiKey, fetchApiKeysForProject, revokeApiKey } from "@/features/projects/api/apiKeyQueries";

export function useApiKeys(projectId: string | undefined) {
  return useQuery({
    queryKey: ["api-keys", projectId],
    queryFn: () => fetchApiKeysForProject(projectId!),
    enabled: !!projectId,
  });
}

export function useApiKeyMutations(projectId: string | undefined) {
  const queryClient = useQueryClient();

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["api-keys", projectId] });
  }

  const create = useMutation({ mutationFn: createApiKey, onSuccess: invalidate });
  const revoke = useMutation({ mutationFn: (id: string) => revokeApiKey(id), onSuccess: invalidate });

  return { create, revoke };
}
