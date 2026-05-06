'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, Zap } from 'lucide-react';
import type { Hotel } from '@/lib/types';
import type { ChatHotel } from '@/hooks/useAgentChat';
import { chatHotelToHotel } from '@/lib/chatHotelUtils';
import ResultsCanvas from '@/components/ResultsCanvas';
import AgentChat from '@/components/AgentChat';

interface TravelSplitViewProps {
  initialMessage?: string;
  onClose: () => void;
  onOpenHotel: (hotel: Hotel) => void;
}

export default function TravelSplitView({ initialMessage, onClose, onOpenHotel }: TravelSplitViewProps) {
  const [tripContext, setTripContext] = useState('');
  const [agentHotels, setAgentHotels] = useState<ChatHotel[]>([]);
  const [visible, setVisible] = useState(false);

  // Fade-in on mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleOpenHotelFromChat = useCallback((chatHotel: ChatHotel) => {
    onOpenHotel(chatHotelToHotel(chatHotel));
  }, [onOpenHotel]);

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col"
      style={{
        background: 'var(--bg-base)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.18s ease-out, transform 0.18s ease-out',
      }}
    >
      {/* Slim top bar */}
      <div
        className="flex items-center justify-between px-5 flex-shrink-0"
        style={{
          height: '48px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-surface)',
        }}
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4" style={{ color: 'var(--elastic-blue)' }} />
          <span className="font-bold text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>Horizon</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              background: 'rgba(0,119,204,0.08)',
              border: '1px solid rgba(0,119,204,0.18)',
              color: 'var(--elastic-blue)',
            }}
          >
            AI Concierge
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
          style={{ color: 'var(--text-muted)' }}
          title="Back to search"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Split body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Results canvas */}
        <div
          className="flex flex-col overflow-hidden border-r"
          style={{
            width: 'calc(100% - clamp(400px, 32%, 540px))',
            borderColor: 'var(--border)',
          }}
        >
          <ResultsCanvas
            onContextChange={setTripContext}
            onOpenHotel={onOpenHotel}
            agentHotels={agentHotels}
          />
        </div>

        {/* Right: Agent chat */}
        <div
          className="flex flex-col"
          style={{ width: 'clamp(400px, 32%, 540px)' }}
        >
          <AgentChat
            panel
            initialMessage={initialMessage}
            tripContext={tripContext}
            onAgentHotels={setAgentHotels}
            onOpenHotel={handleOpenHotelFromChat}
          />
        </div>
      </div>
    </div>
  );
}
