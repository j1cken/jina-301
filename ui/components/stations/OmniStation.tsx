'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Hotel } from '@/lib/types';
import { resolveImageUrl } from '@/lib/images';
import { apiUrl } from '@/lib/api';

const ACCENT = '#10B981';
const BLUE = '#0077CC';
const PINK = '#F04E98';
const TEAL = '#00BFB3';
const GOLD = '#FACB3D';
const ORANGE = '#E7664C';

const MODELS = [
  {
    id: 'jina-embeddings-v5-text-small',
    modalities: 'Text',
    context: '8,192 tok',
    dims: '384',
    eis: '✅ Live',
    when: 'Pure text, latency-sensitive, tight storage budget',
    color: BLUE,
  },
  {
    id: 'jina-clip-v2',
    modalities: 'Text + Image',
    context: '8,192 tok',
    dims: '1,024',
    eis: '✅ Live',
    when: 'Image search, visual catalogs — the multimodal workhorse',
    color: TEAL,
  },
  {
    id: 'jina-embeddings-v5-omni-small',
    modalities: 'Text + Image + Audio + Video',
    context: '32,768 tok',
    dims: '1,024',
    eis: '✅ Live',
    when: 'Cross-modal retrieval, mixed-media archives, multi-format knowledge bases',
    color: ACCENT,
    highlight: true,
  },
  {
    id: 'jina-embeddings-v5-omni-nano',
    modalities: 'Text + Image + Audio + Video',
    context: '8,192 tok',
    dims: '768',
    eis: '✅ Live',
    when: 'Same powers, smaller footprint — edge and high-throughput',
    color: ACCENT,
  },
];

const MODALITIES = [
  { id: 'text',  label: '📝 Text',  model: 'jina-embeddings-v5-text-small', color: BLUE },
  { id: 'image', label: '🖼 Image', model: 'jina-clip-v2',                  color: TEAL },
  { id: 'audio', label: '🎵 Audio', model: 'whisper-large-v3',   color: GOLD },
  { id: 'video', label: '🎬 Video', model: 'siglip2 + whisper', color: ORANGE },
];

const SITUATIONS = [
  {
    icon: '📄',
    icon2: '🖼',
    title: 'Product catalog with descriptions and photos',
    say: 'One index, one query hits both. No separate image pipeline — omni already speaks both languages.',
  },
  {
    icon: '🎙',
    icon2: '📄',
    title: 'Customer calls archived alongside email threads',
    say: 'Omni embeds audio and text into the same space. A single kNN query finds the call and the follow-up email together.',
  },
  {
    icon: '📹',
    icon2: '📄',
    title: 'Knowledge base with docs, screenshots, and video tutorials',
    say: 'Stop building three separate pipelines. Omni finds the right asset regardless of format — one index, one inference_id.',
  },
];

const NOT_CASES = [
  {
    title: 'Pure text, latency-sensitive.',
    body: 'v5-text-small is 384-dim, built exactly for this. Omni at 1024-dim is bigger — you won\'t see better text recall and you\'ll pay more compute.',
  },
  {
    title: 'Image catalog already on CLIP v2 and customers are happy.',
    body: 'Migration cost > marginal benefit. Wait for the cross-modal ask — when users say "I want to search with audio too," that\'s your signal.',
  },
  {
    title: 'You don\'t actually have multiple modalities.',
    body: '"We might add audio someday" is not a use case. Build for the data you have. Three specialized models beat one overloaded model you don\'t fully use.',
  },
];

// Waveform bars — static SVG representing audio input
function Waveform() {
  const bars = [4, 8, 14, 22, 18, 12, 26, 32, 28, 20, 14, 24, 30, 18, 10, 28, 22, 16, 8, 18, 26, 12, 20, 28, 14, 6];
  return (
    <svg viewBox={`0 0 ${bars.length * 8} 40`} className="w-full h-10" style={{ opacity: 0.8 }}>
      {bars.map((h, i) => (
        <rect key={i} x={i * 8 + 1} y={(40 - h) / 2} width={5} height={h} rx={2}
          fill={GOLD} opacity={0.7 + (i % 3) * 0.1} />
      ))}
    </svg>
  );
}

function OmniResultCard({ hotel }: { hotel: Hotel }) {
  const img = hotel.image_paths?.[0];
  return (
    <div className="flex gap-3 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
      {img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="" className="w-16 h-14 object-cover rounded-lg shrink-0" />
      )}
      <div className="flex flex-col justify-center gap-0.5 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{hotel.name}</p>
        <p className="text-xs text-white/50 truncate">{hotel.location_name}, {hotel.country}</p>
        <p className="text-xs font-mono" style={{ color: ACCENT }}>${hotel.price_per_night_usd}/night</p>
      </div>
    </div>
  );
}

function DemoCard({
  icon, title, description, inputSlot, buttonLabel, onRun, loading, results, error, liveMode, onToggleLive,
}: {
  icon: string;
  title: string;
  description: string;
  inputSlot: React.ReactNode;
  buttonLabel: string;
  onRun: () => void;
  loading: boolean;
  results: Hotel[];
  error: string | null;
  liveMode: boolean;
  onToggleLive: () => void;
}) {
  return (
    <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: ACCENT + '08', border: `1px solid ${ACCENT}25` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>
        {/* Live toggle */}
        <button
          onClick={onToggleLive}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all shrink-0"
          style={{
            background: liveMode ? ACCENT + '20' : 'rgba(255,255,255,0.05)',
            borderColor: liveMode ? ACCENT + '60' : 'rgba(255,255,255,0.15)',
            color: liveMode ? ACCENT : 'rgba(255,255,255,0.4)',
          }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: liveMode ? ACCENT : 'rgba(255,255,255,0.3)' }} />
          {liveMode ? 'live' : 'cached'}
        </button>
      </div>

      <p className="text-sm text-white/60 leading-relaxed">{description}</p>

      {/* Input area */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {inputSlot}
      </div>

      <button
        onClick={onRun}
        disabled={loading}
        className="w-full py-3 rounded-xl font-bold text-base transition-all"
        style={{
          background: loading ? ACCENT + '30' : ACCENT,
          color: loading ? 'rgba(255,255,255,0.5)' : '#0A0F1E',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}>
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {liveMode ? 'Embedding…' : 'Loading…'}
          </span>
        ) : buttonLabel}
      </button>

      {error && (
        <p className="text-xs text-red-400 bg-red-900/20 rounded-lg px-3 py-2">{error}</p>
      )}

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wide">
              {results.length} matches · one index · one inference call
            </p>
            {results.slice(0, 3).map(h => <OmniResultCard key={h.id} hotel={h} />)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ModalitySwitcher() {
  const [active, setActive] = useState<string[]>(['text']);

  const toggle = (id: string) => {
    setActive(prev =>
      prev.includes(id)
        ? prev.length > 1 ? prev.filter(x => x !== id) : prev
        : [...prev, id]
    );
  };

  const activeModels = MODALITIES.filter(m => active.includes(m.id));
  const withoutCount = activeModels.length;

  return (
    <div className="rounded-2xl p-6 flex flex-col gap-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div>
        <h3 className="text-2xl font-bold text-white mb-1">Modality Switcher</h3>
        <p className="text-lg text-white/70">Query: <span className="text-white/90 italic">&ldquo;romantic beachfront with private pool villa and spa&rdquo;</span> — toggle which input types you have</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {MODALITIES.map(m => (
          <button key={m.id} onClick={() => toggle(m.id)}
            className="min-h-[56px] px-5 py-3 rounded-xl border text-lg font-semibold transition-all"
            style={{
              background: active.includes(m.id) ? m.color : 'rgba(255,255,255,0.05)',
              borderColor: active.includes(m.id) ? m.color : 'rgba(255,255,255,0.15)',
              color: active.includes(m.id) ? '#0A0F1E' : 'rgba(255,255,255,0.5)',
            }}>
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Without Omni */}
        <div className="flex flex-col gap-3">
          <p className="text-xl font-bold text-red-400">Without Omni</p>
          <AnimatePresence>
            {activeModels.map(m => (
              <motion.div key={m.id}
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                className="rounded-xl px-4 py-3 text-base"
                style={{ background: m.color, color: '#0A0F1E' }}>
                <span className="font-mono">{m.model}</span>
                <span className="ml-2 font-normal text-sm" style={{ color: 'rgba(10,15,30,0.65)' }}>✅ EIS</span>
              </motion.div>
            ))}
          </AnimatePresence>
          <div className="text-base text-white/70 mt-1">
            {withoutCount} model{withoutCount !== 1 ? 's' : ''} · {withoutCount} index{withoutCount !== 1 ? 'es' : ''} · {withoutCount > 1 ? 'fusion layer required' : 'standard'}
          </div>
        </div>

        {/* With Omni */}
        <div className="flex flex-col gap-3">
          <p className="text-xl font-bold" style={{ color: ACCENT }}>With Omni</p>
          <div className="rounded-xl px-4 py-3 text-base" style={{ background: ACCENT, color: '#0A0F1E' }}>
            <span className="font-mono">jina-embeddings-v5-omni-small</span>
            <span className="ml-2 font-normal text-sm" style={{ color: 'rgba(10,15,30,0.65)' }}>✅ EIS</span>
          </div>
          <div className="text-base font-semibold" style={{ color: ACCENT }}>1 model · 1 index · no fusion code</div>
        </div>
      </div>
    </div>
  );
}

function ArchitectureDiagram() {
  const inputs = [
    { label: 'Text',  icon: 'T',  color: BLUE },
    { label: 'Image', icon: '🖼', color: TEAL },
    { label: 'Audio', icon: '🎵', color: GOLD },
    { label: 'Video', icon: '🎬', color: ORANGE },
  ];

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <div className="flex gap-8 justify-center">
        {inputs.map((inp, i) => (
          <motion.div key={inp.label}
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15, duration: 0.4 }}
            className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold border-2"
              style={{ background: inp.color + '20', borderColor: inp.color + '60', color: inp.color }}>
              {inp.icon}
            </div>
            <span className="text-sm font-semibold text-white/70">{inp.label}</span>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-12">
        <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.6, duration: 0.3 }}
          className="flex flex-col items-center gap-3">
          <div className="h-10 w-0.5" style={{ background: `linear-gradient(to bottom, ${TEAL}80, ${TEAL})` }} />
          <div className="rounded-xl px-4 py-2.5 text-sm font-mono font-semibold"
            style={{ background: TEAL + '18', border: `2px solid ${TEAL}50`, color: TEAL }}>
            SigLIP2 (vision)
          </div>
        </motion.div>
        <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.6, duration: 0.3 }}
          className="flex flex-col items-center gap-3">
          <div className="h-10 w-0.5" style={{ background: `${GOLD}80` }} />
          <div className="rounded-xl px-4 py-2.5 text-sm font-mono font-semibold"
            style={{ background: GOLD + '18', border: `2px solid ${GOLD}50`, color: GOLD }}>
            Whisper-large-v3
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.4 }}
        className="rounded-2xl px-8 py-4 text-center w-full max-w-xs"
        style={{ background: PINK + '15', border: `2px solid ${PINK}40` }}>
        <p className="text-base font-bold" style={{ color: PINK }}>Cross-modal projectors</p>
        <p className="text-sm text-white/50 mt-1">~5.5M params · newly trained</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.4 }}
        className="rounded-2xl px-8 py-4 text-center w-full max-w-xs"
        style={{ background: BLUE + '15', border: `2px solid ${BLUE}40` }}>
        <p className="text-base font-bold" style={{ color: BLUE }}>v5-text backbone</p>
        <p className="text-sm text-white/50 mt-1">frozen — unchanged</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.5, duration: 0.4 }}
        className="rounded-2xl px-10 py-5 text-center w-full max-w-sm"
        style={{ background: ACCENT + '18', border: `2px solid ${ACCENT}60` }}>
        <p className="text-xl font-bold" style={{ color: ACCENT }}>1024-dim vector</p>
        <p className="text-sm text-white/60 mt-1">one shared space for all modalities</p>
      </motion.div>
    </div>
  );
}

export default function OmniStation({ demoMode }: { demoMode?: boolean }) {
  // Demo card state — each card tracks its own loading/results
  const [textQuery, setTextQuery] = useState('romantic beachfront with private pool villa and spa');
  const [textLive, setTextLive] = useState(false);
  const [textLoading, setTextLoading] = useState(false);
  const [textResults, setTextResults] = useState<Hotel[]>([]);
  const [textError, setTextError] = useState<string | null>(null);

  const [imageLive, setImageLive] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageResults, setImageResults] = useState<Hotel[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);

  const [audioLive, setAudioLive] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioResults, setAudioResults] = useState<Hotel[]>([]);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const SAMPLE_IMAGE = '/images/hotels/al-wadi-desert-ras-al-khaimah_1.png';

  async function runOmni(payload: Record<string, unknown>): Promise<Hotel[]> {
    const res = await fetch(apiUrl('/api/omni'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, demoMode: payload.liveMode ? false : (demoMode ?? true) }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Unknown error');
    return data.results ?? [];
  }

  async function handleTextRun() {
    setTextLoading(true); setTextError(null);
    try {
      setTextResults(await runOmni({ query: textQuery, liveMode: textLive }));
    } catch (e) {
      setTextError((e as Error).message);
    } finally { setTextLoading(false); }
  }

  async function handleImageRun() {
    setImageLoading(true); setImageError(null);
    try {
      if (!imageLive) {
        setImageResults(await runOmni({ query: 'image_demo', liveMode: false }));
      } else {
        const resp = await fetch(resolveImageUrl(SAMPLE_IMAGE) as string);
        const buf = await resp.arrayBuffer();
        const bytes = new Uint8Array(buf);
        const b64 = btoa(Array.from(bytes, b => String.fromCharCode(b)).join(''));
        setImageResults(await runOmni({ imageBase64: b64, liveMode: true }));
      }
    } catch (e) {
      setImageError((e as Error).message);
    } finally { setImageLoading(false); }
  }

  async function handleAudioRun() {
    setAudioLoading(true); setAudioError(null);
    try {
      if (audioLive) {
        // Fetch audio file and base64 encode it for live mode
        const res = await fetch('/audio/hotel-ambient.wav');
        if (res.ok) {
          const buf = await res.arrayBuffer();
          const bytes = new Uint8Array(buf);
          const b64 = btoa(Array.from(bytes, b => String.fromCharCode(b)).join(''));
          setAudioResults(await runOmni({ audioBase64: b64, liveMode: true }));
        } else {
          // Fall back to text proxy if audio file not available
          setAudioResults(await runOmni({ query: 'ocean waves ambient hotel lobby relaxing sound', liveMode: true }));
        }
      } else {
        setAudioResults(await runOmni({ query: 'audio_demo', liveMode: false }));
      }
    } catch (e) {
      setAudioError((e as Error).message);
    } finally { setAudioLoading(false); }
  }

  return (
    <div className="flex flex-col gap-14 pb-16">

      {/* Hero */}
      <div className="flex flex-row items-center gap-8">
        {/* Text left */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: ACCENT + '25', color: ACCENT, border: `1px solid ${ACCENT}50` }}>
              ✅ ON EIS
            </span>
          </div>
          <h1 className="text-5xl font-black text-white leading-tight tracking-tight">
            ONE MODEL.<br />EVERY MODALITY.
          </h1>
          <div className="flex flex-col gap-2">
            <p className="text-lg text-white/80 leading-relaxed">
              Omni handles text, images, audio, and video in the same vector space. Text embeddings are identical to v5-text — <strong className="text-white">existing indices don&apos;t need rebuilding</strong>.
            </p>
            <p className="text-lg text-white/80 leading-relaxed">
              One inference call. One index. No fusion code.
            </p>
            <p className="text-base" style={{ color: ACCENT }}>
              Reach for it when a customer&apos;s data has more than one modality.
            </p>
          </div>
        </div>
        {/* Image right */}
        <div className="w-[42%] shrink-0 rounded-2xl overflow-hidden" style={{ maxHeight: 320 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveImageUrl('/images/omni/omni-hero.png')}
            alt=""
            className="w-full h-full object-cover"
            style={{ objectPosition: '20% 65%' }}
          />
        </div>
      </div>

      {/* Modality Switcher */}
      <ModalitySwitcher />

      {/* Live Demo Cards */}
      <div className="flex flex-col gap-4">
        <h2 className="text-3xl font-bold text-white">Omni in action</h2>
        <p className="text-base text-white/50">Three ways to query the same index — text, image, audio — one model handles all of them.</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          <DemoCard
            icon="📝"
            title="Text Query"
            description="Type any description. Omni finds matching hotels across a 150-property multimodal index."
            inputSlot={
              <textarea
                value={textQuery}
                onChange={e => setTextQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTextRun(); } }}
                rows={2}
                className="w-full bg-transparent text-base text-white outline-none placeholder-white/30 resize-none"
                placeholder="describe what you're looking for…"
              />
            }
            buttonLabel="Search with Omni"
            onRun={handleTextRun}
            loading={textLoading}
            results={textResults}
            error={textError}
            liveMode={textLive}
            onToggleLive={() => setTextLive(v => !v)}
          />

          <DemoCard
            icon="🚁"
            title="Drone Frame"
            description="A single video frame from a property tour. Omni reads composition, lighting, and scene type — no caption required."
            inputSlot={
              <div className="relative rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resolveImageUrl(SAMPLE_IMAGE)} alt="Sample hotel" className="w-full h-28 object-cover" />
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.35)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.9)' }}>
                    <svg className="w-4 h-4 ml-0.5" fill="#0A0F1E" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 text-xs font-mono px-2 py-0.5 rounded"
                  style={{ background: 'rgba(0,0,0,0.7)', color: ORANGE }}>
                  0:10 · drone footage
                </div>
              </div>
            }
            buttonLabel="Search by Scene"
            onRun={handleImageRun}
            loading={imageLoading}
            results={imageResults}
            error={imageError}
            liveMode={imageLive}
            onToggleLive={() => setImageLive(v => !v)}
          />

          <DemoCard
            icon="🎙"
            title="Voice Memo"
            description="5 seconds of ambient audio from the property. Omni finds hotels with matching acoustic profiles — no transcription, no text needed."
            inputSlot={
              <div className="flex flex-col gap-3">
                <Waveform />
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => audioRef.current?.paused ? audioRef.current.play() : audioRef.current?.pause()}
                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium"
                    style={{ background: GOLD + '20', color: GOLD, border: `1px solid ${GOLD}40` }}>
                    ▶ play clip
                  </button>
                  <span className="text-xs text-white/30 font-mono">hotel-ambient.wav · 5s</span>
                  <audio ref={audioRef} src="/audio/hotel-ambient.wav" preload="none" />
                </div>
              </div>
            }
            buttonLabel="Find Hotels Like This"
            onRun={handleAudioRun}
            loading={audioLoading}
            results={audioResults}
            error={audioError}
            liveMode={audioLive}
            onToggleLive={() => setAudioLive(v => !v)}
          />

        </div>
      </div>

      {/* When to reach for Omni */}
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-3xl font-bold text-white">When to reach for Omni</h2>
          <p className="text-base text-white/50 mt-1">Read this once. Repeat it back to the customer.</p>
        </div>
        <div className="p-5 rounded-2xl text-base text-white/80 leading-relaxed"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
          Omni is one embedding model that handles text, images, audio, and video in the same vector space.
          Text embeddings are bit-identical to v5-text-small, so customers already on v5{' '}
          <strong className="text-white">don&apos;t re-index</strong> — they just point new modalities at the same field.
          It beats CLIP v2 on image retrieval at the same parameter size, and it eliminates the custom pipelines customers
          build today to stitch separate text, image, and audio models together.
          <strong className="text-white"> Reach for it when a customer&apos;s data has more than one modality,
          or when they&apos;re tired of maintaining three embedding pipelines.</strong>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SITUATIONS.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="rounded-2xl p-5 flex flex-col gap-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex gap-1 text-2xl">{s.icon}{s.icon2}</div>
              <p className="text-base font-semibold text-white leading-snug">{s.title}</p>
              <p className="text-sm text-white/60 leading-relaxed italic">{s.say}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* When NOT to use */}
      <div className="flex flex-col gap-4">
        <h2 className="text-3xl font-bold text-white">When NOT to use Omni</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {NOT_CASES.map((item, i) => (
            <div key={i} className="rounded-2xl p-5 flex flex-col gap-2"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-base font-bold text-white/90">{item.title}</p>
              <p className="text-sm text-white/55 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Architecture */}
      <div className="flex flex-col gap-4">
        <h2 className="text-3xl font-bold text-white">Architecture in 60 seconds</h2>
        <p className="text-base text-white/50 max-w-2xl">
          The text backbone didn&apos;t change. It got three new input pipes. SigLIP2 handles vision, Whisper handles audio —
          both feed through ~5.5M newly-trained projectors into the frozen v5-text backbone.
          One kNN call, zero cross-modal glue code.
        </p>
        <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <ArchitectureDiagram />
        </div>
      </div>

      {/* Model comparison table */}
      <div className="flex flex-col gap-4">
        <h2 className="text-3xl font-bold text-white">Model comparison</h2>
        <p className="text-sm text-white/40">Screenshot this. Use it for the &ldquo;which model?&rdquo; conversation.</p>
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.08)', borderBottom: '2px solid rgba(255,255,255,0.15)' }}>
                <th className="text-left px-5 py-4 text-sm font-bold uppercase tracking-wide text-white">Model</th>
                <th className="text-left px-5 py-4 text-sm font-bold uppercase tracking-wide text-white">Modalities</th>
                <th className="text-left px-5 py-4 text-sm font-bold uppercase tracking-wide text-white">Context</th>
                <th className="text-left px-5 py-4 text-sm font-bold uppercase tracking-wide text-white">Dims</th>
                <th className="text-left px-5 py-4 text-sm font-bold uppercase tracking-wide text-white">EIS</th>
                <th className="text-left px-5 py-4 text-sm font-bold uppercase tracking-wide text-white">Use when</th>
              </tr>
            </thead>
            <tbody>
              {MODELS.map((m, i) => (
                <tr key={m.id}
                  style={{
                    borderBottom: i < MODELS.length - 1 ? '1px solid rgba(255,255,255,0.07)' : undefined,
                    background: m.highlight ? ACCENT + '0C' : undefined,
                  }}>
                  <td className="px-5 py-4">
                    <span className="text-sm font-mono font-semibold" style={{ color: m.color }}>{m.id}</span>
                    {m.highlight && <span className="ml-2 text-xs px-1.5 py-0.5 rounded font-semibold"
                      style={{ background: ACCENT + '25', color: ACCENT }}>new</span>}
                  </td>
                  <td className="px-5 py-4 text-sm text-white/80">{m.modalities}</td>
                  <td className="px-5 py-4 text-sm font-mono text-white/70">{m.context}</td>
                  <td className="px-5 py-4 text-sm font-mono text-white/70">{m.dims}</td>
                  <td className="px-5 py-4 text-sm text-white/80">{m.eis}</td>
                  <td className="px-5 py-4 text-sm text-white/65 leading-snug">{m.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
