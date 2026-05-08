'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StepProgressBar from '../StepProgressBar';

// Kibana dark palette
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
};

const NORMAL_LOGS = [
  { time: '14:00:01', level: 'INFO', service: 'auth-svc', msg: 'User login from 10.0.1.42' },
  { time: '14:00:01', level: 'INFO', service: 'api-gw', msg: 'Request processed in 45ms' },
  { time: '14:00:02', level: 'INFO', service: 'auth-svc', msg: 'User login from 10.0.1.43' },
  { time: '14:00:02', level: 'INFO', service: 'api-gw', msg: 'Request processed in 51ms' },
  { time: '14:00:03', level: 'INFO', service: 'db-svc', msg: 'Query completed in 12ms' },
  { time: '14:00:03', level: 'WARN', service: 'api-gw', msg: 'Retry attempt #1 for req-9821' },
  { time: '14:00:04', level: 'INFO', service: 'auth-svc', msg: 'User login from 10.0.1.44' },
  { time: '14:00:04', level: 'INFO', service: 'api-gw', msg: 'Request processed in 48ms' },
];

const TEMPLATES = [
  { pattern: 'User login from {IP}', count: 1847, color: K.green },
  { pattern: 'Request processed in {N}ms', count: 3201, color: K.green },
  { pattern: 'Query completed in {N}ms', count: 891, color: K.green },
  { pattern: 'Retry attempt #{N} for {ID}', count: 12, color: K.yellow },
];

const ANOMALY_LOGS = [
  { time: '14:00:47', level: 'INFO', service: 'auth-svc', msg: 'User login from 203.0.113.5', highlight: false },
  { time: '14:00:47', level: 'ERROR', service: 'api-gw', msg: 'Request timeout after 30s', highlight: true },
  { time: '14:00:48', level: 'ERROR', service: 'db-svc', msg: 'DB connection pool exhausted', highlight: true },
  { time: '14:00:48', level: 'INFO', service: 'cache-svc', msg: 'User login from 203.0.113.5', highlight: true },
  { time: '14:00:49', level: 'INFO', service: 'api-gw', msg: 'Request processed in 42ms', highlight: false },
];

const STEPS = ['stream', 'templates', 'anomaly', 'detail', 'summary'];

export default function OllyLogAnomalyDemo() {
  const [step, setStep] = useState(0);
  const [visibleLogs, setVisibleLogs] = useState(0);

  useEffect(() => {
    if (step === 0) {
      let i = 0;
      const t = setInterval(() => {
        i++;
        setVisibleLogs(i);
        if (i >= NORMAL_LOGS.length) { clearInterval(t); setTimeout(() => setStep(1), 600); }
      }, 200);
      return () => clearInterval(t);
    }
    if (step === 1) { const t = setTimeout(() => setStep(2), 2500); return () => clearTimeout(t); }
    if (step === 2) { const t = setTimeout(() => setStep(3), 2500); return () => clearTimeout(t); }
    if (step === 3) { const t = setTimeout(() => setStep(4), 3000); return () => clearTimeout(t); }
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
        <span style={{ color: K.text }}>Logs</span>
        <span style={{ color: K.border }}>›</span>
        <span style={{ color: K.blue }}>Discover</span>
        <div className="ml-auto flex items-center gap-2" style={{ color: K.muted }}>
          <span>Last 15 minutes</span>
          <span className="px-2 py-0.5 rounded text-xs" style={{ background: K.blue + '20', color: K.blue }}>Refresh</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="stream" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 rounded-b-lg overflow-auto" style={{ background: K.bg, border: `1px solid ${K.border}`, borderTop: 'none' }}>
            <div className="grid text-xs px-2 pt-1 pb-0.5 font-mono" style={{ gridTemplateColumns: '70px 45px 80px 1fr', color: K.muted, borderBottom: `1px solid ${K.border}` }}>
              <span>Time</span><span>Level</span><span>Service</span><span>Message</span>
            </div>
            {NORMAL_LOGS.slice(0, visibleLogs).map((log, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                className="grid text-xs px-2 py-0.5 font-mono hover:opacity-80"
                style={{ gridTemplateColumns: '70px 45px 80px 1fr', borderBottom: `1px solid ${K.border}20` }}>
                <span style={{ color: K.muted }}>{log.time}</span>
                <span style={{ color: log.level === 'WARN' ? K.yellow : K.green }}>{log.level}</span>
                <span style={{ color: K.blue }}>{log.service}</span>
                <span style={{ color: K.text }}>{log.msg}</span>
              </motion.div>
            ))}
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="templates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col gap-3">
            <p className="text-xs" style={{ color: K.muted }}>Embedding log templates extracted from stream…</p>
            <div className="rounded-lg p-3 flex flex-col gap-2" style={{ background: K.surface, border: `1px solid ${K.border}` }}>
              {TEMPLATES.map((t, i) => (
                <motion.div key={t.pattern} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}
                  className="flex items-center justify-between rounded px-2 py-1.5" style={{ background: K.bg }}>
                  <span className="text-xs font-mono" style={{ color: t.color }}>{t.pattern}</span>
                  <span className="text-xs" style={{ color: K.muted }}>{t.count.toLocaleString()} occurrences</span>
                </motion.div>
              ))}
            </div>
            <p className="text-xs" style={{ color: K.muted }}>4 templates extracted. Embedding sequences via Jina Embeddings v5…</p>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="anomaly" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col gap-2">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded text-xs font-medium" style={{ background: K.red + '20', color: K.red, border: `1px solid ${K.red}40` }}>
              ⚠ Anomalous sequence detected — similarity to prior incidents: 0.91
            </div>
            <div className="rounded-lg overflow-hidden flex-1" style={{ background: K.bg, border: `1px solid ${K.border}` }}>
              <div className="grid text-xs px-2 pt-1 pb-0.5 font-mono" style={{ gridTemplateColumns: '70px 45px 80px 1fr', color: K.muted, borderBottom: `1px solid ${K.border}` }}>
                <span>Time</span><span>Level</span><span>Service</span><span>Message</span>
              </div>
              {ANOMALY_LOGS.map((log, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
                  className="grid text-xs px-2 py-1 font-mono"
                  style={{
                    gridTemplateColumns: '70px 45px 80px 1fr',
                    borderBottom: `1px solid ${K.border}20`,
                    background: log.highlight ? K.red + '18' : 'transparent',
                    borderLeft: log.highlight ? `3px solid ${K.red}` : '3px solid transparent',
                  }}>
                  <span style={{ color: K.muted }}>{log.time}</span>
                  <span style={{ color: log.level === 'ERROR' ? K.red : log.level === 'WARN' ? K.yellow : K.green }}>{log.level}</span>
                  <span style={{ color: K.blue }}>{log.service}</span>
                  <span style={{ color: log.highlight ? K.text : K.muted }}>{log.msg}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col gap-3">
            <div className="rounded-lg p-3" style={{ background: K.surface, border: `1px solid ${K.red}40` }}>
              <p className="text-xs font-semibold mb-2" style={{ color: K.red }}>Anomaly Details</p>
              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between"><span style={{ color: K.muted }}>Sequence</span><span style={{ color: K.text }}>login → timeout → DB error → login (diff svc)</span></div>
                <div className="flex justify-between"><span style={{ color: K.muted }}>Last seen</span><span style={{ color: K.red }}>Never</span></div>
                <div className="flex justify-between"><span style={{ color: K.muted }}>Similarity score</span><span style={{ color: K.yellow }}>0.91 (vs known incidents)</span></div>
                <div className="flex justify-between"><span style={{ color: K.muted }}>Closest match</span><span style={{ color: K.text }}>Credential stuffing via cache bypass · 2024-11-14</span></div>
              </div>
            </div>
            <p className="text-xs" style={{ color: K.muted }}>Threshold rules would not have triggered — this sequence has never appeared in any alert rule.</p>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <div className="text-5xl">🎯</div>
            <p className="text-lg font-bold" style={{ color: K.text }}>Novel pattern surfaced</p>
            <p className="text-sm max-w-xs" style={{ color: K.muted }}>Embeddings treat log templates as meaning — not strings. A sequence no rule engine has ever seen was caught because it was semantically similar to a known attack.</p>
            <div className="flex gap-4">
              <div className="rounded-lg p-3 text-center" style={{ background: K.surface }}>
                <p className="text-xl font-bold" style={{ color: K.red }}>0</p>
                <p className="text-xs mt-1" style={{ color: K.muted }}>rules written</p>
              </div>
              <div className="rounded-lg p-3 text-center" style={{ background: K.surface }}>
                <p className="text-xl font-bold" style={{ color: K.blue }}>0.91</p>
                <p className="text-xs mt-1" style={{ color: K.muted }}>similarity to prior attack</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
