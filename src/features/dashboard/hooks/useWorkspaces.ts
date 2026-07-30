import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { fetchWorkspaceMemberships } from "@/features/dashboard/api/workspaceQueries";

export function useWorkspaces() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["workspace-memberships", user?.id],
    queryFn: () => fetchWorkspaceMemberships(user!.id),
    enabled: !!user,
  });
}
