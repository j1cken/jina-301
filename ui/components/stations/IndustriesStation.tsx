'use client';

import { SECTORS } from '@/lib/industriesData';
import SectorSection from '@/components/industries/SectorSection';

export default function IndustriesStation() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Industries</h1>
        <p className="text-sm text-white/50">
          Customers don&apos;t buy embeddings. They buy faster incident triage, fewer
          false-positive alerts, and analysts who can actually find the right document.
          These 15 use cases show how Jina models on Elastic deliver those outcomes —
          across Search, Observability, and Security.
        </p>
      </div>

      {SECTORS.map((sector, i) => (
        <SectorSection key={sector.id} sector={sector} delay={i * 0.1} />
      ))}
    </div>
  );
}
