'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ChevronDown, ChevronUp, Edit2, Check } from 'lucide-react';
import JinaCallout from '@/components/JinaCallout';
import ModelBadge from '@/components/shared/ModelBadge';
import type { Hotel, VlmAnalysis } from '@/lib/types';
import { resolveImageUrl } from '@/lib/images';
import { apiUrl } from '@/lib/api';

const DEFAULT_PROMPT = `You are a luxury travel editor. Analyze this hotel image and return ONLY a JSON object:
{
  "style": "one evocative phrase describing the architectural/design style",
  "visibleAmenities": ["up to 5 specific amenities visible in the image"],
  "mood": "one sentence atmosphere description",
  "guestProfile": "ideal guest in 10 words",
  "standout": "single most distinctive visual feature"
}
Return only valid JSON, no markdown fences, no explanation.`;

const PROMPT_PRESETS = [
  {
    label: 'Focus on amenities',
    prompt: `Analyze this hotel image. Return ONLY JSON:
{
  "style": "brief style description",
  "visibleAmenities": ["every visible amenity, up to 8"],
  "mood": "atmosphere in one sentence",
  "guestProfile": "who stays here in 10 words",
  "standout": "most distinctive amenity visible"
}`,
  },
  {
    label: 'Guest profile',
    prompt: `You are a hotel market analyst. Analyze this hotel image. Return ONLY JSON:
{
  "style": "property style in 3 words",
  "visibleAmenities": ["top 3 amenities visible"],
  "mood": "emotional appeal in one sentence",
  "guestProfile": "detailed ideal guest description: age, income, travel reason",
  "standout": "top selling point for this guest"
}`,
  },
  {
    label: 'Style + mood',
    prompt: `You are an interior design critic. Analyze this hotel image. Return ONLY JSON:
{
  "style": "precise architectural and interior design style",
  "visibleAmenities": ["visible luxury details, up to 5"],
  "mood": "evocative atmosphere — use sensory language",
  "guestProfile": "ideal guest in 10 words",
  "standout": "most photographable design element"
}`,
  },
];

interface DescribeStationProps {
  demoMode: boolean;
  hotels?: Hotel[];
  onSelectStation?: (station: string) => void;
}

interface VlmResult {
  hotel: Hotel;
  analysis: VlmAnalysis & { standout?: string };
}

function AnalysisCard({ result, onFindSimilar }: { result: VlmResult; onFindSimilar?: () => void }) {
  const { hotel, analysis } = result;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--bg-card)', border: '1.5px solid var(--elastic-purple)' }}
    >
      <div className="flex gap-0">
        {hotel.image_paths?.[0] && (
          <img src={resolveImageUrl(hotel.image_paths[0])} alt={hotel.name} className="w-48 flex-shrink-0 object-cover" />
        )}
        <div className="p-4 flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 style={{ color: 'var(--text-primary)' }}>{hotel.name}</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{hotel.location_name}</p>
            </div>
            <span data-bp-chip="purple" className="text-xs px-2 py-1 rounded-full flex-shrink-0"
              style={{ background: 'rgba(168,85,247,0.15)', color: 'var(--elastic-purple)', border: '1px solid rgba(168,85,247,0.3)' }}>
              Jina VLM · jina.ai
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Style</p>
              <p style={{ color: 'var(--text-primary)' }}>{analysis.style}</p>
            </div>
            <div>
              <p className="font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Mood</p>
              <p style={{ color: 'var(--text-primary)' }}>{analysis.mood}</p>
            </div>
            <div>
              <p className="font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Visible Amenities</p>
              <div className="flex flex-wrap gap-1">
                {analysis.visibleAmenities.slice(0, 5).map(a => (
                  <span key={a} className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    {a}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Guest Profile</p>
              <p className="leading-snug" style={{ color: 'var(--text-primary)' }}>{analysis.guestProfile}</p>
            </div>
            {analysis.standout && (
              <div className="col-span-2">
                <p className="font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Standout Feature</p>
                <p style={{ color: 'var(--elastic-purple)' }}>{analysis.standout}</p>
              </div>
            )}
          </div>

          {onFindSimilar && (
            <button
              onClick={onFindSimilar}
              className="mt-3 text-sm px-3 py-1.5 rounded-lg font-semibold transition-all"
              style={{ background: 'var(--elastic-purple)', color: '#fff' }}
            >
              Find hotels like this →
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

const SAMPLE_HOTELS: Hotel[] = [
  {
    id: 'demo-1', name: 'The Venetian Resort', descriptions: [],
    location: { lat: 36.1214, lon: -115.1699 }, location_name: 'Las Vegas, NV',
    country: 'USA', region: 'Nevada', amenities: [], style: ['luxury'],
    price_tier: 'luxury', price_per_night_usd: 450,
    image_paths: ['/images/hotels/venetian-las-vegas_1.png'], rating: 4.7, nearby_landmarks: [],
  },
];

export default function DescribeStation({ demoMode, hotels, onSelectStation }: DescribeStationProps) {
  const [results, setResults] = useState<VlmResult[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [coldStart, setColdStart] = useState(false);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [promptOpen, setPromptOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(DEFAULT_PROMPT);

  const displayHotels = hotels?.length ? hotels : SAMPLE_HOTELS;

  const analyze = async (hotel: Hotel) => {
    if (loading) return;
    const imageUrl = resolveImageUrl(hotel.image_paths?.[0]);
    if (!imageUrl) return;

    setLoading(hotel.id);
    setColdStart(false);

    try {
      const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${window.location.origin}${imageUrl}`;
      const res = await fetch(apiUrl('/api/vision'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: fullUrl, hotelId: hotel.id, demoMode, prompt }),
      });
      const data = await res.json();

      if (res.status === 502 && data.coldStart) {
        setColdStart(true);
        return;
      }

      if (data.analysis) {
        setResults(prev => [{ hotel, analysis: data.analysis }, ...prev.filter(r => r.hotel.id !== hotel.id)]);
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h2 style={{ color: 'var(--text-primary)' }}>Describe</h2>
          <ModelBadge model="VLM" api="jina" />
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>
          CLIP finds by similarity. VLM <em>understands</em> what it sees — style, amenities, mood, guest profile.
        </p>
      </div>

      <JinaCallout
        model="VLM"
        loading={!!loading}
        loadingMessage="Jina VLM is analyzing the hotel image — reading architectural style, visible amenities, and guest experience..."
        doneMessage="VLM returned structured analysis from a single image. No metadata needed — the model sees it."
      />

      {/* VLM Prompt panel */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <button
          onClick={() => setPromptOpen(p => !p)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold"
          style={{ color: 'var(--text-secondary)' }}
        >
          <span>VLM Prompt</span>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {PROMPT_PRESETS.map(p => (
                <button
                  data-bp-chip="purple"
                  key={p.label}
                  onClick={e => { e.stopPropagation(); setPrompt(p.prompt); setEditDraft(p.prompt); setEditing(false); }}
                  className="px-2 py-0.5 rounded text-xs font-semibold transition-colors"
                  style={{
                    background: prompt === p.prompt ? 'rgba(168,85,247,0.15)' : 'var(--bg-surface)',
                    color: prompt === p.prompt ? 'var(--elastic-purple)' : 'var(--text-muted)',
                    border: `1px solid ${prompt === p.prompt ? 'rgba(168,85,247,0.3)' : 'var(--border)'}`,
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {promptOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        <AnimatePresence>
          {promptOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--border)' }}>
                {editing ? (
                  <div className="pt-3 space-y-2">
                    <textarea
                      value={editDraft}
                      onChange={e => setEditDraft(e.target.value)}
                      rows={8}
                      className="w-full px-3 py-2 rounded-lg text-xs font-mono outline-none resize-y"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setPrompt(editDraft); setEditing(false); }}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold"
                        style={{ background: 'var(--elastic-purple)', color: '#fff' }}
                      >
                        <Check className="w-3 h-3" /> Save
                      </button>
                      <button
                        onClick={() => { setEditDraft(prompt); setEditing(false); }}
                        className="px-3 py-1 rounded-lg text-xs font-semibold"
                        style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 relative group">
                    <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {prompt}
                    </pre>
                    <button
                      onClick={() => { setEditDraft(prompt); setEditing(true); }}
                      className="absolute top-3 right-0 flex items-center gap-1 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {coldStart && (
        <div data-bp-card="pink" className="p-4 rounded-xl text-sm" style={{ background: 'rgba(240,78,152,0.1)', border: '1px solid rgba(240,78,152,0.3)', color: 'var(--elastic-pink)' }}>
          VLM is warming up (cold start). Retrying in ~30s... or try a different hotel while waiting.
        </div>
      )}

      {/* Hotel selection grid */}
      <div>
        <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>Click any hotel to analyze with Jina VLM:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {displayHotels.slice(0, 8).map(hotel => (
            <button
              key={hotel.id}
              onClick={() => analyze(hotel)}
              disabled={!!loading}
              className="relative rounded-xl overflow-hidden text-left transition-all hover:scale-105 group disabled:opacity-50"
              style={{ border: '1.5px solid var(--border)' }}
            >
              {hotel.image_paths?.[0] ? (
                <img src={resolveImageUrl(hotel.image_paths[0])} alt={hotel.name} className="w-full h-28 object-cover" />
              ) : (
                <div className="w-full h-28 flex items-center justify-center text-3xl" style={{ background: 'var(--bg-surface)' }}>🏨</div>
              )}
              <div className="p-2" style={{ background: 'var(--bg-card)' }}>
                <p className="text-xs font-semibold line-clamp-1" style={{ color: 'var(--text-primary)' }}>{hotel.name}</p>
              </div>
              {loading === hotel.id && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(7,16,31,0.7)' }}>
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--elastic-purple)' }} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Analysis results */}
      <AnimatePresence>
        {results.map(result => (
          <AnalysisCard
            key={result.hotel.id}
            result={result}
            onFindSimilar={onSelectStation ? () => onSelectStation('find') : undefined}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
