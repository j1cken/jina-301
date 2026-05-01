'use client';

import { useState, useEffect } from 'react';
import { X, Star, MapPin, DollarSign, Search } from 'lucide-react';
import type { Hotel } from '@/lib/types';
import { resolveImageUrl } from '@/lib/images';

interface HotelDetailModalProps {
  hotel: Hotel;
  onClose: () => void;
  onFindSimilar?: (hotel: Hotel) => void;
  onFilterByTag?: (tag: string) => void;
  onEnableGeo?: () => void;
}

export default function HotelDetailModal({ hotel, onClose, onFindSimilar, onFilterByTag, onEnableGeo }: HotelDetailModalProps) {
  const primaryImage = resolveImageUrl(hotel.image_paths?.[0]);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const descriptions = hotel.descriptions ?? [];
  const hasMoreDesc = descriptions.length > 1;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-all"
          style={{ background: 'rgba(0,0,0,0.4)', color: '#fff' }}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Hero image */}
        <div className="relative" style={{ height: '280px', background: 'var(--bg-surface)' }}>
          {primaryImage ? (
            <img src={primaryImage} alt={hotel.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">🏨</div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Title row */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <h2 className="font-bold" style={{ color: 'var(--text-primary)', fontSize: '1.5rem', lineHeight: '1.2' }}>
              {hotel.name}
            </h2>
            {hotel.rating > 0 && (
              <div className="flex items-center gap-1 flex-shrink-0 mt-1">
                <Star className="w-5 h-5" style={{ color: 'var(--elastic-gold)' }} fill="currentColor" />
                <span className="text-lg font-bold" style={{ color: 'var(--elastic-gold)' }}>
                  {hotel.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Location + price */}
          <div className="flex items-center gap-4 mb-4">
            {hotel.location_name && hotel.location_name.toLowerCase() !== 'unknown' && (
              <button
                className="flex items-center gap-1 cursor-pointer transition-opacity hover:opacity-70"
                onClick={() => { onClose(); onEnableGeo?.(); }}
                title="Enable geo filter for this area"
              >
                <MapPin className="w-4 h-4" style={{ color: 'var(--elastic-blue)' }} />
                <span className="text-sm underline decoration-dotted" style={{ color: 'var(--elastic-blue)' }}>
                  {hotel.location_name}
                </span>
              </button>
            )}
            {hotel.price_per_night_usd > 0 && (
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  ${hotel.price_per_night_usd}/night
                </span>
              </div>
            )}
          </div>

          {/* Descriptions */}
          {descriptions.length > 0 && (
            <div className="mb-4">
              <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--text-secondary)' }}>
                {descriptions[0]}
              </p>
              {descExpanded && descriptions.slice(1).map((desc, i) => (
                <p key={i + 1} className="text-sm leading-relaxed mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {desc}
                </p>
              ))}
              {hasMoreDesc && (
                <button
                  onClick={() => setDescExpanded(e => !e)}
                  className="text-xs font-semibold transition-opacity hover:opacity-70"
                  style={{ color: 'var(--elastic-blue)' }}
                >
                  {descExpanded ? 'Show less' : `Show more (${descriptions.length - 1} more)`}
                </button>
              )}
            </div>
          )}

          {/* Style tags */}
          {hotel.style?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Style</p>
              <div className="flex flex-wrap gap-2">
                {hotel.style.map(s => (
                  <button
                    key={s}
                    onClick={() => { onClose(); onFilterByTag?.(s); }}
                    className="text-sm px-3 py-1 rounded-full capitalize cursor-pointer transition-opacity hover:opacity-70"
                    style={{ background: 'rgba(0,119,204,0.08)', color: 'var(--elastic-blue)', border: '1px solid rgba(0,119,204,0.2)' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Amenities */}
          {hotel.amenities?.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Amenities</p>
              <div className="flex flex-wrap gap-2">
                {hotel.amenities.map(a => (
                  <button
                    key={a}
                    onClick={() => { onClose(); onFilterByTag?.(a); }}
                    className="text-sm px-3 py-1 rounded-full capitalize cursor-pointer transition-opacity hover:opacity-70"
                    style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {onFindSimilar && (
              <button
                onClick={() => onFindSimilar(hotel)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'var(--elastic-blue)', color: '#fff' }}
              >
                <Search className="w-4 h-4" />
                Find similar hotels
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
