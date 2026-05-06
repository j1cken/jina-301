'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import StationNav from '@/components/StationNav';
import DemoModeBanner from '@/components/DemoModeBanner';
import IngestStation from '@/components/stations/IngestStation';
import FindStation from '@/components/stations/FindStation';
import RankStation from '@/components/stations/RankStation';
import LookStation from '@/components/stations/LookStation';
import DescribeStation from '@/components/stations/DescribeStation';
import CapstoneStation from '@/components/stations/CapstoneStation';
import AgentStation from '@/components/stations/AgentStation';
import AgentChat from '@/components/AgentChat';
import TravelHome from '@/components/TravelHome';
import HotelDetailModal from '@/components/HotelDetailModal';
import StationInfoBand from '@/components/StationInfoBand';
import StationDetailDrawer from '@/components/StationDetailDrawer';
import { DemoModeContext } from '@/lib/demoMode';
import type { Station, Hotel, RankedHotel, VlmAnalysis } from '@/lib/types';
import type { ChatHotel } from '@/hooks/useAgentChat';
import { apiUrl } from '@/lib/api';

type ViewMode = 'travel' | 'demo';
type Theme = 'light' | 'dark';

// Convert a ChatHotel (partial data from hotels.json) to a Hotel for the detail modal
function chatHotelToHotel(ch: ChatHotel): Hotel {
  return {
    id: ch.id,
    name: ch.name,
    descriptions: ch.descriptions ?? (ch.description ? [ch.description] : []),
    location: ch.location ?? { lat: 0, lon: 0 },
    location_name: ch.location_name ?? '',
    country: ch.country ?? '',
    region: ch.region ?? '',
    amenities: ch.amenities ?? [],
    style: ch.style ?? [],
    // trust hotels.json data; Tier 1 hotels fall back to 'mid'
    price_tier: (ch.price_tier as Hotel['price_tier']) ?? 'mid',
    price_per_night_usd: ch.price_per_night_usd ?? 0,
    image_paths: ch.image_paths,
    rating: ch.rating ?? 0,
    nearby_landmarks: ch.nearby_landmarks ?? [],
    room_description: ch.room_description,
  };
}

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>('travel');
  const [theme, setTheme] = useState<Theme>('light');
  const [station, setStation] = useState<Station>('ingest');
  const [demoMode, setDemoMode] = useState(false);
  const [findResults, setFindResults] = useState<Hotel[]>([]);
  const [topRanked, setTopRanked] = useState<RankedHotel | undefined>(undefined);
  const [vlmAnalysis, setVlmAnalysis] = useState<VlmAnalysis | undefined>(undefined);
  const [analyzedHotel, setAnalyzedHotel] = useState<Hotel | undefined>(undefined);
  const [pendingFindQuery, setPendingFindQuery] = useState<string | null>(null);
  const [showAgentChat, setShowAgentChat] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | undefined>(undefined);

  // Read ?mode=demo hatch and persisted preferences on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'demo') setViewMode('demo');

    const stored = localStorage.getItem('horizonDemoMode');
    if (stored === 'true') setDemoMode(true);

    const storedTheme = (localStorage.getItem('horizonTheme') as Theme) || 'light';
    setTheme(storedTheme);
    document.documentElement.setAttribute('data-theme', storedTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('horizonTheme', next);
      document.documentElement.setAttribute('data-theme', next);
      return next;
    });
  }, []);

  const toggleDemo = useCallback(() => {
    setDemoMode(prev => {
      const next = !prev;
      localStorage.setItem('horizonDemoMode', String(next));
      return next;
    });
  }, []);

  const disableDemo = useCallback(() => {
    setDemoMode(false);
    localStorage.setItem('horizonDemoMode', 'false');
  }, []);

  // Auto-close drawer when switching stations
  useEffect(() => { setDrawerOpen(false); }, [station]);

  const prewarmVlm = useCallback(() => {
    fetch(apiUrl('/api/vision'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: '', hotelId: '__prewarm', demoMode: false }),
    }).catch(() => { /* silent */ });
  }, []);

  const openHotelFromChat = useCallback((chatHotel: ChatHotel) => {
    setSelectedHotel(chatHotelToHotel(chatHotel));
  }, []);

  return (
    <DemoModeContext.Provider value={demoMode}>
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
        {demoMode && <DemoModeBanner onDisable={disableDemo} />}

        {viewMode === 'travel' ? (
          <TravelHome
            onShowDemo={() => setViewMode('demo')}
            onSelectStation={(s) => { setViewMode('demo'); setStation(s); }}
            onOpenAgent={() => setShowAgentChat(true)}
            theme={theme}
            onToggleTheme={toggleTheme}
            demoMode={demoMode}
            onToggleDemo={toggleDemo}
          />
        ) : (
          <div className="demo-blueprint flex flex-col flex-1">
            <Header
              demoMode={demoMode}
              onToggleDemo={toggleDemo}
              theme={theme}
              onToggleTheme={toggleTheme}
              viewMode={viewMode}
              onToggleView={() => setViewMode(v => v === 'travel' ? 'demo' : 'travel')}
            />
            <StationNav active={station} onSelect={setStation} />
            <StationInfoBand station={station} onOpenDrawer={() => setDrawerOpen(true)} />
            <StationDetailDrawer station={station} isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
            <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
              {station === 'ingest' && <IngestStation demoMode={demoMode} />}
              {station === 'find' && (
                <FindStation
                  demoMode={demoMode}
                  onResultsChange={hotels => setFindResults(hotels)}
                  pendingQuery={pendingFindQuery}
                  onPendingQueryConsumed={() => setPendingFindQuery(null)}
                />
              )}
              {station === 'rank' && <RankStation demoMode={demoMode} onTopRanked={setTopRanked} />}
              {station === 'look' && <LookStation demoMode={demoMode} onVlmPrewarm={prewarmVlm} onSelectStation={s => setStation(s as Station)} />}
              {station === 'describe' && (
                <DescribeStation
                  demoMode={demoMode}
                  hotels={findResults}
                  onSelectStation={s => setStation(s as Station)}
                  onFindWithQuery={q => { setPendingFindQuery(q); setStation('find'); }}
                  onVlmResult={(hotel, analysis) => { setAnalyzedHotel(hotel); setVlmAnalysis(analysis); }}
                />
              )}
              {station === 'capstone' && <CapstoneStation searchResults={findResults} topRanked={topRanked} vlmAnalysis={vlmAnalysis} analyzedHotel={analyzedHotel} />}
              {station === 'agent' && <AgentStation />}
            </main>
          </div>
        )}
      </div>

      {/* AI Concierge — sidebar in travel view, modal overlay in demo view */}
      {showAgentChat && viewMode === 'travel' && (
        <AgentChat
          sidebar
          onClose={() => setShowAgentChat(false)}
          onOpenHotel={openHotelFromChat}
        />
      )}
      {showAgentChat && viewMode !== 'travel' && (
        <AgentChat
          onClose={() => setShowAgentChat(false)}
          onOpenHotel={openHotelFromChat}
        />
      )}

      {/* Hotel detail modal — shared between chat and search results */}
      {selectedHotel && (
        <HotelDetailModal
          hotel={selectedHotel}
          onClose={() => setSelectedHotel(undefined)}
          onFindSimilar={(hotel) => {
            setSelectedHotel(undefined);
            setPendingFindQuery(hotel.name);
            setViewMode('demo');
            setStation('find');
          }}
        />
      )}
    </DemoModeContext.Provider>
  );
}
