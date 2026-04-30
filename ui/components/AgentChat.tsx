'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, X, RotateCcw, ChevronDown, ChevronRight, Wrench } from 'lucide-react';
import { useAgentChat, type Message } from '@/hooks/useAgentChat';
import { useDemoMode } from '@/lib/demoMode';

const SUGGESTIONS = [
  'Find a quiet hotel near the convention center for remote work',
  'Romantic beachfront with private pool and ocean views',
  'Luxury spa resort in the mountains with hiking trails',
];

function ThinkingBlock({ text }: { text: string }) {
  const [open, setOpen] = useState(true);
  return (
    <button
      onClick={() => setOpen(o => !o)}
      className="w-full text-left rounded-lg mb-2 overflow-hidden"
      style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)' }}
    >
      <div className="flex items-center gap-1.5 px-3 py-1.5">
        {open ? <ChevronDown className="w-3 h-3" style={{ color: 'var(--elastic-purple)' }} />
               : <ChevronRight className="w-3 h-3" style={{ color: 'var(--elastic-purple)' }} />}
        <span className="text-xs font-semibold" style={{ color: 'var(--elastic-purple)' }}>Thinking…</span>
      </div>
      {open && (
        <div className="px-3 pb-2 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {text}
        </div>
      )}
    </button>
  );
}

function ToolBadge({ name, status }: { name: string; status: 'pending' | 'complete' }) {
  return (
    <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md mb-1 w-fit"
      style={{ background: 'rgba(0,191,179,0.08)', border: '1px solid rgba(0,191,179,0.2)', color: 'var(--elastic-teal)' }}>
      <Wrench className="w-3 h-3" />
      <span>{status === 'pending' ? `Using ${name}…` : `✓ ${name}`}</span>
    </div>
  );
}

function MessageBubble({ msg, isLast }: { msg: Message; isLast: boolean }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div style={{ maxWidth: '80%' }}>
        {!isUser && msg.reasoning && <ThinkingBlock text={msg.reasoning} />}
        {!isUser && msg.toolCalls.map(tc => (
          <ToolBadge key={tc.id} name={tc.name} status={tc.status} />
        ))}
        {(msg.content || (!msg.isComplete && !isUser)) && (
          <div
            className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
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
            {msg.content}
            {!msg.isComplete && isLast && (
              <span className="inline-block w-1.5 h-4 ml-0.5 align-middle animate-pulse rounded-sm"
                style={{ background: 'var(--elastic-teal)' }} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface AgentChatProps {
  onClose?: () => void;
  embedded?: boolean;
}

export default function AgentChat({ onClose, embedded = false }: AgentChatProps) {
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

  const chatContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>AI Concierge</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Powered by Elastic Agent Builder</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button onClick={reset}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              title="New conversation">
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          {onClose && (
            <button onClick={onClose}
              className="p-1.5 rounded-lg transition-colors"
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
              <p className="text-2xl mb-2">✨</p>
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
                  className="w-full text-left px-3 py-2 rounded-xl text-sm transition-colors"
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
              <MessageBubble key={msg.id} msg={msg} isLast={i === messages.length - 1} />
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
        <p className="text-xs mt-1.5 text-center" style={{ color: 'var(--text-muted)' }}>
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  );

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

  // Fullscreen overlay
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: 'var(--bg-base)',
          border: '1px solid var(--border)',
          height: 'min(80vh, 700px)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
        }}>
        {chatContent}
      </div>
    </div>
  );
}
