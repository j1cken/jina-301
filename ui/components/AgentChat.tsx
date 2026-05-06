'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, X, RotateCcw, ChevronDown, ChevronRight, Wrench, Zap, MessageSquare } from 'lucide-react';
import { useAgentChat, type Message, type ChatHotel } from '@/hooks/useAgentChat';
import { useDemoMode } from '@/lib/demoMode';
import ChatHotelCard from '@/components/ChatHotelCard';

const SUGGESTIONS = [
  'Quiet hotel for focused remote work, no casino noise',
  'Romantic beachfront with private pool and ocean views',
  'Baller room in Vegas with a view of the Strip',
];

// Maps Agent Builder tool names to human-readable labels (Jina-aware)
const TOOL_LABELS: Record<string, string> = {
  semantic_search:   'Jina Semantic Search',
  search_hotels:     'Jina Semantic Search',
  hotel_search:      'Jina Semantic Search',
  rerank:            'Jina Reranker v3',
  rerank_results:    'Jina Reranker v3',
  get_hotel:         'Hotel Lookup',
  get_hotel_details: 'Hotel Lookup',
  web_search:        'Web Search',
  search:            'Jina Semantic Search',
};

function labelFor(name: string): string {
  return TOOL_LABELS[name] ?? name.replace(/_/g, ' ');
}

const STATUS_PHRASES = [
  'Searching hotels…',
  'Comparing options…',
  'Checking availability…',
  'Reading reviews…',
  'Finding the best match…',
];

// ── Process section: thinking + tool calls, collapsed by default ──
function ProcessSection({ msg }: { msg: Message }) {
  const [open, setOpen] = useState(false);
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    if (msg.isComplete) return;
    const id = setInterval(() => setPhraseIdx(i => (i + 1) % STATUS_PHRASES.length), 1600);
    return () => clearInterval(id);
  }, [msg.isComplete]);

  const hasProcess = msg.reasoning || msg.toolCalls.length > 0;
  if (!hasProcess && msg.isComplete) return null;

  // While streaming: show the most descriptive active status
  const lastTool = msg.toolCalls[msg.toolCalls.length - 1];
  const liveStatus = lastTool
    ? `${labelFor(lastTool.name)}…`
    : STATUS_PHRASES[phraseIdx];

  const label = msg.isComplete
    ? `Thought${msg.thinkingDuration ? ` for ${msg.thinkingDuration}s` : ''} · view reasoning`
    : liveStatus;

  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5 w-full text-left transition-colors"
        style={{
          background: 'rgba(168,85,247,0.06)',
          border: '1px solid rgba(168,85,247,0.15)',
          color: 'var(--elastic-purple)',
        }}
      >
        {msg.isComplete ? (
          open ? <ChevronDown className="w-3 h-3 flex-shrink-0" /> : <ChevronRight className="w-3 h-3 flex-shrink-0" />
        ) : (
          <span className="w-3 h-3 flex-shrink-0 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ background: 'var(--elastic-purple)' }} />
          </span>
        )}
        <span className="flex-1 font-medium">{label}</span>
        {msg.toolCalls.length > 0 && (
          <span className="text-xs opacity-60 flex-shrink-0">{msg.toolCalls.length} tool{msg.toolCalls.length > 1 ? 's' : ''}</span>
        )}
      </button>

      {open && (
        <div className="mt-1 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(168,85,247,0.12)', background: 'rgba(168,85,247,0.03)' }}>
          {/* Tool calls */}
          {msg.toolCalls.length > 0 && (
            <div className="px-3 pt-2 pb-1 space-y-1.5">
              {msg.toolCalls.map(tc => (
                <ToolDetail key={tc.id} name={tc.name} status={tc.status} input={tc.input} output={tc.output} />
              ))}
            </div>
          )}
          {/* Reasoning */}
          {msg.reasoning && (
            <div className="px-3 py-2 text-xs leading-relaxed" style={{ color: 'var(--text-muted)', borderTop: msg.toolCalls.length > 0 ? '1px solid rgba(168,85,247,0.1)' : undefined }}>
              <p className="font-semibold uppercase tracking-wider mb-1 opacity-60" style={{ fontSize: '10px' }}>Reasoning</p>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: ({ children }) => <p className="mb-1">{children}</p> }}>
                {msg.reasoning}
              </ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ToolDetail({
  name, status, input, output,
}: { name: string; status: 'pending' | 'complete'; input?: Record<string, unknown>; output?: string }) {
  const [showDetail, setShowDetail] = useState(false);
  const label = labelFor(name);

  return (
    <div>
      <button
        onClick={() => setShowDetail(s => !s)}
        className="flex items-center gap-1.5 w-full text-left text-xs"
        style={{ color: 'var(--elastic-teal)' }}
      >
        <Wrench className="w-3 h-3 flex-shrink-0" />
        <span className="flex-1 font-medium">{status === 'complete' ? `✓ ${label}` : `${label}…`}</span>
        {(input || output) && (
          showDetail
            ? <ChevronDown className="w-3 h-3 flex-shrink-0 opacity-50" />
            : <ChevronRight className="w-3 h-3 flex-shrink-0 opacity-50" />
        )}
      </button>
      {showDetail && (input || output) && (
        <div className="mt-1 ml-4.5 rounded text-xs" style={{ background: 'rgba(0,0,0,0.08)', padding: '6px 8px' }}>
          {input && (
            <div className="mb-1">
              <span className="opacity-50 uppercase tracking-wider" style={{ fontSize: '9px' }}>Input</span>
              <pre className="mt-0.5 whitespace-pre-wrap break-all" style={{ fontFamily: 'monospace', fontSize: '10px' }}>
                {JSON.stringify(input, null, 2)}
              </pre>
            </div>
          )}
          {output && (
            <div>
              <span className="opacity-50 uppercase tracking-wider" style={{ fontSize: '9px' }}>Result</span>
              <p className="mt-0.5 break-words" style={{ fontFamily: 'monospace', fontSize: '10px' }}>{output}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Markdown components — theme-aware, no prose color overrides ──
const MD_COMPONENTS: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-1">{children}</h1>,
  h2: ({ children }) => <h2 className="text-base font-bold mb-1 mt-1">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
  code: ({ children }) => (
    <code className="rounded px-1 py-0.5 text-xs font-mono" style={{ background: 'rgba(0,0,0,0.08)' }}>{children}</code>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 pl-3 italic opacity-70 mb-2" style={{ borderColor: 'var(--elastic-blue)' }}>{children}</blockquote>
  ),
  a: ({ href, children }) => (
    <a href={href} className="underline" style={{ color: 'var(--elastic-blue)' }} target="_blank" rel="noopener noreferrer">{children}</a>
  ),
  hr: () => <hr className="my-2 opacity-20" />,
};

function MessageBubble({ msg, isLast, onOpenHotel }: {
  msg: Message;
  isLast: boolean;
  onOpenHotel: (hotel: ChatHotel) => void;
}) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div style={{ maxWidth: '90%', width: isUser ? undefined : '100%' }}>
        {!isUser && <ProcessSection msg={msg} />}

        {(msg.content || (!msg.isComplete && !isUser)) && (
          <div
            className="rounded-2xl px-4 py-3 text-sm"
            style={isUser ? {
              background: 'var(--elastic-blue)',
              color: '#fff',
              borderBottomRightRadius: '4px',
            } : {
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              borderBottomLeftRadius: '4px',
            }}
          >
            {isUser ? (
              <p className="leading-relaxed">{msg.content}</p>
            ) : (
              <>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
                  {msg.content}
                </ReactMarkdown>
                {!msg.isComplete && isLast && (
                  <span className="inline-block w-1.5 h-4 ml-0.5 align-middle animate-pulse rounded-sm"
                    style={{ background: 'var(--elastic-teal)' }} />
                )}
              </>
            )}
          </div>
        )}

        {/* Hotel cards — shown after response completes */}
        {!isUser && msg.isComplete && msg.hotels.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {msg.hotels.map(h => (
              <ChatHotelCard key={h.id} hotel={h} onOpen={onOpenHotel} />
            ))}
            <p className="text-xs mt-1 px-1" style={{ color: 'var(--text-muted)' }}>
              Tap a hotel to view details &amp; book
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface AgentChatProps {
  onClose?: () => void;
  embedded?: boolean;
  sidebar?: boolean;
  onOpenHotel?: (hotel: ChatHotel) => void;
}

export default function AgentChat({ onClose, embedded = false, sidebar = false, onOpenHotel }: AgentChatProps) {
  const demoMode = useDemoMode();
  const { messages, isLoading, sendMessage, reset } = useAgentChat(demoMode);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const submit = useCallback(() => {
    const val = input.trim();
    if (!val || isLoading) return;
    setInput('');
    sendMessage(val);
  }, [input, isLoading, sendMessage]);

  const handleKey = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }, [submit]);

  const handleOpenHotel = useCallback((hotel: ChatHotel) => {
    onOpenHotel?.(hotel);
  }, [onOpenHotel]);

  const chatContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4" style={{ color: 'var(--elastic-blue)' }} />
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>AI Concierge</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Jina AI &amp; Elastic Agent Builder</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button onClick={reset}
              className="p-1.5 rounded-lg transition-colors hover:opacity-70"
              style={{ color: 'var(--text-muted)' }}
              title="New conversation">
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          {onClose && (
            <button onClick={onClose}
              className="p-1.5 rounded-lg transition-colors hover:opacity-70"
              style={{ color: 'var(--text-muted)' }}>
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ minHeight: 0 }}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: 'rgba(0,119,204,0.1)', border: '1px solid rgba(0,119,204,0.2)' }}>
                <MessageSquare className="w-6 h-6" style={{ color: 'var(--elastic-blue)' }} />
              </div>
              <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Tell me what you&apos;re looking for
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                I&apos;ll search 150+ hotels and find your perfect match
              </p>
            </div>
            <div className="w-full max-w-sm space-y-2">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors hover:opacity-80"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isLast={i === messages.length - 1}
                onOpenHotel={handleOpenHotel}
              />
            ))}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex gap-2 items-end rounded-xl overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Describe your ideal stay…"
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none"
            style={{ color: 'var(--text-primary)', maxHeight: '120px', overflowY: 'auto' }}
          />
          <button
            onClick={submit}
            disabled={!input.trim() || isLoading}
            className="m-1.5 p-2 rounded-lg transition-colors flex-shrink-0"
            style={{
              background: (!input.trim() || isLoading) ? 'var(--bg-card)' : 'var(--elastic-blue)',
              color: (!input.trim() || isLoading) ? 'var(--text-muted)' : '#fff',
            }}>
            <Send className="w-4 h-4" />
          </button>
        </div>
        {/* Jina attribution */}
        <p className="text-xs mt-1.5 text-center" style={{ color: 'var(--text-muted)' }}>
          Powered by{' '}
          <span style={{ color: 'var(--elastic-blue)', fontWeight: 600 }}>Jina Embeddings v5</span>
          {' '}·{' '}
          <span style={{ color: 'var(--elastic-teal)', fontWeight: 600 }}>Elastic Agent Builder</span>
        </p>
      </div>
    </div>
  );

  // Embedded mode (AgentStation)
  if (embedded) {
    return (
      <div className="rounded-2xl overflow-hidden" style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        height: '600px',
      }}>
        {chatContent}
      </div>
    );
  }

  // Sidebar mode — right panel that slides in over page content
  if (sidebar) {
    return (
      <div
        className="fixed top-0 right-0 h-full z-40 flex flex-col"
        style={{
          width: '400px',
          background: 'var(--bg-base)',
          borderLeft: '1px solid var(--border)',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
        }}
      >
        {chatContent}
      </div>
    );
  }

  // Fullscreen overlay (default, used from demo view)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: 'var(--bg-base)',
          border: '1px solid var(--border)',
          height: 'min(85vh, 750px)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
        }}>
        {chatContent}
      </div>
    </div>
  );
}
