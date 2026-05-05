'use client';

import { useEffect } from 'react';
import { getStationMeta, STATION_META } from '@/lib/stationMeta';
import type { Station } from '@/lib/types';

interface StationDetailDrawerProps {
  station: Station;
  isOpen: boolean;
  onClose: () => void;
}

function DownArrow() {
  return (
    <div style={{ textAlign: 'center', fontSize: '18px', color: 'var(--text-muted)', padding: '4px 0', lineHeight: 1 }}>
      ↓
    </div>
  );
}

function VerticalFlowNode({ label, sub, variant }: { label: string; sub: string; variant: string }) {
  const isJina = variant === 'jina';
  const isElastic = variant === 'elastic';

  const border = isJina
    ? '1px solid var(--elastic-pink)'
    : isElastic
    ? '1px solid var(--elastic-teal)'
    : '1px solid var(--border)';

  const bg = isJina
    ? 'rgba(240,78,152,0.08)'
    : isElastic
    ? 'rgba(0,191,179,0.08)'
    : 'rgba(255,255,255,0.04)';

  const labelColor = isJina
    ? 'var(--elastic-pink)'
    : isElastic
    ? 'var(--elastic-teal)'
    : '#FFFFFF';

  return (
    <div style={{ border, background: bg, borderRadius: '10px', padding: '16px 20px', width: '100%' }}>
      <p style={{
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: '17px',
        fontWeight: isJina || isElastic ? 500 : 400,
        color: labelColor,
        margin: 0,
        lineHeight: 1.3,
      }}>
        {label}
      </p>
      <p style={{
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: '14px',
        color: '#9AA3B2',
        margin: '6px 0 0',
        lineHeight: 1.4,
      }}>
        {sub}
      </p>
    </div>
  );
}

function FlowRow({ flow, stationLabel, stationColor }: { flow: typeof STATION_META[0]['flow'], stationLabel: string, stationColor: string }) {
  return (
    <div>
      <p style={{
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: '11px',
        fontWeight: 600,
        color: stationColor,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        margin: '0 0 12px',
      }}>
        {stationLabel}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {flow.map((node, i) => (
          <div key={i}>
            <VerticalFlowNode {...node} />
            {i < flow.length - 1 && <DownArrow />}
          </div>
        ))}
      </div>
    </div>
  );
}

const SECTION_HEADER: React.CSSProperties = {
  fontFamily: 'IBM Plex Mono, monospace',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--text-muted)',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  margin: '0 0 16px',
};

export default function StationDetailDrawer({ station, isOpen, onClose }: StationDetailDrawerProps) {
  const meta = getStationMeta(station);
  const isCapstone = station === 'capstone';
  const hasFlow = meta.flow.length > 0;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Scrim */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10,16,32,0.65)',
            zIndex: 49,
          }}
        />
      )}

      {/* Drawer panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(75vw, 1100px)',
          minWidth: '580px',
          zIndex: 50,
          background: '#0F1729',
          borderLeft: `2px solid ${meta.color}`,
          boxShadow: '-16px 0 48px rgba(0,0,0,0.6)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s ease',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 32px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: `${meta.color}0d`,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '24px' }}>{meta.icon}</span>
            <div>
              <p style={{
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: '20px',
                fontWeight: 600,
                color: '#FFFFFF',
                margin: 0,
                letterSpacing: '0.03em',
              }}>
                {meta.label} — How It Works
              </p>
              <p style={{
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: '14px',
                color: '#9AA3B2',
                margin: '4px 0 0',
              }}>
                {meta.modelFull}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: '22px',
              color: '#6B7280',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 36px 40px' }}>

          {/* Lede */}
          {meta.lede && (
            <p style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: '18px',
              fontWeight: 400,
              color: '#C7CCD6',
              lineHeight: 1.6,
              margin: '0 0 32px',
            }}>
              {meta.lede}
            </p>
          )}

          {/* Model Details */}
          {(meta.inferenceId || meta.endpoint || meta.dims || meta.retriever) && (
            <div style={{
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '20px 24px',
              background: 'rgba(255,255,255,0.03)',
              marginBottom: '32px',
            }}>
              <p style={SECTION_HEADER}>Model Details</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(meta.inferenceId || meta.endpoint) && (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                    <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px', color: '#6B7280', width: '100px', flexShrink: 0 }}>
                      {meta.inferenceId ? 'inference id' : 'endpoint'}
                    </span>
                    <code style={{
                      fontFamily: 'IBM Plex Mono, monospace',
                      fontSize: '16px',
                      color: meta.inferenceId ? '#00BFB3' : '#F04E98',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '4px',
                      padding: '3px 10px',
                    }}>
                      {meta.inferenceId ?? meta.endpoint}
                    </code>
                  </div>
                )}
                {meta.dims && (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                    <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px', color: '#6B7280', width: '100px', flexShrink: 0 }}>dims</span>
                    <code style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '16px', color: '#FFFFFF', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '3px 10px' }}>
                      {meta.dims}
                    </code>
                  </div>
                )}
                {meta.retriever && (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                    <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px', color: '#6B7280', width: '100px', flexShrink: 0 }}>retriever</span>
                    <code style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '16px', color: '#00BFB3', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '3px 10px' }}>
                      {meta.retriever}
                    </code>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Data Flow */}
          {(hasFlow || isCapstone) && (
            <div style={{ marginBottom: '32px' }}>
              <p style={SECTION_HEADER}>Data Flow</p>
              {isCapstone ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {STATION_META.filter(s => s.flow.length > 0).map(s => (
                    <div key={s.id} style={{ borderLeft: `3px solid ${s.color}`, paddingLeft: '16px' }}>
                      <FlowRow flow={s.flow} stationLabel={s.label} stationColor={s.color} />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ borderLeft: `3px solid ${meta.color}`, paddingLeft: '16px' }}>
                  <FlowRow flow={meta.flow} stationLabel={meta.label} stationColor={meta.color} />
                </div>
              )}
            </div>
          )}

          {/* Implementation Notes */}
          <div>
            <p style={SECTION_HEADER}>Implementation Notes</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {meta.wiringNotes.map((note, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{
                    fontFamily: 'IBM Plex Mono, monospace',
                    fontSize: '16px',
                    color: '#1BA9F5',
                    flexShrink: 0,
                    lineHeight: 1.5,
                    userSelect: 'none',
                  }}>▸</span>
                  <span style={{
                    fontFamily: 'IBM Plex Mono, monospace',
                    fontSize: '15px',
                    color: '#C7CCD6',
                    lineHeight: 1.6,
                  }}>
                    {note}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
