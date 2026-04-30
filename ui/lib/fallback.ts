import type { SearchResponse, RerankResponse, ClipResponse, VisionResponse, IngestStep } from './types';

type FallbackData = {
  ingest?: IngestStep[];
  search?: Record<string, SearchResponse>;
  rerank?: Record<string, RerankResponse>;
  clip?: ClipResponse;
  vision?: VisionResponse;
};

let cache: FallbackData | null = null;

async function loadFallbacks(): Promise<FallbackData> {
  if (cache) return cache;

  const load = async (path: string) => {
    try {
      const res = await fetch(path);
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  };

  const [ingest, search, rerank, clip, vision] = await Promise.all([
    load('/fallbacks/ingest.json'),
    load('/fallbacks/search.json'),
    load('/fallbacks/rerank.json'),
    load('/fallbacks/clip.json'),
    load('/fallbacks/vision.json'),
  ]);

  cache = { ingest, search, rerank, clip, vision };
  return cache;
}

export async function getFallbackSearch(query: string): Promise<SearchResponse | null> {
  const data = await loadFallbacks();
  if (!data.search) return null;
  // Return the closest matching query key, or first available
  const key = Object.keys(data.search).find(k => k.toLowerCase().includes(query.toLowerCase().slice(0, 20))) ?? Object.keys(data.search)[0];
  return key ? data.search[key] : null;
}

export async function getFallbackRerank(query: string): Promise<RerankResponse | null> {
  const data = await loadFallbacks();
  if (!data.rerank) return null;
  const key = Object.keys(data.rerank).find(k => k.toLowerCase().includes(query.toLowerCase().slice(0, 20))) ?? Object.keys(data.rerank)[0];
  return key ? data.rerank[key] : null;
}

export async function getFallbackClip(): Promise<ClipResponse | null> {
  const data = await loadFallbacks();
  return data.clip ?? null;
}

export async function getFallbackVision(): Promise<VisionResponse | null> {
  const data = await loadFallbacks();
  return data.vision ?? null;
}

export async function getFallbackIngest(): Promise<IngestStep[] | null> {
  const data = await loadFallbacks();
  return data.ingest ?? null;
}
