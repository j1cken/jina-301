'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { InteractiveCardData } from '@/lib/industriesData';
import FinanceEarningsDemo from './demos/FinanceEarningsDemo';
import ManufacturingPartsDemo from './demos/ManufacturingPartsDemo';
import OllyLogAnomalyDemo from './demos/OllyLogAnomalyDemo';
import OllyAlertStormDemo from './demos/OllyAlertStormDemo';
import SecurityAlertTriageDemo from './demos/SecurityAlertTriageDemo';
import SecurityTTPDemo from './demos/SecurityTTPDemo';

const DEMOS: Record<string, React.ComponentType> = {
  'finance-earnings': FinanceEarningsDemo,
  'manufacturing-parts': ManufacturingPartsDemo,
  'olly-log-anomaly': OllyLogAnomalyDemo,
  'olly-alert-storm': OllyAlertStormDemo,
  'security-alert-triage': SecurityAlertTriageDemo,
  'security-ttp': SecurityTTPDemo,
};

interface DemoModalProps {
  card: InteractiveCardData;
  sectorAccentColor: string;
  onClose: () => void;
}

export default function DemoModal({ card, sectorAccentColor, onClose }: DemoModalProps) {
  const DemoComponent = DEMOS[card.id];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

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
          className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg-base, #0f172a)', border: '1px solid rgba(255,255,255,0.12)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{card.sectorIcon}</span>
              <div>
                <p className="text-xs font-medium" style={{ color: sectorAccentColor }}>{card.sector}</p>
                <h2 className="text-base font-bold text-white">{card.title}</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5 flex-wrap justify-end">
                {card.models.map(m => (
                  <span key={m.label} className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: m.color + '20', color: m.color, border: `1px solid ${m.color}40` }}>
                    {m.label}
                  </span>
                ))}
              </div>
              <button onClick={onClose}
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all text-lg leading-none">
                ×
              </button>
            </div>
          </div>

          {/* Demo body */}
          <div className="flex-1 overflow-auto p-5" style={{ minHeight: 0 }}>
            {DemoComponent ? <DemoComponent /> : (
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
