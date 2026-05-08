'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import StepProgressBar from '../StepProgressBar';

const K = {
  bg: '#1D1E24',
  surface: '#25262E',
  border: '#343741',
  text: '#DFE5EF',
  muted: '#98A2B3',
  blue: '#0B64DD',
  green: '#008A5E',
  red: '#C61E25',
  yellow: '#FACB3D',
  teal: '#00BFB3',
};

const FLOOD_ALERTS = Array.from({ length: 18 }, (_, i) => ({
  id: `a${i}`,
  rule: i % 7 === 0 ? 'Disk Space Critical' : 'Heartbeat Missing',
  host: i % 7 === 0 ? `prod-disk-0${i % 5 + 1}` : `prod-web-${String(i + 1).padStart(2, '0')}`,
  severity: i % 7 === 0 ? 'high' : 'critical',
  time: `14:${String(Math.floor(i / 3)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}`,
}));

const CLUSTERS = [
  { id: 'cluster-a', label: 'Network Partition', count: 998, severity: 'critical', color: K.red, hosts: 'prod-web-01 … prod-web-1000', rootCause: 'Datacenter network switch failure — rack B3' },
  { id: 'cluster-b', label: 'Disk Space Critical', count: 5, severity: 'high', color: K.yellow, hosts: 'prod-disk-01, prod-disk-03, prod-disk-04, prod-disk-05, prod-disk-07', rootCause: 'Log rotation misconfigured after last deploy' },
];

const STEPS = ['flood', 'cluster', 'grouped', 'summary'];

export default function OllyAlertStormDemo() {
  const [step, setStep] = useState(0);
  const [visibleAlerts, setVisibleAlerts] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (step === 0) {
      setTotalCount(0);
      setVisibleAlerts(0);
      let i = 0;
      const t = setInterval(() => {
        i++;
        setVisibleAlerts(Math.min(i, FLOOD_ALERTS.length));
        setTotalCount(c => c + Math.floor(Math.random() * 80 + 40));
        if (i >= FLOOD_ALERTS.length + 4) { clearInterval(t); setTimeout(() => setStep(1), 500); }
      }, 120);
      countRef.current = t;
      return () => clearInterval(t);
    }
    if (step === 1) { const t = setTimeout(() => setStep(2), 2000); return () => clearTimeout(t); }
    if (step === 2) { const t = setTimeout(() => setStep(3), 3000); return () => clearTimeout(t); }
  }, [step]);

  const advance = () => { if (step < STEPS.length - 1) setStep(s => s + 1); };

  return (
    <div className="flex flex-col gap-3 h-full" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex items-center justify-between">
        <StepProgressBar total={STEPS.length} current={step} accentColor={K.blue} />
        {step < STEPS.length - 1 && (
          <button onClick={advance} className="text-xs transition-colors" style={{ color: K.muted }}>Skip →</button>
        )}
      </div>

      {/* Kibana top bar */}
      <div className="rounded-t-lg flex items-center gap-3 px-3 py-2 text-xs" style={{ background: K.surface, borderBottom: `1px solid ${K.border}` }}>
        <span style={{ color: K.muted }}>Kibana</span>
        <span style={{ color: K.border }}>›</span>
        <span style={{ color: K.text }}>Observability</span>
        <span style={{ color: K.border }}>›</span>
        <span style={{ color: K.blue }}>Alerts</span>
        {step === 0 && (
          <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 0.6 }}
            className="ml-auto text-xs px-2 py-0.5 rounded" style={{ background: K.red + '30', color: K.red }}>
            LIVE · {totalCount.toLocaleString()} alerts
          </motion.span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="flood" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 rounded-b-lg overflow-auto" style={{ background: K.bg, border: `1px solid ${K.border}`, borderTop: 'none' }}>
            <div className="grid text-xs px-2 py-1 font-mono sticky top-0" style={{ gridTemplateColumns: '70px 70px 1fr 120px', color: K.muted, background: K.surface, borderBottom: `1px solid ${K.border}` }}>
              <span>Severity</span><span>Time</span><span>Rule</span><span>Host</span>
            </div>
            <LayoutGroup>
              {FLOOD_ALERTS.slice(0, visibleAlerts).map((a) => (
                <motion.div key={a.id} layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="grid text-xs px-2 py-1 font-mono"
                  style={{ gridTemplateColumns: '70px 70px 1fr 120px', borderBottom: `1px solid ${K.border}20` }}>
                  <span className="font-semibold" style={{ color: a.severity === 'critical' ? K.red : K.yellow }}>{a.severity}</span>
                  <span style={{ color: K.muted }}>{a.time}</span>
                  <span style={{ color: K.text }}>{a.rule}</span>
                  <span style={{ color: K.blue }}>{a.host}</span>
                </motion.div>
              ))}
            </LayoutGroup>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="cluster" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-4" style={{ background: K.bg, borderRadius: 8, border: `1px solid ${K.border}` }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
              className="w-10 h-10 rounded-full border-2" style={{ borderColor: K.teal, borderTopColor: 'transparent' }} />
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: K.teal }}>Embedding + clustering…</p>
              <p className="text-xs mt-1" style={{ color: K.muted }}>HDBSCAN on 1,003 alert vectors</p>
            </div>
            <div className="flex gap-6 text-center">
              <div><p className="text-2xl font-bold" style={{ color: K.text }}>1,003</p><p className="text-xs" style={{ color: K.muted }}>raw alerts</p></div>
              <div><p className="text-2xl font-bold" style={{ color: K.teal }}>→</p></div>
              <div><p className="text-2xl font-bold" style={{ color: K.teal }}>2</p><p className="text-xs" style={{ color: K.muted }}>clusters</p></div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="grouped" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col gap-3">
            <p className="text-xs" style={{ color: K.muted }}>1,003 alerts collapsed to 2 incident clusters</p>
            {CLUSTERS.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.2 }}
                className="rounded-lg p-4 flex flex-col gap-2" style={{ background: K.surface, border: `1px solid ${c.color}40` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold" style={{ color: c.color }}>{c.count.toLocaleString()}</span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: K.text }}>{c.label}</p>
                      <p className="text-xs" style={{ color: K.muted }}>{c.severity} severity cluster</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded" style={{ background: c.color + '20', color: c.color }}>
                    {c.severity.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs" style={{ color: K.muted }}>
                  <span className="font-medium" style={{ color: K.text }}>Hosts: </span>{c.hosts}
                </div>
                <div className="text-xs rounded px-2 py-1" style={{ background: K.bg }}>
                  <span style={{ color: K.muted }}>Root cause: </span>
                  <span style={{ color: K.text }}>{c.rootCause}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
            <div className="text-5xl">😴</div>
            <p className="text-lg font-bold" style={{ color: K.text }}>On-call engineers actually sleep.</p>
            <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
              <div className="rounded-lg p-3" style={{ background: K.surface }}>
                <p className="text-xl font-bold" style={{ color: K.red }}>1,003</p>
                <p className="text-xs mt-1" style={{ color: K.muted }}>raw alerts</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: K.surface }}>
                <p className="text-xl font-bold" style={{ color: K.teal }}>2</p>
                <p className="text-xs mt-1" style={{ color: K.muted }}>true incidents</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: K.surface }}>
                <p className="text-xl font-bold" style={{ color: K.green }}>0</p>
                <p className="text-xs mt-1" style={{ color: K.muted }}>hardcoded rules</p>
              </div>
            </div>
            <p className="text-sm max-w-xs" style={{ color: K.muted }}>HDBSCAN on alert embeddings. Zero-day alert storms still collapse — no new rules needed.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
