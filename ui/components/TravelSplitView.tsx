'use client';

import { useState, useCallback, useEffect, type Dispatch, type SetStateAction } from 'react';
import { X, Zap } from 'lucide-react';
import type { Hotel } from '@/lib/types';
import type { ChatHotel } from '@/hooks/useAgentChat';
import ResultsCanvas from '@/components/ResultsCanvas';
import AgentChat from '@/components/AgentChat';
import TripCart, { type TripCartState } from '@/components/TripCart';
import HotelDetailModal from '@/components/HotelDetailModal';
import { generatePNR } from '@/components/BookingConfirmation';

interface TravelSplitViewProps {
  initialMessage?: string;
  onClose: () => void;
  cart: TripCartState;
  setCart: Dispatch<SetStateAction<TripCartState>>;
}

export default function TravelSplitView({ initialMessage, onClose, cart, setCart }: TravelSplitViewProps) {
  const [tripContext, setTripContext] = useState('');
  const [agentHotels, setAgentHotels] = useState<ChatHotel[]>([]);
  const [visible, setVisible] = useState(false);
  const [tripHotels, setTripHotels] = useState<Hotel[]>([]);
  const [bookingPNR, setBookingPNR] = useState<string | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | undefined>();

  // Fade-in on mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const addHotelToTrip = useCallback((hotel: Hotel) => {
    setTripHotels(prev => prev.some(h => h.id === hotel.id) ? prev : [...prev, hotel]);
  }, []);

  const removeHotelFromTrip = useCallback((id: string) => {
    setTripHotels(prev => prev.filter(h => h.id !== id));
  }, []);

  const bookTrip = useCallback(() => {
    if (tripHotels.length === 0) return;
    setBookingPNR(generatePNR());
  }, [tripHotels]);

  const handleOpenHotel = useCallback((hotel: Hotel) => {
    setSelectedHotel(hotel);
  }, []);

  const handleOpenHotelFromChat = useCallback((_: ChatHotel) => {}, []);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex flex-col"
      style={{
        top: '120px',
        background: 'var(--bg-base)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.45s ease-out, transform 0.45s ease-out',
      }}
    >
      {/* Slim top bar */}
      <div
        className="flex items-center justify-between px-5 flex-shrink-0"
        style={{ height: '48px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4" style={{ color: 'var(--elastic-blue)' }} />
          <span className="font-bold text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>Horizon</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'rgba(0,119,204,0.08)', border: '1px solid rgba(0,119,204,0.18)', color: 'var(--elastic-blue)' }}
          >
            AI Concierge
          </span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Split body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Results canvas */}
        <div
          className="flex flex-col overflow-hidden border-r"
          style={{ width: 'calc(100% - clamp(400px, 32%, 540px))', borderColor: 'var(--border)' }}
        >
          <ResultsCanvas
            onOpenHotel={handleOpenHotel}
            agentHotels={agentHotels}
          />
        </div>

        {/* Right: Trip Cart (top 42%) + AgentChat (bottom 58%) */}
        <div className="flex flex-col" style={{ width: 'clamp(400px, 32%, 540px)' }}>
          {/* Trip Cart */}
          <div
            style={{
              flex: '0 0 42%',
              minHeight: 0,
              overflow: 'visible',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <TripCart
              cart={cart}
              setCart={setCart}
              hotels={tripHotels}
              onRemove={removeHotelFromTrip}
              onBook={bookTrip}
              bookingPNR={bookingPNR}
              onContextChange={setTripContext}
            />
          </div>

          {/* AgentChat */}
          <div style={{ flex: '1 1 58%', minHeight: 0, overflow: 'hidden' }}>
            <AgentChat
              panel
              initialMessage={initialMessage}
              tripContext={tripContext}
              onAgentHotels={setAgentHotels}
              onOpenHotel={handleOpenHotelFromChat}
              onDatesParsed={(checkIn, checkOut) => setCart(prev => ({ ...prev, checkIn, checkOut }))}
            />
          </div>
        </div>
      </div>

      {/* Hotel detail modal — owns Add to Trip */}
      {selectedHotel && (
        <HotelDetailModal
          hotel={selectedHotel}
          onClose={() => setSelectedHotel(undefined)}
          onAddToTrip={addHotelToTrip}
          inTrip={tripHotels.some(h => h.id === selectedHotel.id)}
          onFindSimilar={() => setSelectedHotel(undefined)}
        />
      )}
    </div>
  );
}
