'use client';

import { useState, useEffect } from 'react';
import { X, Star, MapPin, DollarSign, Search, CheckCircle, Calendar } from 'lucide-react';
import type { Hotel } from '@/lib/types';
import { resolveImageUrl } from '@/lib/images';

interface HotelDetailModalProps {
  hotel: Hotel;
  onClose: () => void;
  onFindSimilar?: (hotel: Hotel) => void;
  onFilterByTag?: (tag: string) => void;
  onEnableGeo?: () => void;
}

const VENETIAN_ID = 'the-venetian-resort-las-vegas';

function BookingConfirmation({ hotel, onClose }: { hotel: Hotel; onClose: () => void }) {
  const isVenetian = hotel.id === VENETIAN_ID;
  const pnr = `HRZ-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

  return (
    <div className="p-8 flex flex-col items-center text-center gap-4">
      <div className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(0,191,179,0.12)', border: '2px solid var(--elastic-teal)' }}>
        <CheckCircle className="w-8 h-8" style={{ color: 'var(--elastic-teal)' }} />
      </div>

      <div>
        <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Booking Confirmed!
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {hotel.name}
        </p>
      </div>

      {isVenetian && (
        <div className="rounded-xl px-4 py-3 w-full"
          style={{ background: 'rgba(254,197,20,0.08)', border: '1px solid rgba(254,197,20,0.25)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--elastic-gold)' }}>
            ✨ See you at the Venetian on May 13!
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            We&apos;re literally there right now — enjoy SKO!
          </p>
        </div>
      )}

      <div className="rounded-xl px-4 py-3 w-full" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Confirmation Code</p>
        <p className="text-xl font-mono font-bold" style={{ color: 'var(--elastic-blue)', letterSpacing: '0.1em' }}>{pnr}</p>
      </div>

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        A confirmation has been sent to your email.{' '}
        <span style={{ color: 'var(--elastic-blue)' }}>View itinerary →</span>
      </p>

      <button
        onClick={onClose}
        className="w-full py-2.5 rounded-xl text-sm font-semibold mt-2 transition-all hover:opacity-90"
        style={{ background: 'var(--elastic-blue)', color: '#fff' }}>
        Done
      </button>
    </div>
  );
}

export default function HotelDetailModal({ hotel, onClose, onFindSimilar, onFilterByTag, onEnableGeo }: HotelDetailModalProps) {
  const [descExpanded, setDescExpanded] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [showBooking, setShowBooking] = useState(false);

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

        {showBooking ? (
          <BookingConfirmation hotel={hotel} onClose={onClose} />
        ) : (
          <>
            {/* Hero image */}
            <div className="relative" style={{ height: '280px', background: 'var(--bg-surface)' }}>
              {hotel.image_paths?.[activeIdx] ? (
                <img src={resolveImageUrl(hotel.image_paths[activeIdx])} alt={hotel.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">🏨</div>
              )}
            </div>

            {(hotel.image_paths?.length ?? 0) > 1 && (
              <div className="flex gap-2 px-4 py-2" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
                {hotel.image_paths!.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIdx(i)}
                    className="relative flex-shrink-0 rounded-lg overflow-hidden transition-all"
                    style={{
                      width: 72, height: 52,
                      border: `2px solid ${activeIdx === i ? 'var(--elastic-blue)' : 'var(--border)'}`,
                      opacity: activeIdx === i ? 1 : 0.6,
                    }}
                  >
                    <img src={resolveImageUrl(src)} alt={i === 0 ? 'Exterior' : 'Room'} className="w-full h-full object-cover" />
                    <span
                      className="absolute bottom-0 left-0 right-0 text-center"
                      style={{ fontSize: '9px', background: 'rgba(0,0,0,0.55)', color: '#fff', padding: '1px 0' }}
                    >
                      {i === 0 ? 'Exterior' : 'Room'}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              {activeIdx > 0 && hotel.room_description && (
                <div className="mb-4 p-3 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--elastic-purple)' }}>
                    Room · VLM Analysis
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {hotel.room_description}
                  </p>
                </div>
              )}

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
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => setShowBooking(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                  style={{ background: 'var(--elastic-blue)', color: '#fff' }}
                >
                  <Calendar className="w-4 h-4" />
                  Book Now
                </button>
                {onFindSimilar && (
                  <button
                    onClick={() => onFindSimilar(hotel)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                  >
                    <Search className="w-4 h-4" />
                    Find similar
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                >
                  Close
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
