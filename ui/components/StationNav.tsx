'use client';

import type { Station } from '@/lib/types';
import { STATION_META } from '@/lib/stationMeta';

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
      {STATION_META.map(s => {
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
              <span data-station-icon className="text-lg">{s.icon}</span>
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
