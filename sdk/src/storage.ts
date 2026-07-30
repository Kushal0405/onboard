const STORAGE_PREFIX = "onboardflow:";

export function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    // localStorage may be unavailable (private browsing, quota) - fail silently, caching is best-effort.
  }
}

export function readCompletedStepIds(tourId: string): Set<string> {
  return new Set(readCache<string[]>(`completed:${tourId}`) ?? []);
}

export function markStepCompleted(tourId: string, stepId: string): void {
  const completed = readCompletedStepIds(tourId);
  completed.add(stepId);
  writeCache(`completed:${tourId}`, Array.from(completed));
}

export function getOrCreateAnonymousId(): string {
  const existing = readCache<string>("anonymous-id");
  if (existing) return existing;
  const id = "anon_" + crypto.randomUUID();
  writeCache("anonymous-id", id);
  return id;
}
