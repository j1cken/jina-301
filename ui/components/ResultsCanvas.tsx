'use client';

import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import type { Hotel } from '@/lib/types';
import type { ChatHotel } from '@/hooks/useAgentChat';
import { chatHotelToHotel } from '@/lib/chatHotelUtils';
import TravelHotelCard from '@/components/TravelHotelCard';

interface ResultsCanvasProps {
  onOpenHotel: (hotel: Hotel) => void;
  agentHotels?: ChatHotel[];
}

function _SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div style={{ aspectRatio: '16/9', background: 'var(--bg-surface)' }} className="animate-pulse" />
      <div className="p-4 space-y-2.5">
        <div className="animate-pulse rounded h-5 w-3/4" style={{ background: 'var(--border)' }} />
        <div className="animate-pulse rounded h-3 w-1/2" style={{ background: 'var(--border)' }} />
        <div className="animate-pulse rounded h-3 w-full" style={{ background: 'var(--border)' }} />
      </div>
    </div>
  );
}

export default function ResultsCanvas({ onOpenHotel, agentHotels = [] }: ResultsCanvasProps) {
  const agentHotelsFull = useMemo(
    () => agentHotels.map(chatHotelToHotel),
    [agentHotels]
  );

  const hasContent = agentHotelsFull.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Results area */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ minHeight: 0 }}>
        {!hasContent && (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(0,119,204,0.08)', border: '1px solid rgba(0,119,204,0.15)' }}
            >
              <Sparkles className="w-6 h-6" style={{ color: 'var(--elastic-blue)' }} />
            </div>
            <div>
              <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Hotel results</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Ask the concierge to find the perfect hotel for you
              </p>
            </div>
          </div>
        )}

        {/* Agent-recommended hotels */}
        {agentHotelsFull.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--elastic-teal)' }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--elastic-teal)' }}>
                AI Picks
              </span>
            </div>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))' }}>
              {agentHotelsFull.map(h => (
                <div key={h.id} className="relative">
                  <div
                    className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1"
                    style={{ background: 'rgba(0,191,179,0.9)', color: '#fff', backdropFilter: 'blur(4px)' }}
                  >
                    <Sparkles className="w-3 h-3" /> AI Pick
                  </div>
                  <TravelHotelCard hotel={h} onClick={() => onOpenHotel(h)} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
