'use client';

import { useState, useCallback } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { CalendarDays, Users, Minus, Plus, Copy, ChevronDown } from 'lucide-react';

export interface TripCartState {
  checkIn?: Date;
  checkOut?: Date;
  guests: number;
  tripName: string;
}

interface TripCartProps {
  onContextChange: (context: string) => void;
}

function fmt(d?: Date) {
  if (!d) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function buildContext(s: TripCartState): string {
  const parts: string[] = [];
  if (s.tripName) parts.push(`Trip: "${s.tripName}"`);
  if (s.checkIn && s.checkOut) {
    parts.push(`Dates: ${fmt(s.checkIn)} – ${fmt(s.checkOut)}`);
  } else if (s.checkIn) {
    parts.push(`Check-in: ${fmt(s.checkIn)}`);
  }
  parts.push(`Guests: ${s.guests}`);
  return parts.join(' · ');
}

export default function TripCart({ onContextChange }: TripCartProps) {
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [guests, setGuests] = useState(2);
  const [tripName, setTripName] = useState('');
  const [showIn, setShowIn] = useState(false);
  const [showOut, setShowOut] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const ctx = buildContext({ checkIn, checkOut, guests, tripName });
    onContextChange(ctx);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [checkIn, checkOut, guests, tripName, onContextChange]);

  return (
    <div
      className="flex flex-wrap items-center gap-2 px-4 py-2.5 flex-shrink-0 relative z-20"
      style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}
    >
      {/* Trip name */}
      <input
        value={tripName}
        onChange={e => setTripName(e.target.value)}
        placeholder="Name this trip…"
        className="text-sm bg-transparent outline-none"
        style={{ color: 'var(--text-primary)', minWidth: '110px', maxWidth: '150px' }}
      />
      <span style={{ color: 'var(--border)' }}>|</span>

      {/* Check-in */}
      <div className="relative">
        <button
          onClick={() => { setShowIn(s => !s); setShowOut(false); }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm"
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            color: checkIn ? 'var(--text-primary)' : 'var(--text-muted)',
          }}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          {fmt(checkIn) ?? 'Check-in'}
          <ChevronDown className="w-3 h-3 opacity-50" />
        </button>
        {showIn && (
          <div
            className="absolute top-full left-0 mt-1 z-50 rounded-xl shadow-xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <DayPicker
              mode="single"
              selected={checkIn}
              onSelect={d => { setCheckIn(d); setShowIn(false); }}
              disabled={{ before: new Date() }}
              style={{ margin: '8px' }}
            />
          </div>
        )}
      </div>

      {/* Check-out */}
      <div className="relative">
        <button
          onClick={() => { setShowOut(s => !s); setShowIn(false); }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm"
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            color: checkOut ? 'var(--text-primary)' : 'var(--text-muted)',
          }}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          {fmt(checkOut) ?? 'Check-out'}
          <ChevronDown className="w-3 h-3 opacity-50" />
        </button>
        {showOut && (
          <div
            className="absolute top-full left-0 mt-1 z-50 rounded-xl shadow-xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <DayPicker
              mode="single"
              selected={checkOut}
              onSelect={d => { setCheckOut(d); setShowOut(false); }}
              disabled={{ before: checkIn ?? new Date() }}
              style={{ margin: '8px' }}
            />
          </div>
        )}
      </div>

      {/* Guest count */}
      <div className="flex items-center gap-1">
        <Users className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
        <button
          onClick={() => setGuests(g => Math.max(1, g - 1))}
          className="w-5 h-5 flex items-center justify-center rounded"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-5 text-center text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{guests}</span>
        <button
          onClick={() => setGuests(g => Math.min(8, g + 1))}
          className="w-5 h-5 flex items-center justify-center rounded"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Add to chat */}
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ml-auto"
        style={{
          background: copied ? 'rgba(0,191,179,0.1)' : 'rgba(0,119,204,0.08)',
          border: `1px solid ${copied ? 'rgba(0,191,179,0.3)' : 'rgba(0,119,204,0.2)'}`,
          color: copied ? 'var(--elastic-teal)' : 'var(--elastic-blue)',
        }}
      >
        <Copy className="w-3 h-3" />
        {copied ? 'Added!' : 'Add to chat'}
      </button>
    </div>
  );
}
