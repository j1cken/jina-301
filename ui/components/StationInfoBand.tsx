'use client';

import { getStationMeta } from '@/lib/stationMeta';
import type { Station } from '@/lib/types';

interface StationInfoBandProps {
  station: Station;
  onOpenDrawer: () => void;
}

function deriveChips(station: Station, meta: ReturnType<typeof getStationMeta>): string[] {
  if (station === 'capstone') return ['5 MODELS', 'JINA × ELASTIC'];
  if (station === 'agent') return ['AGENT BUILDER'];

  const chips: string[] = [];
  if (meta.inferenceId) chips.push('EIS');
  else if (meta.endpoint) chips.push('DIRECT');
  if (station === 'ingest') chips.push('MARKDOWN');
  if (meta.dims) chips.push(`${meta.dims}D`);
  if (meta.retriever) {
    chips.push(meta.retriever.includes('text_similarity') ? 'rerank' : 'kNN');
  }
  return chips;
}

const SEP = (
  <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '13px', padding: '0 8px', userSelect: 'none' }}>|</span>
);

const DOT = (
  <span style={{ color: '#4A5468', fontSize: '12px', padding: '0 6px', userSelect: 'none' }}>·</span>
);

export default function StationInfoBand({ station, onOpenDrawer }: StationInfoBandProps) {
  const meta = getStationMeta(station);
  const chips = deriveChips(station, meta);
  const isSpecial = station === 'capstone' || station === 'agent';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      background: '#0A1020',
      borderTop: '1px solid rgba(0,191,179,0.25)',
      borderBottom: '1px solid rgba(0,191,179,0.25)',
      minHeight: '56px',
      overflow: 'hidden',
    }}>
      {/* Left teal accent bar */}
      <div style={{ width: '4px', alignSelf: 'stretch', background: '#00BFB3', flexShrink: 0 }} />

      {/* Content */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        flex: 1,
        padding: '0 20px',
        gap: '0',
        minWidth: 0,
        overflow: 'hidden',
      }}>
        {/* ARCHITECTURE label */}
        <span style={{
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: '11px',
          fontWeight: 600,
          color: '#1BA9F5',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}>
          ARCHITECTURE
        </span>

        {SEP}

        {/* Status fields */}
        {isSpecial ? (
          <span style={{
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: '13px',
            color: '#FFFFFF',
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}>
            {station === 'capstone' ? '5 JINA MODELS · ELASTICSEARCH' : 'KIBANA AGENT BUILDER · ELASTICSEARCH'}
          </span>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0', minWidth: 0, overflow: 'hidden' }}>
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px', color: '#6B7280', flexShrink: 0 }}>MODEL:</span>
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px', color: '#00BFB3', fontWeight: 500, marginLeft: '5px', whiteSpace: 'nowrap', flexShrink: 0 }}>{meta.modelFull}</span>

            {meta.esIndex && (
              <>
                {DOT}
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px', color: '#6B7280', flexShrink: 0 }}>INDEX:</span>
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px', color: '#00BFB3', fontWeight: 500, marginLeft: '5px', whiteSpace: 'nowrap', flexShrink: 0 }}>{meta.esIndex}</span>
              </>
            )}

            {meta.esField && (
              <>
                {DOT}
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px', color: '#6B7280', flexShrink: 0 }}>FIELD:</span>
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px', color: '#00BFB3', fontWeight: 500, marginLeft: '5px', whiteSpace: 'nowrap', flexShrink: 0 }}>{meta.esField}</span>
              </>
            )}
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Stat chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginRight: '12px' }}>
          {chips.map(chip => (
            <span key={chip} style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: '10px',
              fontWeight: 500,
              color: '#00BFB3',
              border: '1px solid #00BFB399',
              borderRadius: '3px',
              padding: '2px 7px',
              whiteSpace: 'nowrap',
              letterSpacing: '0.04em',
            }}>
              {chip}
            </span>
          ))}
        </div>

        {/* How It Works button — filled primary */}
        <button
          onClick={onOpenDrawer}
          style={{
            flexShrink: 0,
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: '12px',
            fontWeight: 600,
            color: '#0F1729',
            background: '#1BA9F5',
            border: 'none',
            borderRadius: '4px',
            height: '34px',
            padding: '0 16px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          How It Works →
        </button>
      </div>
    </div>
  );
}
