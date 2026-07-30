import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";

export type WorkspaceMembership = {
  id: string;
  role: Database["public"]["Enums"]["workspace_role"];
  workspace: {
    id: string;
    name: string;
    slug: string;
    plan: string;
  };
};

export async function fetchWorkspaceMemberships(userId: string): Promise<WorkspaceMembership[]> {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("id, role, workspace:workspaces(id, name, slug, plan)")
    .eq("user_id", userId);

  if (error) throw error;

  return data
    .filter((row): row is typeof row & { workspace: NonNullable<typeof row.workspace> } =>
      Boolean(row.workspace),
    )
    .map((row) => ({
      id: row.id,
      role: row.role,
      workspace: row.workspace,
    }));
}
