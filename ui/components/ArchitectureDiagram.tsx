'use client';

import { useState } from 'react';
import { STATION_META } from '@/lib/stationMeta';
import type { FlowNode } from '@/lib/stationMeta';

// Stations shown in the architecture diagram (excludes capstone + agent which have no flow)
const DIAGRAM_STATIONS = STATION_META.filter(s => s.flow.length > 0 && s.id !== 'capstone' && s.id !== 'agent');

export function FlowNodeComponent({ label, sub, variant }: FlowNode) {
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
      {DIAGRAM_STATIONS.map((station, i) => (
        <div
          key={station.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0',
            padding: '10px 16px',
            borderBottom: i < DIAGRAM_STATIONS.length - 1 ? '1px solid var(--border)' : 'none',
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
              {station.label.toUpperCase()}
            </p>
            <p style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: '9px',
              fontWeight: 400,
              color: 'var(--text-muted)',
              margin: '2px 0 0',
              opacity: 0.7,
            }}>
              {station.model}
            </p>
          </div>

          {/* Node chain */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'nowrap', overflowX: 'auto' }}>
            {station.flow.map((node, ni) => (
              <span key={ni} style={{ display: 'contents' }}>
                <FlowNodeComponent {...node} />
                {ni < station.flow.length - 1 && <Arrow />}
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
