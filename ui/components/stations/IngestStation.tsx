'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import JinaCallout from '@/components/JinaCallout';
import { apiUrl } from '@/lib/api';
import HotelCard from '@/components/HotelCard';
import HotelDetailModal from '@/components/HotelDetailModal';
import ModelBadge from '@/components/shared/ModelBadge';
import type { IngestStep, Hotel } from '@/lib/types';

const DEMO_URLS = [
  'https://www.venetianlasvegas.com',
  'https://www.bellagio.com',
  'https://www.mgmgrand.com',
];

interface IngestStationProps {
  demoMode: boolean;
}

export default function IngestStation({ demoMode }: IngestStationProps) {
  const [url, setUrl] = useState(DEMO_URLS[0]);
  const [steps, setSteps] = useState<IngestStep[]>([]);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Hotel | null>(null);
  const [selectedModal, setSelectedModal] = useState<Hotel | null>(null);
  const [clearing, setClearing] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  const run = async () => {
    setSteps([]);
    setCompletedSteps(new Set());
    setResult(null);
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

  const clearIndex = async () => {
    setClearConfirm(false);
    setClearing(true);
    setClearSuccess(false);
    try {
      const res = await fetch(apiUrl('/api/ingest/clear'), { method: 'DELETE' });
      if (res.ok) {
        setClearSuccess(true);
        setSteps([]);
        setResult(null);
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
        <div className="p-4 rounded-xl" style={{ background: 'rgba(240,78,152,0.1)', border: '1px solid rgba(240,78,152,0.3)' }}>
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
        <div className="p-4 rounded-xl text-sm" style={{ background: 'rgba(0,191,179,0.1)', border: '1px solid rgba(0,191,179,0.3)', color: 'var(--elastic-teal)' }}>
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

      {/* Result hotel card — clickable */}
      {result && (
        <div>
          <h3 className="mb-3" style={{ color: 'var(--text-secondary)' }}>Ingested Hotel</h3>
          <HotelCard hotel={result} index={0} onClick={setSelectedModal} />
        </div>
      )}

      {selectedModal && (
        <HotelDetailModal
          hotel={selectedModal}
          onClose={() => setSelectedModal(null)}
        />
      )}
    </div>
  );
}
