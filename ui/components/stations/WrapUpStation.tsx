'use client';

import { BASE_PATH } from '@/lib/api';

const MODELS = [
  {
    icon: '🌐',
    name: 'Jina Reader',
    api: 'r.jina.ai',
    bullets: ['URL → clean markdown', 'Zero parse code'],
    color: '#FEC514',
    badge: 'Direct API',
  },
  {
    icon: '🔍',
    name: 'Embeddings v5',
    api: '.jina-embeddings-v5-text-small',
    bullets: ['Default semantic_text endpoint', 'kNN · multilingual · 384 dims'],
    color: '#0077CC',
    badge: 'On EIS',
  },
  {
    icon: '⚡',
    name: 'Reranker v3',
    api: '.jina-reranker-v3',
    bullets: ['Cross-attention precision', 'Catches what vectors miss'],
    color: '#F04E98',
    badge: 'On EIS',
  },
  {
    icon: '📷',
    name: 'CLIP v2',
    api: '.jina-clip-v2',
    bullets: ['Text + image, one space', 'Search by photo'],
    color: '#00BFB3',
    badge: 'On EIS',
  },
  {
    icon: '🌐',
    name: 'Omni v5',
    api: 'jina-embeddings-v5-omni',
    bullets: ['All 4 modalities, one index', 'No re-indexing needed', 'Beats CLIP v2 on images'],
    color: '#10B981',
    badge: 'On EIS',
  },
];

const TAKEAWAYS = [
  {
    num: '01',
    headline: 'Jina on EIS — new defaults',
    bullets: ['5 models · one Inference Service', 'v5 = default semantic_text', 'v3 = cross-attention precision'],
    color: '#0077CC',
  },
  {
    num: '02',
    headline: 'Omni — one index, every modality',
    bullets: ['Text vectors = v5-text-small (zero re-index)', 'Audio + image + video → same EIS endpoint', 'Outperforms CLIP v2 on images'],
    color: '#00BFB3',
  },
  {
    num: '03',
    headline: 'Agent-ready from day one',
    bullets: ['Every model is an Agent tool', 'Search becomes an agentic skill'],
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
        <p className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)', letterSpacing: '0.14em' }}>
          The Stack
        </p>
        <div className="grid gap-3 md:grid-cols-5">
          {MODELS.map(m => (
            <div key={m.name} className="rounded-xl p-4 flex flex-col gap-2"
              style={{ background: 'var(--bg-card)', border: `1.5px solid ${m.color}30` }}>
              <div className="flex items-start justify-between gap-1">
                <span className="text-2xl">{m.icon}</span>
                <span className="text-sm px-1.5 py-0.5 rounded font-semibold"
                  style={{ background: m.color + '18', color: m.color }}>
                  {m.badge}
                </span>
              </div>
              <div>
                <p className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>{m.name}</p>
                <p className="text-sm font-mono mt-0.5" style={{ color: m.color }}>{m.api}</p>
              </div>
              <ul className="flex flex-col gap-1">
                {m.bullets.map((b, i) => (
                  <li key={i} className="text-base leading-snug flex gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <span style={{ color: m.color }}>·</span>{b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Takeaways */}
      <div>
        <p className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)', letterSpacing: '0.14em' }}>
          Three Things to Remember
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {TAKEAWAYS.map(t => (
            <div key={t.num} className="rounded-xl p-5 flex flex-col gap-3"
              style={{ background: 'var(--bg-card)', border: `1.5px solid ${t.color}30`, borderLeft: `4px solid ${t.color}` }}>
              <span className="text-4xl font-black" style={{ color: t.color + '50' }}>{t.num}</span>
              <h3 className="text-2xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{t.headline}</h3>
              <ul className="flex flex-col gap-2">
                {t.bullets.map((b, i) => (
                  <li key={i} className="text-lg leading-snug flex gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <span style={{ color: t.color }}>·</span>{b}
                  </li>
                ))}
              </ul>
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
        <div className="flex flex-col gap-2 text-base flex-shrink-0">
          <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <span style={{ color: '#0077CC' }}>●</span>
            <span>elastic.co/docs — Inference API</span>
          </div>
          <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <span style={{ color: '#10B981' }}>●</span>
            <span>jina.ai — Embeddings v5 + Omni</span>
          </div>
          <a
            href="https://www.elastic.co/search-labs/blog/jina-embeddings-v5-omni-all-media-one-index"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            style={{ color: 'var(--text-secondary)' }}>
            <span style={{ color: '#10B981' }}>●</span>
            <span>Search Labs blog — jina-embeddings-v5-omni deep dive</span>
          </a>
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
