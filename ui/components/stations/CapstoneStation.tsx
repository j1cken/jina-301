'use client';

import dynamic from 'next/dynamic';
import type { Hotel, RankedHotel, VlmAnalysis } from '@/lib/types';
import { resolveImageUrl } from '@/lib/images';

const MapPanel = dynamic(() => import('@/components/MapPanel'), { ssr: false });

interface CapstoneStationProps {
  searchResults?: Hotel[];
  topRanked?: RankedHotel;
  vlmAnalysis?: VlmAnalysis;
  analyzedHotel?: Hotel;
}

export default function CapstoneStation({ searchResults, topRanked, vlmAnalysis, analyzedHotel }: CapstoneStationProps) {
  const mapHotels = searchResults ?? [];
  const featuredHotel = topRanked ?? analyzedHotel;
  const analysis = vlmAnalysis;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-2" style={{ color: 'var(--text-primary)' }}>All Together</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Five models. One search experience. You&apos;re a conference planner booking hotels for next year&apos;s SKO in Las Vegas.
        </p>
      </div>

      {/* Architecture diagram */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <img
          src={resolveImageUrl('/images/arch-diagram-v2_1.png')}
          alt="Architecture diagram showing Jina AI and Elastic integration"
          className="w-full h-auto"
        />
      </div>

      {/* Three-panel layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Map */}
        <div className="md:col-span-1">
          <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            🔍 Embeddings + Geo — Candidates
          </h3>
          {mapHotels.length > 0 ? (
            <MapPanel hotels={mapHotels} />
          ) : (
            <div className="rounded-xl flex items-center justify-center h-64 text-center p-4"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div>
                <p className="text-3xl mb-2">🗺</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Run Find station first to see map data here</p>
              </div>
            </div>
          )}
        </div>

        {/* Top ranked hotel */}
        <div className="md:col-span-1">
          <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            ⚡ Reranker — Top Result
          </h3>
          {featuredHotel ? (
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1.5px solid var(--elastic-pink)' }}>
              {featuredHotel.image_paths?.[0] && (
                <img src={resolveImageUrl(featuredHotel.image_paths[0])} alt={featuredHotel.name} className="w-full h-36 object-cover" />
              )}
              <div className="p-4">
                <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{featuredHotel.name}</p>
                <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>{featuredHotel.location_name}</p>
                {(featuredHotel as RankedHotel).rankDelta != null && (
                  <div data-bp-chip="pink" className="text-sm px-2 py-1 rounded inline-block"
                    style={{ background: 'rgba(240,78,152,0.12)', color: 'var(--elastic-pink)' }}>
                    ↑ {(featuredHotel as RankedHotel).rankDelta} positions after reranking
                  </div>
                )}
                {featuredHotel.price_per_night_usd > 0 && (
                  <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    ${featuredHotel.price_per_night_usd}/night
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl flex items-center justify-center h-64 text-center p-4"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div>
                <p className="text-3xl mb-2">⚡</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Run Rank station first to see top result here</p>
              </div>
            </div>
          )}
        </div>

        {/* VLM analysis */}
        <div className="md:col-span-1">
          <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            👁 VLM — Room Analysis
          </h3>
          {analysis ? (
            <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-card)', border: '1.5px solid var(--elastic-purple)' }}>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Style</p>
                <p className="font-semibold" style={{ color: 'var(--elastic-purple)' }}>{analysis.style}</p>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Mood</p>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{analysis.mood}</p>
              </div>
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Amenities</p>
                <div className="flex flex-wrap gap-1">
                  {analysis.visibleAmenities.slice(0, 4).map(a => (
                    <span key={a} className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Guest Profile</p>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{analysis.guestProfile}</p>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Powered by Jina VLM · via jina.ai API</p>
            </div>
          ) : (
            <div className="rounded-xl flex items-center justify-center h-64 text-center p-4"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div>
                <p className="text-3xl mb-2">👁</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Run Describe station first to see VLM analysis here</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Narration */}
      <div data-bp-card="blue" className="p-5 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--elastic-blue)' }}>
        <p className="text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          <span style={{ color: 'var(--elastic-gold)' }}>Reader</span> scraped the property data.{' '}
          <span style={{ color: 'var(--elastic-blue)' }}>Embeddings + geo</span> found candidates on the Strip.{' '}
          <span style={{ color: 'var(--elastic-pink)' }}>Reranker</span> surfaced the right one.{' '}
          <span style={{ color: 'var(--elastic-teal)' }}>CLIP</span> matched the aesthetic.{' '}
          <span style={{ color: 'var(--elastic-purple)' }}>VLM</span> told us exactly what the room offers.{' '}
          <strong style={{ color: 'var(--text-primary)' }}>Five models. One search experience.</strong>
        </p>
      </div>
    </div>
  );
}
