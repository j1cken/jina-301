'use client';

import { useState, useCallback, useMemo } from 'react';
import { Search, Sparkles } from 'lucide-react';
import type { Hotel } from '@/lib/types';
import type { ChatHotel } from '@/hooks/useAgentChat';
import { chatHotelToHotel } from '@/lib/chatHotelUtils';
import { apiUrl } from '@/lib/api';
import { useDemoMode } from '@/lib/demoMode';
import TravelHotelCard from '@/components/TravelHotelCard';
import TripCart from '@/components/TripCart';

interface ResultsCanvasProps {
  onContextChange: (context: string) => void;
  onOpenHotel: (hotel: Hotel) => void;
  agentHotels?: ChatHotel[];
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div style={{ aspectRatio: '16/9', background: 'var(--bg-surface)' }} className="animate-pulse" />
      <div className="p-4 space-y-2.5">
        <div className="animate-pulse rounded h-5 w-3/4" style={{ background: 'var(--border)' }} />
        <div className="animate-pulse rounded h-3 w-1/2" style={{ background: 'var(--border)' }} />
        <div className="animate-pulse rounded h-3 w-full" style={{ background: 'var(--border)' }} />
      </div>
    </div>
  );
}

export default function ResultsCanvas({ onContextChange, onOpenHotel, agentHotels = [] }: ResultsCanvasProps) {
  const demoMode = useDemoMode();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true); setError(null); setSearched(true);
    try {
      const res = await fetch(apiUrl('/api/search'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, demoMode }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResults(data.semantic || []);
    } catch {
      setError('Search unavailable — try enabling Fallback mode.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [demoMode]);

  // Convert agent's ChatHotel[] → Hotel[] for display
  const agentHotelsFull = useMemo(
    () => agentHotels.map(chatHotelToHotel),
    [agentHotels]
  );

  // Manual search results split into agent-recommended vs rest
  const { picks, rest } = useMemo(() => {
    if (!agentHotels.length || !results.length) return { picks: [], rest: results };
    const pickSet = new Set(agentHotels.map(h => h.name.toLowerCase()));
    const picks = results.filter(h => pickSet.has(h.name.toLowerCase()));
    const rest = results.filter(h => !pickSet.has(h.name.toLowerCase()));
    return { picks, rest };
  }, [results, agentHotels]);

  const hasContent = agentHotelsFull.length > 0 || searched;

  return (
    <div className="flex flex-col h-full">
      <TripCart onContextChange={onContextChange} />

      {/* Search bar */}
      <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runSearch(query)}
              placeholder="Search hotels…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl outline-none"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <button
            onClick={() => runSearch(query)}
            disabled={loading || !query.trim()}
            className="px-4 py-2 rounded-xl text-sm font-semibold flex-shrink-0"
            style={{
              background: query.trim() ? 'var(--elastic-blue)' : 'var(--border)',
              color: query.trim() ? '#fff' : 'var(--text-muted)',
              cursor: query.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            {loading ? '…' : 'Search'}
          </button>
        </div>
        {/* Subtle Jina + Elastic attribution */}
        <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)', opacity: 0.75 }}>
          <span style={{ color: 'var(--elastic-blue)' }}>Jina Embeddings v5</span>
          {' · '}
          <span style={{ color: 'var(--elastic-teal)' }}>Elastic</span>
          {' '}semantic search
        </p>
      </div>

      {/* Results area */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ minHeight: 0 }}>
        {!hasContent && (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(0,119,204,0.08)', border: '1px solid rgba(0,119,204,0.15)' }}
            >
              <Search className="w-6 h-6" style={{ color: 'var(--elastic-blue)' }} />
            </div>
            <div>
              <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Hotel results</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Search above, or let the concierge find them for you
              </p>
            </div>
          </div>
        )}

        {error && (
          <div
            className="rounded-xl p-4 text-center text-sm mb-4"
            style={{ background: 'rgba(240,78,152,0.07)', border: '1px solid rgba(240,78,152,0.2)', color: 'var(--elastic-pink)' }}
          >
            {error}
          </div>
        )}

        {loading && (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Agent-recommended hotels — shown whenever concierge responds */}
        {!loading && agentHotelsFull.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--elastic-teal)' }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--elastic-teal)' }}>
                AI Picks
              </span>
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
              {agentHotelsFull.map(h => (
                <div key={h.id} className="relative">
                  <div
                    className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1"
                    style={{ background: 'rgba(0,191,179,0.9)', color: '#fff', backdropFilter: 'blur(4px)' }}
                  >
                    <Sparkles className="w-3 h-3" /> AI Pick
                  </div>
                  <TravelHotelCard hotel={h} onClick={() => onOpenHotel(h)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual search results */}
        {!loading && searched && (
          <>
            {picks.length > 0 && (
              <div className="mb-5">
                {agentHotelsFull.length === 0 && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--elastic-teal)' }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--elastic-teal)' }}>
                      AI Picks
                    </span>
                  </div>
                )}
                <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                  {picks.map(h => (
                    <div key={h.id} className="relative">
                      <div
                        className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1"
                        style={{ background: 'rgba(0,191,179,0.9)', color: '#fff', backdropFilter: 'blur(4px)' }}
                      >
                        <Sparkles className="w-3 h-3" /> AI Pick
                      </div>
                      <TravelHotelCard hotel={h} onClick={() => onOpenHotel(h)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rest.length > 0 && (
              <div>
                {(picks.length > 0 || agentHotelsFull.length > 0) && (
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>All Results</p>
                )}
                <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                  {rest.map(h => (
                    <TravelHotelCard key={h.id} hotel={h} onClick={() => onOpenHotel(h)} />
                  ))}
                </div>
              </div>
            )}

            {results.length === 0 && !error && agentHotelsFull.length === 0 && (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  No hotels found — try a different query
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
