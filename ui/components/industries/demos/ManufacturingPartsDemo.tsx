'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StepProgressBar from '../StepProgressBar';
import DemoSummarySlide from '../DemoSummarySlide';
import type { DemoComponentProps } from '../DemoModal';
import type { InteractiveCardData } from '@/lib/industriesData';

const PARTS = [
  { id: 'P-2847-A', name: 'Pressure Relief Sensor', score: 0.97, match: true, desc: 'M18×1.5 thread, IP67, 0–10 bar' },
  { id: 'P-2847-B', name: 'Pressure Relief Sensor (Legacy)', score: 0.81, match: false, desc: 'M18×1.5 thread, IP65, 0–6 bar' },
  { id: 'P-3012-C', name: 'Temp/Pressure Combo Sensor', score: 0.74, match: false, desc: 'M22×1.5, dual output, 0–16 bar' },
  { id: 'P-1905-F', name: 'Differential Pressure Sensor', score: 0.61, match: false, desc: 'Flange mount, 4–20mA output' },
];

const VECTOR_DIMS = [0.82, -0.34, 0.61, 0.17, -0.71, 0.44, 0.09, -0.53];

const STEPS = ['drop', 'encode', 'results', 'summary'];
const ACCENT = '#00BFB3';

export default function ManufacturingPartsDemo({ card, autoPlay, advanceTick, restartTick }: DemoComponentProps) {
  const interactiveCard = card as InteractiveCardData;
  const [step, setStep] = useState(0);
  const [dimIdx, setDimIdx] = useState(0);
  const hasAdvancedOnce = useRef(false);

  const advance = () => {
    setStep(s => {
      if (s < STEPS.length - 1) { hasAdvancedOnce.current = true; return s + 1; }
      return s;
    });
  };

  // dimIdx cycling animation — always runs on step 1, not gated
  useEffect(() => {
    if (step !== 1) return;
    const d = setInterval(() => setDimIdx(i => (i + 1) % VECTOR_DIMS.length), 180);
    return () => clearInterval(d);
  }, [step]);

  // Auto-advance step timers — gated on autoPlay
  useEffect(() => {
    if (!autoPlay) return;
    if (step >= STEPS.length - 1) return;
    const delays: Record<number, number> = { 0: 1800, 1: 2200, 2: 3000 };
    const t = setTimeout(advance, delays[step] ?? 2500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, autoPlay]);

  // Restart
  useEffect(() => {
    if (restartTick === 0 || !autoPlay) return;
    if (step >= STEPS.length - 1) return;
    const delays: Record<number, number> = { 0: 1800, 1: 2200, 2: 3000 };
    const t = setTimeout(advance, delays[step] ?? 2500);
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
        {step === 0 && (
          <motion.div key="drop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="rounded-xl border-2 border-dashed border-white/20 w-full max-w-sm p-8 flex flex-col items-center gap-3"
              style={{ background: 'rgba(0,191,179,0.04)' }}>
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 1.4 }} className="text-5xl">📸</motion.div>
              <p className="text-sm font-medium text-white/70">Field photo uploading…</p>
              <p className="text-xs text-white/40 text-center">Grainy phone shot taken under a car hood<br/>No part name. No manual number.</p>
              <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1.6, ease: 'linear' }}
                className="h-1 rounded-full mt-2" style={{ background: ACCENT }} />
            </div>
            <p className="text-xs text-white/40">Mechanic doesn&apos;t know the part name — just snapped a photo</p>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="encode" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center gap-5">
            <div className="flex flex-col items-center gap-3">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-10 h-10 rounded-full border-2" style={{ borderColor: ACCENT, borderTopColor: 'transparent' }} />
              <p className="text-sm font-medium" style={{ color: ACCENT }}>CLIP v2 encoding…</p>
              <p className="text-xs text-white/40">Image → 1024-dim multimodal vector</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 w-full max-w-xs font-mono text-xs text-center">
              <p className="text-white/40 mb-1">vector[{dimIdx}]</p>
              <motion.p key={dimIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold" style={{ color: ACCENT }}>
                {VECTOR_DIMS[dimIdx].toFixed(4)}
              </motion.p>
              <p className="text-white/30 mt-1">… 1024 dimensions total</p>
            </div>
            <p className="text-xs text-white/40 text-center">Searching 50,000 CAD library embeddings via kNN</p>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col gap-2">
            <p className="text-xs text-white/40 mb-1">Visual matches from CAD library — 50,000 parts indexed</p>
            {PARTS.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="rounded-lg border p-3"
                style={{
                  borderColor: p.match ? ACCENT : 'rgba(255,255,255,0.08)',
                  background: p.match ? 'rgba(0,191,179,0.08)' : 'rgba(255,255,255,0.03)',
                }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {p.match && <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: ACCENT + '20', color: ACCENT }}>EXACT MATCH</span>}
                    <span className={`text-sm font-medium ${p.match ? 'text-white' : 'text-white/50'}`}>{p.name}</span>
                  </div>
                  <span className="text-xs font-mono" style={{ color: p.match ? ACCENT : 'rgba(255,255,255,0.3)' }}>{p.score}</span>
                </div>
                <div className="flex gap-3 text-xs text-white/40">
                  <span className="font-mono">{p.id}</span>
                  <span>{p.desc}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {step === 3 && interactiveCard.summaryData && (
          <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1">
            <DemoSummarySlide data={interactiveCard.summaryData} card={card} accentColor={ACCENT} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
