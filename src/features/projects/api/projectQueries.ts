import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";

export type Project = Database["public"]["Tables"]["projects"]["Row"];

const PAGE_SIZE = 12;

export interface FetchProjectsParams {
  workspaceId: string;
  page: number;
  search: string;
}

export interface FetchProjectsResult {
  projects: Project[];
  totalCount: number;
  pageSize: number;
}

export async function fetchProjects({
  workspaceId,
  page,
  search,
}: FetchProjectsParams): Promise<FetchProjectsResult> {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("projects")
    .select("*", { count: "exact" })
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search.trim()) {
    query = query.ilike("name", `%${search.trim()}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return { projects: data, totalCount: count ?? 0, pageSize: PAGE_SIZE };
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "project"
  );
}

export interface CreateProjectParams {
  workspaceId: string;
  createdBy: string;
  name: string;
  description?: string;
}

export async function createProject({
  workspaceId,
  createdBy,
  name,
  description,
}: CreateProjectParams): Promise<Project> {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let attempt = 0;

  // Slugs are unique per workspace; retry with a numeric suffix on collision.
  while (attempt < 10) {
    const { data, error } = await supabase
      .from("projects")
      .insert({
        workspace_id: workspaceId,
        created_by: createdBy,
        name,
        slug,
        description: description || null,
      })
      .select()
      .single();

    if (!error) return data;

    if (error.code === "23505") {
      attempt += 1;
      slug = `${baseSlug}-${attempt + 1}`;
      continue;
    }

    throw error;
  }

  throw new Error("Could not generate a unique project slug");
}

export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw error;
}
