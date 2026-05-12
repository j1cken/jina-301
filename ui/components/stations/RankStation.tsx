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

const VENETIAN = { lat: 36.1214, lon: -115.1699 };

const DEMO_QUERIES = [
  'quiet hotel for focused remote work, no casino noise',
  'romantic beachfront with private pool villa and spa',
  'boutique heritage hotel with authentic local architecture',
  'eco-lodge for wildlife photography safaris',
  'gemütliches Boutique-Hotel mit historischem Charme',  // German: cozy boutique hotel with historic charm
  'resort balnéaire élégant avec accès direct à la plage', // French: elegant seaside resort with direct beach access
  'プールと山の景色を望む高級リゾート',                              // Japanese: luxury resort with pool and mountain views
];

interface RankStationProps {
  demoMode: boolean;
  onTopRanked?: (hotel: RankedHotel) => void;
  // Flow player props
  flowRankReveal?: boolean | null;
  onFlowRankRevealConsumed?: () => void;
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

function RankedCard({ hotel, rank, showExplanation, query, demoMode }: { hotel: RankedHotel; rank: number; showExplanation?: boolean; query?: string; demoMode?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [loadingLlm, setLoadingLlm] = useState(false);
  const [llmExplanation, setLlmExplanation] = useState<string | null>(null);

  const canOnDemand = showExplanation && !hotel.matchExplanation && hotel.rankDelta !== 0 && !!query;
  const activeExplanation = hotel.matchExplanation ?? llmExplanation;

  const handleWhyClick = async () => {
    if (activeExplanation) {
      setExpanded(e => !e);
      return;
    }
    if (loadingLlm || !canOnDemand) return;
    setLoadingLlm(true);
    setExpanded(true);
    try {
      const res = await fetch(apiUrl('/api/explain-rank'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, hotelId: hotel.id, delta: hotel.rankDelta, demoMode }),
      });
      const data = await res.json();
      setLlmExplanation(data.explanation ?? null);
    } catch {
      setLlmExplanation(`Moved ${hotel.rankDelta > 0 ? 'up' : 'down'} ${Math.abs(hotel.rankDelta)} positions after reranking.`);
    } finally {
      setLoadingLlm(false);
    }
  };

  const showWhyButton = showExplanation && (hotel.matchExplanation || canOnDemand);

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

        {showWhyButton && (
          <button
            data-bp-chip="pink"
            onClick={handleWhyClick}
            className="flex-shrink-0 px-2 py-1 rounded text-xs font-semibold transition-colors"
            style={{
              background: 'rgba(240,78,152,0.12)',
              border: '1px solid rgba(240,78,152,0.3)',
              color: 'var(--elastic-pink)',
            }}
          >
            {loadingLlm ? '…' : (activeExplanation && expanded) ? '▲ Hide' : 'Why?'}
          </button>
        )}
      </div>

      <AnimatePresence>
        {expanded && (activeExplanation || loadingLlm) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 jina-callout mx-3 mb-3">
              {loadingLlm && !activeExplanation ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Asking Gemini to explain this result…</p>
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>
                  {activeExplanation}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function RankStation({ demoMode, onTopRanked, flowRankReveal, onFlowRankRevealConsumed }: RankStationProps) {
  const [query, setQuery] = useState(DEMO_QUERIES[0]);
  const [useGeo, setUseGeo] = useState(false);
  const [results, setResults] = useState<RerankResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoaded = useRef(false);
  // Flow player: controls whether the "After Reranking" column is revealed
  const [revealReranked, setRevealReranked] = useState(false);

  useEffect(() => {
    if (flowRankReveal === null || flowRankReveal === undefined) return;
    setRevealReranked(flowRankReveal);
    onFlowRankRevealConsumed?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowRankReveal]);

  const search = async (q = query) => {
    if (!q.trim()) return;
    setLoading(true);
    setResults(null);
    setError(null);

    const geo = useGeo ? { ...VENETIAN, radiusMiles: 0.5 } : undefined;

    try {
      const res = await fetch(apiUrl('/api/rerank'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, geoFilter: geo, demoMode }),
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

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useGeo}
            onChange={e => setUseGeo(e.target.checked)}
            className="w-4 h-4 accent-blue-500"
          />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Filter: within 0.5 miles of The Venetian (demo geo filter)
          </span>
        </label>
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
          <div className={`grid gap-4 ${revealReranked ? 'grid-cols-2' : 'grid-cols-1 max-w-xl'}`}>
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

            {/* After column — hidden until flow reveals it */}
            {revealReranked && (
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
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
                    <RankedCard key={hotel.id} hotel={hotel} rank={i + 1} showExplanation query={query} demoMode={demoMode} />
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </LayoutGroup>
      )}
    </div>
  );
}
