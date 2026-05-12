import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';

const VLM_URL = 'https://api-beta-vlm.jina.ai/v1/chat/completions';
const COLD_START_CODES = new Set([502, 503, 429]);

const VlmSchema = z.object({
  style: z.string(),
  visibleAmenities: z.array(z.string()),
  mood: z.string(),
  guestProfile: z.string(),
  standout: z.string().optional(),
}).passthrough();

const PROMPT = `Analyze this hotel image and return ONLY a JSON object with these exact fields:
{
  "style": "one phrase describing the hotel style (e.g. 'Contemporary Luxury', 'Desert Retreat', 'Boutique Heritage')",
  "visibleAmenities": ["list of amenities visible in the image, max 5"],
  "mood": "one sentence describing the mood and atmosphere",
  "guestProfile": "one sentence describing the ideal guest for this property"
}
Return only valid JSON, no markdown fences, no explanation.`;

function stripFences(text: string): string {
  let s = text.trim();
  if (s.startsWith('```')) {
    const newline = s.indexOf('\n');
    if (newline !== -1) s = s.slice(newline + 1);
    if (s.endsWith('```')) s = s.slice(0, -3).trim();
  }
  return s;
}

export async function POST(req: NextRequest) {
  const { imageUrl, imageBase64, mimeType, hotelId, demoMode, prompt: customPrompt } = await req.json();
  const activePrompt = customPrompt?.trim() || PROMPT;

  if (!imageUrl && !hotelId && !imageBase64) {
    return NextResponse.json({ error: 'imageUrl, imageBase64, or hotelId required' }, { status: 400 });
  }

  if (demoMode) {
    try {
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      const p = join(process.cwd(), 'public', 'fallbacks', 'vision.json');
      return NextResponse.json(JSON.parse(readFileSync(p, 'utf-8')));
    } catch { /* fall through */ }
  }

  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'JINA_API_KEY not configured' }, { status: 503 });
  }

  // Use provided base64 directly, or fetch and encode from URL
  let base64: string;
  let mime = 'image/jpeg';
  if (imageBase64) {
    base64 = imageBase64;
    mime = mimeType ?? 'image/jpeg';
  } else {
    try {
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error(`Image fetch failed: ${imgRes.status}`);
      mime = imgRes.headers.get('content-type') ?? 'image/jpeg';
      const buf = await imgRes.arrayBuffer();
      base64 = Buffer.from(buf).toString('base64');
      if (base64.length > 5_000_000) {
        throw new Error('Image too large (> 4MB base64)');
      }
    } catch (err) {
      return NextResponse.json({ error: `Could not fetch image: ${(err as Error).message}` }, { status: 400 });
    }
  }

  const payload = {
    model: 'jina-vlm',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: activePrompt },
        { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } },
      ],
    }],
    max_tokens: 500,
  };

  // Retry with backoff on cold-start (20s per-attempt timeout to keep worst-case ~95s)
  const delays = [0, 15000, 30000];
  let lastStatus = 200;

  for (let i = 0; i < delays.length; i++) {
    if (delays[i] > 0) await new Promise(r => setTimeout(r, delays[i]));

    let vlmRes: Response;
    try {
      vlmRes = await fetchWithTimeout(VLM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      }, 20_000);
    } catch {
      // Timeout or network error — treat like cold-start and retry if attempts remain
      if (i < delays.length - 1) continue;
      return NextResponse.json(
        { error: 'Vision model timed out. Please retry in ~30 seconds.', coldStart: true, status: 504 },
        { status: 502 }
      );
    }

    lastStatus = vlmRes.status;

    if (COLD_START_CODES.has(vlmRes.status)) {
      continue;
    }

    if (!vlmRes.ok) {
      const body = await vlmRes.text().catch(() => '');
      return NextResponse.json({ error: `VLM error ${vlmRes.status}`, detail: body.slice(0, 300) }, { status: 500 });
    }

    const data = await vlmRes.json();
    const raw = data?.choices?.[0]?.message?.content ?? '';

    let parsedJson: Record<string, unknown> | null = null;
    try {
      const j = JSON.parse(stripFences(raw));
      if (j && typeof j === 'object' && !Array.isArray(j)) parsedJson = j as Record<string, unknown>;
    } catch { /* fall through */ }

    const parsed = parsedJson ? VlmSchema.safeParse(parsedJson) : { success: false as const };
    if (parsed.success) {
      return NextResponse.json({ analysis: parsed.data, rawJson: raw });
    }

    // Partial fallback: JSON parsed but failed schema — salvage whatever fields are present
    // rather than dumping raw JSON into the mood field.
    if (parsedJson) {
      const str = (v: unknown) => (typeof v === 'string' ? v : undefined);
      const arr = (v: unknown) => (Array.isArray(v) ? (v as unknown[]).filter(x => typeof x === 'string') as string[] : []);
      return NextResponse.json({
        analysis: {
          style: str(parsedJson.style) ?? 'Hotel',
          visibleAmenities: arr(parsedJson.visibleAmenities),
          mood: str(parsedJson.mood) ?? '',
          guestProfile: str(parsedJson.guestProfile) ?? '',
          standout: str(parsedJson.standout),
          ...Object.fromEntries(
            Object.entries(parsedJson).filter(([k]) =>
              !['style','visibleAmenities','mood','guestProfile','standout'].includes(k)
            )
          ),
        },
        rawJson: raw,
      });
    }

    // Full fallback: VLM returned non-JSON — surface it in rawDescription only
    return NextResponse.json({
      analysis: {
        style: 'Hotel',
        visibleAmenities: [],
        mood: '',
        guestProfile: '',
        rawDescription: raw,
      },
      rawJson: raw,
    });
  }

  return NextResponse.json(
    { error: 'Vision model is warming up. Please retry in ~30 seconds.', coldStart: true, status: lastStatus },
    { status: 502 }
  );
}
