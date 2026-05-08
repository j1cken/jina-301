export type PriceTier = 'budget' | 'mid' | 'upscale' | 'luxury' | 'ultra';

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface Hotel {
  id: string;
  name: string;
  descriptions: string[];
  location: GeoPoint;
  location_name: string;
  country: string;
  region: string;
  amenities: string[];
  style: string[];
  price_tier: PriceTier;
  price_per_night_usd: number;
  image_paths: string[];
  image_embedding?: number[];
  rating: number;
  nearby_landmarks: string[];
  room_description?: string;
  score?: number;
}

export interface RankedHotel extends Hotel {
  naiveRank: number;
  rerankedRank: number;
  rankDelta: number;
  matchExplanation?: string;
}

export interface SearchResponse {
  semantic: Hotel[];
  bm25: Hotel[];
  hybrid?: Hotel[];
  took: number;
}

export interface RerankResponse {
  naive: Hotel[];
  reranked: RankedHotel[];
  naiveTook: number;
  rerankTook: number;
}

export interface ClipResponse {
  results: Hotel[];
  query_vector_preview: number[];
}

export interface VlmAnalysis {
  style: string;
  visibleAmenities: string[];
  mood: string;
  guestProfile: string;
  standout?: string;
  rawDescription?: string;
  [key: string]: unknown;
}

export interface VisionResponse {
  analysis: VlmAnalysis;
}

export interface GeoFilter {
  lat: number;
  lon: number;
  radiusMiles: number;
}

export type Station = 'ingest' | 'find' | 'rank' | 'look' | 'describe' | 'capstone' | 'agent' | 'industries';

export interface IngestStep {
  step: 'fetch' | 'reader_output' | 'parse' | 'index' | 'complete';
  status: 'start' | 'progress' | 'done' | 'error';
  message: string;
  detail?: Record<string, unknown>;
}

export interface IngestedHotel extends Partial<Hotel> {
  name: string;
  source_url?: string;
}
