import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";

export type ApiKey = Database["public"]["Tables"]["api_keys"]["Row"];

export async function fetchApiKeysForProject(projectId: string): Promise<ApiKey[]> {
  const { data, error } = await supabase
    .from("api_keys")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export interface CreateApiKeyParams {
  projectId: string;
  createdBy: string;
  name?: string;
}

export async function createApiKey({ projectId, createdBy, name }: CreateApiKeyParams): Promise<ApiKey> {
  const { data, error } = await supabase
    .from("api_keys")
    .insert({ project_id: projectId, created_by: createdBy, name: name ?? "Default" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function revokeApiKey(id: string): Promise<void> {
  const { error } = await supabase
    .from("api_keys")
    .update({ is_active: false, revoked_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}
