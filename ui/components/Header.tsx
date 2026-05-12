'use client';

import { Globe2, ToggleLeft, ToggleRight, Sun, Moon, Layers } from 'lucide-react';

interface HeaderProps {
  demoMode: boolean;
  onToggleDemo: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  viewMode: 'travel' | 'demo';
  onToggleView: () => void;
  isFlowing?: boolean;
  onStartFlow?: () => void;
  onExitFlow?: () => void;
}

export default function Header({ demoMode, onToggleDemo, theme, onToggleTheme, viewMode, onToggleView, isFlowing, onStartFlow, onExitFlow }: HeaderProps) {
  return (
    <header
      className="flex items-center justify-between px-6 py-4 border-b"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}
    >
      {/* Logo + title */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--elastic-blue)' }}
        >
          <Globe2 className="w-5 h-5" style={{ color: '#fff' }} />
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Horizon
          </span>
          <span className="ml-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            Travel Search · Powered by Jina AI on Elastic
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* Partner badges */}
        <div className="hidden md:flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="px-2 py-1 rounded" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            Elastic
          </span>
          <span className="px-2 py-1 rounded" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            Jina AI
          </span>
        </div>

        {/* How it works / Back to site toggle */}
        <button
          onClick={onToggleView}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: viewMode === 'demo' ? 'rgba(0,119,204,0.12)' : 'var(--bg-card)',
            border: `1.5px solid ${viewMode === 'demo' ? 'var(--elastic-blue)' : 'var(--border)'}`,
            color: viewMode === 'demo' ? 'var(--elastic-blue)' : 'var(--text-secondary)',
          }}
        >
          <Layers className="w-4 h-4" />
          {viewMode === 'demo' ? '← Travel Site' : 'How It Works'}
        </button>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-lg transition-all"
          style={{
            background: 'var(--bg-card)',
            border: '1.5px solid var(--border)',
            color: 'var(--text-secondary)',
          }}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Flow mode button — only in demoMode */}
        {demoMode && (
          <button
            onClick={isFlowing ? onExitFlow : onStartFlow}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
            style={{
              background: isFlowing ? 'rgba(0,119,204,0.18)' : 'rgba(0,119,204,0.10)',
              border: `1.5px solid var(--elastic-blue)`,
              color: 'var(--elastic-blue)',
            }}
          >
            {isFlowing ? '■ EXIT' : '▶ FLOW'}
          </button>
        )}

        {/* Demo mode toggle */}
        <button
          data-bp-chip="gold"
          onClick={onToggleDemo}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: demoMode ? 'rgba(254,197,20,0.15)' : 'var(--bg-card)',
            border: `1.5px solid ${demoMode ? 'var(--elastic-gold)' : 'var(--border)'}`,
            color: demoMode ? 'var(--elastic-gold)' : 'var(--text-secondary)',
          }}
        >
          {demoMode ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
          Fallback
        </button>
      </div>
    </header>
  );
}
