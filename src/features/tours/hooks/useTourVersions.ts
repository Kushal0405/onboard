import { useQuery } from "@tanstack/react-query";

import { fetchTourVersions } from "@/features/tours/api/tourQueries";

export function useTourVersions(tourId: string | undefined) {
  return useQuery({
    queryKey: ["tour-versions", tourId],
    queryFn: () => fetchTourVersions(tourId!),
    enabled: !!tourId,
  });
}
