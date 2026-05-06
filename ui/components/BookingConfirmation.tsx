'use client';

import { CheckCircle } from 'lucide-react';
import type { Hotel } from '@/lib/types';

const VENETIAN_ID = 'the-venetian-resort-las-vegas';

export function generatePNR(): string {
  return `HRZ-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export function BookingConfirmation({ hotel, pnr, onClose }: { hotel: Hotel; pnr: string; onClose: () => void }) {
  const isVenetian = hotel.id === VENETIAN_ID;

  return (
    <div className="p-8 flex flex-col items-center text-center gap-4">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(0,191,179,0.12)', border: '2px solid var(--elastic-teal)' }}
      >
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
        <div
          className="rounded-xl px-4 py-3 w-full"
          style={{ background: 'rgba(254,197,20,0.08)', border: '1px solid rgba(254,197,20,0.25)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--elastic-gold)' }}>
            ✨ See you at the Venetian on May 13!
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            We&apos;re literally there right now — enjoy SKO!
          </p>
        </div>
      )}

      <div
        className="rounded-xl px-4 py-3 w-full"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
          Confirmation Code
        </p>
        <p
          className="text-xl font-mono font-bold"
          style={{ color: 'var(--elastic-blue)', letterSpacing: '0.1em' }}
        >
          {pnr}
        </p>
      </div>

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        A confirmation has been sent to your email.{' '}
        <span style={{ color: 'var(--elastic-blue)' }}>View itinerary →</span>
      </p>

      <button
        onClick={onClose}
        className="w-full py-2.5 rounded-xl text-sm font-semibold mt-2 transition-all hover:opacity-90"
        style={{ background: 'var(--elastic-blue)', color: '#fff' }}
      >
        Done
      </button>
    </div>
  );
}
