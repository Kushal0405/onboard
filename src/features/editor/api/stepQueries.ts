import { supabase } from "@/lib/supabase/client";
import type { Database, Json } from "@/types/supabase";
import { DEFAULT_STEP_CONTENT, type StepContent, type StepType } from "@/features/editor/types";

export type Step = Database["public"]["Tables"]["steps"]["Row"];

export async function fetchSteps(tourVersionId: string): Promise<Step[]> {
  const { data, error } = await supabase
    .from("steps")
    .select("*")
    .eq("tour_version_id", tourVersionId)
    .order("position", { ascending: true });

  if (error) throw error;
  return data;
}

export interface CreateStepParams {
  tourVersionId: string;
  position: number;
  stepType: StepType;
  title?: string;
}

export async function createStep({
  tourVersionId,
  position,
  stepType,
  title,
}: CreateStepParams): Promise<Step> {
  const { data, error } = await supabase
    .from("steps")
    .insert({
      tour_version_id: tourVersionId,
      position,
      step_type: stepType,
      title: title ?? null,
      content: DEFAULT_STEP_CONTENT as unknown as Json,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export interface UpdateStepParams {
  id: string;
  title?: string | null;
  stepType?: StepType;
  targetSelector?: string | null;
  content?: StepContent;
}

export async function updateStep({
  id,
  title,
  stepType,
  targetSelector,
  content,
}: UpdateStepParams): Promise<Step> {
  const { data, error } = await supabase
    .from("steps")
    .update({
      ...(title !== undefined && { title }),
      ...(stepType !== undefined && { step_type: stepType }),
      ...(targetSelector !== undefined && { target_selector: targetSelector }),
      ...(content !== undefined && { content: content as unknown as Json }),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteStep(id: string): Promise<void> {
  const { error } = await supabase.from("steps").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderSteps(steps: { id: string; position: number }[]): Promise<void> {
  // The (tour_version_id, position) unique constraint means writing final
  // positions directly can transiently collide depending on update order
  // (e.g. swapping two steps). Stage through negative positions first so
  // every intermediate state is guaranteed unique, then apply final values.
  for (const [index, { id }] of steps.entries()) {
    await supabase
      .from("steps")
      .update({ position: -(index + 1) })
      .eq("id", id)
      .throwOnError();
  }

  for (const { id, position } of steps) {
    await supabase.from("steps").update({ position }).eq("id", id).throwOnError();
  }
}
