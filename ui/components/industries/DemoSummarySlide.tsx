'use client';

import { motion } from 'framer-motion';
import type { SummaryData, InteractiveCardData, InfoCardData } from '@/lib/industriesData';

interface DemoSummarySlideProps {
  data: SummaryData;
  card: InteractiveCardData | InfoCardData;
  accentColor: string;
}

export default function DemoSummarySlide({ data, card, accentColor }: DemoSummarySlideProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-4 h-full"
    >
      {/* Title + model badges */}
      <div className="flex items-start justify-between gap-3 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">{card.sectorIcon}</span>
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{card.title}</h3>
        </div>
        <div className="flex gap-1.5 flex-wrap justify-end">
          {card.models.map(m => (
            <span key={m.label} className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: m.color + '20', color: m.color, border: `1px solid ${m.color}40` }}>
              {m.label}
            </span>
          ))}
        </div>
      </div>

      {/* Business problem */}
      <div className="rounded-xl p-4" style={{ background: accentColor + '0d', border: `1px solid ${accentColor}30` }}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: accentColor }}>Business Problem</p>
        <p className="text-base font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>{data.businessProblem}</p>
      </div>

      {/* Technical solution */}
      <div className="rounded-xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>How It Works</p>
        <div className="flex flex-col gap-1.5">
          {data.technicalSolution.split('. ').filter(Boolean).map((sentence, i, arr) => (
            <p key={i} className="text-sm leading-relaxed flex gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <span className="shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>·</span>
              <span>{sentence}{i < arr.length - 1 ? '.' : ''}</span>
            </p>
          ))}
        </div>
      </div>

      {/* Position when / Don't position when */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: 'rgba(16,185,129,0.08)', borderTop: '1px solid rgba(16,185,129,0.2)', borderRight: '1px solid rgba(16,185,129,0.2)', borderBottom: '1px solid rgba(16,185,129,0.2)', borderLeft: '3px solid rgba(16,185,129,0.55)' }}>
          <p className="text-sm font-semibold" style={{ color: '#10B981' }}>✓ Position when</p>
          <ul className="flex flex-col gap-2">
            {data.positionWhen.map((item, i) => (
              <li key={i} className="text-sm flex gap-1.5 leading-snug" style={{ color: 'var(--text-primary)' }}>
                <span className="shrink-0 mt-0.5" style={{ color: '#10B981' }}>·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: 'rgba(239,68,68,0.06)', borderTop: '1px solid rgba(239,68,68,0.18)', borderRight: '1px solid rgba(239,68,68,0.18)', borderBottom: '1px solid rgba(239,68,68,0.18)', borderLeft: '3px solid rgba(239,68,68,0.55)' }}>
          <p className="text-sm font-semibold text-red-500">✗ Don&apos;t position when</p>
          <ul className="flex flex-col gap-2">
            {data.dontPositionWhen.map((item, i) => (
              <li key={i} className="text-sm flex gap-1.5 leading-snug" style={{ color: 'var(--text-primary)' }}>
                <span className="shrink-0 mt-0.5 text-red-400">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
