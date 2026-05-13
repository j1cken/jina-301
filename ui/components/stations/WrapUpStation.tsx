'use client';

import { BASE_PATH } from '@/lib/api';

const MODELS = [
  {
    icon: '🌐',
    name: 'Jina Reader',
    api: 'r.jina.ai',
    purpose: 'Fetches any URL → clean markdown. Feeds Elasticsearch at index time — zero parsing code.',
    color: '#FEC514',
    badge: 'Direct API',
  },
  {
    icon: '🔍',
    name: 'Embeddings v5',
    api: '.jina-embeddings-v5-text-small',
    purpose: 'Default inference endpoint for semantic_text. Dense semantic vectors powering kNN search. Multilingual. 8 192-token context. 384 dims.',
    color: '#0077CC',
    badge: 'On EIS',
  },
  {
    icon: '⚡',
    name: 'Reranker v3',
    api: '.jina-reranker-v3',
    purpose: 'Reads query + full document together. Catches nuance vectors miss — promotions show it.',
    color: '#F04E98',
    badge: 'On EIS',
  },
  {
    icon: '📷',
    name: 'CLIP v2',
    api: '.jina-clip-v2',
    purpose: 'Text ↔ image in one vector space. Upload a photo, find hotels that look like it.',
    color: '#00BFB3',
    badge: 'On EIS',
  },
  {
    icon: '🌐',
    name: 'Omni v5',
    api: 'jina-embeddings-v5-omni',
    purpose: 'Text + image + audio + video — one index. Same kNN query, every modality.',
    color: '#10B981',
    badge: 'On EIS',
  },
];

const TAKEAWAYS = [
  {
    num: '01',
    headline: 'Jina on EIS — new defaults',
    body: 'Five specialized models, one Inference Service. Embeddings v5 is the default endpoint for semantic_text. Reranker v3 adds cross-attention precision. Neither requires custom ML work.',
    color: '#0077CC',
  },
  {
    num: '02',
    headline: 'Omni — one model, every modality',
    body: 'One kNN query covers text, images, audio, and video. Same index, same pipeline, same search syntax. No separate embedding pipeline per modality.',
    color: '#00BFB3',
  },
  {
    num: '03',
    headline: 'Agent-ready from day one',
    body: 'Every Jina model on EIS is a tool the Elastic Agent Builder can call. Semantic search becomes an agentic skill.',
    color: '#F04E98',
  },
];

export default function WrapUpStation() {
  return (
    <div className="space-y-10 pb-8">

      {/* Hero */}
      <div className="text-center space-y-3 pt-4">
        <div className="flex items-center justify-center gap-4 mb-4">
          <img
            src={`${BASE_PATH}/images/logo-elastic-horizontal-color.svg`}
            alt="Elastic"
            style={{ height: '32px', width: 'auto' }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="text-2xl font-light" style={{ color: 'var(--text-muted)' }}>+</span>
          <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Jina AI</span>
        </div>
        <h1 className="text-4xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          5 models. One index. Every industry.
        </h1>
        <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
          The same Jina + Elastic primitives you just saw in a hotel booking app power search, observability, and security at scale.
        </p>
      </div>

      {/* Model cards */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)', letterSpacing: '0.14em' }}>
          The Stack
        </p>
        <div className="grid gap-3 md:grid-cols-5">
          {MODELS.map(m => (
            <div key={m.name} className="rounded-xl p-4 flex flex-col gap-2"
              style={{ background: 'var(--bg-card)', border: `1.5px solid ${m.color}30` }}>
              <div className="flex items-start justify-between gap-1">
                <span className="text-2xl">{m.icon}</span>
                <span className="text-xs px-1.5 py-0.5 rounded font-semibold"
                  style={{ background: m.color + '18', color: m.color }}>
                  {m.badge}
                </span>
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{m.name}</p>
                <p className="text-xs font-mono mt-0.5" style={{ color: m.color }}>{m.api}</p>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{m.purpose}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Takeaways */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)', letterSpacing: '0.14em' }}>
          Three Things to Remember
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {TAKEAWAYS.map(t => (
            <div key={t.num} className="rounded-xl p-5 flex flex-col gap-3"
              style={{ background: 'var(--bg-card)', border: `1.5px solid ${t.color}30`, borderLeft: `4px solid ${t.color}` }}>
              <span className="text-3xl font-black" style={{ color: t.color + '50' }}>{t.num}</span>
              <h3 className="text-base font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{t.headline}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{t.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Resources */}
      <div className="rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        style={{ background: 'linear-gradient(135deg, rgba(0,119,204,0.08), rgba(16,185,129,0.06))', border: '1px solid rgba(0,119,204,0.2)' }}>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Learn More</p>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Jina AI models are live on Elastic Inference Service.</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Search for <code className="px-1 rounded text-xs" style={{ background: 'var(--bg-surface)' }}>jina</code> in the Elastic documentation or visit <strong>jina.ai</strong> for model benchmarks.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm flex-shrink-0">
          <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <span style={{ color: '#0077CC' }}>●</span>
            <span>elastic.co/docs — Inference API</span>
          </div>
          <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <span style={{ color: '#10B981' }}>●</span>
            <span>jina.ai — Embeddings v5 + Omni</span>
          </div>
          <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <span style={{ color: '#F04E98' }}>●</span>
            <span>This app: Horizon demo — coming to Eden soon</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-2">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
          Horizon · Jina AI 301 · SKO 2026 · Venetian Las Vegas
        </p>
      </div>
    </div>
  );
}
