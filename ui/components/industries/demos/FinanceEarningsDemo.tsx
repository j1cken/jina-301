'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StepProgressBar from '../StepProgressBar';

const QUERY = 'AI infrastructure spend commitment Q4';

const KEYWORD_RESULTS = [
  { title: 'Q3 2024 Infrastructure Update', snippet: 'Infrastructure investments continue across all segments. Capital allocation remains consistent with prior guidance.', score: 0.31, dim: true },
  { title: 'FY2023 Annual Report — Capital Expenditure', snippet: 'Total capex of $18.2B was allocated across data centers, network infrastructure, and general operations.', score: 0.28, dim: true },
  { title: 'Q4 Investor Day — Opening Remarks', snippet: 'We remain committed to disciplined capital deployment as we navigate the current environment.', score: 0.24, dim: true },
  { title: 'Q2 2024 10-Q Filing — Risk Factors', snippet: 'Infrastructure spending may be impacted by supply chain disruptions and component shortages.', score: 0.21, dim: true },
];

const RERANKED_RESULTS = [
  { title: 'Q4 2024 Earnings Call — CFO Remarks', snippet: '"We are committing $4.2 billion to AI-specific data center infrastructure in Q4 alone, with a further $12B planned through 2026."', score: 0.97, highlight: true },
  { title: 'Q4 Investor Day — Opening Remarks', snippet: 'We remain committed to disciplined capital deployment as we navigate the current environment.', score: 0.41, dim: false },
  { title: 'Q3 2024 Infrastructure Update', snippet: 'Infrastructure investments continue across all segments. Capital allocation remains consistent with prior guidance.', score: 0.22, dim: true },
  { title: 'FY2023 Annual Report — Capital Expenditure', snippet: 'Total capex of $18.2B was allocated across data centers, network infrastructure, and general operations.', score: 0.18, dim: true },
];

const STEPS = [
  'query',
  'keyword',
  'reranking',
  'reranked',
];

export default function FinanceEarningsDemo() {
  const [step, setStep] = useState(0);
  const [typedQuery, setTypedQuery] = useState('');
  const [reranking, setReranking] = useState(false);

  // Auto-advance
  useEffect(() => {
    if (step === 0) {
      let i = 0;
      const t = setInterval(() => {
        i++;
        setTypedQuery(QUERY.slice(0, i));
        if (i >= QUERY.length) {
          clearInterval(t);
          setTimeout(() => setStep(1), 700);
        }
      }, 40);
      return () => clearInterval(t);
    }
    if (step === 1) {
      const t = setTimeout(() => setStep(2), 2500);
      return () => clearTimeout(t);
    }
    if (step === 2) {
      setReranking(true);
      const t = setTimeout(() => { setReranking(false); setStep(3); }, 1800);
      return () => clearTimeout(t);
    }
  }, [step]);

  const advance = () => { if (step < STEPS.length - 1) setStep(s => s + 1); };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <StepProgressBar total={STEPS.length} current={step} accentColor="#0077CC" />
        {step < STEPS.length - 1 && (
          <button onClick={advance} className="text-xs text-white/50 hover:text-white/80 transition-colors">
            Skip →
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 flex items-center gap-3">
        <span className="text-white/40 text-sm">🔍</span>
        <span className="text-sm font-mono text-white/90">
          {step === 0 ? typedQuery : QUERY}
          {step === 0 && <span className="animate-pulse">|</span>}
        </span>
        {step >= 1 && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded" style={{ background: '#0077CC20', color: '#0077CC' }}>
            {step >= 3 ? 'Reranked' : 'Semantic'}
          </span>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 flex flex-col gap-2 overflow-auto">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="keyword" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-2">
              <p className="text-xs text-white/40 mb-1">Keyword results — 47 matches</p>
              {KEYWORD_RESULTS.map((r, i) => (
                <motion.div key={r.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-white/60">{r.title}</span>
                    <span className="text-xs shrink-0 text-white/30">score: {r.score}</span>
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">{r.snippet}</p>
                </motion.div>
              ))}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="reranking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center flex-1 gap-4">
              <div className="flex flex-col items-center gap-3">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-10 h-10 rounded-full border-2 border-t-transparent" style={{ borderColor: '#F04E98', borderTopColor: 'transparent' }} />
                <div className="text-center">
                  <p className="text-sm font-medium" style={{ color: '#F04E98' }}>Reranker v3 processing…</p>
                  <p className="text-xs text-white/40 mt-1">Cross-attention scoring 47 candidates</p>
                </div>
              </div>
              <div className="flex gap-6 text-center">
                <div><p className="text-2xl font-bold text-white">47</p><p className="text-xs text-white/40">candidates</p></div>
                <div><p className="text-2xl font-bold" style={{ color: '#F04E98' }}>131K</p><p className="text-xs text-white/40">context window</p></div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="reranked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-2">
              <p className="text-xs text-white/40 mb-1">Reranker v3 results — re-scored by relevance</p>
              {RERANKED_RESULTS.map((r, i) => (
                <motion.div key={r.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="rounded-lg border p-3 transition-all"
                  style={{
                    borderColor: r.highlight ? '#F04E98' : 'rgba(255,255,255,0.1)',
                    background: r.highlight ? 'rgba(240,78,152,0.08)' : r.dim ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                  }}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className={`text-sm font-medium ${r.dim ? 'text-white/40' : 'text-white/90'}`}>{r.title}</span>
                    <span className="text-xs shrink-0 font-mono" style={{ color: r.highlight ? '#F04E98' : 'rgba(255,255,255,0.3)' }}>
                      {r.score}
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed ${r.dim ? 'text-white/30' : r.highlight ? 'text-white/80' : 'text-white/50'}`}>
                    {r.snippet}
                  </p>
                  {r.highlight && (
                    <div className="mt-2 flex gap-2">
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#F04E9820', color: '#F04E98' }}>
                        Reranker v3 surfaced this
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/50">
                        Was rank #47 in keyword
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className="mt-2 rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                <p className="text-xs text-white/60">Reranker v3 found the needle. Keyword search returned <span className="text-white font-medium">47 irrelevant matches</span> before it.</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
