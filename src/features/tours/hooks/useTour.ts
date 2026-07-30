import { useQuery } from "@tanstack/react-query";

import { fetchLatestTourVersion, fetchTourById } from "@/features/tours/api/tourQueries";

export function useTour(tourId: string | undefined) {
  return useQuery({
    queryKey: ["tour", tourId],
    queryFn: () => fetchTourById(tourId!),
    enabled: !!tourId,
  });
}

export function useLatestTourVersion(tourId: string | undefined) {
  return useQuery({
    queryKey: ["latest-tour-version", tourId],
    queryFn: () => fetchLatestTourVersion(tourId!),
    enabled: !!tourId,
  });
}
