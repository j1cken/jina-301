'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveImageUrl } from '@/lib/images';

const ACCENT = '#10B981';
const BLUE = '#0077CC';
const PINK = '#F04E98';
const TEAL = '#00BFB3';

// Model comparison table data
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
    when: 'Image search, visual catalogs — today\'s multimodal workhorse',
    color: TEAL,
  },
  {
    id: 'jina-embeddings-v5-omni-small',
    modalities: 'Text + Image + Audio + Video',
    context: '32,768 tok',
    dims: '1,024',
    eis: '🔜 Coming',
    when: 'Cross-modal retrieval, long docs with figures, media archives',
    color: ACCENT,
    highlight: true,
  },
  {
    id: 'jina-embeddings-v5-omni-nano',
    modalities: 'Text + Image + Audio + Video',
    context: '8,192 tok',
    dims: '768',
    eis: '🔜 Coming',
    when: 'Same powers, smaller footprint — edge, high throughput',
    color: ACCENT,
  },
];

// Modality switcher
const MODALITIES = [
  { id: 'text', label: '📝 Text', model: 'jina-embeddings-v5-text-small', eis: true, color: BLUE },
  { id: 'image', label: '🖼 Image', model: 'jina-clip-v2', eis: true, color: TEAL },
  { id: 'audio', label: '🎵 Audio', model: 'Whisper-large-v3', eis: false, color: '#FACB3D' },
  { id: 'video', label: '🎬 Video', model: 'frame sampler + fusion layer', eis: false, color: '#E7664C' },
];

// Use case cards
const USE_CASES = [
  {
    icon: '📚',
    title: 'Multimodal Knowledge Base',
    problem: 'Wiki + figures + all-hands videos — one query finds the diagram that answers the question',
    modalities: ['text', 'image', 'video', 'audio'],
    example: '"What does the auth flow look like?" → finds the sequence diagram from a Confluence doc AND the relevant 2-min explainer clip',
  },
  {
    icon: '⚖️',
    title: 'Compliance Archive Discovery',
    problem: '12 years of trader calls + emails + scanned docs — one index, one query',
    modalities: ['audio', 'text', 'image'],
    example: '"Risk disclosure discussion, Q3 2019" → surfaces audio call, email thread, and scanned consent form together',
  },
  {
    icon: '🛍',
    title: 'Visual + Verbal Retail Search',
    problem: '"This jacket, that color, shorter" — one multi-input kNN call',
    modalities: ['text', 'image', 'video'],
    example: 'Upload a reference image + describe the change → single vector space returns exact matches without separate pipelines',
  },
  {
    icon: '🏭',
    title: 'Manufacturing Defect Triage',
    problem: 'Wrong sound + photo + typed description → top matching past incidents',
    modalities: ['audio', 'image', 'text'],
    example: 'Field tech records grinding noise + photos damage → kNN returns top 3 historical incidents with resolution steps',
  },
  {
    icon: '📹',
    title: 'Media Asset Discovery',
    problem: '"Senator looked angry saying fiscal responsibility" — searches visual + audio + transcript',
    modalities: ['video', 'audio', 'text'],
    example: 'One natural-language query searches face expression, spoken words, and on-screen graphics simultaneously',
  },
  {
    icon: '🔧',
    title: 'Field Service Diagnostics',
    problem: 'Technician narrated video IS the query — finds similar past service tickets',
    modalities: ['video', 'audio', 'text'],
    example: '30-second narrated video → omni embeds motion + sound + speech → matches similar past tickets with resolution docs',
  },
];

const modalityColor: Record<string, string> = {
  text: BLUE,
  image: TEAL,
  audio: '#FACB3D',
  video: '#E7664C',
};

function ModalityChip({ id }: { id: string }) {
  const labels: Record<string, string> = { text: '📝 Text', image: '🖼 Image', audio: '🎵 Audio', video: '🎬 Video' };
  return (
    <span className="text-xs px-1.5 py-0.5 rounded font-medium"
      style={{ background: modalityColor[id] + '18', color: modalityColor[id] }}>
      {labels[id]}
    </span>
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

  return (
    <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <h3 className="text-base font-bold text-white mb-4">Modality Switcher</h3>
      <p className="text-xs text-white/50 mb-4">Query: <span className="text-white/80 italic">"quiet beachfront villa at sunset"</span> — select which modalities you have</p>

      {/* Chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {MODALITIES.map(m => (
          <button key={m.id} onClick={() => toggle(m.id)}
            className="text-sm px-3 py-1.5 rounded-full border transition-all font-medium"
            style={{
              background: active.includes(m.id) ? m.color + '20' : 'rgba(255,255,255,0.05)',
              borderColor: active.includes(m.id) ? m.color + '60' : 'rgba(255,255,255,0.15)',
              color: active.includes(m.id) ? m.color : 'rgba(255,255,255,0.5)',
            }}>
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Without Omni */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-red-400">Without Omni</p>
          <AnimatePresence>
            {activeModels.map(m => (
              <motion.div key={m.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-lg px-3 py-2 text-xs"
                style={{ background: m.color + '12', border: `1px solid ${m.color}30`, color: m.color }}>
                <span className="font-mono">{m.model}</span>
                {!m.eis && <span className="ml-2 text-white/30 font-normal">not on EIS</span>}
                {m.eis && <span className="ml-2 text-white/40 font-normal">✅ EIS</span>}
              </motion.div>
            ))}
          </AnimatePresence>
          <div className="text-xs text-white/30 mt-1">
            {activeModels.length} model{activeModels.length !== 1 ? 's' : ''} · {activeModels.length} index{activeModels.length !== 1 ? 'es' : ''} · {activeModels.filter(m => !m.eis).length > 0 ? 'custom fusion code' : 'standard'}
          </div>
          <p className="text-xs text-white/20 italic mt-1">Conceptual infra — not all available on EIS today. Shows the architectural cost omni eliminates.</p>
        </div>

        {/* With Omni */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold" style={{ color: ACCENT }}>With Omni</p>
          <div className="rounded-lg px-3 py-2 text-xs" style={{ background: ACCENT + '12', border: `1px solid ${ACCENT}30`, color: ACCENT }}>
            <span className="font-mono">jina-embeddings-v5-omni-small</span>
            <span className="ml-2 text-white/40 font-normal">🔜 coming to EIS</span>
          </div>
          <div className="text-xs" style={{ color: ACCENT + 'aa' }}>1 model · 1 index · no fusion code</div>
        </div>
      </div>
    </div>
  );
}

function ArchitectureDiagram() {
  const inputs = [
    { label: 'Text', icon: 'T', color: BLUE },
    { label: 'Image', icon: '🖼', color: TEAL },
    { label: 'Audio', icon: '🎵', color: '#FACB3D' },
    { label: 'Video', icon: '🎬', color: '#E7664C' },
  ];

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* Inputs */}
      <div className="flex gap-6 justify-center">
        {inputs.map((inp, i) => (
          <motion.div key={inp.label}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15, duration: 0.4 }}
            className="flex flex-col items-center gap-1.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold border"
              style={{ background: inp.color + '15', borderColor: inp.color + '40', color: inp.color }}>
              {inp.icon}
            </div>
            <span className="text-xs text-white/50">{inp.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Converge arrows */}
      <div className="flex gap-8">
        <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.6, duration: 0.3 }}
          className="flex flex-col items-center gap-2">
          <div className="h-8 w-px" style={{ background: `linear-gradient(to bottom, ${TEAL}80, ${TEAL})` }} />
          <div className="rounded-lg px-3 py-1.5 text-xs font-mono" style={{ background: TEAL + '15', border: `1px solid ${TEAL}40`, color: TEAL }}>
            SigLIP2 (vision)
          </div>
        </motion.div>
        <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.6, duration: 0.3 }}
          className="flex flex-col items-center gap-2">
          <div className="h-8 w-px" style={{ background: 'rgba(250,203,61,0.5)' }} />
          <div className="rounded-lg px-3 py-1.5 text-xs font-mono" style={{ background: '#FACB3D15', border: '1px solid #FACB3D40', color: '#FACB3D' }}>
            Whisper-large-v3
          </div>
        </motion.div>
      </div>

      {/* Projector */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.4 }}
        className="rounded-xl px-5 py-3 text-center" style={{ background: PINK + '12', border: `1px solid ${PINK}35` }}>
        <p className="text-xs font-semibold" style={{ color: PINK }}>Cross-modal projectors</p>
        <p className="text-xs text-white/40 mt-0.5">~5.5M params</p>
      </motion.div>

      {/* Backbone */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.4 }}
        className="rounded-xl px-5 py-3 text-center" style={{ background: BLUE + '12', border: `1px solid ${BLUE}35` }}>
        <p className="text-xs font-semibold" style={{ color: BLUE }}>v5-text backbone</p>
        <p className="text-xs text-white/40 mt-0.5">frozen — unchanged</p>
      </motion.div>

      {/* Output */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.5, duration: 0.4 }}
        className="rounded-xl px-6 py-3 text-center" style={{ background: ACCENT + '15', border: `1px solid ${ACCENT}50` }}>
        <p className="text-sm font-bold" style={{ color: ACCENT }}>1024-dim vector</p>
        <p className="text-xs text-white/40 mt-0.5">one shared space for all modalities</p>
      </motion.div>
    </div>
  );
}

export default function OmniStation() {
  return (
    <div className="flex flex-col gap-12 pb-16">

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden" style={{ height: 380 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolveImageUrl('/images/omni/omni-hero.png')}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: '20% 65%' }}
        />
        {/* Scrim on RIGHT where text lives — left side stays clear so Burns+Lisa show */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.72) 28%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0))' }} />
        {/* Text block pinned to the right */}
        <div className="absolute right-0 top-0 bottom-0 z-10 p-8 flex flex-col justify-center gap-3 w-1/2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌐</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: ACCENT + '30', color: ACCENT, border: `1px solid ${ACCENT}60` }}>
              Coming to EIS · Live on Jina API now
            </span>
          </div>
          {/* .demo-blueprint h1 { color: #1A1A1B !important } — span child escapes it */}
          <h1 className="text-3xl font-bold leading-tight" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}>
            <span style={{ color: '#ffffff' }}>The omni-net catches everything.</span>
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
            Most models are specialized nets — one for text, one for images, one for audio.
            <span className="font-mono" style={{ color: '#ffffff' }}> jina-embeddings-v5-omni</span> catches all four — text, images, audio, and video — one shared vector space.
          </p>
          <p className="text-xs italic" style={{ color: 'rgba(255,255,255,0.55)', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
            "We call it the omni-net because it catches everything." — C.M. Burns, approximately
          </p>
        </div>
      </div>

      {/* The analogy */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-white">What makes it different</h2>
        <p className="text-sm text-white/60 leading-relaxed max-w-3xl">
          The text backbone didn't change. It just got three new input pipes.
          SigLIP2 handles vision, Whisper-large-v3 handles audio — both feed through trained projectors into the same v5-text backbone.
          The result: one embedding that lets text find images, audio find PDFs, video find documents.
          One kNN call, zero cross-modal glue code.
        </p>
      </div>

      {/* Architecture */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-white">Architecture in 60 seconds</h2>
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <ArchitectureDiagram />
        </div>
      </div>

      {/* Model comparison table */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-white">Model comparison</h2>
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/50">Model</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/50">Modalities</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/50">Context</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/50">Dims</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/50">EIS</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/50">Use when</th>
              </tr>
            </thead>
            <tbody>
              {MODELS.map((m, i) => (
                <tr key={m.id}
                  style={{
                    borderBottom: i < MODELS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : undefined,
                    background: m.highlight ? ACCENT + '08' : undefined,
                  }}>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono" style={{ color: m.color }}>{m.id}</span>
                    {m.highlight && <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background: ACCENT + '20', color: ACCENT }}>new</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-white/70">{m.modalities}</td>
                  <td className="px-4 py-3 text-xs font-mono text-white/60">{m.context}</td>
                  <td className="px-4 py-3 text-xs font-mono text-white/60">{m.dims}</td>
                  <td className="px-4 py-3 text-xs text-white/70">{m.eis}</td>
                  <td className="px-4 py-3 text-xs text-white/55">{m.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modality Switcher */}
      <ModalitySwitcher />

      {/* Use cases */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-white">Where omni changes everything</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {USE_CASES.map((uc, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="rounded-xl p-4 flex flex-col gap-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{uc.icon}</span>
                <h3 className="text-sm font-semibold text-white">{uc.title}</h3>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">{uc.problem}</p>
              <p className="text-xs text-white/40 italic leading-relaxed">{uc.example}</p>
              <div className="flex gap-1.5 flex-wrap">
                {uc.modalities.map(m => <ModalityChip key={m} id={m} />)}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* When NOT to use */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-white">When NOT to use omni</h2>
        <div className="flex flex-col gap-3">
          {[
            {
              n: '1',
              title: 'Pure text, latency-sensitive.',
              body: 'v5-text-small is 384-dim, trained for exactly this. Omni at 1024-dim is bigger; you won\'t see better text recall and you\'ll pay more compute.',
            },
            {
              n: '2',
              title: 'Image catalog already on CLIP v2 and customers are happy.',
              body: 'Migration cost > marginal benefit. Wait for a cross-modal requirement — when users say "I want to search with audio too," that\'s your signal.',
            },
            {
              n: '3',
              title: 'You don\'t actually have multiple modalities.',
              body: '"We might add audio someday" is not a use case. Build for the data you have. Three separate specialized models beats one overloaded model you don\'t fully use.',
            },
          ].map(item => (
            <div key={item.n} className="flex gap-4 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="text-lg font-bold text-white/15 shrink-0 w-6">{item.n}.</span>
              <div>
                <p className="text-sm font-semibold text-white/80 mb-1">{item.title}</p>
                <p className="text-xs text-white/55 leading-relaxed">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* If Horizon used Omni */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-white">If Horizon used Omni today</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              icon: '🎙',
              title: 'Voice query',
              body: 'Upload a 5-sec voice memo: ocean waves, no traffic. Omni matches hotel promo video audio profiles. No text needed.',
              note: 'Not possible today — no audio path exists',
            },
            {
              icon: '🚁',
              title: 'Drone clip',
              body: '10-second drone footage from your vacation reel. Omni samples frames AND audio bed jointly. CLIP v2 gets stills; Omni gets motion + sound + composition together.',
              note: 'CLIP v2 partial; omni completes it',
            },
            {
              icon: '📺',
              title: 'Video review',
              body: 'Paste a YouTube review link. Omni embeds spoken review (audio) + room footage (video) + on-screen text. Returns hotels never tagged with any of the reviewer\'s words.',
              note: 'Zero possible today without custom pipelines',
            },
          ].map((item, i) => (
            <div key={i} className="rounded-xl p-4 flex flex-col gap-2" style={{ background: ACCENT + '08', border: `1px solid ${ACCENT}25` }}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{item.icon}</span>
                <h4 className="text-sm font-semibold text-white">{item.title}</h4>
              </div>
              <p className="text-xs text-white/65 leading-relaxed">{item.body}</p>
              <p className="text-xs text-white/30 italic mt-auto">{item.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Coming to EIS */}
      <div className="rounded-2xl p-8 flex flex-col gap-4" style={{ background: 'rgba(16,185,129,0.05)', border: `1px solid ${ACCENT}25` }}>
        <h2 className="text-xl font-bold" style={{ color: ACCENT }}>Be the FE who ships omni first.</h2>
        <div className="flex flex-col gap-2 text-sm text-white/65 leading-relaxed">
          <p>Omni is live on the Jina API today and arriving on Elastic Inference Service soon. We&apos;re being honest: the EIS rollout is a few beats behind the model release. We&apos;d rather ship it right than ship it loud.</p>
          <p>When it lands, the <code className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.08)' }}>inference_id</code> looks exactly like the others. Your existing <code className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.08)' }}>semantic_text</code> mappings and ingest pipelines keep working — you&apos;ll just have a new option in the dropdown.</p>
          <p>Want first crack? Join <code className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.08)' }}>#jina-omni-eis</code> for the GA ping. Prototype on the Jina API now — the embedding shape is identical, so your Elasticsearch index design doesn&apos;t change.</p>
        </div>
        <div className="flex flex-col gap-2 text-xs text-white/40">
          <div className="flex items-center gap-2">
            <span style={{ color: ACCENT }}>✓</span>
            <span>API endpoint: <code className="font-mono">api.jina.ai/v1/embeddings</code> with <code className="font-mono">model: "jina-embeddings-v5-omni-small"</code></span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ color: ACCENT }}>✓</span>
            <span>Same request format as v5-text-small and CLIP v2 — input array accepts mixed modality objects</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ color: ACCENT }}>✓</span>
            <span>EIS inference_id will follow the <code className="font-mono">.jina-embeddings-v5-omni-small</code> pattern</span>
          </div>
        </div>
      </div>
    </div>
  );
}
