import { NextRequest, NextResponse } from 'next/server';
import { searchSemantic, searchBm25 } from '@/lib/elasticsearch';
import type { GeoFilter, Hotel } from '@/lib/types';

function rrf(semantic: Hotel[], bm25: Hotel[], k = 60): Hotel[] {
  const scores = new Map<string, number>();
  semantic.forEach((h, i) => scores.set(h.id, (scores.get(h.id) ?? 0) + 1 / (k + i + 1)));
  bm25.forEach((h, i) => scores.set(h.id, (scores.get(h.id) ?? 0) + 1 / (k + i + 1)));
  const hotelMap = new Map([...semantic, ...bm25].map(h => [h.id, h]));
  const seen = new Set<string>();
  const ids = [...semantic, ...bm25].map(h => h.id).filter(id => { if (seen.has(id)) return false; seen.add(id); return true; });
  return ids
    .sort((a, b) => (scores.get(b) ?? 0) - (scores.get(a) ?? 0))
    .slice(0, 10)
    .map(id => hotelMap.get(id)!)
    .filter(Boolean);
}

export async function POST(req: NextRequest) {
  const { query, geoFilter, demoMode } = await req.json();

  if (!query?.trim()) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }

  if (demoMode) {
    try {
      const res = await fetch(new URL('/fallbacks/search.json', req.url));
      if (res.ok) {
        const fallbacks = await res.json();
        const key = Object.keys(fallbacks).find(k => k.toLowerCase().includes(query.toLowerCase().slice(0, 15))) ?? Object.keys(fallbacks)[0];
        if (key) {
          const fb = fallbacks[key];
          if (!fb.hybrid && fb.semantic && fb.bm25) fb.hybrid = rrf(fb.semantic, fb.bm25);
          return NextResponse.json(fb);
        }
      }
    } catch { /* fall through to live */ }
  }

  const geo: GeoFilter | undefined = geoFilter;
  const start = Date.now();

  const [semantic, bm25] = await Promise.all([
    searchSemantic(query, geo),
    searchBm25(query, geo),
  ]);

  return NextResponse.json({ semantic, bm25, hybrid: rrf(semantic, bm25), took: Date.now() - start });
}
