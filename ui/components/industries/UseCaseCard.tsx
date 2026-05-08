'use client';

import { motion } from 'framer-motion';
import type { InteractiveCardData } from '@/lib/industriesData';

interface UseCaseCardProps {
  card: InteractiveCardData;
  index: number;
  accentColor: string;
  onClick: () => void;
}

export default function UseCaseCard({ card, index, accentColor, onClick }: UseCaseCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
      onClick={onClick}
      className="group w-full text-left rounded-xl p-5 flex flex-col gap-3 transition-all duration-200 hover:scale-[1.01]"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid rgba(255,255,255,0.1)`,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = accentColor + '60'; (e.currentTarget as HTMLElement).style.background = accentColor + '08'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{card.sectorIcon}</span>
          <div>
            <p className="text-xs font-medium" style={{ color: accentColor }}>{card.sector}</p>
            <h3 className="text-sm font-bold text-white">{card.title}</h3>
          </div>
        </div>
        <span className="shrink-0 text-xs px-2 py-0.5 rounded-full text-white/50 border border-white/10 group-hover:text-white/80 group-hover:border-white/20 transition-all">
          Interactive
        </span>
      </div>

      {/* Hook */}
      <p className="text-xs leading-relaxed text-white/60 group-hover:text-white/80 transition-colors">{card.hook}</p>

      {/* Models + CTA */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {card.models.map(m => (
            <span key={m.label} className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: m.color + '18', color: m.color }}>
              {m.label}
            </span>
          ))}
        </div>
        <span className="text-xs font-medium transition-all group-hover:translate-x-1 duration-200" style={{ color: accentColor }}>
          Explore →
        </span>
      </div>
    </motion.button>
  );
}
