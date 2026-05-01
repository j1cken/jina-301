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
import { DemoModeContext } from '@/lib/demoMode';
import type { Station, Hotel, RankedHotel, VlmAnalysis } from '@/lib/types';
import { apiUrl } from '@/lib/api';

type ViewMode = 'travel' | 'demo';
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

  const prewarmVlm = useCallback(() => {
    fetch(apiUrl('/api/vision'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: '', hotelId: '__prewarm', demoMode: false }),
    }).catch(() => { /* silent */ });
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
      {showAgentChat && <AgentChat onClose={() => setShowAgentChat(false)} />}
    </DemoModeContext.Provider>
  );
}
