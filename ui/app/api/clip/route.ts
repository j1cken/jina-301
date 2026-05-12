import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { searchByClipVector, getClipEmbeddingViaEIS } from '@/lib/elasticsearch';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';

const JINA_EMBEDDINGS_URL = 'https://api.jina.ai/v1/embeddings';

async function getClipEmbedding(imageBase64: string, mimeType: string, apiKey: string): Promise<number[]> {
  const res = await fetchWithTimeout(JINA_EMBEDDINGS_URL, {
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
  const { imageBase64: rawBase64, imageUrl, mimeType, demoMode } = await req.json();

  // Server-side fetch for sample images — SSRF allowlist: only /images/ paths
  let imageBase64 = rawBase64;
  if (imageUrl) {
    if (!imageUrl.startsWith('/images/') && !imageUrl.startsWith('/horizon/images/')) {
      return NextResponse.json({ error: 'Invalid imageUrl' }, { status: 400 });
    }
    const origin = new URL(req.url).origin;
    const resp = await fetchWithTimeout(`${origin}${imageUrl}`);
    if (!resp.ok) return NextResponse.json({ error: 'Image fetch failed' }, { status: 400 });
    const buf = await resp.arrayBuffer();
    imageBase64 = Buffer.from(buf).toString('base64');
  }

  if (!imageBase64) {
    return NextResponse.json({ error: 'imageBase64 or imageUrl is required' }, { status: 400 });
  }

  if (demoMode) {
    try {
      const clipPath = join(process.cwd(), 'public', 'fallbacks', 'clip.json');
      return NextResponse.json(JSON.parse(readFileSync(clipPath, 'utf-8')));
    } catch { /* fall through */ }
  }

  try {
    let vector: number[];
    if (process.env.CLIP_VIA_EIS === 'true') {
      vector = await getClipEmbeddingViaEIS(imageBase64);
    } else {
      const apiKey = process.env.JINA_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: 'JINA_API_KEY not configured' }, { status: 503 });
      }
      vector = await getClipEmbedding(imageBase64, mimeType ?? 'image/jpeg', apiKey);
    }
    const results = await searchByClipVector(vector);
    return NextResponse.json({ results, query_vector_preview: vector.slice(0, 8) });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
