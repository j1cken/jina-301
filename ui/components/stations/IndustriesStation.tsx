'use client';

import { SECTORS } from '@/lib/industriesData';
import SectorSection from '@/components/industries/SectorSection';

export default function IndustriesStation() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Industries</h1>
        <p className="text-sm text-white/50">
          Vector search and embedding models solve real problems far beyond ecommerce.
          Explore how Jina AI models power search, observability, and security across industries.
        </p>
      </div>

      {SECTORS.map((sector, i) => (
        <SectorSection key={sector.id} sector={sector} delay={i * 0.1} />
      ))}
    </div>
  );
}
