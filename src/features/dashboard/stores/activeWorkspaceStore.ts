import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ActiveWorkspaceState {
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (workspaceId: string) => void;
}

export const useActiveWorkspaceStore = create<ActiveWorkspaceState>()(
  persist(
    (set) => ({
      activeWorkspaceId: null,
      setActiveWorkspaceId: (workspaceId) => set({ activeWorkspaceId: workspaceId }),
    }),
    { name: "onboardflow-active-workspace" },
  ),
);
