import { useEffect, useMemo } from "react";

import { useActiveWorkspaceStore } from "@/features/dashboard/stores/activeWorkspaceStore";
import { useWorkspaces } from "@/features/dashboard/hooks/useWorkspaces";

export function useActiveWorkspace() {
  const { data: memberships, isLoading, error } = useWorkspaces();
  const activeWorkspaceId = useActiveWorkspaceStore((state) => state.activeWorkspaceId);
  const setActiveWorkspaceId = useActiveWorkspaceStore((state) => state.setActiveWorkspaceId);

  const activeMembership = useMemo(() => {
    if (!memberships || memberships.length === 0) return null;
    return (
      memberships.find((m) => m.workspace.id === activeWorkspaceId) ?? memberships[0] ?? null
    );
  }, [memberships, activeWorkspaceId]);

  useEffect(() => {
    if (activeMembership && activeMembership.workspace.id !== activeWorkspaceId) {
      setActiveWorkspaceId(activeMembership.workspace.id);
    }
  }, [activeMembership, activeWorkspaceId, setActiveWorkspaceId]);

  return {
    memberships: memberships ?? [],
    activeMembership,
    isLoading,
    error,
  };
}
