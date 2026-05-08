'use client';

import { motion } from 'framer-motion';
import type { InfoCardData } from '@/lib/industriesData';

interface UseCaseInfoCardProps {
  card: InfoCardData;
  index: number;
}

export default function UseCaseInfoCard({ card, index }: UseCaseInfoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="rounded-xl p-4 flex flex-col gap-2.5"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-base">{card.sectorIcon}</span>
        <div>
          <p className="text-xs text-white/40">{card.sector}</p>
          <h4 className="text-sm font-semibold text-white/80">{card.title}</h4>
        </div>
      </div>

      <p className="text-xs text-white/50 leading-relaxed italic">{card.hook}</p>

      <ul className="flex flex-col gap-1">
        {card.bullets.map((b, i) => (
          <li key={i} className="text-xs text-white/45 flex gap-1.5 leading-relaxed">
            <span className="shrink-0 mt-0.5 text-white/25">·</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <div className="flex gap-1.5 flex-wrap mt-1">
        {card.models.map(m => (
          <span key={m.label} className="text-xs px-1.5 py-0.5 rounded"
            style={{ background: m.color + '12', color: m.color + 'cc' }}>
            {m.label}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
