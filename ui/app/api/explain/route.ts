import { NextRequest, NextResponse } from 'next/server';
import { getClient } from '@/lib/elasticsearch';

const INDEX = 'horizon-hotels';

export async function POST(req: NextRequest) {
  const { hotelId, query, searchType } = await req.json();

  if (!hotelId || !query) {
    return NextResponse.json({ error: 'hotelId and query required' }, { status: 400 });
  }

  const es = getClient();

  // Semantic/hybrid don't have term-level scoring — return honest stubs
  if (searchType !== 'bm25') {
    return NextResponse.json({
      value: null,
      description: searchType === 'hybrid'
        ? 'Hybrid result via RRF — blends Jina semantic similarity rank + BM25 keyword rank. Hotels appearing in both lists score highest.'
        : 'Semantic match via Jina Embeddings v5 — cosine similarity in 1024-dim vector space. Meaning-based, not keyword-based.',
      details: [],
    });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (es as any).explain({
      index: INDEX,
      id: hotelId,
      query: { match: { descriptions_text: query } },
    });

    const exp = result.explanation ?? result._explanation;
    if (!exp) {
      return NextResponse.json({ value: 0, description: 'No explanation available', details: [] });
    }

    return NextResponse.json({
      value: exp.value ?? 0,
      description: exp.description ?? '',
      details: (exp.details ?? []).slice(0, 3).map((d: { description?: string; value?: number }) => ({
        description: d.description ?? '',
        value: d.value ?? 0,
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
