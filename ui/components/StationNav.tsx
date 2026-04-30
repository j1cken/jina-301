'use client';

import type { Station } from '@/lib/types';

interface StationConfig {
  id: Station;
  label: string;
  model: string;
  icon: string;
  color: string;
}

const STATIONS: StationConfig[] = [
  { id: 'ingest', label: 'Ingest', model: 'Reader', icon: '🌐', color: '#FEC514' },
  { id: 'find', label: 'Find', model: 'Embeddings v5', icon: '🔍', color: '#0077CC' },
  { id: 'rank', label: 'Rank', model: 'Reranker v3', icon: '⚡', color: '#F04E98' },
  { id: 'look', label: 'Look', model: 'CLIP v2', icon: '📷', color: '#00BFB3' },
  { id: 'describe', label: 'Describe', model: 'VLM', icon: '👁', color: '#A855F7' },
  { id: 'capstone', label: 'Data Flow', model: '5 Models', icon: '🔀', color: '#0077CC' },
  { id: 'agent', label: 'Agent', model: 'Agent Builder', icon: '✨', color: '#00BFB3' },
];

interface StationNavProps {
  active: Station;
  onSelect: (s: Station) => void;
}

export default function StationNav({ active, onSelect }: StationNavProps) {
  return (
    <nav
      className="flex border-b overflow-x-auto"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}
    >
      {STATIONS.map(s => {
        const isActive = s.id === active;
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className="station-tab flex-shrink-0 flex flex-col items-center px-5 py-3 gap-1 relative"
            style={{
              borderBottom: isActive ? `2.5px solid ${s.color}` : '2.5px solid transparent',
              background: isActive ? `${s.color}14` : 'transparent',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{s.icon}</span>
              <span
                className="font-semibold text-base"
                style={{ color: isActive ? s.color : 'var(--text-secondary)' }}
              >
                {s.label}
              </span>
            </div>
            <span
              className="text-xs"
              style={{ color: isActive ? `${s.color}bb` : 'var(--text-muted)' }}
            >
              {s.model}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
