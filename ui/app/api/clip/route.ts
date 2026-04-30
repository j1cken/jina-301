import { NextRequest, NextResponse } from 'next/server';
import { searchByClipVector } from '@/lib/elasticsearch';

const JINA_EMBEDDINGS_URL = 'https://api.jina.ai/v1/embeddings';

async function getClipEmbedding(imageBase64: string, mimeType: string, apiKey: string): Promise<number[]> {
  const res = await fetch(JINA_EMBEDDINGS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'jina-clip-v2',
      input: [{ image: imageBase64 }],
      encoding_type: 'float',
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Jina CLIP error ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const vector = data.data?.[0]?.embedding;
  if (!Array.isArray(vector) || vector.length !== 1024) {
    throw new Error('Unexpected CLIP response shape');
  }
  return vector;
}

export async function POST(req: NextRequest) {
  const { imageBase64, mimeType, demoMode } = await req.json();

  if (!imageBase64) {
    return NextResponse.json({ error: 'imageBase64 is required' }, { status: 400 });
  }

  if (demoMode) {
    try {
      const res = await fetch(new URL('/fallbacks/clip.json', req.url));
      if (res.ok) return NextResponse.json(await res.json());
    } catch { /* fall through */ }
  }

  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'JINA_API_KEY not configured' }, { status: 503 });
  }

  const vector = await getClipEmbedding(imageBase64, mimeType ?? 'image/jpeg', apiKey);
  const results = await searchByClipVector(vector);

  return NextResponse.json({
    results,
    query_vector_preview: vector.slice(0, 8),
  });
}
