'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StepProgressBar from '../StepProgressBar';
import DemoSummarySlide from '../DemoSummarySlide';
import type { DemoComponentProps } from '../DemoModal';
import type { InteractiveCardData } from '@/lib/industriesData';

const QUERY = 'connection pool exhausted after deploy';

const BM25_LOGS = [
  { rank: 1, msg: '[INFO] Connection pool initialized with max-active=50', match: true, dim: false },
  { rank: 2, msg: '[INFO] Connection pool health check passed at 14:01', match: true, dim: false },
  { rank: 3, msg: '[WARN] Connection pool usage at 80% threshold', match: true, dim: false },
  { rank: 8, msg: '[INFO] Pool configuration loaded from application.yaml', match: true, dim: true },
  { rank: 47, msg: '[ERROR] JDBC: timeout acquiring resource from pool — max active reached (50/50)', match: false, dim: true, key: true },
];

const RANKED_LOGS = [
  { rank: 1, was: 47, msg: '[ERROR] JDBC: timeout acquiring resource from pool — max active reached (50/50)', delta: 46, top: true },
  { rank: 2, was: 31, msg: '[ERROR] HikariCP: connection acquisition timed out after 30000ms', delta: 29, top: false },
  { rank: 3, was: 22, msg: '[WARN] DB wait queue depth: 148 — upstream pressure detected', delta: 19, top: false },
  { rank: 4, was: 1, msg: '[INFO] Connection pool initialized with max-active=50', delta: -3, top: false },
];

const STEPS = ['incident', 'bm25', 'reranking', 'ranked', 'resolution', 'summary'];
const ACCENT = '#00BFB3';

export default function OllyRCALogSearchDemo({ card, autoPlay, advanceTick, restartTick }: DemoComponentProps) {
  const interactiveCard = card as InteractiveCardData;
  const [step, setStep] = useState(0);
  const hasAdvancedOnce = useRef(false);

  const advance = () => {
    setStep(s => {
      if (s < STEPS.length - 1) { hasAdvancedOnce.current = true; return s + 1; }
      return s;
    });
  };

  // Auto-play: gate step transitions on autoPlay flag
  useEffect(() => {
    if (!autoPlay) return;
    if (step >= STEPS.length - 1) return;
    const delay = step === 2 ? 2000 : 2500;
    const t = setTimeout(advance, delay);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, autoPlay]);

  // Restart: when auto-play is toggled back on, restart current step timer
  useEffect(() => {
    if (restartTick === 0 || !autoPlay) return;
    if (step >= STEPS.length - 1) return;
    const delay = step === 2 ? 2000 : 2500;
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
        {/* Step 0: Incident alert */}
        {step === 0 && (
          <motion.div key="incident" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3 flex-1">
            <div className="rounded-lg px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <span className="text-sm">🚨</span>
              <div>
                <p className="text-xs font-bold text-red-400">PagerDuty Alert</p>
                <p className="text-sm text-white/80">checkout service p99 latency spike — 14:23 UTC</p>
              </div>
            </div>
            <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-white/40 font-mono">Window: 14:00 – 14:30 UTC</p>
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: ACCENT + '20', color: ACCENT }}>50 candidate logs</span>
              </div>
              <div className="flex flex-col gap-1">
                {[...Array(5)].map((_, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                    className="h-5 rounded" style={{ background: `rgba(255,255,255,${0.06 - i * 0.01})`, width: `${90 - i * 8}%` }} />
                ))}
              </div>
            </div>
            <p className="text-xs text-white/40 text-center">SRE needs to find the root cause — fast</p>
          </motion.div>
        )}

        {/* Step 1: BM25 results */}
        {step === 1 && (
          <motion.div key="bm25" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-2 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="rounded-lg px-3 py-1.5 flex-1" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="text-xs font-mono text-white/70">🔍 {QUERY}</span>
              </div>
              <span className="text-xs text-white/40">BM25 · 50 results</span>
            </div>
            {BM25_LOGS.map((log, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="rounded-lg p-2.5 flex items-start gap-2"
                style={{
                  background: log.key ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.04)',
                  border: log.key ? '1px solid rgba(239,68,68,0.15)' : '1px solid rgba(255,255,255,0.08)',
                }}>
                <span className="text-xs text-white/25 font-mono w-6 shrink-0">#{log.rank}</span>
                <span className={`text-xs font-mono leading-relaxed ${log.dim ? 'text-white/35' : log.match ? 'text-white/70' : 'text-white/50'}`}>
                  {log.msg}
                  {log.match && <span className="ml-1.5 text-xs px-1 rounded" style={{ background: '#FEC51420', color: '#FEC514' }}>keyword hit</span>}
                </span>
              </motion.div>
            ))}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="mt-1 text-xs text-center text-white/40">
              The root cause log is <span className="text-red-400 font-medium">buried at #47</span> — keyword matched generic pool docs instead
            </motion.div>
          </motion.div>
        )}

        {/* Step 2: Reranking spinner */}
        {step === 2 && (
          <motion.div key="reranking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center flex-1 gap-5">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-12 h-12 rounded-full border-2 border-t-transparent" style={{ borderColor: '#F04E98', borderTopColor: 'transparent' }} />
            <div className="text-center flex flex-col gap-1">
              <p className="text-sm font-semibold" style={{ color: '#F04E98' }}>Reranker v3 scoring…</p>
              <p className="text-xs font-mono text-white/40">.jina-reranker-v3 · rank_window_size: 50</p>
            </div>
            <div className="flex gap-8 text-center">
              <div><p className="text-2xl font-bold text-white">50</p><p className="text-xs text-white/40">candidates</p></div>
              <div><p className="text-2xl font-bold" style={{ color: '#F04E98' }}>50</p><p className="text-xs text-white/40">pairs scored</p></div>
              <div><p className="text-2xl font-bold" style={{ color: ACCENT }}>0</p><p className="text-xs text-white/40">re-indexed</p></div>
            </div>
            <p className="text-xs text-white/30">Cross-attention on raw log text — no ingest changes required</p>
          </motion.div>
        )}

        {/* Step 3: Reranked results */}
        {step === 3 && (
          <motion.div key="ranked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-2 flex-1">
            <p className="text-xs text-white/40 mb-1">Reranker v3 results — re-scored by semantic relevance</p>
            {RANKED_LOGS.map((log, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="rounded-lg p-3 flex items-start gap-2"
                style={{
                  background: log.top ? 'rgba(240,78,152,0.08)' : 'rgba(255,255,255,0.04)',
                  border: log.top ? '1px solid rgba(240,78,152,0.35)' : '1px solid rgba(255,255,255,0.08)',
                }}>
                <span className="text-xs font-mono w-5 shrink-0" style={{ color: log.top ? '#F04E98' : 'rgba(255,255,255,0.25)' }}>#{log.rank}</span>
                <span className={`text-xs font-mono leading-relaxed flex-1 ${log.top ? 'text-white/90' : 'text-white/45'}`}>{log.msg}</span>
                <span className={`text-xs shrink-0 px-1.5 py-0.5 rounded font-mono ${log.delta > 0 ? 'text-emerald-400' : 'text-white/30'}`}
                  style={{ background: log.delta > 0 ? 'rgba(16,185,129,0.12)' : 'transparent' }}>
                  {log.delta > 0 ? `+${log.delta}` : log.delta}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Step 4: Resolution */}
        {step === 4 && (
          <motion.div key="resolution" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4 flex-1">
            <div className="rounded-lg p-4" style={{ background: 'rgba(240,78,152,0.08)', border: '1px solid rgba(240,78,152,0.3)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#F04E98' }}>Root cause — surfaced from #47</p>
              <p className="text-xs font-mono text-white/80 leading-relaxed">
                [ERROR] JDBC: timeout acquiring resource from pool — max active reached (50/50)<br />
                <span className="text-white/40">14:11 UTC · checkout-service-7d9f8b · deploy 4a2c1e9</span>
              </p>
            </div>
            <div className="rounded-lg p-4" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <p className="text-xs text-emerald-400 font-semibold mb-1">DB connection leak introduced in deploy at 14:11 UTC</p>
              <p className="text-xs text-white/60">Rollback initiated. Pool max-active increased to 100 pending hotfix review.</p>
            </div>
            <div className="flex gap-6 justify-center text-center mt-2">
              <div>
                <p className="text-2xl font-bold" style={{ color: ACCENT }}>4 min</p>
                <p className="text-xs text-white/40">MTTR this incident</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white/30">45 min</p>
                <p className="text-xs text-white/40">typical without reranker</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 5: Summary */}
        {step === 5 && interactiveCard.summaryData && (
          <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1">
            <DemoSummarySlide data={interactiveCard.summaryData} card={card} accentColor={ACCENT} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
