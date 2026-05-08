'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { SectorData, InteractiveCardData } from '@/lib/industriesData';
import UseCaseCard from './UseCaseCard';
import UseCaseInfoCard from './UseCaseInfoCard';
import DemoModal from './DemoModal';

interface SectorSectionProps {
  sector: SectorData;
  delay?: number;
}

export default function SectorSection({ sector, delay = 0 }: SectorSectionProps) {
  const [activeCard, setActiveCard] = useState<InteractiveCardData | null>(null);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        className="flex flex-col gap-4"
      >
        {/* Section header */}
        <div className="flex items-center gap-3 pb-3" style={{ borderBottom: `1px solid ${sector.accentColor}30` }}>
          <span className="text-2xl">{sector.icon}</span>
          <div>
            <h2 className="text-lg font-bold text-white">{sector.label}</h2>
            <p className="text-xs text-white/50">{sector.description}</p>
          </div>
        </div>

        {/* Interactive cards — 2-col */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sector.interactiveCards.map((card, i) => (
            <UseCaseCard
              key={card.id}
              card={card}
              index={i}
              accentColor={sector.accentColor}
              onClick={() => setActiveCard(card)}
            />
          ))}
        </div>

        {/* Info cards — 3-col */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {sector.infoCards.map((card, i) => (
            <UseCaseInfoCard key={`${sector.id}-info-${i}`} card={card} index={i} />
          ))}
        </div>
      </motion.div>

      {/* Demo modal */}
      {activeCard && (
        <DemoModal
          card={activeCard}
          sectorAccentColor={sector.accentColor}
          onClose={() => setActiveCard(null)}
        />
      )}
    </>
  );
}
