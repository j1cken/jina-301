'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { CalendarDays, Users, Minus, Plus, X, ShoppingBag, ChevronDown } from 'lucide-react';
import type { Hotel } from '@/lib/types';
import { resolveImageUrl } from '@/lib/images';
import { BookingConfirmation, generatePNR } from '@/components/BookingConfirmation';

export interface TripCartState {
  checkIn?: Date;
  checkOut?: Date;
  guests: number;
  tripName: string;
}

interface TripCartProps {
  cart: TripCartState;
  setCart: (s: TripCartState) => void;
  hotels: Hotel[];
  onRemove: (id: string) => void;
  onBook: () => void;
  bookingPNR: string | null;
  onContextChange?: (ctx: string) => void;
}

function fmt(d?: Date) {
  if (!d) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function nightsBetween(a?: Date, b?: Date): number {
  if (!a || !b) return 0;
  const diff = b.getTime() - a.getTime();
  return Math.max(0, Math.round(diff / 86400000));
}

function buildContext(cart: TripCartState): string {
  const parts: string[] = [];
  if (cart.tripName) parts.push(`Trip: "${cart.tripName}"`);
  if (cart.checkIn && cart.checkOut) {
    parts.push(`Dates: ${fmt(cart.checkIn)} – ${fmt(cart.checkOut)}`);
  } else if (cart.checkIn) {
    parts.push(`Check-in: ${fmt(cart.checkIn)}`);
  }
  parts.push(`Guests: ${cart.guests}`);
  return parts.join(' · ');
}

export default function TripCart({ cart, setCart, hotels, onRemove, onBook, bookingPNR, onContextChange }: TripCartProps) {
  const [showIn, setShowIn] = useState(false);
  const [showOut, setShowOut] = useState(false);
  // Stable PNR — only used when bookingPNR is set externally (for trip booking flow)
  const [singlePNR] = useState(() => generatePNR());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced context sync
  useEffect(() => {
    if (!onContextChange) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onContextChange(buildContext(cart));
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [cart, onContextChange]);

  const nights = nightsBetween(cart.checkIn, cart.checkOut);
  const totalPrice = hotels.reduce((sum, h) => sum + (h.price_per_night_usd || 0), 0);

  // Dummy hotel for trip-level booking confirmation (first hotel or fallback)
  const primaryHotel = hotels[0];

  const closePickers = useCallback(() => { setShowIn(false); setShowOut(false); }, []);

  // Close pickers on outside click
  useEffect(() => {
    if (!showIn && !showOut) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-picker]')) closePickers();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showIn, showOut, closePickers]);

  if (bookingPNR && primaryHotel) {
    return (
      <div className="h-full overflow-y-auto">
        <BookingConfirmation
          hotel={primaryHotel}
          pnr={bookingPNR}
          onClose={() => {/* parent controls bookingPNR */}}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-surface)' }}>
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-1.5 mb-2">
          <ShoppingBag className="w-3.5 h-3.5" style={{ color: 'var(--elastic-blue)' }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--elastic-blue)' }}>Trip</span>
        </div>

        {/* Trip name */}
        <input
          value={cart.tripName}
          onChange={e => setCart({ ...cart, tripName: e.target.value })}
          placeholder="Name this trip…"
          className="text-sm bg-transparent outline-none w-full mb-2"
          style={{ color: 'var(--text-primary)' }}
        />

        {/* Date + Guest row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Check-in */}
          <div className="relative" data-picker>
            <button
              onClick={() => { setShowIn(s => !s); setShowOut(false); }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                color: cart.checkIn ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              <CalendarDays className="w-3 h-3" />
              {fmt(cart.checkIn) ?? 'Check-in'}
              <ChevronDown className="w-2.5 h-2.5 opacity-50" />
            </button>
            {showIn && (
              <div
                className="fixed z-[200] rounded-xl shadow-2xl"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', top: 'auto', left: 'auto' }}
                data-picker
              >
                <DayPicker
                  mode="single"
                  selected={cart.checkIn}
                  onSelect={d => { setCart({ ...cart, checkIn: d }); setShowIn(false); }}
                  disabled={{ before: new Date() }}
                  style={{ margin: '8px' }}
                />
              </div>
            )}
          </div>

          {/* Check-out */}
          <div className="relative" data-picker>
            <button
              onClick={() => { setShowOut(s => !s); setShowIn(false); }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                color: cart.checkOut ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              <CalendarDays className="w-3 h-3" />
              {fmt(cart.checkOut) ?? 'Check-out'}
              <ChevronDown className="w-2.5 h-2.5 opacity-50" />
            </button>
            {showOut && (
              <div
                className="fixed z-[200] rounded-xl shadow-2xl"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                data-picker
              >
                <DayPicker
                  mode="single"
                  selected={cart.checkOut}
                  onSelect={d => { setCart({ ...cart, checkOut: d }); setShowOut(false); }}
                  disabled={{ before: cart.checkIn ?? new Date() }}
                  style={{ margin: '8px' }}
                />
              </div>
            )}
          </div>

          {/* Guests */}
          <div className="flex items-center gap-1 ml-auto">
            <Users className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
            <button
              onClick={() => setCart({ ...cart, guests: Math.max(1, cart.guests - 1) })}
              className="w-4 h-4 flex items-center justify-center rounded text-xs"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              <Minus className="w-2.5 h-2.5" />
            </button>
            <span className="w-5 text-center text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{cart.guests}</span>
            <button
              onClick={() => setCart({ ...cart, guests: Math.min(8, cart.guests + 1) })}
              className="w-4 h-4 flex items-center justify-center rounded text-xs"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              <Plus className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Hotel list */}
      <div className="flex-1 overflow-y-auto px-4 py-2" style={{ minHeight: 0 }}>
        {hotels.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-4">
            <ShoppingBag className="w-6 h-6 opacity-20" style={{ color: 'var(--text-muted)' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Click a hotel card, then &ldquo;Add to Trip&rdquo;
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {hotels.map(h => {
              const hotelTotal = nights > 0 && h.price_per_night_usd > 0 ? nights * h.price_per_night_usd : null;
              return (
                <div
                  key={h.id}
                  className="rounded-xl overflow-hidden"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  {/* Image */}
                  {h.image_paths?.[0] && (
                    <img
                      src={resolveImageUrl(h.image_paths[0])}
                      alt={h.name}
                      className="w-full object-cover"
                      style={{ height: 90 }}
                    />
                  )}
                  {/* Info */}
                  <div className="px-3 py-2">
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>{h.name}</p>
                      <button
                        onClick={() => onRemove(h.id)}
                        className="flex-shrink-0 p-0.5 rounded hover:opacity-70 mt-0.5"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {h.location_name && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{h.location_name}</p>
                    )}
                    <div className="flex items-center justify-between mt-1.5">
                      <div>
                        {h.price_per_night_usd > 0 && (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            ${h.price_per_night_usd.toLocaleString()}<span className="opacity-60">/night</span>
                          </span>
                        )}
                      </div>
                      {hotelTotal && (
                        <span className="text-xs font-bold" style={{ color: 'var(--elastic-blue)' }}>
                          ${hotelTotal.toLocaleString()} <span className="font-normal opacity-70">· {nights}n</span>
                        </span>
                      )}
                    </div>
                    {h.rating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs" style={{ color: 'var(--elastic-gold)' }}>★</span>
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{h.rating.toFixed(1)}</span>
                        {h.price_tier && (
                          <span className="text-xs ml-1 opacity-50" style={{ color: 'var(--text-muted)' }}>· {h.price_tier}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer: total + book */}
      <div className="px-4 pb-3 pt-2 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        {hotels.length > 0 && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {nights > 0 ? `${nights} night${nights !== 1 ? 's' : ''}` : 'Select dates'}
            </span>
            {nights > 0 && totalPrice > 0 && (
              <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                ${(nights * totalPrice).toLocaleString()} est.
              </span>
            )}
          </div>
        )}
        <button
          onClick={onBook}
          disabled={hotels.length === 0}
          className="w-full py-2 rounded-xl text-sm font-bold transition-all"
          style={{
            background: hotels.length > 0 ? 'var(--elastic-blue)' : 'var(--border)',
            color: hotels.length > 0 ? '#fff' : 'var(--text-muted)',
            cursor: hotels.length > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          Book Trip
        </button>
      </div>
    </div>
  );
}
