export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { input, conversationId } = await req.json();
  const agentId = process.env.AGENT_ID;
  const kibanaUrl = process.env.KIBANA_URL;
  const apiKey = process.env.KIBANA_API_KEY;

  if (!agentId || agentId === 'placeholder' || !kibanaUrl || !apiKey) {
    const err = `event: error\ndata: ${JSON.stringify({ message: 'Agent not configured — set AGENT_ID, KIBANA_URL, KIBANA_API_KEY in environment' })}\n\ndata: [DONE]\n\n`;
    return new NextResponse(err, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
  }
  if (!input?.trim()) {
    return NextResponse.json({ error: 'input required' }, { status: 400 });
  }

  const body: Record<string, string> = { input, agent_id: agentId };
  if (conversationId) body.conversation_id = conversationId;

  let upstream: Response;
  try {
    upstream = await fetch(`${kibanaUrl}/api/agent_builder/converse/async`, {
      method: 'POST',
      headers: {
        'Authorization': `ApiKey ${apiKey}`,
        'Content-Type': 'application/json',
        'kbn-xsrf': 'true',
      },
      body: JSON.stringify(body),
      signal: req.signal,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const errEvent = `event: error\ndata: ${JSON.stringify({ message: `Network error: ${msg}` })}\n\n`;
    return new NextResponse(errEvent, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
  }

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '');
    const errEvent = `event: error\ndata: ${JSON.stringify({ message: `Kibana ${upstream.status}: ${errText.slice(0, 200)}` })}\n\n`;
    return new NextResponse(errEvent, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
  }

  // 2-minute streaming timeout — if Kibana hangs while client stays connected, inject an error and close
  const timeoutController = new AbortController();
  const timeoutTimer = setTimeout(() => timeoutController.abort(), 120_000);
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      // Cancel the reader when the timeout fires so the in-flight read() resolves
      timeoutController.signal.addEventListener('abort', () => {
        reader.cancel('timeout').catch(() => {});
      }, { once: true });

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
        if (timeoutController.signal.aborted) {
          const errMsg = `event: error\ndata: ${JSON.stringify({ message: 'Agent timed out after 2 minutes' })}\n\ndata: [DONE]\n\n`;
          controller.enqueue(encoder.encode(errMsg));
        }
        controller.close();
      } catch {
        controller.close();
      } finally {
        clearTimeout(timeoutTimer);
      }
    },
    cancel() {
      clearTimeout(timeoutTimer);
    },
  });

  return new NextResponse(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
