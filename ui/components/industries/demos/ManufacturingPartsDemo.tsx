'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StepProgressBar from '../StepProgressBar';

const PARTS = [
  { id: 'P-2847-A', name: 'Pressure Relief Sensor', score: 0.97, match: true, desc: 'M18×1.5 thread, IP67, 0–10 bar' },
  { id: 'P-2847-B', name: 'Pressure Relief Sensor (Legacy)', score: 0.81, match: false, desc: 'M18×1.5 thread, IP65, 0–6 bar' },
  { id: 'P-3012-C', name: 'Temp/Pressure Combo Sensor', score: 0.74, match: false, desc: 'M22×1.5, dual output, 0–16 bar' },
  { id: 'P-1905-F', name: 'Differential Pressure Sensor', score: 0.61, match: false, desc: 'Flange mount, 4–20mA output' },
];

const VECTOR_DIMS = [0.82, -0.34, 0.61, 0.17, -0.71, 0.44, 0.09, -0.53];

const STEPS = ['drop', 'encode', 'results', 'summary'];

export default function ManufacturingPartsDemo() {
  const [step, setStep] = useState(0);
  const [dimIdx, setDimIdx] = useState(0);

  useEffect(() => {
    if (step === 0) { const t = setTimeout(() => setStep(1), 1800); return () => clearTimeout(t); }
    if (step === 1) {
      const t = setTimeout(() => setStep(2), 2200);
      const d = setInterval(() => setDimIdx(i => (i + 1) % VECTOR_DIMS.length), 180);
      return () => { clearTimeout(t); clearInterval(d); };
    }
    if (step === 2) { const t = setTimeout(() => setStep(3), 3000); return () => clearTimeout(t); }
  }, [step]);

  const advance = () => { if (step < STEPS.length - 1) setStep(s => s + 1); };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <StepProgressBar total={STEPS.length} current={step} accentColor="#00BFB3" />
        {step < STEPS.length - 1 && (
          <button onClick={advance} className="text-xs text-white/50 hover:text-white/80 transition-colors">Skip →</button>
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
                className="h-1 rounded-full mt-2" style={{ background: '#00BFB3' }} />
            </div>
            <p className="text-xs text-white/40">Mechanic doesn't know the part name — just snapped a photo</p>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="encode" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center gap-5">
            <div className="flex flex-col items-center gap-3">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-10 h-10 rounded-full border-2" style={{ borderColor: '#00BFB3', borderTopColor: 'transparent' }} />
              <p className="text-sm font-medium" style={{ color: '#00BFB3' }}>CLIP v2 encoding…</p>
              <p className="text-xs text-white/40">Image → 1024-dim multimodal vector</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 w-full max-w-xs font-mono text-xs text-center">
              <p className="text-white/40 mb-1">vector[{dimIdx}]</p>
              <motion.p key={dimIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold" style={{ color: '#00BFB3' }}>
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
                  borderColor: p.match ? '#00BFB3' : 'rgba(255,255,255,0.08)',
                  background: p.match ? 'rgba(0,191,179,0.08)' : 'rgba(255,255,255,0.03)',
                }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {p.match && <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: '#00BFB320', color: '#00BFB3' }}>EXACT MATCH</span>}
                    <span className={`text-sm font-medium ${p.match ? 'text-white' : 'text-white/50'}`}>{p.name}</span>
                  </div>
                  <span className="text-xs font-mono" style={{ color: p.match ? '#00BFB3' : 'rgba(255,255,255,0.3)' }}>{p.score}</span>
                </div>
                <div className="flex gap-3 text-xs text-white/40">
                  <span className="font-mono">{p.id}</span>
                  <span>{p.desc}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="text-6xl">✅</div>
            <div className="text-center">
              <p className="text-xl font-bold text-white mb-2">P-2847-A found</p>
              <p className="text-sm text-white/60">Pressure Relief Sensor · M18×1.5 · IP67</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center w-full max-w-sm">
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-2xl font-bold" style={{ color: '#00BFB3' }}>0</p>
                <p className="text-xs text-white/40 mt-1">manual lookups</p>
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-2xl font-bold text-white">30s</p>
                <p className="text-xs text-white/40 mt-1">vs. 10 min before</p>
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-2xl font-bold" style={{ color: '#00BFB3' }}>0.97</p>
                <p className="text-xs text-white/40 mt-1">visual similarity</p>
              </div>
            </div>
            <p className="text-sm text-white/50 text-center max-w-xs">No part name. No manual number. CLIP v2 matched the field photo to the exact component.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
