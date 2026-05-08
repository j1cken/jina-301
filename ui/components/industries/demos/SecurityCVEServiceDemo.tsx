'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StepProgressBar from '../StepProgressBar';
import DemoSummarySlide from '../DemoSummarySlide';
import type { DemoComponentProps } from '../DemoModal';
import type { InteractiveCardData } from '@/lib/industriesData';

const CVE_DESCRIPTION = 'Remote code execution via string interpolation in Apache Commons Text ≤ 1.9. Unauthenticated attackers can execute arbitrary code by crafting malicious strings processed by StringSubstitutor.';

const SERVICE_MATCHES = [
  {
    rank: 1,
    name: 'notification-svc',
    team: 'Platform / Messaging',
    desc: 'Sends transactional emails and push alerts using Apache Commons Text for template variable substitution in message bodies.',
    score: 0.94,
    top: true,
    keywordHit: false,
  },
  {
    rank: 2,
    name: 'report-generator',
    team: 'Analytics / Data',
    desc: 'Generates PDF and CSV reports. Uses Commons Lang utilities including text processing helpers for field formatting.',
    score: 0.81,
    top: false,
    keywordHit: false,
  },
  {
    rank: 3,
    name: 'template-engine-api',
    team: 'Frontend Platform',
    desc: 'Server-side rendering for marketing pages. Bundles several Apache Commons libraries for HTML sanitization.',
    score: 0.76,
    top: false,
    keywordHit: false,
  },
];

const STEPS = ['cve', 'search', 'matches', 'ticket', 'summary'];
const ACCENT = '#F04E98';

export default function SecurityCVEServiceDemo({ card, autoPlay, advanceTick, restartTick }: DemoComponentProps) {
  const interactiveCard = card as InteractiveCardData;
  const [step, setStep] = useState(0);
  const [rankProgress, setRankProgress] = useState(0);
  const hasAdvancedOnce = useRef(false);

  const advance = () => {
    setStep(s => {
      if (s < STEPS.length - 1) { hasAdvancedOnce.current = true; return s + 1; }
      return s;
    });
  };

  // Reranking progress animation when on step 1
  useEffect(() => {
    if (step !== 1) { setRankProgress(0); return; }
    let p = 0;
    const t = setInterval(() => {
      p += 3;
      setRankProgress(Math.min(p, 100));
      if (p >= 100) clearInterval(t);
    }, 50);
    return () => clearInterval(t);
  }, [step]);

  // Auto-play
  useEffect(() => {
    if (!autoPlay) return;
    if (step >= STEPS.length - 1) return;
    const delay = step === 1 ? 3500 : 2500;
    const t = setTimeout(advance, delay);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, autoPlay]);

  // Restart
  useEffect(() => {
    if (restartTick === 0 || !autoPlay) return;
    if (step >= STEPS.length - 1) return;
    const delay = step === 1 ? 3500 : 2500;
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
        {/* Step 0: New CVE */}
        {step === 0 && (
          <motion.div key="cve" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3 flex-1">
            <div className="rounded-lg p-4" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-red-400">CVE-2026-XXXX</span>
                <span className="text-xs px-2 py-0.5 rounded font-bold bg-red-500/25 text-red-300">CRITICAL · 9.8</span>
              </div>
              <p className="text-sm text-white/80 font-medium mb-2">Apache Commons Text — Remote Code Execution</p>
              <p className="text-xs text-white/55 leading-relaxed">{CVE_DESCRIPTION}</p>
            </div>
            <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-xs text-white/40 mb-1">Keyword search on service catalog</p>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-white/60">search: "Apache Commons Text"</span>
                <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/40">0 results</span>
              </div>
              <p className="text-xs text-white/30 mt-1">No service names mention the library — manual triage begins</p>
            </div>
            <p className="text-xs text-white/40 text-center">47 service owners. 9am. How many are at risk?</p>
          </motion.div>
        )}

        {/* Step 1: Semantic search + reranking */}
        {step === 1 && (
          <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4 flex-1 justify-center">
            <div className="flex flex-col gap-3">
              <div className="rounded-xl px-4 py-3" style={{ background: '#0077CC15', border: '1px solid #0077CC40' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: '#0077CC' }}>CVE description → Embeddings v5</p>
                <p className="text-xs font-mono text-white/55">.jina-embeddings-v5-text-small → 384-dim query vector</p>
              </div>
              <div className="rounded-xl px-4 py-3" style={{ background: ACCENT + '12', border: `1px solid ${ACCENT}35` }}>
                <p className="text-xs font-semibold mb-1" style={{ color: ACCENT }}>Reranker v3 → 47 service catalog entries</p>
                <p className="text-xs font-mono text-white/55">.jina-reranker-v3 · cross-attention scoring each service description</p>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-white/40">
                  <span>Scoring 47 services…</span>
                  <span className="font-mono">{rankProgress}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <motion.div className="h-full rounded-full" style={{ width: `${rankProgress}%`, background: ACCENT }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Match results */}
        {step === 2 && (
          <motion.div key="matches" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-2 flex-1">
            <p className="text-xs text-white/40 mb-1">Services at risk — ranked by semantic match to CVE</p>
            {SERVICE_MATCHES.map((svc, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.09 }}
                className="rounded-lg p-3"
                style={{
                  background: svc.top ? 'rgba(240,78,152,0.08)' : 'rgba(255,255,255,0.04)',
                  border: svc.top ? `1px solid ${ACCENT}40` : '1px solid rgba(255,255,255,0.08)',
                }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className={`text-sm font-medium font-mono ${svc.top ? 'text-white' : 'text-white/75'}`}>{svc.name}</p>
                      {svc.top && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: ACCENT + '20', color: ACCENT }}>keyword: 0 hits</span>
                      )}
                    </div>
                    <p className="text-xs text-white/35 mt-0.5">{svc.team}</p>
                  </div>
                  <span className="text-xs font-mono shrink-0 px-2 py-0.5 rounded" style={{ background: svc.top ? ACCENT + '20' : 'rgba(255,255,255,0.05)', color: svc.top ? ACCENT : 'rgba(255,255,255,0.35)' }}>
                    {svc.score}
                  </span>
                </div>
                <p className={`text-xs leading-relaxed ${svc.top ? 'text-white/65' : 'text-white/40'}`}>{svc.desc}</p>
              </motion.div>
            ))}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="mt-1 text-xs text-center text-white/40">
              Matched via <span className="text-white/70">tech stack description</span>, not service name — keyword search returned 0
            </motion.div>
          </motion.div>
        )}

        {/* Step 3: Patch ticket drafted */}
        {step === 3 && (
          <motion.div key="ticket" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4 flex-1">
            <div className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-white/40 font-semibold">Jira · Auto-drafted patch ticket</p>
                <span className="text-xs px-2 py-0.5 rounded font-bold bg-red-500/20 text-red-400">P0</span>
              </div>
              <p className="text-sm font-medium text-white mb-2">[CVE-2026-XXXX] Patch Apache Commons Text ≤1.9 in 3 services</p>
              <div className="flex flex-col gap-1 text-xs text-white/60">
                <div className="flex gap-2"><span className="text-white/30">Affected:</span><span>notification-svc · report-generator · template-engine-api</span></div>
                <div className="flex gap-2"><span className="text-white/30">Action:</span><span>Upgrade commons-text to ≥ 1.10.0</span></div>
                <div className="flex gap-2"><span className="text-white/30">Owners:</span><span className="text-emerald-400">notified ✓</span></div>
              </div>
            </div>
            <div className="flex gap-4 text-center justify-center">
              <div>
                <p className="text-2xl font-bold" style={{ color: ACCENT }}>3</p>
                <p className="text-xs text-white/40">services at risk found</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">47</p>
                <p className="text-xs text-white/40">services in catalog</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white/30">0</p>
                <p className="text-xs text-white/40">keyword matches</p>
              </div>
            </div>
            <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-xs text-white/60">Completed in minutes. <span className="text-white font-medium">Old approach:</span> day-long Slack thread asking 47 service owners.</p>
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
