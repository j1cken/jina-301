'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTypewriter } from '@/hooks/useTypewriter';
import dynamic from 'next/dynamic';
import { Maximize2, Minimize2, Camera, X as XIcon } from 'lucide-react';
import JinaCallout from '@/components/JinaCallout';
import { apiUrl } from '@/lib/api';
import { resolveImageUrl } from '@/lib/images';
import HotelCard from '@/components/HotelCard';
import SearchBar from '@/components/shared/SearchBar';
import ModelBadge from '@/components/shared/ModelBadge';
import HotelDetailModal from '@/components/HotelDetailModal';
import type { Hotel, SearchResponse, GeoFilter } from '@/lib/types';

const MapPanel = dynamic(() => import('@/components/MapPanel'), { ssr: false });

const DEMO_QUERIES = [
  'quiet hotel for focused remote work, no casino noise',
  'boutique hotel near the arts district, local Vegas vibe',
  'family resort with pool close to the Strip',
  'luxury suite with Strip views and spa access',
  'ruhiges Hotel in Las Vegas, fernab vom Casinolärm',
  'hôtel boutique calme à Las Vegas, loin du bruit des casinos',
  'ラスベガスで静かなリモートワーク向けホテル',
];

const VENETIAN = { lat: 36.1214, lon: -115.1699 };

const MODE_LABELS = { semantic: 'Semantic', bm25: 'BM25', hybrid: 'Hybrid' } as const;

const STOPWORDS = new Set([
  'the','a','an','in','of','on','at','to','for','is','it','with','and','or','but',
  'not','by','from','as','this','that','are','was','be','have','has','i','my','we',
]);

function isStopwordDetail(desc: string): boolean {
  const m = desc.match(/weight\([^:]+:(\w+)/);
  return m ? STOPWORDS.has(m[1].toLowerCase()) : false;
}

interface FindStationProps {
  demoMode: boolean;
  onResultsChange?: (hotels: Hotel[]) => void;
  pendingQuery?: string | null;
  onPendingQueryConsumed?: () => void;
  // Flow player props
  flowQuery?: string | null;
  onFlowQueryConsumed?: () => void;
  flowTriggerImageSearch?: boolean;
  onFlowImageSearchConsumed?: () => void;
  flowGeoFilter?: boolean | null;
  onFlowGeoFilterConsumed?: () => void;
}

interface ExplainResult {
  hotelId: string;
  value: number;
  description: string;
  details: { description: string; value: number }[];
}

type SearchMode = 'semantic' | 'bm25' | 'hybrid';
type ViewMode = 'single' | 'sidebyside' | 'map';

export default function FindStation({ demoMode, onResultsChange, pendingQuery, onPendingQueryConsumed, flowQuery, onFlowQueryConsumed, flowTriggerImageSearch, onFlowImageSearchConsumed, flowGeoFilter, onFlowGeoFilterConsumed }: FindStationProps) {
  const [query, setQuery] = useState('');
  const [useGeo, setUseGeo] = useState(false);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedModal, setSelectedModal] = useState<Hotel | null>(null);
  const [view, setView] = useState<ViewMode>('single');
  const [leftMode, setLeftMode] = useState<SearchMode>('semantic');
  const [rightMode, setRightMode] = useState<SearchMode>('bm25');
  const [explains, setExplains] = useState<Record<string, ExplainResult>>({});
  const [loadingExplain, setLoadingExplain] = useState<string | null>(null);
  const [visibleExplains, setVisibleExplains] = useState<Set<string>>(new Set());
  const [mapExpanded, setMapExpanded] = useState(false);
  const [geoResetNotice, setGeoResetNotice] = useState(false);

  // CLIP image search state
  const [clipResults, setClipResults] = useState<Hotel[] | null>(null);
  const [clipLoading, setClipLoading] = useState(false);
  const [clipPreviewUrl, setClipPreviewUrl] = useState<string | null>(null);
  const [clipPreviewOpen, setClipPreviewOpen] = useState(false);
  const [clipError, setClipError] = useState<string | null>(null);
  const [clipFile, setClipFile] = useState<File | null>(null);
  const clipPreviewRef = useRef<string | null>(null);

  // Revoke object URLs on unmount or when preview changes
  useEffect(() => {
    return () => { if (clipPreviewRef.current) URL.revokeObjectURL(clipPreviewRef.current); };
  }, []);

  const getList = (mode: SearchMode): Hotel[] =>
    mode === 'bm25' ? (results?.bm25 ?? []) :
    mode === 'hybrid' ? (results?.hybrid ?? []) :
    (results?.semantic ?? []);

  useEffect(() => {
    if (results) onResultsChange?.(getList(leftMode));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftMode, results]);

  useEffect(() => {
    if (!mapExpanded) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMapExpanded(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mapExpanded]);

  const consumedQueryRef = useRef<string | null>(null);
  useEffect(() => {
    if (!pendingQuery || consumedQueryRef.current === pendingQuery) return;
    consumedQueryRef.current = pendingQuery;
    setQuery(pendingQuery);
    search(pendingQuery);
    onPendingQueryConsumed?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingQuery]);

  // Flow player: typewriter query injection
  const handleFlowQueryComplete = useCallback(() => {
    if (flowQuery) {
      search(flowQuery);
      onFlowQueryConsumed?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowQuery]);

  const flowTyped = useTypewriter(flowQuery ?? null, handleFlowQueryComplete);

  useEffect(() => {
    if (flowQuery !== null && flowQuery !== undefined) {
      setQuery(flowTyped);
    }
  }, [flowTyped, flowQuery]);

  // Flow player: trigger sample image search
  useEffect(() => {
    if (!flowTriggerImageSearch) return;
    handleSampleImage();
    onFlowImageSearchConsumed?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowTriggerImageSearch]);

  // Flow player: apply/reset geo filter and re-run search
  useEffect(() => {
    if (flowGeoFilter === null || flowGeoFilter === undefined) return;
    setUseGeo(flowGeoFilter);
    search(query, flowGeoFilter); // pass override directly — bypasses stale closure
    onFlowGeoFilterConsumed?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowGeoFilter]);

  const search = async (q = query, geoOverride?: boolean) => {
    if (!q.trim()) return;
    setLoading(true);
    setResults(null);
    setExplains({});
    setVisibleExplains(new Set());
    setMapExpanded(false);
    setSearchError(null);

    const useGeoNow = geoOverride !== undefined ? geoOverride : useGeo;
    const geo: GeoFilter | undefined = useGeoNow
      ? { ...VENETIAN, radiusMiles: 0.5 }
      : undefined;

    try {
      const res = await fetch(apiUrl('/api/search'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, geoFilter: geo, demoMode }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Search failed (${res.status})`);
      }
      const data = await res.json();
      setResults(data);
      onResultsChange?.(data[leftMode] ?? data.semantic ?? []);
    } catch (err) {
      setSearchError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const runClipSearch = async (body: Record<string, unknown>, previewUrl: string, isObjectUrl: boolean) => {
    setClipResults(null);
    setClipError(null);
    setClipLoading(true);
    // Revoke previous object URL if it was one
    if (clipPreviewRef.current) { URL.revokeObjectURL(clipPreviewRef.current); clipPreviewRef.current = null; }
    if (isObjectUrl) clipPreviewRef.current = previewUrl;
    setClipPreviewUrl(previewUrl);

    try {
      const res = await fetch(apiUrl('/api/omni'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, demoMode }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? `CLIP error ${res.status}`);
      const data = await res.json();
      setClipResults(data.results ?? []);
    } catch (err) {
      setClipError((err as Error).message);
    } finally {
      setClipLoading(false);
    }
  };

  const handleImageSearch = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { setClipError('Image too large — please use an image under 5MB'); return; }
    if (!file.type.startsWith('image/')) return;
    setClipFile(file);

    const preview = URL.createObjectURL(file);
    const base64: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve((e.target!.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    await runClipSearch({ imageBase64: base64, mimeType: file.type }, preview, true);
  };

  const handleSampleImage = () => {
    const resolvedUrl = resolveImageUrl('/images/sample-hotel-room.png') ?? '/images/sample-hotel-room.png';
    runClipSearch({ imageUrl: resolvedUrl }, resolvedUrl, false);
  };

  const clearClip = () => {
    if (clipPreviewRef.current) { URL.revokeObjectURL(clipPreviewRef.current); clipPreviewRef.current = null; }
    setClipResults(null);
    setClipPreviewUrl(null);
    setClipError(null);
    setClipFile(null);
  };

  const fetchExplain = async (hotel: Hotel, mode: SearchMode) => {
    const key = `${hotel.id}-${mode}`;

    // Toggle visibility if already fetched
    if (explains[key]) {
      setVisibleExplains(prev => {
        const next = new Set(prev);
        if (next.has(key)) { next.delete(key); } else { next.add(key); }
        return next;
      });
      return;
    }

    if (loadingExplain === key) return;
    setLoadingExplain(key);
    try {
      const res = await fetch(apiUrl('/api/explain'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId: hotel.id, query, searchType: mode }),
      });
      if (res.ok) {
        const data = await res.json();
        setExplains(prev => ({ ...prev, [key]: { hotelId: hotel.id, ...data } }));
        setVisibleExplains(prev => new Set([...Array.from(prev), key]));
      }
    } catch {
      // explain is non-critical; silently swallow — user can retry by clicking "Why?" again
    } finally {
      setLoadingExplain(null);
    }
  };

  const modeColor = (mode: SearchMode) =>
    mode === 'semantic' ? 'var(--elastic-blue)' :
    mode === 'hybrid' ? 'var(--elastic-purple)' :
    'var(--elastic-pink)';

  const modeAlpha = (mode: SearchMode) =>
    mode === 'semantic' ? 'rgba(0,119,204,0.08)' :
    mode === 'hybrid' ? 'rgba(168,85,247,0.08)' :
    'rgba(240,78,152,0.08)';

  const modeBorder = (mode: SearchMode) =>
    mode === 'semantic' ? 'rgba(0,119,204,0.2)' :
    mode === 'hybrid' ? 'rgba(168,85,247,0.2)' :
    'rgba(240,78,152,0.2)';

  const modeTag = (mode: SearchMode) => ({
    semantic: 'Semantic understands meaning — not just keywords',
    bm25: 'BM25 matches keywords — no meaning, no location awareness',
    hybrid: 'Hybrid blends semantic + BM25 results via RRF',
  }[mode]);

  const modeEmoji = (mode: SearchMode) =>
    mode === 'semantic' ? '🧠 Semantic' :
    mode === 'hybrid' ? '🔀 Hybrid' :
    '🔤 BM25';

  const handleFilterByTag = (tag: string) => {
    setSelectedModal(null);
    if (useGeo) {
      setUseGeo(false);
      setGeoResetNotice(true);
      setTimeout(() => setGeoResetNotice(false), 3000);
    }
    setQuery(tag);
    search(tag);
  };

  const handleEnableGeo = () => {
    setSelectedModal(null);
    setUseGeo(true);
  };

  const renderColumn = (col: SearchMode, setCol: (m: SearchMode) => void) => (
    <div className="space-y-2">
      {/* Mode selector */}
      <div className="flex gap-1.5 items-center flex-wrap">
        {(['semantic', 'bm25', 'hybrid'] as const).map(m => (
          <button
            key={m}
            onClick={() => setCol(m)}
            className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: col === m ? modeColor(m) : 'var(--bg-surface)',
              color: col === m ? 'white' : 'var(--text-secondary)',
              border: `1px solid ${col === m ? modeColor(m) : 'var(--border)'}`,
            }}
          >
            {modeEmoji(m)}
          </button>
        ))}
      </div>

      {/* Info tag */}
      <div
        data-bp-card={col === 'hybrid' ? 'purple' : col === 'bm25' ? 'pink' : 'blue'}
        className="p-2 rounded-lg text-xs"
        style={{
          background: modeAlpha(col),
          border: `1px solid ${modeBorder(col)}`,
          color: modeColor(col),
        }}
      >
        {modeTag(col)}
      </div>

      {/* Results */}
      <div className="space-y-2">
        {results && getList(col).length === 0 && !loading && (
          <div className="p-3 rounded-lg text-xs" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            {col === 'bm25'
              ? <>No keyword matches{useGeo ? ' within 0.5mi of The Venetian' : ''}. BM25 requires exact words — it can&apos;t match slang or inferred meaning. <span style={{ color: 'var(--elastic-blue)' }}>Try Semantic or Hybrid.</span></>
              : <>No results{useGeo ? ' within 0.5mi of The Venetian' : ''}.</>
            }
          </div>
        )}
        {getList(col).slice(0, 5).map((hotel, i) => {
          const key = `${hotel.id}-${col}`;
          const exp = explains[key];
          const expVisible = visibleExplains.has(key);
          const meaningfulDetails = exp?.details.filter(d => !isStopwordDetail(d.description)) ?? [];
          return (
            <div key={hotel.id}>
              <HotelCard
                hotel={hotel}
                index={i}
                onClick={setSelectedModal}
                showScore={col !== 'hybrid'}
              />
              <div className="flex justify-end mt-1">
                <button
                  data-bp-chip="blue"
                  onClick={() => fetchExplain(hotel, col)}
                  className="px-2 py-0.5 rounded text-xs font-semibold transition-colors"
                  style={{
                    background: 'rgba(0,119,204,0.15)',
                    border: '1px solid rgba(0,119,204,0.3)',
                    color: 'var(--elastic-blue)',
                  }}
                >
                  {loadingExplain === key ? '…' : (exp && expVisible) ? '▲ Hide' : 'Why?'}
                </button>
              </div>
              {exp && expVisible && (
                <div className="mt-1 p-2 rounded-lg text-xs" style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}>
                  {exp.value != null && (
                    <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                      Score: {exp.value.toFixed(4)}
                    </p>
                  )}
                  <p>{exp.description}</p>
                  {meaningfulDetails.slice(0, 3).map((d, di) => (
                    <p key={di} className="mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      · {d.description} ({d.value.toFixed(4)})
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h2 style={{ color: 'var(--text-primary)' }}>Find</h2>
          <ModelBadge model="Embeddings v5 · text-small" api="eis" />
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>
          Semantic search understands intent — not just keywords. Compare with BM25 or Hybrid.
        </p>
      </div>

      <JinaCallout
        model="Embeddings v5"
        loading={loading}
        loadingMessage="Jina Embeddings v5 text-small is converting your query to a vector and searching all hotel descriptions..."
        doneMessage="Embeddings understood your intent, not just your keywords. Try Side by Side to compare with BM25 or Hybrid."
      />

      {searchError && (
        <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(240,78,152,0.1)', border: '1px solid rgba(240,78,152,0.3)', color: 'var(--elastic-pink)' }}>
          Search error: {searchError}
        </div>
      )}

      <div className="space-y-3">
        <SearchBar
          value={query}
          onChange={setQuery}
          onSubmit={() => search()}
          placeholder="Describe your ideal hotel..."
          disabled={loading || clipLoading}
          suggestions={DEMO_QUERIES}
          onImageSearch={handleImageSearch}
        />

        {/* Sample image shortcut */}
        {!clipResults && !clipLoading && (
          <button
            onClick={handleSampleImage}
            className="text-xs flex items-center gap-1.5 transition-colors hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
          >
            <Camera className="w-3.5 h-3.5" />
            Use sample hotel room image →
          </button>
        )}

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
        {geoResetNotice && (
          <p className="text-xs" style={{ color: 'var(--elastic-teal)' }}>
            Geo filter cleared — tag search covers all hotels
          </p>
        )}
      </div>

      {/* CLIP image search results */}
      {(clipLoading || clipResults || clipError) && (
        <div className="space-y-3">
          {/* Results banner */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(0,191,179,0.08)', border: '1px solid rgba(0,191,179,0.25)' }}>
            {clipPreviewUrl && (
              <button
                onClick={() => setClipPreviewOpen(true)}
                title="Click to enlarge"
                className="flex-shrink-0 rounded-lg overflow-hidden hover:ring-2 hover:ring-teal-400 transition-all"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={clipPreviewUrl} alt="Query image" className="w-8 h-8 object-cover" />
              </button>
            )}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Camera className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--elastic-teal)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--elastic-teal)' }}>
                {clipLoading ? 'Searching by image…' : clipError ? 'Image search error' : 'Hotels matching your image'}
              </span>
              {!clipLoading && (
                <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>
                  Omni · EIS · 1024-dim
                </span>
              )}
            </div>
            <button onClick={clearClip} className="flex-shrink-0 p-1 rounded transition-colors hover:opacity-70"
              style={{ color: 'var(--text-muted)' }}>
              <XIcon className="w-4 h-4" />
            </button>
          </div>

          {clipError && (
            <div className="p-3 rounded-lg text-sm flex items-center justify-between gap-3"
              style={{ background: 'rgba(240,78,152,0.1)', border: '1px solid rgba(240,78,152,0.3)', color: 'var(--elastic-pink)' }}>
              <span>{clipError}</span>
              {clipFile && (
                <button
                  onClick={() => handleImageSearch(clipFile)}
                  className="flex-shrink-0 px-3 py-1 rounded-lg text-xs font-semibold"
                  style={{ background: 'var(--elastic-pink)', color: '#fff' }}
                >
                  Retry
                </button>
              )}
            </div>
          )}

          {clipLoading && (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin flex-shrink-0"
                style={{ borderColor: 'var(--elastic-teal)', borderTopColor: 'transparent' }} />
              Embedding with Omni and running kNN…
            </div>
          )}

          {clipResults && clipResults.length > 0 && (
            <div className="space-y-2">
              {clipResults.slice(0, 5).map((hotel, i) => (
                <HotelCard key={hotel.id} hotel={hotel} index={i} onClick={setSelectedModal} showScore />
              ))}
            </div>
          )}

          {clipResults && clipResults.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No visual matches found.</p>
          )}
        </div>
      )}

      {/* Click-to-enlarge image preview overlay */}
      {clipPreviewOpen && clipPreviewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={() => setClipPreviewOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={clipPreviewUrl}
            alt="Query image"
            className="max-w-[80vw] max-h-[80vh] rounded-2xl shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            className="absolute top-6 right-6 text-white/70 hover:text-white text-3xl leading-none"
            onClick={() => setClipPreviewOpen(false)}
          >
            ×
          </button>
        </div>
      )}

      {results && (
        <>
          <div className="flex gap-2 items-center">
            {([
              { v: 'single', label: '📌 Single' },
              { v: 'sidebyside', label: '⚡ Side by Side' },
              { v: 'map', label: '🗺 Map' },
            ] as const).map(({ v, label }) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: view === v ? 'var(--elastic-blue)' : 'var(--bg-card)',
                  color: view === v ? 'white' : 'var(--text-secondary)',
                  border: `1px solid ${view === v ? 'var(--elastic-blue)' : 'var(--border)'}`,
                }}
              >
                {label}
              </button>
            ))}
            <span className="text-sm ml-auto" style={{ color: 'var(--text-muted)' }}>
              {results.took}ms
            </span>
          </div>

          {view === 'map' ? (
            <>
              {mapExpanded && (
                <div
                  className="fixed inset-0 z-40"
                  style={{ background: 'rgba(0,0,0,0.5)' }}
                  onClick={() => setMapExpanded(false)}
                />
              )}
              <div
                style={mapExpanded
                  ? { position: 'fixed', inset: '3vh 2vw', zIndex: 50, borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }
                  : { position: 'relative' }
                }
              >
                {/* Expand button */}
                <button
                  onClick={() => setMapExpanded(e => !e)}
                  title={mapExpanded ? 'Collapse map' : 'Expand map'}
                  className="absolute top-3 right-3 z-10 p-1.5 rounded-lg transition-colors"
                  style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}
                >
                  {mapExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <MapPanel
                  key={mapExpanded ? 'expanded' : 'collapsed'}
                  hotels={results.semantic}
                  onSelect={setSelectedModal}
                  selected={selectedModal}
                  style={mapExpanded ? { height: '100%', borderRadius: 0 } : undefined}
                />
              </div>
            </>
          ) : view === 'single' ? (
            renderColumn(leftMode, setLeftMode)
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {leftMode === rightMode && (
                <div data-bp-card="gold" className="col-span-2 text-center text-xs py-1.5 rounded-lg"
                  style={{ background: 'rgba(254,197,20,0.1)', color: 'var(--elastic-gold)', border: '1px solid rgba(254,197,20,0.25)' }}>
                  Both columns showing {MODE_LABELS[leftMode]} — switch one column to compare
                </div>
              )}
              {renderColumn(leftMode, setLeftMode)}
              {renderColumn(rightMode, setRightMode)}
            </div>
          )}
        </>
      )}

      {selectedModal && (
        <HotelDetailModal
          hotel={selectedModal}
          onClose={() => setSelectedModal(null)}
          onFilterByTag={handleFilterByTag}
          onEnableGeo={handleEnableGeo}
        />
      )}
    </div>
  );
}
