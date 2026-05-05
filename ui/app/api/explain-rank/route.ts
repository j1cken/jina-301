import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { getHotelById } from '@/lib/elasticsearch';

const inFlight = new Set<string>();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { query, hotelId, delta = 0 } = body as { query: string; hotelId: string; delta?: number };

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

  const descriptionText = hotel.descriptions.join(' ').slice(0, 1500);
  const score = hotel.score ?? 0;

  const makeFallback = () =>
    score > 0
      ? `Reranker score: ${score.toFixed(3)} — moved ${delta > 0 ? 'up' : 'down'} ${Math.abs(delta)} position${Math.abs(delta) !== 1 ? 's' : ''}.`
      : `Moved ${delta > 0 ? 'up' : 'down'} ${Math.abs(delta)} position${Math.abs(delta) !== 1 ? 's' : ''} after reranking.`;

  inFlight.add(key);
  const ai = new GoogleGenAI({ vertexai: true, project: 'elastic-sa', location: 'us-central1' });

  const t0 = Date.now();
  try {
    console.log('[explain-rank] calling Gemini...');
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are explaining to an Elastic Field Engineer why Jina Reranker v3 re-ordered a hotel search result.

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

Rules: quotedPhrase MUST appear verbatim in the description. No marketing language. Be honest about mismatches.`,
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quotedPhrase: { type: Type.STRING },
            explanation: { type: Type.STRING },
            mismatch: { type: Type.STRING, nullable: true },
          },
          required: ['quotedPhrase', 'explanation'],
        },
      },
    });

    console.log('[explain-rank] Gemini OK in %dms', Date.now() - t0);

    const raw = response.text ?? '';
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
    console.error('[explain-rank] Gemini error after %dms:', Date.now() - t0, err);
    return NextResponse.json({ explanation: makeFallback() });
  } finally {
    inFlight.delete(key);
  }
}
