'use client';

import { useState } from 'react';

const FLOWS = [
  {
    station: 'INGEST',
    model: 'Reader',
    nodes: [
      { label: 'Hotel URL', sub: 'input', variant: 'neutral' },
      { label: 'Jina Reader API', sub: 'r.jina.ai', variant: 'jina' },
      { label: 'Markdown Content', sub: 'parsed', variant: 'neutral' },
      { label: 'Elasticsearch', sub: 'index write', variant: 'elastic' },
      { label: 'Indexed Document', sub: 'stored', variant: 'neutral' },
    ],
  },
  {
    station: 'FIND',
    model: 'Embeddings v5',
    nodes: [
      { label: 'Text Query', sub: 'input', variant: 'neutral' },
      { label: 'Jina Embeddings v5', sub: 'via EIS', variant: 'jina' },
      { label: 'Query Vector', sub: '384 dims', variant: 'neutral' },
      { label: 'Elasticsearch kNN', sub: 'semantic_text', variant: 'elastic' },
      { label: 'Hotel Results', sub: 'ranked by score', variant: 'neutral' },
    ],
  },
  {
    station: 'RANK',
    model: 'Reranker v3',
    nodes: [
      { label: 'Query + Candidates', sub: 'from Find', variant: 'neutral' },
      { label: 'Jina Reranker v3', sub: 'via EIS', variant: 'jina' },
      { label: 'Relevance Scores', sub: 'cross-attention', variant: 'neutral' },
      { label: 'Reranked Hotels', sub: 'final order', variant: 'neutral' },
    ],
  },
  {
    station: 'LOOK',
    model: 'CLIP v2',
    nodes: [
      { label: 'Image Upload', sub: 'input', variant: 'neutral' },
      { label: 'Jina CLIP v2', sub: 'via EIS', variant: 'jina' },
      { label: 'Image Vector', sub: '512 dims', variant: 'neutral' },
      { label: 'Elasticsearch kNN', sub: 'dense_vector', variant: 'elastic' },
      { label: 'Visual Matches', sub: 'similar hotels', variant: 'neutral' },
    ],
  },
  {
    station: 'DESCRIBE',
    model: 'VLM',
    nodes: [
      { label: 'Hotel Image', sub: 'input', variant: 'neutral' },
      { label: 'Jina VLM', sub: 'api-beta-vlm.jina.ai', variant: 'jina' },
      { label: 'JSON Analysis', sub: 'structured', variant: 'neutral' },
      { label: 'Style · Mood · Amenities', sub: 'rendered card', variant: 'neutral' },
    ],
  },
];

function FlowNode({ label, sub, variant }: { label: string; sub: string; variant: string }) {
  const isJina = variant === 'jina';
  const isElastic = variant === 'elastic';

  const border = isJina
    ? '1.5px solid var(--elastic-pink)'
    : isElastic
    ? '1.5px solid var(--elastic-teal)'
    : '1px solid var(--border)';

  const bg = isJina
    ? 'rgba(240,78,152,0.07)'
    : isElastic
    ? 'rgba(0,191,179,0.07)'
    : 'var(--bg-surface)';

  const labelColor = isJina
    ? 'var(--elastic-pink)'
    : isElastic
    ? 'var(--elastic-teal)'
    : 'var(--text-primary)';

  return (
    <div
      style={{
        border,
        background: bg,
        borderRadius: '4px',
        padding: '6px 10px',
        minWidth: '120px',
        maxWidth: '160px',
        flexShrink: 0,
      }}
    >
      <p
        style={{
          color: labelColor,
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: '11px',
          fontWeight: isJina || isElastic ? 500 : 400,
          lineHeight: 1.3,
          margin: 0,
        }}
      >
        {label}
      </p>
      <p
        style={{
          color: 'var(--text-muted)',
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: '9px',
          fontWeight: 400,
          lineHeight: 1.3,
          margin: '2px 0 0',
        }}
      >
        {sub}
      </p>
    </div>
  );
}

function Arrow() {
  return (
    <span
      style={{
        color: 'var(--text-muted)',
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: '14px',
        flexShrink: 0,
        alignSelf: 'center',
        padding: '0 4px',
        lineHeight: 1,
      }}
    >
      →
    </span>
  );
}

export default function ArchitectureDiagram() {
  const [fullscreen, setFullscreen] = useState(false);

  const diagram = (
    <div
      style={{
        border: fullscreen ? 'none' : '1px solid var(--border)',
        borderRadius: fullscreen ? '0' : '8px',
        background: 'var(--bg-card)',
        overflow: 'hidden',
        width: '100%',
        zoom: fullscreen ? 2.2 : 1,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <p
          style={{
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: '11px',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            margin: 0,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Data Flow — per station
        </p>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'IBM Plex Mono, monospace', fontSize: '9px', color: 'var(--text-muted)' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', border: '1.5px solid var(--elastic-pink)', borderRadius: '2px', background: 'rgba(240,78,152,0.07)' }} />
            Jina AI
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'IBM Plex Mono, monospace', fontSize: '9px', color: 'var(--text-muted)' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', border: '1.5px solid var(--elastic-teal)', borderRadius: '2px', background: 'rgba(0,191,179,0.07)' }} />
            Elasticsearch
          </span>
          <button
            onClick={() => setFullscreen(f => !f)}
            style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: '9px',
              color: 'var(--text-muted)',
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: '3px',
              padding: '2px 6px',
              cursor: 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            {fullscreen ? '⊠ exit' : '⊞ expand'}
          </button>
        </div>
      </div>

      {/* Flow rows */}
      {FLOWS.map((flow, i) => (
        <div
          key={flow.station}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0',
            padding: '10px 16px',
            borderBottom: i < FLOWS.length - 1 ? '1px solid var(--border)' : 'none',
          }}
        >
          {/* Station label */}
          <div style={{ width: '90px', flexShrink: 0, paddingRight: '12px' }}>
            <p style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: '10px',
              fontWeight: 500,
              color: 'var(--text-muted)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              margin: 0,
            }}>
              {flow.station}
            </p>
            <p style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: '9px',
              fontWeight: 400,
              color: 'var(--text-muted)',
              margin: '2px 0 0',
              opacity: 0.7,
            }}>
              {flow.model}
            </p>
          </div>

          {/* Node chain */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'nowrap', overflowX: 'auto' }}>
            {flow.nodes.map((node, ni) => (
              <span key={ni} style={{ display: 'contents' }}>
                <FlowNode {...node} />
                {ni < flow.nodes.length - 1 && <Arrow />}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  if (fullscreen) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'var(--bg-card)',
        overflow: 'auto',
      }}>
        {diagram}
      </div>
    );
  }

  return diagram;
}
