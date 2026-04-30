'use client';

import { useState, useCallback, useRef, Dispatch, SetStateAction } from 'react';
import { apiUrl } from '@/lib/api';

export interface ToolCall {
  id: string;
  name: string;
  status: 'pending' | 'complete';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string;
  toolCalls: ToolCall[];
  isComplete: boolean;
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
      return { ...msg, reasoning: (msg.reasoning ?? '') + (raw.reasoning as string ?? '') };
    case 'thinking_complete':
      return msg;
    case 'message_chunk':
      return { ...msg, content: msg.content + ((raw.text_chunk ?? raw.text ?? '') as string) };
    case 'message_complete':
      return { ...msg, content: (raw.message_content as string) ?? msg.content, isComplete: true };
    case 'round_complete':
      return { ...msg, isComplete: true };
    case 'tool_call':
      return {
        ...msg,
        toolCalls: [...msg.toolCalls, {
          id: (raw.tool_id as string) ?? String(Date.now()),
          name: (raw.tool_name as string) ?? 'tool',
          status: 'pending',
        }],
      };
    case 'tool_result':
      return {
        ...msg,
        toolCalls: msg.toolCalls.map(tc =>
          tc.id === (raw.tool_id as string) ? { ...tc, status: 'complete' } : tc
        ),
      };
    case 'error':
      return { ...msg, content: `⚠️ ${(raw.message as string) ?? 'Unknown error'}`, isComplete: true };
    default:
      return msg;
  }
}

// Fallback: canned stream for demo mode
const FALLBACK: Array<{ delay: number; type: string; data: Record<string, unknown> }> = [
  { delay: 200,  type: 'reasoning',         data: { reasoning: 'Searching horizon-hotels index for matching properties...' } },
  { delay: 1000, type: 'thinking_complete',  data: {} },
  { delay: 1200, type: 'message_chunk',      data: { text_chunk: "I found some great matches! Here are my top picks:\n\n" } },
  { delay: 1500, type: 'message_chunk',      data: { text_chunk: "**Bellagio Las Vegas** — Iconic luxury on the Strip with fountain views and world-class spa. $359/night ⭐ 4.8\n\n" } },
  { delay: 2000, type: 'message_chunk',      data: { text_chunk: "**Park MGM Las Vegas** — Boutique-style retreat with rooftop pool and city views. $219/night ⭐ 4.6\n\n" } },
  { delay: 2500, type: 'message_chunk',      data: { text_chunk: "Would you like to refine this further or explore a different destination?" } },
  { delay: 2700, type: 'message_complete',   data: { message_content: '' } },
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
    setMessages(prev => [
      ...prev,
      { id: `user-${Date.now()}`, role: 'user', content, toolCalls: [], isComplete: true },
      { id: assistantId, role: 'assistant', content: '', toolCalls: [], isComplete: false },
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
