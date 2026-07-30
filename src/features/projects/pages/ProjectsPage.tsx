import { useState } from "react";
import { ChevronLeft, ChevronRight, FolderKanban, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useActiveWorkspace } from "@/features/dashboard/hooks/useActiveWorkspace";
import { CreateProjectDialog } from "@/features/projects/components/CreateProjectDialog";
import { DeleteProjectDialog } from "@/features/projects/components/DeleteProjectDialog";
import { useProjects } from "@/features/projects/hooks/useProjects";
import type { Project } from "@/features/projects/api/projectQueries";

export function ProjectsPage() {
  const { activeMembership, isLoading: isWorkspaceLoading } = useActiveWorkspace();
  const workspaceId = activeMembership?.workspace.id;

  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(0);
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const { data, isLoading, isFetching } = useProjects(workspaceId, page, debouncedSearch);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

  function handleSearchChange(value: string) {
    setSearchInput(value);
    setPage(0);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-muted-foreground">
            Group your tours by app, platform, or team.
          </p>
        </div>
        {workspaceId && <CreateProjectDialog workspaceId={workspaceId} />}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>

      {isWorkspaceLoading || isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : !data || data.projects.length === 0 ? (
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex size-10 items-center justify-center rounded-md bg-muted">
              <FolderKanban className="size-5 text-muted-foreground" />
            </div>
            <CardTitle>{debouncedSearch ? "No matching projects" : "No projects yet"}</CardTitle>
            <CardDescription>
              {debouncedSearch
                ? "Try a different search term."
                : "Create your first project to start building onboarding tours."}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${isFetching ? "opacity-60" : ""}`}>
            {data.projects.map((project) => (
              <Card key={project.id} className="group relative">
                <CardHeader>
                  <CardTitle className="pr-8">{project.name}</CardTitle>
                  {project.description && (
                    <CardDescription>{project.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label={`Delete ${project.name}`}
                    onClick={() => setProjectToDelete(project)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <DeleteProjectDialog
        project={projectToDelete}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
      />
    </div>
  );
}
