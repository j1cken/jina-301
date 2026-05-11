import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { searchByClipVector } from '@/lib/elasticsearch';

const JINA_EMBEDDINGS_URL = 'https://api.jina.ai/v1/embeddings';

async function getOmniEmbedding(
  apiKey: string,
  inputs: Array<{ text?: string; image?: string; audio?: string }>,
): Promise<number[]> {
  const res = await fetch(JINA_EMBEDDINGS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'jina-embeddings-v5-omni-small',
      task: 'retrieval.query',
      normalized: true,
      input: inputs,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Omni embedding error ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const vector = data.data?.[0]?.embedding;
  if (!Array.isArray(vector) || vector.length < 256) {
    throw new Error('Unexpected omni response shape');
  }
  return vector;
}

export async function POST(req: NextRequest) {
  const { query, imageBase64: rawBase64, imageUrl, audioBase64, demoMode } = await req.json();

  // Determine fallback lookup key
  const fallbackKey = query ?? ((rawBase64 || imageUrl) ? 'image_demo' : 'audio_demo');

  if (demoMode) {
    try {
      const omniPath = join(process.cwd(), 'public', 'fallbacks', 'omni.json');
      const all = JSON.parse(readFileSync(omniPath, 'utf-8'));
      const key =
        Object.keys(all).find(k => k.toLowerCase().includes(fallbackKey.toLowerCase().slice(0, 20))) ??
        Object.keys(all)[0];
      if (key) return NextResponse.json(all[key]);
    } catch { /* fall through */ }
    // Emergency fallback: use clip.json shape if omni.json missing or unmatched
    try {
      const clipPath = join(process.cwd(), 'public', 'fallbacks', 'clip.json');
      const clip = JSON.parse(readFileSync(clipPath, 'utf-8'));
      return NextResponse.json({ results: clip.results ?? [], query_vector_preview: [], took: 0 });
    } catch { /* fall through to live */ }
  }

  // Resolve imageUrl → base64 (SSRF allowlist: /images/ and /audio/ paths only)
  let imageBase64 = rawBase64;
  if (imageUrl) {
    if (!imageUrl.startsWith('/images/') && !imageUrl.startsWith('/audio/')) {
      return NextResponse.json({ error: 'Invalid imageUrl' }, { status: 400 });
    }
    const origin = new URL(req.url).origin;
    const resp = await fetch(`${origin}${imageUrl}`);
    if (!resp.ok) return NextResponse.json({ error: 'Asset fetch failed' }, { status: 400 });
    const buf = await resp.arrayBuffer();
    imageBase64 = Buffer.from(buf).toString('base64');
  }

  if (!query && !imageBase64 && !audioBase64) {
    return NextResponse.json({ error: 'query, imageBase64/imageUrl, or audioBase64 required' }, { status: 400 });
  }

  try {
    const apiKey = process.env.JINA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'JINA_API_KEY not configured' }, { status: 503 });
    }

    // Build input array — omni accepts mixed modality objects in one call
    const inputs: Array<{ text?: string; image?: string; audio?: string }> = [];
    if (query) inputs.push({ text: query });
    if (imageBase64) inputs.push({ image: imageBase64 });
    if (audioBase64) inputs.push({ audio: audioBase64 });

    const start = Date.now();
    const vector = await getOmniEmbedding(apiKey, inputs);
    const results = await searchByClipVector(vector);
    const took = Date.now() - start;

    return NextResponse.json({ results, query_vector_preview: vector.slice(0, 8), took });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
