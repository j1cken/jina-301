'use client';

import { motion } from 'framer-motion';
import { Star, MapPin, DollarSign } from 'lucide-react';
import type { Hotel } from '@/lib/types';
import { resolveImageUrl } from '@/lib/images';
import ScoreMeter from './shared/ScoreMeter';

interface HotelCardProps {
  hotel: Hotel;
  index?: number;
  onClick?: (hotel: Hotel) => void;
  selected?: boolean;
  showScore?: boolean;
  rankBadge?: React.ReactNode;
}

export default function HotelCard({ hotel, index = 0, onClick, selected, showScore, rankBadge }: HotelCardProps) {
  const primaryImage = resolveImageUrl(hotel.image_paths?.[0]);
  const firstDesc = hotel.descriptions?.[0] ?? '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      onClick={() => onClick?.(hotel)}
      className={`flex gap-4 rounded-xl overflow-hidden transition-all${onClick ? ' cursor-pointer hover:shadow-md' : ''}`}
      style={{
        background: selected ? 'var(--bg-card-hover)' : 'var(--bg-card)',
        border: `1.5px solid ${selected ? 'var(--elastic-blue)' : 'var(--border)'}`,
        boxShadow: selected ? '0 0 0 1px var(--elastic-blue)' : 'none',
      }}
      whileHover={onClick ? { scale: 1.005 } : undefined}
    >
      {/* Image — 40% width */}
      <div className="w-40 flex-shrink-0 relative" style={{ background: 'var(--bg-surface)' }}>
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={hotel.name}
            className="w-full h-full object-cover"
            style={{ minHeight: '120px' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl" style={{ minHeight: '120px', background: 'var(--bg-surface)' }}>
            🏨
          </div>
        )}
        {rankBadge && (
          <div className="absolute top-2 left-2">{rankBadge}</div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold leading-tight" style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>
            {hotel.name}
          </h3>
          {hotel.rating > 0 && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="w-4 h-4" style={{ color: 'var(--elastic-gold)' }} fill="currentColor" />
              <span className="text-sm font-semibold" style={{ color: 'var(--elastic-gold)' }}>
                {hotel.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {hotel.location_name && hotel.location_name.toLowerCase() !== 'unknown' && (
          <div className="flex items-center gap-1 mb-2">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
            <span className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
              {hotel.location_name}
            </span>
          </div>
        )}

        {firstDesc && (
          <p className="text-sm leading-snug mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
            {firstDesc}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {hotel.style?.slice(0, 2).map(s => (
              <span key={s} className="text-xs px-2 py-0.5 rounded-full capitalize"
                style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                {s}
              </span>
            ))}
          </div>
          {hotel.price_per_night_usd > 0 && (
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <DollarSign className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {hotel.price_per_night_usd}/night
              </span>
            </div>
          )}
        </div>

        {showScore && hotel.score != null && (
          <div className="mt-2">
            <ScoreMeter score={hotel.score} label="relevance" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
