import { supabase } from "@/lib/supabase/client";

export async function countProjectsInWorkspace(workspaceId: string): Promise<number> {
  const { count, error } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  if (error) throw error;
  return count ?? 0;
}
