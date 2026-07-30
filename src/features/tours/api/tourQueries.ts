import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";

export type Tour = Database["public"]["Tables"]["tours"]["Row"];
export type TourVersion = Database["public"]["Tables"]["tour_versions"]["Row"];

export async function fetchToursForProject(projectId: string): Promise<Tour[]> {
  const { data, error } = await supabase
    .from("tours")
    .select("*")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data;
}

export interface CreateTourParams {
  projectId: string;
  createdBy: string;
  name: string;
}

export async function createTour({ projectId, createdBy, name }: CreateTourParams): Promise<Tour> {
  const { data: tour, error: tourError } = await supabase
    .from("tours")
    .insert({ project_id: projectId, created_by: createdBy, name, status: "draft" })
    .select()
    .single();

  if (tourError) throw tourError;

  const { error: versionError } = await supabase.from("tour_versions").insert({
    tour_id: tour.id,
    created_by: createdBy,
    version_number: 1,
    is_published: false,
  });

  if (versionError) throw versionError;

  return tour;
}

export async function deleteTour(tourId: string): Promise<void> {
  const { error } = await supabase.from("tours").delete().eq("id", tourId);
  if (error) throw error;
}

export interface DuplicateTourParams {
  tour: Tour;
  createdBy: string;
}

export async function duplicateTour({ tour, createdBy }: DuplicateTourParams): Promise<Tour> {
  const { data: newTour, error: tourError } = await supabase
    .from("tours")
    .insert({
      project_id: tour.project_id,
      created_by: createdBy,
      name: `${tour.name} (copy)`,
      status: "draft",
      theme_id: tour.theme_id,
    })
    .select()
    .single();

  if (tourError) throw tourError;

  const { data: latestVersion, error: latestVersionError } = await supabase
    .from("tour_versions")
    .select("id")
    .eq("tour_id", tour.id)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestVersionError) throw latestVersionError;

  const { error: versionError } = await supabase.from("tour_versions").insert({
    tour_id: newTour.id,
    created_by: createdBy,
    version_number: 1,
    is_published: false,
  });

  if (versionError) throw versionError;

  if (latestVersion) {
    const { data: steps, error: stepsError } = await supabase
      .from("steps")
      .select("step_type, position, title, content, target_selector")
      .eq("tour_version_id", latestVersion.id);

    if (stepsError) throw stepsError;

    if (steps.length > 0) {
      const { data: newVersion, error: newVersionError } = await supabase
        .from("tour_versions")
        .select("id")
        .eq("tour_id", newTour.id)
        .eq("version_number", 1)
        .single();

      if (newVersionError) throw newVersionError;

      const { error: insertStepsError } = await supabase.from("steps").insert(
        steps.map((step) => ({ ...step, tour_version_id: newVersion.id })),
      );

      if (insertStepsError) throw insertStepsError;
    }
  }

  return newTour;
}

export async function archiveTour(tourId: string): Promise<void> {
  const { error } = await supabase.from("tours").update({ status: "archived" }).eq("id", tourId);
  if (error) throw error;
}

export async function restoreTourToDraft(tourId: string): Promise<void> {
  const { error } = await supabase.from("tours").update({ status: "draft" }).eq("id", tourId);
  if (error) throw error;
}

export async function publishTourLatestVersion(tourId: string): Promise<void> {
  const { data: latestVersion, error: latestVersionError } = await supabase
    .from("tour_versions")
    .select("id")
    .eq("tour_id", tourId)
    .order("version_number", { ascending: false })
    .limit(1)
    .single();

  if (latestVersionError) throw latestVersionError;

  const publishedAt = new Date().toISOString();

  const { error: versionUpdateError } = await supabase
    .from("tour_versions")
    .update({ is_published: true, published_at: publishedAt })
    .eq("id", latestVersion.id);

  if (versionUpdateError) throw versionUpdateError;

  const { error: tourUpdateError } = await supabase
    .from("tours")
    .update({ status: "published", published_version_id: latestVersion.id })
    .eq("id", tourId);

  if (tourUpdateError) throw tourUpdateError;
}

export async function fetchTourById(tourId: string): Promise<Tour | null> {
  const { data, error } = await supabase.from("tours").select("*").eq("id", tourId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchLatestTourVersion(tourId: string): Promise<TourVersion | null> {
  const { data, error } = await supabase
    .from("tour_versions")
    .select("*")
    .eq("tour_id", tourId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchTourVersions(tourId: string): Promise<TourVersion[]> {
  const { data, error } = await supabase
    .from("tour_versions")
    .select("*")
    .eq("tour_id", tourId)
    .order("version_number", { ascending: false });

  if (error) throw error;
  return data;
}
