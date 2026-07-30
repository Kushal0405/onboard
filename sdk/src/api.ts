import { readCache, writeCache } from "./storage";
import type { GetTourResponse } from "./types";

const DEFAULT_API_BASE = "https://udsmmrdkevrwiicphhbp.supabase.co/functions/v1";
const CACHE_TTL_MS = 60_000;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 500;

interface CachedResponse<T> {
  data: T;
  fetchedAt: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, attempt = 0): Promise<Response> {
  try {
    const response = await fetch(url);
    if (!response.ok && response.status >= 500 && attempt < MAX_RETRIES) {
      await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt);
      return fetchWithRetry(url, attempt + 1);
    }
    return response;
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt);
      return fetchWithRetry(url, attempt + 1);
    }
    throw error;
  }
}

export async function fetchPublishedTours(
  publicKey: string,
  apiBase = DEFAULT_API_BASE,
): Promise<GetTourResponse> {
  const cacheKey = `get-tour:${publicKey}`;
  const cached = readCache<CachedResponse<GetTourResponse>>(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const response = await fetchWithRetry(
      `${apiBase}/get-tour?publicKey=${encodeURIComponent(publicKey)}`,
    );
    if (!response.ok) {
      if (cached) return cached.data;
      throw new Error(`get-tour request failed with status ${response.status}`);
    }
    const data = (await response.json()) as GetTourResponse;
    writeCache(cacheKey, { data, fetchedAt: Date.now() });
    return data;
  } catch (error) {
    if (cached) return cached.data;
    throw error;
  }
}
