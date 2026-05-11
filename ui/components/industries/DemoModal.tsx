'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { InteractiveCardData, InfoCardData } from '@/lib/industriesData';
import FinanceEarningsDemo from './demos/FinanceEarningsDemo';
import ManufacturingPartsDemo from './demos/ManufacturingPartsDemo';
import SecurityTTPDemo from './demos/SecurityTTPDemo';
import OllyRCALogSearchDemo from './demos/OllyRCALogSearchDemo';
import OllyMetricAnomalyDemo from './demos/OllyMetricAnomalyDemo';
import SecurityCVEServiceDemo from './demos/SecurityCVEServiceDemo';
import CompactDemo from './demos/CompactDemo';

export interface DemoComponentProps {
  card: InteractiveCardData | InfoCardData;
  autoPlay: boolean;
  advanceTick: number;
  restartTick: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DEMOS: Record<string, React.ComponentType<any>> = {
  'finance-earnings': FinanceEarningsDemo,
  'manufacturing-parts': ManufacturingPartsDemo,
  'security-ttp': SecurityTTPDemo,
  'olly-rca-log-search': OllyRCALogSearchDemo,
  'olly-metric-anomaly': OllyMetricAnomalyDemo,
  'security-cve-service': SecurityCVEServiceDemo,
  // Info card compact demos — all 9 use the data-driven CompactDemo
  'search-legal': CompactDemo,
  'search-video': CompactDemo,
  'search-healthcare': CompactDemo,
  'olly-trace-sim': CompactDemo,
  'olly-deploy-diff': CompactDemo,
  'olly-runbook': CompactDemo,
  'security-malware': CompactDemo,
  'security-phishing': CompactDemo,
  'security-threat-intel': CompactDemo,
};

interface DemoModalProps {
  card: InteractiveCardData | InfoCardData;
  sectorAccentColor: string;
  onClose: () => void;
  variant?: 'default' | 'compact';
}

export default function DemoModal({ card, sectorAccentColor, onClose, variant = 'default' }: DemoModalProps) {
  const DemoComponent = DEMOS[card.id];
  const [autoPlay, setAutoPlay] = useState(false);
  const [advanceTick, setAdvanceTick] = useState(0);
  const [restartTick, setRestartTick] = useState(0);

  // Escape closes; ArrowRight/Space manually advances (when not in auto mode)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (!autoPlay && (e.key === 'ArrowRight' || e.key === ' ')) {
        e.preventDefault();
        setAdvanceTick(t => t + 1);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, autoPlay]);

  const handleAutoToggle = () => {
    const next = !autoPlay;
    setAutoPlay(next);
    if (next) {
      // Toggling auto back ON — signal demos to restart their step timer
      setRestartTick(t => t + 1);
    }
  };

  const maxW = variant === 'compact' ? 'max-w-xl' : 'max-w-3xl';
  const bodyPad = variant === 'compact' ? 'p-4' : 'p-5';
  const headerPad = variant === 'compact' ? 'px-4 py-3' : 'px-5 py-4';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.25 }}
          className={`w-full ${maxW} max-h-[90vh] flex flex-col rounded-2xl overflow-hidden`}
          style={{ background: 'var(--bg-base, #0f172a)', border: '1px solid var(--border, rgba(255,255,255,0.12))' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex flex-wrap items-start justify-between gap-2 ${headerPad}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl flex-shrink-0">{card.sectorIcon}</span>
              <div className="min-w-0">
                <p className="text-xs font-medium" style={{ color: sectorAccentColor }}>{card.sector}</p>
                <h2 className="text-base font-bold text-white">{card.title}</h2>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap justify-end flex-shrink-0">
              <div className="flex gap-1 flex-wrap justify-end">
                {card.models.map(m => (
                  <span key={m.label} className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: m.color + '20', color: m.color, border: `1px solid ${m.color}40` }}>
                    {m.label}
                  </span>
                ))}
              </div>
              {/* Segmented Manual|Auto pill */}
              <div role="group" aria-label="Playback mode" className="flex rounded-lg overflow-hidden shrink-0" style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
                <button
                  onClick={() => { if (autoPlay) handleAutoToggle(); }}
                  aria-pressed={!autoPlay}
                  className="text-xs px-2.5 py-1 font-medium transition-all"
                  style={{
                    background: !autoPlay ? sectorAccentColor + '20' : 'transparent',
                    color: !autoPlay ? sectorAccentColor : 'rgba(255,255,255,0.4)',
                    cursor: !autoPlay ? 'default' : 'pointer',
                  }}
                >
                  Manual
                </button>
                <button
                  onClick={() => { if (!autoPlay) handleAutoToggle(); }}
                  aria-pressed={autoPlay}
                  className="text-xs px-2.5 py-1 font-medium transition-all"
                  style={{
                    background: autoPlay ? sectorAccentColor + '20' : 'transparent',
                    color: autoPlay ? sectorAccentColor : 'rgba(255,255,255,0.4)',
                    borderLeft: '1px solid rgba(255,255,255,0.15)',
                    cursor: autoPlay ? 'default' : 'pointer',
                  }}
                >
                  Auto
                </button>
              </div>
              {/* Next step — only in manual mode */}
              {!autoPlay && (
                <button
                  onClick={() => setAdvanceTick(t => t + 1)}
                  className="shrink-0 text-xs px-2.5 py-1 rounded-lg font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/15"
                  title="Next step (→ or Space)"
                >
                  Next →
                </button>
              )}
              <button onClick={onClose}
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all text-lg leading-none">
                ×
              </button>
            </div>
          </div>

          {/* Demo body */}
          <div className={`flex-1 overflow-auto ${bodyPad}`} style={{ minHeight: 0 }}>
            {DemoComponent ? (
              <DemoComponent
                card={card}
                autoPlay={autoPlay}
                advanceTick={advanceTick}
                restartTick={restartTick}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white/40 text-sm">
                Demo not found: {card.id}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
