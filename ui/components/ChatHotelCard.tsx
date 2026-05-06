'use client';

import type { ChatHotel } from '@/hooks/useAgentChat';
import { resolveImageUrl } from '@/lib/images';

interface ChatHotelCardProps {
  hotel: ChatHotel;
  onOpen: (hotel: ChatHotel) => void;
}

export default function ChatHotelCard({ hotel, onOpen }: ChatHotelCardProps) {
  const image = resolveImageUrl(hotel.image_paths?.[0]);
  const raw = hotel.descriptions?.[0] ?? hotel.description ?? '';
  const desc = raw ? raw.slice(0, 90) + (raw.length > 90 ? '…' : '') : '';

  return (
    <button
      onClick={() => onOpen(hotel)}
      className="w-full text-left flex gap-3 rounded-xl overflow-hidden transition-all hover:scale-[1.01]"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Image */}
      <div className="flex-shrink-0" style={{ width: 88, height: 72, background: 'var(--bg-card)' }}>
        {image ? (
          <img src={image} alt={hotel.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">🏨</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 py-2 pr-3 min-w-0">
        <p className="font-semibold text-sm leading-tight mb-0.5 truncate" style={{ color: 'var(--text-primary)' }}>
          {hotel.name}
        </p>
        <p className="text-xs leading-snug line-clamp-2" style={{ color: 'var(--text-muted)' }}>
          {desc}
        </p>
      </div>

      {/* Arrow hint */}
      <div className="flex items-center pr-3 flex-shrink-0" style={{ color: 'var(--elastic-blue)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}
