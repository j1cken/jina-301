import { NextRequest, NextResponse } from 'next/server';
import { getClient } from '@/lib/elasticsearch';

const INDEX = 'horizon-hotels';
const EMBEDDING_ID = '.jina-embeddings-v5-text-small';

type StepId = 'fetch' | 'parse' | 'index' | 'complete';
interface ProgressEvent {
  step: StepId;
  status: 'start' | 'progress' | 'done' | 'error';
  message: string;
  detail?: Record<string, unknown>;
}

function sse(event: ProgressEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

async function fetchViaReader(url: string, apiKey: string): Promise<string> {
  const res = await fetch(`https://r.jina.ai/${url}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'X-Respond-With': 'markdown',
    },
  });
  if (!res.ok) throw new Error(`Jina Reader returned ${res.status}`);
  const text = await res.text();
  // Strip the header lines (Title: ..., URL Source: ..., Markdown Content:)
  const contentStart = text.indexOf('Markdown Content:');
  return contentStart > -1 ? text.slice(contentStart + 17).trim() : text;
}

function parseHotelFromMarkdown(markdown: string, url: string): Record<string, unknown> {
  const lines = markdown.split('\n');

  const name = lines.find(l => l.startsWith('# '))?.replace(/^# /, '').trim()
    ?? lines.find(l => l.trim().length > 3)?.trim()
    ?? 'Unknown Hotel';

  const paragraphs = markdown
    .split(/\n{2,}/)
    .map(p => p.replace(/^#+\s+/, '').trim())
    .filter(p => p.length > 50 && !p.startsWith('http'));

  const descriptions = paragraphs.slice(0, 4);

  return {
    name,
    descriptions,
    descriptions_text: descriptions.join(' '),
    source_url: url,
    location: { lat: 0, lon: 0 },
    location_name: 'Unknown',
    country: 'Unknown',
    region: 'Unknown',
    amenities: [],
    style: [],
    price_tier: 'mid',
    price_per_night_usd: 0,
    image_paths: [],
    rating: 0,
    nearby_landmarks: [],
  };
}

export async function POST(req: NextRequest) {
  const { url, demoMode } = await req.json();

  if (demoMode) {
    const fallbackSteps: ProgressEvent[] = [
      { step: 'fetch', status: 'start', message: 'Jina Reader is fetching the page...' },
      { step: 'fetch', status: 'done', message: 'Received 12,480 characters of clean markdown' },
      { step: 'parse', status: 'start', message: 'Extracting hotel fields from markdown...' },
      { step: 'parse', status: 'done', message: 'Parsed: name, 3 descriptions, amenities, location', detail: { name: 'The Venetian Resort Las Vegas' } },
      { step: 'index', status: 'start', message: 'Indexing to Elasticsearch — semantic_text auto-embedding now...' },
      { step: 'index', status: 'done', message: 'Indexed 1 document with .jina-embeddings-v5-text-small', detail: { id: 'demo-venetian' } },
      { step: 'complete', status: 'done', message: 'Hotel ready for search', detail: { name: 'The Venetian Resort Las Vegas' } },
    ];

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for (const step of fallbackSteps) {
          controller.enqueue(encoder.encode(sse(step)));
          await new Promise(r => setTimeout(r, 600));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    });
  }

  if (!url) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }

  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'JINA_API_KEY not configured' }, { status: 503 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: ProgressEvent) => controller.enqueue(encoder.encode(sse(event)));

      try {
        emit({ step: 'fetch', status: 'start', message: `Jina Reader fetching ${url}...` });
        const markdown = await fetchViaReader(url, apiKey);
        emit({ step: 'fetch', status: 'done', message: `Received ${markdown.length.toLocaleString()} characters`, detail: { chars: markdown.length } });

        emit({ step: 'parse', status: 'start', message: 'Extracting hotel fields from markdown...' });
        const hotel = parseHotelFromMarkdown(markdown, url);
        emit({ step: 'parse', status: 'done', message: `Parsed: "${hotel.name}"`, detail: { name: hotel.name } });

        emit({ step: 'index', status: 'start', message: `Indexing to Elasticsearch with ${EMBEDDING_ID}...` });
        const es = getClient();
        const id = `scraped-${Date.now()}`;
        await es.index({ index: INDEX, id, document: hotel });
        emit({ step: 'index', status: 'done', message: 'Indexed with auto-embedding', detail: { id } });

        emit({ step: 'complete', status: 'done', message: 'Hotel ready for search', detail: hotel });
      } catch (err) {
        emit({ step: 'fetch', status: 'error', message: (err as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
  });
}
