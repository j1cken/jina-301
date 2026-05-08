/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client } from '@elastic/elasticsearch';
import type { Hotel, RankedHotel, GeoFilter } from './types';
import { getExplanation } from './rerankerExplanations';

const INDEX = 'horizon-hotels';
const RERANKER_ID = '.jina-reranker-v3';

let client: Client | null = null;

export function getClient(): Client {
  if (client) return client;

  const apiKey = process.env.ELASTICSEARCH_API_KEY;
  const url = process.env.ELASTICSEARCH_URL;

  if (!apiKey || !url) {
    throw new Error('Missing ELASTICSEARCH_URL or ELASTICSEARCH_API_KEY');
  }

  client = new Client({ node: url, auth: { apiKey } });
  return client;
}

function hitToHotel(hit: any): Hotel {
  const src = hit._source ?? {};
  return {
    id: hit._id as string,
    name: src.name ?? '',
    descriptions: src.descriptions ?? [],
    location: src.location ?? { lat: 0, lon: 0 },
    location_name: src.location_name ?? '',
    country: src.country ?? '',
    region: src.region ?? '',
    amenities: src.amenities ?? [],
    style: src.style ?? [],
    price_tier: src.price_tier ?? 'mid',
    price_per_night_usd: src.price_per_night_usd ?? 0,
    image_paths: src.image_paths ?? [],
    rating: src.rating ?? 0,
    nearby_landmarks: src.nearby_landmarks ?? [],
    score: hit._score ?? 0,
  };
}

function buildGeoFilter(geo?: GeoFilter): any | undefined {
  if (!geo) return undefined;
  return {
    geo_distance: {
      distance: `${geo.radiusMiles}mi`,
      location: { lat: geo.lat, lon: geo.lon },
    },
  };
}

const SOURCE_EXCLUDE = { excludes: ['image_embedding', 'name_semantic'] };

export async function searchSemantic(query: string, geo?: GeoFilter, size = 10): Promise<Hotel[]> {
  const es = getClient();
  const geoFilter = buildGeoFilter(geo);

  const q = geoFilter
    ? { bool: { must: [{ semantic: { field: 'descriptions', query } }], filter: [geoFilter] } }
    : { semantic: { field: 'descriptions', query } };

  const response = await (es.search as any)({
    index: INDEX,
    query: q,
    size,
    _source: SOURCE_EXCLUDE,
  });

  return response.hits.hits.map(hitToHotel);
}

export async function searchBm25(query: string, geo?: GeoFilter, size = 10): Promise<Hotel[]> {
  const es = getClient();
  const geoFilter = buildGeoFilter(geo);

  const q = geoFilter
    ? { bool: { must: [{ match: { descriptions_text: query } }], filter: [geoFilter] } }
    : { match: { descriptions_text: query } };

  const response = await (es.search as any)({
    index: INDEX,
    query: q,
    size,
    _source: SOURCE_EXCLUDE,
  });

  return response.hits.hits.map(hitToHotel);
}

export async function searchWithReranker(
  query: string,
  geo?: GeoFilter,
  rankWindowSize = 50,
  size = 10
): Promise<{ naive: Hotel[]; reranked: RankedHotel[] }> {
  const es = getClient();
  const geoFilter = buildGeoFilter(geo);

  const baseRetriever = geoFilter
    ? { standard: { query: { bool: { must: [{ semantic: { field: 'descriptions', query } }], filter: [geoFilter] } } } }
    : { standard: { query: { semantic: { field: 'descriptions', query } } } };

  const [naiveRes, rerankedRes] = await Promise.all([
    (es.search as any)({
      index: INDEX,
      retriever: baseRetriever,
      size,
      _source: SOURCE_EXCLUDE,
    }),
    (es.search as any)({
      index: INDEX,
      retriever: {
        text_similarity_reranker: {
          retriever: baseRetriever,
          field: 'descriptions_text',
          inference_id: RERANKER_ID,
          inference_text: query,
          rank_window_size: rankWindowSize,
        },
      },
      size,
      _source: SOURCE_EXCLUDE,
    }),
  ]);

  const naive: RankedHotel[] = naiveRes.hits.hits.map((hit: any, i: number) => ({
    ...hitToHotel(hit),
    naiveRank: i + 1,
    rerankedRank: i + 1,
    rankDelta: 0,
  }));

  const naiveIdToRank = new Map(naive.map(h => [h.id, h.naiveRank]));

  const reranked: RankedHotel[] = rerankedRes.hits.hits.map((hit: any, i: number) => {
    const hotel = hitToHotel(hit);
    const naiveRank = naiveIdToRank.get(hotel.id) ?? 99;
    const rerankedRank = i + 1;
    return {
      ...hotel,
      naiveRank,
      rerankedRank,
      rankDelta: naiveRank - rerankedRank,
      matchExplanation: getExplanation(query, hotel.name) ?? undefined,
    };
  });

  return { naive, reranked };
}

export async function searchByClipVector(vector: number[], size = 8): Promise<Hotel[]> {
  const es = getClient();

  const response = await (es.search as any)({
    index: INDEX,
    knn: {
      field: 'image_embedding',
      query_vector: vector,
      k: size,
      num_candidates: 50,
    },
    _source: SOURCE_EXCLUDE,
  });

  return response.hits.hits.map(hitToHotel);
}

export async function getClipEmbeddingViaEIS(imageBase64: string): Promise<number[]> {
  const url = `${process.env.ELASTICSEARCH_URL}/_inference/embedding/.jina-clip-v2`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `ApiKey ${process.env.ELASTICSEARCH_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input: [imageBase64] }),
  });
  if (!res.ok) throw new Error(`EIS CLIP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const vector = data.embeddings?.[0]?.embedding;
  if (!Array.isArray(vector) || vector.length !== 1024)
    throw new Error(`Unexpected EIS CLIP shape: ${JSON.stringify(data).slice(0, 200)}`);
  return vector;
}

export async function getHotelById(id: string): Promise<Hotel | null> {
  const es = getClient();
  try {
    const res = await es.get({ index: INDEX, id });
    return hitToHotel({ _id: id, _source: res._source, _score: 1 });
  } catch {
    return null;
  }
}

export async function checkIndexHealth(): Promise<{ exists: boolean; count: number }> {
  const es = getClient();
  try {
    const exists = await es.indices.exists({ index: INDEX });
    if (!exists) return { exists: false, count: 0 };
    const { count } = await es.count({ index: INDEX });
    return { exists: true, count };
  } catch {
    return { exists: false, count: 0 };
  }
}
