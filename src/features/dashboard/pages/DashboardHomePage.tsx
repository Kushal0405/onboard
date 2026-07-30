import { useQuery } from "@tanstack/react-query";
import { FolderKanban } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { countProjectsInWorkspace } from "@/features/dashboard/api/projectQueries";
import { useActiveWorkspace } from "@/features/dashboard/hooks/useActiveWorkspace";

export function DashboardHomePage() {
  const { user } = useAuth();
  const { activeMembership, isLoading: isWorkspaceLoading } = useActiveWorkspace();
  const workspaceId = activeMembership?.workspace.id;

  const { data: projectCount, isLoading: isProjectCountLoading } = useQuery({
    queryKey: ["project-count", workspaceId],
    queryFn: () => countProjectsInWorkspace(workspaceId!),
    enabled: !!workspaceId,
  });

  const fullName = user?.user_metadata.full_name as string | undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome{fullName ? `, ${fullName}` : ""}</h1>
        <p className="text-muted-foreground">
          {isWorkspaceLoading ? "Loading workspace..." : activeMembership?.workspace.name}
        </p>
      </div>

      {isProjectCountLoading ? (
        <Skeleton className="h-40 w-full max-w-md" />
      ) : projectCount === 0 ? (
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex size-10 items-center justify-center rounded-md bg-muted">
              <FolderKanban className="size-5 text-muted-foreground" />
            </div>
            <CardTitle>No projects yet</CardTitle>
            <CardDescription>
              Create your first project to start building onboarding tours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/dashboard/projects">Create a project</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>{projectCount} project{projectCount === 1 ? "" : "s"}</CardTitle>
            <CardDescription>View and manage your projects.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/dashboard/projects">Go to projects</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
