import { NextRequest, NextResponse } from 'next/server';
import https from 'node:https';
import { GoogleAuth } from 'google-auth-library';
import { getHotelById } from '@/lib/elasticsearch';

export const dynamic = 'force-dynamic';

const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });

/** Call Vertex AI using native https to bypass Next.js's patched global fetch */
async function callVertexGemini(prompt: string): Promise<string> {
  console.log('[explain-rank] getting ADC token...');
  const token = await auth.getAccessToken();
  console.log('[explain-rank] token OK, making https request...');
  const body = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      thinkingConfig: { thinkingBudget: 0 },
      responseSchema: {
        type: 'OBJECT',
        properties: {
          quotedPhrase: { type: 'STRING' },
          explanation: { type: 'STRING' },
          mismatch: { type: 'STRING', nullable: true },
        },
        required: ['quotedPhrase', 'explanation'],
      },
    },
  });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'us-central1-aiplatform.googleapis.com',
      path: '/v1/projects/elastic-sa/locations/us-central1/publishers/google/models/gemini-2.5-flash:generateContent',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      console.log('[explain-rank] https response status:', res.statusCode);
      let data = '';
      res.on('data', (chunk: Buffer) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Vertex AI ${res.statusCode}: ${data.slice(0, 200)}`));
          return;
        }
        try {
          const json = JSON.parse(data);
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
          resolve(text);
        } catch {
          reject(new Error(`Vertex AI parse error: ${data.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const inFlight = new Set<string>();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { query, hotelId, delta = 0, demoMode } = body as { query: string; hotelId: string; delta?: number; demoMode?: boolean };

  console.log('[explain-rank] START hotelId=%s query=%s', hotelId, query.slice(0, 40));

  if (!query?.trim() || !hotelId?.trim()) {
    return NextResponse.json({ error: 'query and hotelId are required' }, { status: 400 });
  }

  const key = `${hotelId}:${query}`;
  if (inFlight.has(key)) {
    console.log('[explain-rank] IN FLIGHT key=%s', key);
    return NextResponse.json({ error: 'request in flight' }, { status: 429 });
  }

  const hotel = await getHotelById(hotelId);
  if (!hotel) {
    console.log('[explain-rank] hotel not found id=%s', hotelId);
    return NextResponse.json({ error: 'hotel not found' }, { status: 404 });
  }

  console.log('[explain-rank] hotel found: %s, descriptions=%d, score=%s', hotel.name, hotel.descriptions.length, hotel.score);

  if (demoMode) {
    const firstSentence = hotel.descriptions[0]?.split('.')[0] ?? hotel.name;
    const dir = delta > 0 ? 'up' : 'down';
    const n = Math.abs(delta);
    return NextResponse.json({
      explanation: `"${firstSentence}." — The bi-encoder collapsed this description into a single vector and couldn't weight individual signals. Reranker v3 read the query and full description together with cross-attention, catching the semantic match the vector missed.\n\nMoved ${dir} ${n} position${n !== 1 ? 's' : ''} after reranking.`,
    });
  }

  const descriptionText = hotel.descriptions.join(' ').slice(0, 1500);
  const score = hotel.score ?? 0;

  const makeFallback = () =>
    score > 0
      ? `Reranker score: ${score.toFixed(3)} — moved ${delta > 0 ? 'up' : 'down'} ${Math.abs(delta)} position${Math.abs(delta) !== 1 ? 's' : ''}.`
      : `Moved ${delta > 0 ? 'up' : 'down'} ${Math.abs(delta)} position${Math.abs(delta) !== 1 ? 's' : ''} after reranking.`;

  inFlight.add(key);

  const t0 = Date.now();
  const geminiCall = callVertexGemini(`You are explaining to an Elastic Field Engineer why Jina Reranker v3 re-ordered a hotel search result.

Query: "${query}"
Hotel: "${hotel.name}"${score > 0 ? `\nReranker score: ${score.toFixed(3)}` : ''}
Description: "${descriptionText}"
Amenities: ${hotel.amenities.join(', ')}

Return JSON with:
- quotedPhrase: one phrase verbatim from the description the reranker likely weighted for this query
- explanation: what lexical signal the bi-encoder over- or under-weighted (1-2 sentences, max 40 words)
- mismatch: if the description contradicts the query, name the contradicting phrase (1 sentence, max 20 words); else null

Example:
{"quotedPhrase":"soundproofed co-working rooms","explanation":"The bi-encoder under-weighted 'soundproofed' because 'quiet' wasn't a verbatim match; the reranker caught the semantic equivalence.","mismatch":null}

Rules: quotedPhrase MUST appear verbatim in the description. No marketing language. Be honest about mismatches.`);
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Gemini timeout')), 20_000)
  );

  try {
    console.log('[explain-rank] calling Gemini...');
    const raw = await Promise.race([geminiCall, timeoutPromise]);

    console.log('[explain-rank] Gemini OK in %dms', Date.now() - t0);

    const parsed = JSON.parse(raw) as { quotedPhrase: string; explanation: string; mismatch?: string | null };

    console.log('[explain-rank] quotedPhrase=%s inDesc=%s', parsed.quotedPhrase?.slice(0,30), descriptionText.includes(parsed.quotedPhrase));

    if (!descriptionText.includes(parsed.quotedPhrase)) {
      console.log('[explain-rank] quotedPhrase not found in description, using fallback');
      return NextResponse.json({ explanation: makeFallback() });
    }

    const parts: string[] = [`"${parsed.quotedPhrase}" — ${parsed.explanation}`];
    if (parsed.mismatch) parts.push(parsed.mismatch);

    return NextResponse.json({ explanation: parts.join('\n\n') });
  } catch (err) {
    geminiCall.catch(() => {}); // swallow orphaned promise after race loss
    console.error('[explain-rank] Gemini error after %dms:', Date.now() - t0, err);
    const dir = delta > 0 ? 'up' : 'down';
    const n = Math.abs(delta);
    return NextResponse.json({
      explanation: `Reranker v3 read the query and full description together with cross-attention — catching signals the bi-encoder missed when it collapsed everything into one vector.\n\nMoved ${dir} ${n} position${n !== 1 ? 's' : ''} after reranking.`,
    });
  } finally {
    inFlight.delete(key);
  }
}
