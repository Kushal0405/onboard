import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveWorkspace } from "@/features/dashboard/hooks/useActiveWorkspace";
import { useActiveWorkspaceStore } from "@/features/dashboard/stores/activeWorkspaceStore";

export function WorkspaceSwitcher() {
  const { memberships, activeMembership, isLoading } = useActiveWorkspace();
  const setActiveWorkspaceId = useActiveWorkspaceStore((state) => state.setActiveWorkspaceId);

  if (isLoading) {
    return <Skeleton className="h-9 w-full" />;
  }

  if (!activeMembership) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between font-normal"
          aria-label="Switch workspace"
        >
          <span className="truncate">{activeMembership.workspace.name}</span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships.map((membership) => (
          <DropdownMenuItem
            key={membership.workspace.id}
            onSelect={() => setActiveWorkspaceId(membership.workspace.id)}
          >
            <span className="flex-1 truncate">{membership.workspace.name}</span>
            {membership.workspace.id === activeMembership.workspace.id && (
              <Check className="size-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
