'use client';

import { Star, MapPin } from 'lucide-react';
import type { Hotel } from '@/lib/types';
import { resolveImageUrl } from '@/lib/images';

interface TravelHotelCardProps {
  hotel: Hotel;
  onClick: (hotel: Hotel) => void;
}

export default function TravelHotelCard({ hotel, onClick }: TravelHotelCardProps) {
  const primaryImage = resolveImageUrl(hotel.image_paths?.[0]);
  const firstDesc = hotel.descriptions?.[0] ?? '';

  return (
    <div
      onClick={() => onClick(hotel)}
      className="rounded-2xl overflow-hidden cursor-pointer transition-all"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      {/* Image */}
      <div className="relative" style={{ aspectRatio: '16/9', background: 'var(--bg-surface)' }}>
        {primaryImage ? (
          <img src={primaryImage} alt={hotel.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🏨</div>
        )}
        {/* Price badge */}
        {hotel.price_per_night_usd > 0 && (
          <div
            className="absolute bottom-3 right-3 px-2 py-1 rounded-lg text-sm font-bold"
            style={{ background: 'rgba(0,0,0,0.75)', color: '#fff', backdropFilter: 'blur(4px)' }}
          >
            ${hotel.price_per_night_usd}/night
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold leading-tight" style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>
            {hotel.name}
          </h3>
          {hotel.rating > 0 && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="w-3.5 h-3.5" style={{ color: 'var(--elastic-gold)' }} fill="currentColor" />
              <span className="text-sm font-semibold" style={{ color: 'var(--elastic-gold)' }}>
                {hotel.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 mb-2">
          <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
            {hotel.location_name}
          </span>
        </div>

        {firstDesc && (
          <p className="text-sm leading-snug mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
            {firstDesc}
          </p>
        )}

        {/* Style tags */}
        <div className="flex flex-wrap gap-1">
          {hotel.style?.slice(0, 3).map(s => (
            <span
              key={s}
              className="text-xs px-2 py-0.5 rounded-full capitalize"
              style={{ background: 'rgba(0,119,204,0.08)', color: 'var(--elastic-blue)', border: '1px solid rgba(0,119,204,0.2)' }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
