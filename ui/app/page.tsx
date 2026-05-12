'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Header from '@/components/Header';
import StationNav from '@/components/StationNav';
import DemoModeBanner from '@/components/DemoModeBanner';
import DemoFlowOverlay from '@/components/DemoFlowOverlay';
import IngestStation from '@/components/stations/IngestStation';
import FindStation from '@/components/stations/FindStation';
import RankStation from '@/components/stations/RankStation';
import { useDemoFlow } from '@/hooks/useDemoFlow';
import type { FlowAction } from '@/lib/demoScript';
import LookStation from '@/components/stations/LookStation';
import DescribeStation from '@/components/stations/DescribeStation';
import CapstoneStation from '@/components/stations/CapstoneStation';
import AgentStation from '@/components/stations/AgentStation';
import IndustriesStation from '@/components/stations/IndustriesStation';
import OmniStation from '@/components/stations/OmniStation';
import WrapUpStation from '@/components/stations/WrapUpStation';
import AgentChat from '@/components/AgentChat';
import TravelHome from '@/components/TravelHome';
import TravelSplitView from '@/components/TravelSplitView';
import HotelDetailModal from '@/components/HotelDetailModal';
import StationInfoBand from '@/components/StationInfoBand';
import StationDetailDrawer from '@/components/StationDetailDrawer';
import { DemoModeContext } from '@/lib/demoMode';
import type { Station, Hotel, RankedHotel, VlmAnalysis } from '@/lib/types';
import type { ChatHotel } from '@/hooks/useAgentChat';
import { type TripCartState } from '@/components/TripCart';
import { chatHotelToHotel } from '@/lib/chatHotelUtils';
import { apiUrl } from '@/lib/api';

type ViewMode = 'travel' | 'demo' | 'split';
type Theme = 'light' | 'dark';

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
  const [splitInitialMessage, setSplitInitialMessage] = useState<string | undefined>();
  const [splitInitialImageFile, setSplitInitialImageFile] = useState<File | undefined>();
  const [cart, setCart] = useState<TripCartState>({ guests: 2, tripName: '' });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | undefined>(undefined);

  // --- Demo flow player state ---
  const [addFirstHotelSignal, setAddFirstHotelSignal] = useState(0);
  const [flowHeroQuery, setFlowHeroQuery] = useState<string | null>(null);
  const [flowFindQuery, setFlowFindQuery] = useState<string | null>(null);
  const [flowRankReveal, setFlowRankReveal] = useState<boolean | null>(null);
  const [flowGeoFilter, setFlowGeoFilter] = useState<boolean | null>(null);
  const [flowTriggerImageSearch, setFlowTriggerImageSearch] = useState(false);
  const [flowTriggerIngest, setFlowTriggerIngest] = useState(false);
  const flowFindQueryKey = useRef(0); // increment to re-trigger same query string

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

  // --- Demo flow: reset all flow-specific state ---
  const resetFlowState = useCallback(() => {
    setFlowHeroQuery(null);
    setFlowFindQuery(null);
    setFlowRankReveal(null);
    setFlowGeoFilter(null);
    setFlowTriggerImageSearch(false);
    setFlowTriggerIngest(false);
  }, []);

  // --- Demo flow: action dispatcher ---
  const handleFlowAction = useCallback((action: FlowAction) => {
    switch (action.type) {
      case 'type-hero-query':
        setViewMode('travel');
        setFlowHeroQuery(action.query);
        break;
      case 'navigate':
        if (action.station === 'home') {
          setViewMode('travel');
        } else {
          setViewMode('demo');
          setStation(action.station as Station);
          // Reset rank reveal — false on entry (un-reveal), null when leaving
          if (action.station === 'rank') setFlowRankReveal(false);
          else setFlowRankReveal(null);
        }
        break;
      case 'set-find-query':
        setViewMode('demo');
        setStation('find');
        // Null then set to allow re-triggering same query
        setFlowFindQuery(null);
        flowFindQueryKey.current += 1;
        requestAnimationFrame(() => setFlowFindQuery(action.query));
        break;
      case 'set-rank-reveal':
        setFlowRankReveal(action.enabled);
        break;
      case 'set-geo-filter':
        setFlowGeoFilter(action.enabled);
        break;
      case 'open-agent':
        setSplitInitialMessage(action.query || undefined);
        setViewMode('split');
        break;
      case 'close-agent':
        setViewMode('travel');
        setSplitInitialMessage(undefined);
        break;
      case 'trigger-image-search':
        setFlowTriggerImageSearch(true);
        break;
      case 'trigger-ingest':
        setFlowTriggerIngest(true);
        break;
      case 'add-first-agent-hotel':
        setAddFirstHotelSignal(prev => prev + 1);
        break;
      case 'wait':
        break;
    }
  }, []);

  const flow = useDemoFlow(handleFlowAction, resetFlowState);

  const startFlow = useCallback(() => {
    resetFlowState();
    setDemoMode(true);
    flow.start();
  }, [flow, resetFlowState]);

  const exitFlow = useCallback(() => {
    resetFlowState();
    flow.exit();
  }, [flow, resetFlowState]);

  return (
    <DemoModeContext.Provider value={demoMode}>
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
        {demoMode && <DemoModeBanner onDisable={disableDemo} />}

        {viewMode === 'travel' || viewMode === 'split' ? (
          <TravelHome
            onShowDemo={() => setViewMode('demo')}
            onSelectStation={(s) => { setViewMode('demo'); setStation(s); }}
            onOpenAgent={(query?: string, imageFile?: File) => { setSplitInitialMessage(query || undefined); setSplitInitialImageFile(imageFile || undefined); setViewMode('split'); }}
            theme={theme}
            onToggleTheme={toggleTheme}
            demoMode={demoMode}
            onToggleDemo={toggleDemo}
            cart={cart}
            setCart={setCart}
            isFlowing={flow.isFlowing}
            onStartFlow={startFlow}
            onExitFlow={exitFlow}
            flowHeroQuery={flowHeroQuery}
            onFlowHeroQueryConsumed={() => setFlowHeroQuery(null)}
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
              isFlowing={flow.isFlowing}
              onStartFlow={startFlow}
              onExitFlow={exitFlow}
            />
            <StationNav active={station} onSelect={setStation} />
            <StationInfoBand station={station} onOpenDrawer={() => setDrawerOpen(true)} />
            <StationDetailDrawer station={station} isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
            <main className={`flex-1 max-w-6xl mx-auto w-full px-6 py-8 ${flow.isFlowing ? 'pb-20' : ''}`}>
              {station === 'ingest' && (
                <IngestStation
                  demoMode={demoMode}
                  flowTriggerRun={flowTriggerIngest}
                  onFlowTriggerRunConsumed={() => setFlowTriggerIngest(false)}
                />
              )}
              {station === 'find' && (
                <FindStation
                  demoMode={demoMode}
                  onResultsChange={hotels => setFindResults(hotels)}
                  pendingQuery={pendingFindQuery}
                  onPendingQueryConsumed={() => setPendingFindQuery(null)}
                  flowQuery={flowFindQuery}
                  onFlowQueryConsumed={() => setFlowFindQuery(null)}
                  flowTriggerImageSearch={flowTriggerImageSearch}
                  onFlowImageSearchConsumed={() => setFlowTriggerImageSearch(false)}
                  flowGeoFilter={flowGeoFilter}
                  onFlowGeoFilterConsumed={() => setFlowGeoFilter(null)}
                />
              )}
              {station === 'rank' && (
                <RankStation
                  demoMode={demoMode}
                  onTopRanked={setTopRanked}
                  flowRankReveal={flowRankReveal}
                  onFlowRankRevealConsumed={() => setFlowRankReveal(null)}
                />
              )}
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
              {station === 'industries' && <IndustriesStation />}
              {station === 'omni' && <OmniStation demoMode={demoMode} />}
              {station === 'wrapup' && <WrapUpStation />}
            </main>
          </div>
        )}
      </div>

      {/* Split-view concierge — full-screen 65/35 layout; owns its own hotel modal + cart */}
      {viewMode === 'split' && (
        <TravelSplitView
          initialMessage={splitInitialMessage}
          initialImageFile={splitInitialImageFile}
          onClose={() => { setViewMode('travel'); setSplitInitialImageFile(undefined); }}
          cart={cart}
          setCart={setCart}
          addFirstHotelSignal={addFirstHotelSignal}
        />
      )}

      {/* AI Concierge modal overlay — demo view only */}
      {showAgentChat && viewMode === 'demo' && (
        <AgentChat
          onClose={() => setShowAgentChat(false)}
          onOpenHotel={openHotelFromChat}
        />
      )}

      <DemoFlowOverlay
        isFlowing={flow.isFlowing}
        stepIndex={flow.stepIndex}
        totalSteps={flow.totalSteps}
        currentLabel={flow.currentLabel}
        stepReady={flow.stepReady}
      />

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
