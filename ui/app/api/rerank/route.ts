import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { searchWithReranker } from '@/lib/elasticsearch';
import type { GeoFilter } from '@/lib/types';

export async function POST(req: NextRequest) {
  const { query, geoFilter, demoMode } = await req.json();

  if (!query?.trim()) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }

  if (demoMode) {
    try {
      const fallbacks = JSON.parse(readFileSync(join(process.cwd(), 'public', 'fallbacks', 'rerank.json'), 'utf-8'));
      const key = Object.keys(fallbacks).find(k => k.toLowerCase().includes(query.toLowerCase().slice(0, 15))) ?? Object.keys(fallbacks)[0];
      if (key) return NextResponse.json(fallbacks[key]);
    } catch { /* fall through to live */ }
  }

  const geo: GeoFilter | undefined = geoFilter;
  const naiveStart = Date.now();
  try {
    const { naive, reranked } = await searchWithReranker(query, geo);
    const rerankTook = Date.now() - naiveStart;
    return NextResponse.json({ naive, reranked, naiveTook: rerankTook, rerankTook });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
