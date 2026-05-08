'use client';

import { motion } from 'framer-motion';
import type { InfoCardData } from '@/lib/industriesData';

interface UseCaseInfoCardProps {
  card: InfoCardData;
  index: number;
  onClick?: () => void;
}

export default function UseCaseInfoCard({ card, index, onClick }: UseCaseInfoCardProps) {
  const isClickable = !!onClick;

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      onClick={onClick}
      disabled={!isClickable}
      className={`rounded-xl p-4 flex flex-col gap-2.5 text-left w-full transition-all duration-200 ${
        isClickable
          ? 'hover:border-slate-300 hover:bg-slate-50 cursor-pointer'
          : 'cursor-default'
      }`}
      style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.1)' }}
      whileHover={isClickable ? { scale: 1.01 } : undefined}
      whileTap={isClickable ? { scale: 0.99 } : undefined}
    >
      <div className="flex items-center gap-2">
        <span className="text-base">{card.sectorIcon}</span>
        <div>
          <p className="text-xs text-slate-600">{card.sector}</p>
          <h4 className="text-sm font-semibold text-slate-900">{card.title}</h4>
        </div>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed italic">{card.hook}</p>

      <ul className="flex flex-col gap-1">
        {card.bullets.map((b, i) => (
          <li key={i} className="text-xs text-slate-700 flex gap-1.5 leading-relaxed">
            <span className="shrink-0 mt-0.5 text-slate-400">·</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-2 mt-1">
        <div className="flex gap-1.5 flex-wrap">
          {card.models.map(m => (
            <span key={m.label} className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: m.color + '18', color: m.color }}>
              {m.label}
            </span>
          ))}
        </div>
        {isClickable && (
          <span className="text-xs text-slate-400 shrink-0">Explore →</span>
        )}
      </div>
    </motion.button>
  );
}
