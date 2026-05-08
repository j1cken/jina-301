'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StepProgressBar from '../StepProgressBar';
import DemoSummarySlide from '../DemoSummarySlide';
import type { DemoComponentProps } from '../DemoModal';
import type { InteractiveCardData } from '@/lib/industriesData';

const FINGERPRINT = 'payment-service · 5xx burst · downstream-only · started 02:14 UTC · no upstream correlation';

const MATCHES = [
  { score: 0.89, title: 'Stripe Webhook Retry Storm', date: 'Black Friday 2024', fix: 'Rate-limit webhook ingress + scale payment-service replicas', top: true },
  { score: 0.81, title: 'Payment TLS Cert Rotation', date: 'Mar 2025', fix: 'Certificate hot-reload triggered cascading TLS handshake timeouts', top: false },
  { score: 0.42, title: 'Kafka Consumer Lag — Analytics', date: 'Jan 2025', fix: 'Partition rebalance during broker maintenance window', top: false, dim: true },
];

const STEPS = ['anomaly', 'search', 'matches', 'rca', 'summary'];
const ACCENT = '#00BFB3';
const EMB_COLOR = '#0077CC';

export default function OllyMetricAnomalyDemo({ card, autoPlay, advanceTick, restartTick }: DemoComponentProps) {
  const interactiveCard = card as InteractiveCardData;
  const [step, setStep] = useState(0);
  const [searchProgress, setSearchProgress] = useState(0);
  const hasAdvancedOnce = useRef(false);

  const advance = () => {
    setStep(s => {
      if (s < STEPS.length - 1) { hasAdvancedOnce.current = true; return s + 1; }
      return s;
    });
  };

  // kNN search progress animation when on step 1
  useEffect(() => {
    if (step !== 1) { setSearchProgress(0); return; }
    let p = 0;
    const t = setInterval(() => {
      p += 4;
      setSearchProgress(Math.min(p, 100));
      if (p >= 100) clearInterval(t);
    }, 40);
    return () => clearInterval(t);
  }, [step]);

  // Auto-play
  useEffect(() => {
    if (!autoPlay) return;
    if (step >= STEPS.length - 1) return;
    const delay = step === 1 ? 3000 : 2500;
    const t = setTimeout(advance, delay);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, autoPlay]);

  // Restart
  useEffect(() => {
    if (restartTick === 0 || !autoPlay) return;
    if (step >= STEPS.length - 1) return;
    const delay = step === 1 ? 3000 : 2500;
    const t = setTimeout(advance, delay);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restartTick]);

  // Manual advance
  useEffect(() => {
    if (advanceTick === 0) return;
    advance();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advanceTick]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <StepProgressBar total={STEPS.length} current={step} accentColor={ACCENT} />
        {!autoPlay && step < STEPS.length - 1 && !hasAdvancedOnce.current && (
          <span className="text-xs text-white/30 italic">Press → or Next to advance</span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 0: ML anomaly detected */}
        {step === 0 && (
          <motion.div key="anomaly" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3 flex-1">
            <div className="rounded-lg p-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-red-400">Elastic ML Anomaly Job</p>
                <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-mono">severity: 94/100</span>
              </div>
              <p className="text-sm text-white/80 font-medium">payment-service error rate anomaly</p>
              <p className="text-xs text-white/40 mt-1">02:14 UTC · 5xx burst detected · downstream-only pattern</p>
            </div>
            <div className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-xs text-white/40 font-semibold mb-2">Auto-generated incident fingerprint</p>
              <p className="text-xs font-mono text-white/70 leading-relaxed">{FINGERPRINT}</p>
            </div>
            <p className="text-xs text-white/40 text-center mt-1">ML detected it — but can it explain it?</p>
          </motion.div>
        )}

        {/* Step 1: Embedding + kNN search */}
        {step === 1 && (
          <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4 flex-1 justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-xl px-4 py-3 w-full" style={{ background: EMB_COLOR + '15', border: `1px solid ${EMB_COLOR}40` }}>
                <p className="text-xs font-semibold mb-1" style={{ color: EMB_COLOR }}>Embedding fingerprint</p>
                <p className="text-xs font-mono text-white/60">.jina-embeddings-v5-text-small → 384-dim vector</p>
              </div>
              <div className="flex flex-col gap-1 w-full">
                <div className="flex justify-between text-xs text-white/40 mb-1">
                  <span>kNN → incidents-historical (312 postmortems)</span>
                  <span className="font-mono">{searchProgress}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <motion.div className="h-full rounded-full" style={{ width: `${searchProgress}%`, background: EMB_COLOR }} />
                </div>
              </div>
              <p className="text-xs text-white/30">Matching against pre-embedded postmortem corpus — no re-indexing</p>
            </div>
          </motion.div>
        )}

        {/* Step 2: Match results */}
        {step === 2 && (
          <motion.div key="matches" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-2 flex-1">
            <p className="text-xs text-white/40 mb-1">Top historical incident matches</p>
            {MATCHES.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="rounded-lg p-3"
                style={{
                  background: m.top ? 'rgba(0,191,179,0.08)' : m.dim ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                  border: m.top ? `1px solid ${ACCENT}40` : '1px solid rgba(255,255,255,0.08)',
                }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <p className={`text-sm font-medium ${m.dim ? 'text-white/35' : 'text-white/85'}`}>{m.title}</p>
                    <p className="text-xs text-white/35 mt-0.5">{m.date}</p>
                  </div>
                  <span className="text-xs font-mono shrink-0 px-2 py-0.5 rounded" style={{ background: m.top ? ACCENT + '20' : 'rgba(255,255,255,0.05)', color: m.top ? ACCENT : 'rgba(255,255,255,0.35)' }}>
                    {m.score}
                  </span>
                </div>
                {!m.dim && <p className="text-xs text-white/45 leading-relaxed">{m.fix}</p>}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Step 3: RCA applied */}
        {step === 3 && (
          <motion.div key="rca" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4 flex-1">
            <div className="rounded-lg p-4" style={{ background: 'rgba(0,191,179,0.08)', border: `1px solid ${ACCENT}40` }}>
              <p className="text-xs font-semibold mb-2" style={{ color: ACCENT }}>Match applied — Stripe Webhook Retry Storm (0.89)</p>
              <p className="text-sm text-white/80 leading-relaxed">Rate-limit webhook ingress + scale payment-service replicas</p>
            </div>
            <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-xs text-white/40 mb-2">Timeline</p>
              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex gap-2"><span className="text-white/30 font-mono w-12 shrink-0">02:14</span><span className="text-white/60">Elastic ML detects anomaly (severity 94)</span></div>
                <div className="flex gap-2"><span className="text-white/30 font-mono w-12 shrink-0">02:14</span><span className="text-white/60">Fingerprint embedded → kNN search returns top match</span></div>
                <div className="flex gap-2"><span className="text-white/30 font-mono w-12 shrink-0">02:15</span><span className="text-emerald-400">On-call applies fix from 2024 postmortem</span></div>
                <div className="flex gap-2"><span className="text-white/30 font-mono w-12 shrink-0">02:16</span><span className="text-emerald-400">Service restored · 90s total MTTR</span></div>
              </div>
            </div>
            <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-xs text-white/60">Elastic ML detected it. Jina + Elastic <span className="text-white font-medium">explained it.</span></p>
            </div>
          </motion.div>
        )}

        {/* Step 4: Summary */}
        {step === 4 && interactiveCard.summaryData && (
          <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1">
            <DemoSummarySlide data={interactiveCard.summaryData} card={card} accentColor={ACCENT} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
