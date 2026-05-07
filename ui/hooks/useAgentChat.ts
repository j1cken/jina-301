'use client';

import { useState, useCallback, useRef, Dispatch, SetStateAction } from 'react';
import { apiUrl, BASE_PATH } from '@/lib/api';

export interface ChatHotel {
  id: string;
  name: string;
  // Tier 1 hotels (8 hand-crafted) use singular; Tier 2 (129 generated) use array
  description?: string;
  descriptions?: string[];
  image_paths: string[];
  room_description?: string;
  // Rich fields present on Tier 2 hotels — passed through to the detail modal
  rating?: number;
  price_per_night_usd?: number;
  price_tier?: string;
  amenities?: string[];
  style?: string[];
  location?: { lat: number; lon: number };
  location_name?: string;
  country?: string;
  region?: string;
  nearby_landmarks?: string[];
}

export interface ToolCall {
  id: string;
  name: string;
  status: 'pending' | 'complete';
  input?: Record<string, unknown>;
  output?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string;
  toolCalls: ToolCall[];
  isComplete: boolean;
  hotels: ChatHotel[];
  thinkingStartTime?: number;
  thinkingDuration?: number;
}

// ── Hotel index: eager-fetch on client mount, longest-name-first for greedy matching ──
let hotelsCache: ChatHotel[] | null = null;
if (typeof window !== 'undefined') {
  fetch(`${BASE_PATH}/hotels.json`)
    .then(r => r.json())
    .then((data: ChatHotel[]) => {
      hotelsCache = data.sort((a, b) => b.name.length - a.name.length);
    })
    .catch(() => {});
}

// Words too generic to identify a specific hotel; won't be used as match tokens
const GENERIC_HOTEL_WORDS = new Set([
  'the', 'hotel', 'resort', 'inn', 'las', 'vegas', 'usa', 'and', 'spa',
  'by', 'at', 'of', 'de', 'suites', 'luxury', 'experience', 'properties',
  'collection', 'casino', 'palace', 'desert', 'beach', 'safari', 'arts',
  'plaza', 'star', 'club', 'lodge', 'camp', 'mountain', 'island', 'city',
  'royal', 'bay',
]);

function getHotelTokens(name: string): string[] {
  return name.toLowerCase()
    .replace(/[+&]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !GENERIC_HOTEL_WORDS.has(w));
}

function tokenRegex(t: string): RegExp {
  return new RegExp(`\\b${t}\\b`);
}

function hotelMentionedIn(nameLower: string, tokens: string[], cleaned: string): boolean {
  if (cleaned.includes(nameLower)) return true;
  return tokens.length > 0 && tokens.some(t => tokenRegex(t).test(cleaned));
}

function firstMentionPos(nameLower: string, tokens: string[], cleaned: string): number {
  const exact = cleaned.indexOf(nameLower);
  if (exact >= 0) return exact;
  return tokens
    .map(t => { const m = tokenRegex(t).exec(cleaned); return m ? m.index : -1; })
    .filter(p => p >= 0)
    .reduce((min, p) => Math.min(min, p), Infinity);
}

function extractHotelsFromText(text: string): ChatHotel[] {
  if (!hotelsCache) return [];
  const cleaned = text.replace(/\*{1,2}/g, '').toLowerCase();
  const found: ChatHotel[] = [];
  const seenNames = new Set<string>();
  for (const hotel of hotelsCache) {
    const nameLower = hotel.name.toLowerCase();
    if (seenNames.has(nameLower)) continue;
    const tokens = getHotelTokens(hotel.name);
    if (hotelMentionedIn(nameLower, tokens, cleaned)) {
      found.push(hotel);
      seenNames.add(nameLower);
      if (found.length >= 5) break;
    }
  }
  // Sort by first mention in prose (exact or token); every matched entry has pos >= 0
  found.sort((a, b) =>
    firstMentionPos(a.name.toLowerCase(), getHotelTokens(a.name), cleaned) -
    firstMentionPos(b.name.toLowerCase(), getHotelTokens(b.name), cleaned)
  );
  return found;
}

function normalizeType(explicit: string | null, payload: Record<string, unknown>): string {
  const aliases: Record<string, string> = { conversation_updated: 'conversation_created' };
  if (explicit) return aliases[explicit] ?? explicit;
  if (payload.reasoning) return 'reasoning';
  if ('text_chunk' in payload || 'message_id' in payload) return 'message_chunk';
  if (payload.message_content) return 'message_complete';
  if (payload.conversation_id) return 'conversation_id_set';
  return 'unknown';
}

function applyEvent(
  msg: Message,
  eventType: string,
  raw: Record<string, unknown>,
  setConvId: (id: string) => void,
): Message {
  switch (eventType) {
    case 'conversation_id_set':
    case 'conversation_created':
      if (raw.conversation_id) setConvId(raw.conversation_id as string);
      return msg;
    case 'reasoning':
      return {
        ...msg,
        reasoning: (msg.reasoning ?? '') + ((raw.reasoning as string) ?? ''),
        thinkingStartTime: msg.thinkingStartTime ?? Date.now(),
      };
    case 'thinking_complete':
      return msg;
    case 'message_chunk':
      return { ...msg, content: msg.content + (((raw.text_chunk ?? raw.text ?? '') as string)) };
    case 'message_complete': {
      const content = (raw.message_content as string) ?? msg.content;
      const hotels = extractHotelsFromText(content);
      const thinkingDuration = msg.thinkingStartTime
        ? Math.round((Date.now() - msg.thinkingStartTime) / 1000)
        : undefined;
      return { ...msg, content, isComplete: true, hotels, thinkingDuration };
    }
    case 'round_complete': {
      const hotels = extractHotelsFromText(msg.content);
      const thinkingDuration = msg.thinkingStartTime
        ? Math.round((Date.now() - msg.thinkingStartTime) / 1000)
        : undefined;
      return { ...msg, isComplete: true, hotels, thinkingDuration };
    }
    case 'tool_call':
      return {
        ...msg,
        toolCalls: [...msg.toolCalls, {
          id: (raw.tool_id as string) ?? String(Date.now()),
          name: (raw.tool_name as string) ?? 'tool',
          status: 'pending',
          input: raw.tool_input as Record<string, unknown> | undefined,
        }],
      };
    case 'tool_result':
      return {
        ...msg,
        toolCalls: msg.toolCalls.map(tc =>
          tc.id === (raw.tool_id as string)
            ? { ...tc, status: 'complete', output: raw.tool_result as string | undefined }
            : tc
        ),
      };
    case 'error': {
      console.error('[AgentChat] error event raw:', raw);
      let errMsg: string;
      if (typeof raw.message === 'string') errMsg = raw.message;
      else if (typeof raw.error === 'string') errMsg = raw.error;
      else if (raw.error && typeof raw.error === 'object') {
        const e = raw.error as Record<string, unknown>;
        errMsg = typeof e.message === 'string' ? e.message
          : typeof e.reason === 'string' ? e.reason
          : JSON.stringify(raw.error).slice(0, 200);
      } else errMsg = JSON.stringify(raw).slice(0, 200);
      return { ...msg, content: `⚠️ ${errMsg}`, isComplete: true };
    }
    default:
      return msg;
  }
}

// Fallback: canned stream for demo mode — uses exact hotel names from hotels.json
const FALLBACK: Array<{ delay: number; type: string; data: Record<string, unknown> }> = [
  { delay: 200,  type: 'reasoning',        data: { reasoning: 'Searching horizon-hotels index using Jina Embeddings v5 for semantic matching...' } },
  { delay: 600,  type: 'tool_call',        data: { tool_id: 'tc-1', tool_name: 'semantic_search', tool_input: { query: 'baller room vegas strip view' } } },
  { delay: 1400, type: 'tool_result',      data: { tool_id: 'tc-1', tool_result: '5 hotels matched' } },
  { delay: 1600, type: 'thinking_complete', data: {} },
  { delay: 1800, type: 'message_chunk',    data: { text_chunk: "Here are my top picks for a luxurious Las Vegas stay with Strip views:\n\n" } },
  { delay: 2100, type: 'message_chunk',    data: { text_chunk: "**Bellagio** — Iconic luxury on the Strip with world-famous fountain views, premier spa, and celebrity chef restaurants. $359/night ⭐ 4.9\n\n" } },
  { delay: 2500, type: 'message_chunk',    data: { text_chunk: "**The Venetian Resort Las Vegas** — Grand Italian-inspired suites, indoor gondolas, and sweeping Strip panoramas from every room. $289/night ⭐ 4.8\n\n" } },
  { delay: 2900, type: 'message_chunk',    data: { text_chunk: "**Wynn Las Vegas** — Sophisticated elegance with private pool villas, signature dining, and one of the best spas in Nevada. $429/night ⭐ 4.9\n\n" } },
  { delay: 3200, type: 'message_chunk',    data: { text_chunk: "Would you like more details on any of these, or shall I filter by price range or specific amenities?" } },
  { delay: 3400, type: 'message_complete', data: { message_content: '' } },
];

async function replayFallback(assistantId: string, set: Dispatch<SetStateAction<Message[]>>) {
  for (const step of FALLBACK) {
    await new Promise(r => setTimeout(r, step.delay));
    set(prev => prev.map(m => m.id !== assistantId ? m : applyEvent(m, step.type, step.data, () => {})));
  }
}

export function useAgentChat(demoMode: boolean) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setConversationId(undefined);
    setIsLoading(false);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const assistantId = `asst-${Date.now()}`;
    const emptyMsg: Message = { id: assistantId, role: 'assistant', content: '', toolCalls: [], isComplete: false, hotels: [] };
    setMessages(prev => [
      ...prev,
      { id: `user-${Date.now()}`, role: 'user', content, toolCalls: [], isComplete: true, hotels: [] },
      emptyMsg,
    ]);
    setIsLoading(true);

    if (demoMode) {
      await replayFallback(assistantId, setMessages);
      setIsLoading(false);
      return;
    }

    const abort = new AbortController();
    abortRef.current = abort;
    try {
      const res = await fetch(apiUrl('/api/agent/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: content, conversationId }),
        signal: abort.signal,
      });

      if (!res.body) throw new Error('No response body');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let evType: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim() || line.startsWith(':')) continue;
          if (line.startsWith('event: ')) { evType = line.slice(7).trim(); continue; }
          if (!line.startsWith('data: ')) continue;
          try {
            let raw = JSON.parse(line.slice(6));
            if (raw?.data && typeof raw.data === 'object') raw = raw.data;
            if (raw?.data && typeof raw.data === 'object') raw = raw.data;
            const type = normalizeType(evType, raw);
            evType = null;
            if (type === 'conversation_id_set' || type === 'conversation_created') {
              if (raw.conversation_id) setConversationId(raw.conversation_id as string);
            }
            setMessages(prev => prev.map(m =>
              m.id === assistantId ? applyEvent(m, type, raw, id => setConversationId(id)) : m
            ));
          } catch { /* skip malformed */ }
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: '⚠️ Connection error — please try again.', isComplete: true } : m
      ));
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [isLoading, conversationId, demoMode]);

  return { messages, isLoading, sendMessage, reset, conversationId };
}
