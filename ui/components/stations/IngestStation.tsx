'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader2, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import JinaCallout from '@/components/JinaCallout';
import { apiUrl } from '@/lib/api';
import HotelCard from '@/components/HotelCard';
import ModelBadge from '@/components/shared/ModelBadge';
import type { IngestStep, Hotel } from '@/lib/types';

function renderJson(json: string): React.ReactNode[] {
  const TOKEN_RE = /("(?:\\u[0-9a-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = TOKEN_RE.exec(json)) !== null) {
    if (match.index > last) {
      nodes.push(<span key={i++} style={{ color: 'var(--text-muted)' }}>{json.slice(last, match.index)}</span>);
    }
    const token = match[0];
    let color: string;
    if (token.endsWith(':') || (match[2] !== undefined && match[2].trim() === ':')) {
      color = 'var(--elastic-purple)';
    } else if (token.startsWith('"')) {
      color = 'var(--text-primary)';
    } else if (token === 'true' || token === 'false' || token === 'null') {
      color = 'var(--elastic-pink)';
    } else {
      color = 'var(--code-number)';
    }
    nodes.push(<span key={i++} style={{ color }}>{token}</span>);
    last = match.index + token.length;
  }
  if (last < json.length) {
    nodes.push(<span key={i++} style={{ color: 'var(--text-muted)' }}>{json.slice(last)}</span>);
  }
  return nodes;
}

const DEMO_URLS = [
  'https://www.venetianlasvegas.com',
  'https://www.bellagio.com',
  'https://www.mgmgrand.com',
];

const RAW_HTML_SAMPLE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="google-site-verification" content="qXs4R2yP8kLmN3fT7wVbJcOdEuHiAaZg">
  <link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/fonts/inter-v13-latin-700.woff2">
  <link rel="stylesheet" href="/assets/css/main.bundle.f8a3c1d.min.css">
  <script type="text/javascript">
    window.__INITIAL_STATE__ = {"config":{"env":"production","cdnBase":"https://assets.cdn.venetian.com/v4","tracking":{"ga4":"G-X8Z2Q9LWMR","gtm":"GTM-K7F3P2X","fbPixel":"892341765012834","hotjar":"3847291"}},"user":{"isLoggedIn":false,"loyaltyTier":null},"session":{"id":"6f2c9d1e-4b8a-4f7c-9e3d-2a1b5c8d0f3e","csrf":"8fK2mN9pLxR4vT7wQ1jY3uA6bE5hD0cZ"}};
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-K7F3P2X');
  </script>
</head>
<body class="page-home has-hero" data-page-type="homepage" data-property="venetian-lv">
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-K7F3P2X" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<div id="skip-links"><a href="#main-content" class="skip-link sr-only focusable">Skip to main content</a><a href="#footer" class="skip-link sr-only focusable">Skip to footer</a></div>
<header class="site-header site-header--transparent" role="banner" aria-label="Site header">
  <div class="header__inner container--fluid">
    <a href="/" class="header__logo" aria-label="The Venetian Resort Las Vegas - Home">
      <img src="/assets/img/logo-venetian-white.svg" alt="The Venetian Resort" width="180" height="48" loading="eager">
    </a>
    <nav class="nav-primary" role="navigation" aria-label="Primary navigation">
      <ul class="nav-primary__list" role="list">
        <li class="nav-item nav-item--has-mega" data-nav="rooms"><a href="/rooms" class="nav-item__link" aria-haspopup="true" aria-expanded="false">Rooms &amp; Suites <span class="nav-item__chevron" aria-hidden="true">&#x25BE;</span></a>
          <div class="mega-menu" role="region" aria-label="Rooms submenu">
            <ul><li><a href="/rooms/standard-suite">Standard Suite</a></li><li><a href="/rooms/luxury-suite">Luxury Suite</a></li><li><a href="/rooms/palazzo-suite">Palazzo Suite</a></li><li><a href="/rooms/grand-suite">Grand Suite</a></li><li><a href="/rooms/penthouse">Penthouse Collection</a></li></ul>
          </div>
        </li>
        <li class="nav-item nav-item--has-mega" data-nav="dining"><a href="/dining" class="nav-item__link">Dining <span class="nav-item__chevron" aria-hidden="true">&#x25BE;</span></a></li>
        <li class="nav-item nav-item--has-mega" data-nav="entertainment"><a href="/entertainment" class="nav-item__link">Entertainment <span aria-hidden="true">&#x25BE;</span></a></li>
        <li class="nav-item" data-nav="casino"><a href="/casino" class="nav-item__link">Casino</a></li>
        <li class="nav-item" data-nav="meetings"><a href="/meetings-events" class="nav-item__link">Meetings &amp; Events</a></li>
        <li class="nav-item" data-nav="spa"><a href="/spa-wellness" class="nav-item__link">Spa &amp; Pool</a></li>
        <li class="nav-item" data-nav="offers"><a href="/offers" class="nav-item__link">Offers</a></li>
      </ul>
    </nav>
    <div class="header__actions"><a href="/reservations" class="btn btn--primary btn--sm" data-track="header-book-now">Book Now</a><a href="/account/login" class="btn btn--ghost btn--sm" data-track="header-signin">Sign In</a></div>
  </div>
</header>
<main id="main-content" class="site-main">
  <section class="hero hero--fullscreen" data-component="hero-slider" aria-label="Featured promotions">
    <div class="hero__slides swiper-container" data-autoplay="5000">
      <div class="swiper-wrapper">
        <div class="swiper-slide hero__slide" data-index="0"><picture><source srcset="https://assets.cdn.venetian.com/v4/hero/spring-offer-2x.webp 2x, https://assets.cdn.venetian.com/v4/hero/spring-offer-1x.webp 1x" type="image/webp"><img src="https://assets.cdn.venetian.com/v4/hero/spring-offer-fallback.jpg" alt="" role="presentation" loading="eager" fetchpriority="high" width="1920" height="1080"></picture></div>
      </div>
    </div>
  </section>`;

interface IngestStationProps {
  demoMode: boolean;
  flowTriggerRun?: boolean;
  onFlowTriggerRunConsumed?: () => void;
}

type TransformTab = 'raw' | 'reader' | 'indexed';

const TAB_LABELS: { id: TransformTab; label: string }[] = [
  { id: 'raw', label: '🌐 Raw HTML' },
  { id: 'reader', label: '📄 Jina Reader' },
  { id: 'indexed', label: '🗃️ Indexed Fields' },
];

export default function IngestStation({ demoMode, flowTriggerRun, onFlowTriggerRunConsumed }: IngestStationProps) {
  const [url, setUrl] = useState(DEMO_URLS[0]);
  const [steps, setSteps] = useState<IngestStep[]>([]);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Hotel | null>(null);
  const [rawMarkdown, setRawMarkdown] = useState<string | null>(null);
  const [transformTab, setTransformTab] = useState<TransformTab>('raw');
  const [expanded, setExpanded] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setExpanded(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

  const run = async () => {
    setSteps([]);
    setCompletedSteps(new Set());
    setResult(null);
    setRawMarkdown(null);
    setTransformTab('raw');
    setExpanded(false);
    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/ingest'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, demoMode }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6)) as IngestStep;
              if (event.step === 'reader_output') {
                setRawMarkdown((event.detail?.markdown as string) ?? null);
                continue;
              }
              setSteps(prev => {
                const existing = prev.findIndex(s => s.step === event.step);
                if (existing >= 0) {
                  const updated = [...prev];
                  updated[existing] = event;
                  return updated;
                }
                return [...prev, event];
              });
              if (event.status === 'done') {
                setCompletedSteps(prev => { const next = new Set(prev); next.add(event.step); return next; });
              }
              if (event.step === 'complete' && event.detail) {
                setResult(event.detail as unknown as Hotel);
              }
            } catch { /* skip malformed */ }
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!flowTriggerRun) return;
    run();
    onFlowTriggerRunConsumed?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowTriggerRun]);

  const clearIndex = async () => {
    setClearConfirm(false);
    setClearing(true);
    setClearSuccess(false);
    setExpanded(false);
    try {
      const res = await fetch(apiUrl('/api/ingest/clear'), { method: 'DELETE' });
      if (res.ok) {
        setClearSuccess(true);
        setSteps([]);
        setResult(null);
        setRawMarkdown(null);
      }
    } finally {
      setClearing(false);
    }
  };

  const getStepIcon = (step: IngestStep) => {
    if (completedSteps.has(step.step) || step.status === 'done') {
      return <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--elastic-teal)' }} />;
    }
    if (step.status === 'error') {
      return <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--elastic-pink)' }} />;
    }
    return <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" style={{ color: 'var(--elastic-teal)' }} />;
  };

  const indexedFieldsPreview = result ? {
    name: result.name,
    descriptions: result.descriptions,
    amenities: result.amenities,
    style: result.style,
    price_tier: result.price_tier,
    price_per_night_usd: result.price_per_night_usd,
    location: result.location,
    location_name: result.location_name,
    rating: result.rating,
  } : null;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h2 style={{ color: 'var(--text-primary)' }}>Ingest</h2>
          <ModelBadge model="Reader" api="jina" />
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>
          Jina Reader fetches any URL and returns clean, structured markdown — ready to index.
        </p>
      </div>

      <JinaCallout
        model="Reader"
        loading={loading}
        loadingMessage="Jina Reader is fetching the page and converting it to clean markdown right now..."
        doneMessage="Reader returned structured markdown. Zero parsing code needed — just clean content."
      />

      {/* URL input */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://hotel-website.com"
            className="flex-1 px-4 py-3 rounded-xl text-base outline-none"
            style={{
              background: 'var(--bg-card)',
              border: '1.5px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
          <button
            data-bp-primary
            onClick={run}
            disabled={loading || clearing || !url.trim()}
            className="px-6 py-3 rounded-xl font-semibold text-base transition-all disabled:opacity-50"
            style={{ background: '#FEC514', color: '#07101F' }}
          >
            {loading ? 'Fetching...' : 'Fetch & Ingest'}
          </button>
          <button
            onClick={() => setClearConfirm(true)}
            disabled={loading || clearing}
            title="Clear index"
            className="px-4 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
            style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {DEMO_URLS.map(u => (
            <button
              data-bp-chip="gold"
              key={u}
              onClick={() => setUrl(u)}
              className="text-sm px-3 py-1 rounded-full transition-colors"
              style={{
                background: url === u ? 'rgba(254,197,20,0.15)' : 'var(--bg-card)',
                border: `1px solid ${url === u ? 'var(--elastic-gold)' : 'var(--border)'}`,
                color: url === u ? 'var(--elastic-gold)' : 'var(--text-secondary)',
              }}
            >
              {u.replace('https://www.', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Clear confirmation */}
      {clearConfirm && (
        <div data-bp-card="pink" className="p-4 rounded-xl" style={{ background: 'rgba(240,78,152,0.1)', border: '1px solid rgba(240,78,152,0.3)' }}>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--elastic-pink)' }}>
            Clear the entire hotel index?
          </p>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            This deletes all 150+ hotels from Elasticsearch. You will need to re-ingest them one by one using Fetch &amp; Ingest above, or re-run the indexing pipeline.
          </p>
          <div className="flex gap-2">
            <button
              onClick={clearIndex}
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: 'var(--elastic-pink)', color: '#fff' }}
            >
              Yes, clear index
            </button>
            <button
              onClick={() => setClearConfirm(false)}
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Clear success notice */}
      {clearSuccess && (
        <div data-bp-card="teal" className="p-4 rounded-xl text-sm" style={{ background: 'rgba(0,191,179,0.1)', border: '1px solid rgba(0,191,179,0.3)', color: 'var(--elastic-teal)' }}>
          Index cleared. Use Fetch &amp; Ingest above to re-add hotels one at a time, or re-run <code className="text-xs px-1 rounded" style={{ background: 'var(--bg-surface)' }}>make index</code> to restore all 150+.
        </div>
      )}

      {/* Progress steps */}
      {steps.length > 0 && (
        <div className="space-y-2 p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              {getStepIcon(step)}
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{step.message}</p>
                {step.detail && Object.keys(step.detail).length > 0 && step.step !== 'complete' && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {JSON.stringify(step.detail).slice(0, 120)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Result hotel card — static display */}
      {result && (
        <div>
          <h3 className="mb-3" style={{ color: 'var(--text-secondary)' }}>Ingested Hotel</h3>
          <HotelCard hotel={result} index={0} />
        </div>
      )}

      {/* Content Transformation panel */}
      {result && (
        <>
          {/* Backdrop when expanded */}
          {expanded && (
            <div
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.5)' }}
              onClick={() => setExpanded(false)}
            />
          )}

          <div
            className={`card-enter overflow-hidden${expanded ? '' : ' rounded-xl'}`}
            style={expanded
              ? { position: 'fixed', inset: '3vh 2vw', zIndex: 50, display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', border: '1px solid var(--border)' }
              : { border: '1px solid var(--border)' }
            }
          >
            {/* Header */}
            <div className="px-4 pt-4 pb-0 flex-shrink-0" style={{ background: 'var(--bg-card)' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  Content Transformation
                </p>
                <button
                  onClick={() => setExpanded(e => !e)}
                  title={expanded ? 'Collapse' : 'Expand'}
                  className="p-1 rounded transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center gap-0">
                {TAB_LABELS.map((tab, i) => (
                  <div key={tab.id} className="flex items-center">
                    <button
                      onClick={() => setTransformTab(tab.id)}
                      className="px-4 py-2 text-sm font-medium transition-all"
                      style={{
                        background: transformTab === tab.id ? 'var(--bg-surface)' : 'transparent',
                        color: transformTab === tab.id ? 'var(--elastic-gold)' : 'var(--text-muted)',
                        borderBottom: transformTab === tab.id ? '2px solid var(--elastic-gold)' : '2px solid transparent',
                      }}
                    >
                      {tab.label}
                    </button>
                    {i < TAB_LABELS.length - 1 && (
                      <span className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div
              className="overflow-auto font-mono text-xs leading-relaxed p-4"
              style={{
                background: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                ...(expanded ? { flex: '1 1 auto', minHeight: 0 } : { maxHeight: '320px' }),
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {transformTab === 'raw' && RAW_HTML_SAMPLE}
              {transformTab === 'reader' && (
                rawMarkdown
                  ? rawMarkdown.length > 3000
                    ? rawMarkdown.slice(0, 3000) + '\n\n… (truncated)'
                    : rawMarkdown
                  : '— No reader output captured —'
              )}
              {transformTab === 'indexed' && renderJson(JSON.stringify(indexedFieldsPreview, null, 2))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
