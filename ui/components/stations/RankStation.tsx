'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ArrowUp, ArrowDown, Minus, RefreshCw } from 'lucide-react';
import JinaCallout from '@/components/JinaCallout';
import SearchBar from '@/components/shared/SearchBar';
import ModelBadge from '@/components/shared/ModelBadge';
import type { RerankResponse, RankedHotel } from '@/lib/types';
import { resolveImageUrl } from '@/lib/images';
import { apiUrl } from '@/lib/api';

const DEMO_QUERIES = [
  'quiet hotel for focused remote work, no casino noise',
  'romantic beachfront with private pool villa and spa',
  'boutique heritage hotel with authentic local architecture',
  'eco-lodge for wildlife photography safaris',
];

interface RankStationProps {
  demoMode: boolean;
  onTopRanked?: (hotel: RankedHotel) => void;
}

function RankDelta({ delta }: { delta: number }) {
  if (delta > 0) return (
    <div className="flex items-center gap-1 rank-up text-sm font-bold">
      <ArrowUp className="w-4 h-4" />
      <span>+{delta}</span>
    </div>
  );
  if (delta < 0) return (
    <div className="flex items-center gap-1 rank-down text-sm font-bold">
      <ArrowDown className="w-4 h-4" />
      <span>{delta}</span>
    </div>
  );
  return <div className="flex items-center gap-1 rank-same text-sm"><Minus className="w-4 h-4" /></div>;
}

function RankedCard({ hotel, rank, showExplanation }: { hotel: RankedHotel; rank: number; showExplanation?: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      layoutId={`${hotel.id}-${showExplanation ? 'reranked' : 'naive'}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--bg-card)', border: `1.5px solid ${showExplanation && hotel.rankDelta > 0 ? 'var(--elastic-teal)' : hotel.rankDelta < 0 ? 'var(--elastic-pink)' : 'var(--border)'}` }}
    >
      <div className="flex items-center gap-3 p-3">
        <div
          className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm"
          style={{ background: rank <= 3 ? 'var(--elastic-blue)' : 'var(--bg-surface)', color: rank <= 3 ? 'white' : 'var(--text-muted)', border: '1px solid var(--border)' }}
        >
          {rank}
        </div>

        {hotel.image_paths?.[0] && (
          <img src={resolveImageUrl(hotel.image_paths[0])} alt={hotel.name} className="w-16 h-12 rounded-lg object-cover flex-shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{hotel.name}</p>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{hotel.location_name}</p>
        </div>

        {showExplanation && (
          <div className="flex-shrink-0 text-right">
            <RankDelta delta={hotel.rankDelta} />
            {hotel.rankDelta !== 0 && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>was #{hotel.naiveRank}</p>
            )}
          </div>
        )}

        {showExplanation && hotel.matchExplanation && (
          <button
            data-bp-chip="pink"
            onClick={() => setExpanded(!expanded)}
            className="flex-shrink-0 px-2 py-1 rounded text-xs font-semibold transition-colors"
            style={{
              background: 'rgba(240,78,152,0.12)',
              border: '1px solid rgba(240,78,152,0.3)',
              color: 'var(--elastic-pink)',
            }}
          >
            Why?
          </button>
        )}
      </div>

      <AnimatePresence>
        {expanded && hotel.matchExplanation && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 jina-callout mx-3 mb-3">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {hotel.matchExplanation}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function RankStation({ demoMode, onTopRanked }: RankStationProps) {
  const [query, setQuery] = useState(DEMO_QUERIES[0]);
  const [results, setResults] = useState<RerankResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  const search = async (q = query) => {
    if (!q.trim()) return;
    setLoading(true);
    setResults(null);
    setError(null);

    try {
      const res = await fetch(apiUrl('/api/rerank'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, demoMode }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setResults(data);
      if (onTopRanked && data.reranked?.[0]) onTopRanked(data.reranked[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load results. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-load once on mount — ref guard prevents re-fire on tab switch
  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    search(DEMO_QUERIES[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h2 style={{ color: 'var(--text-primary)' }}>Rank</h2>
          <ModelBadge model="Reranker v3" api="eis" />
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>
          The reranker reads every result in full context — not just vectors. Watch the cards move.
        </p>
      </div>

      <JinaCallout
        model="Reranker v3"
        loading={loading}
        loadingMessage="Jina Reranker v3 is reading each candidate's full text with listwise attention — comparing all results together..."
        doneMessage="Reranking complete. Cards re-ordered by true relevance. Click 'Why?' on moved cards to see the reasoning."
      />

      <div className="space-y-3">
        <SearchBar
          value={query}
          onChange={setQuery}
          onSubmit={() => search()}
          placeholder="Try an engineered demo query..."
          disabled={loading}
          suggestions={DEMO_QUERIES}
        />
      </div>

      {error && !loading && (
        <div data-bp-card="pink" className="flex items-center gap-3 p-4 rounded-xl text-sm"
          style={{ background: 'rgba(240,78,152,0.1)', border: '1px solid rgba(240,78,152,0.3)', color: 'var(--elastic-pink)' }}>
          <span className="flex-1">{error}</span>
          <button
            onClick={() => search()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold flex-shrink-0"
            style={{ background: 'var(--elastic-pink)', color: '#fff' }}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {results && (
        <LayoutGroup>
          <div className="grid grid-cols-2 gap-4">
            {/* Before column */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 pb-1" style={{ borderBottom: '2px solid var(--elastic-blue)' }}>
                <span className="text-sm font-bold" style={{ color: 'var(--elastic-blue)' }}>
                  🔍 Before Reranking
                </span>
                <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>Semantic only</span>
              </div>
              <div className="space-y-2">
                {(results.naive as RankedHotel[] ?? []).slice(0, 8).map((hotel, i) => (
                  <RankedCard key={hotel.id} hotel={hotel} rank={i + 1} showExplanation={false} />
                ))}
              </div>
            </div>

            {/* After column */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 pb-1" style={{ borderBottom: '2px solid var(--elastic-pink)' }}>
                <span className="text-sm font-bold" style={{ color: 'var(--elastic-pink)' }}>
                  ⚡ After Reranking
                </span>
                <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
                  {results.rerankTook}ms · Jina v3
                </span>
              </div>
              <div className="space-y-2">
                {(results.reranked as RankedHotel[] ?? []).slice(0, 8).map((hotel, i) => (
                  <RankedCard key={hotel.id} hotel={hotel} rank={i + 1} showExplanation />
                ))}
              </div>
            </div>
          </div>
        </LayoutGroup>
      )}
    </div>
  );
}
