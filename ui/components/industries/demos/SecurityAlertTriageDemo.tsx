'use client';

import { useState, useEffect } from 'react';
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
  orange: '#E7664C',
  yellow: '#FACB3D',
  teal: '#00BFB3',
  pink: '#F04E98',
};

const FLOOD_ALERTS = [
  { id: 'f1', rule: 'Unauthorized Access Attempt', severity: 'high', src: '203.0.113.1', time: '09:14:01' },
  { id: 'f2', rule: 'Access Denied — Admin Panel', severity: 'critical', src: '203.0.113.1', time: '09:14:01' },
  { id: 'f3', rule: 'Failed SSH Authentication', severity: 'medium', src: '198.51.100.4', time: '09:14:02' },
  { id: 'f4', rule: 'Login Failure — Root Account', severity: 'critical', src: '203.0.113.1', time: '09:14:02' },
  { id: 'f5', rule: 'Auth Error — API Gateway', severity: 'high', src: '203.0.113.1', time: '09:14:03' },
  { id: 'f6', rule: 'Brute Force Detected', severity: 'critical', src: '203.0.113.1', time: '09:14:03' },
  { id: 'f7', rule: 'Permission Denied — /etc/passwd', severity: 'high', src: '198.51.100.4', time: '09:14:04' },
  { id: 'f8', rule: 'Unauthorized SSH Login', severity: 'critical', src: '198.51.100.4', time: '09:14:04' },
  { id: 'f9', rule: 'Account Lockout Triggered', severity: 'high', src: '203.0.113.1', time: '09:14:05' },
  { id: 'f10', rule: 'Forbidden Resource Access', severity: 'medium', src: '203.0.113.1', time: '09:14:05' },
  { id: 'f11', rule: 'Invalid Credentials — SSH', severity: 'high', src: '198.51.100.4', time: '09:14:06' },
  { id: 'f12', rule: 'Auth Bypass Attempt', severity: 'critical', src: '203.0.113.1', time: '09:14:06' },
];

const CLUSTERS = [
  {
    id: 'c1',
    label: 'Authentication Failure Cluster',
    count: 847,
    color: K.red,
    severity: 'critical',
    ruleNames: ['Unauthorized Access Attempt', 'Access Denied', 'Login Failure', 'Auth Error', 'Brute Force', 'Account Lockout', 'Forbidden Access', 'Auth Bypass', 'Invalid Credentials'],
    src: '203.0.113.1 · 198.51.100.4',
    tactic: 'T1110 — Brute Force',
    recommendation: 'Block IPs 203.0.113.1 and 198.51.100.4, review SSH exposure',
  },
  {
    id: 'c2',
    label: 'Privilege Escalation Cluster',
    count: 32,
    color: K.orange,
    severity: 'high',
    ruleNames: ['Permission Denied — /etc/passwd', 'Failed SSH Authentication', 'Unauthorized SSH Login'],
    src: '198.51.100.4',
    tactic: 'T1548 — Abuse Elevation',
    recommendation: 'Audit sudo activity on prod-bastion-01',
  },
];

const STEPS = ['flood', 'cluster', 'grouped', 'summary'];

export default function SecurityAlertTriageDemo() {
  const [step, setStep] = useState(0);
  const [visibleAlerts, setVisibleAlerts] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (step === 0) {
      let i = 0;
      const t = setInterval(() => {
        i++;
        setVisibleAlerts(Math.min(i, FLOOD_ALERTS.length));
        setTotalCount(c => c + Math.floor(Math.random() * 120 + 60));
        if (i >= FLOOD_ALERTS.length + 3) { clearInterval(t); setTimeout(() => setStep(1), 500); }
      }, 110);
      return () => clearInterval(t);
    }
    if (step === 1) { const t = setTimeout(() => setStep(2), 2000); return () => clearTimeout(t); }
    if (step === 2) { const t = setTimeout(() => setStep(3), 3200); return () => clearTimeout(t); }
  }, [step]);

  const advance = () => { if (step < STEPS.length - 1) setStep(s => s + 1); };

  const sevColor = (s: string) => s === 'critical' ? K.red : s === 'high' ? K.orange : K.yellow;

  return (
    <div className="flex flex-col gap-3 h-full" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex items-center justify-between">
        <StepProgressBar total={STEPS.length} current={step} accentColor={K.pink} />
        {step < STEPS.length - 1 && (
          <button onClick={advance} className="text-xs transition-colors" style={{ color: K.muted }}>Skip →</button>
        )}
      </div>

      {/* Kibana SIEM top bar */}
      <div className="rounded-t-lg flex items-center gap-3 px-3 py-2 text-xs" style={{ background: K.surface, borderBottom: `1px solid ${K.border}` }}>
        <span style={{ color: K.muted }}>Kibana</span>
        <span style={{ color: K.border }}>›</span>
        <span style={{ color: K.text }}>Security</span>
        <span style={{ color: K.border }}>›</span>
        <span style={{ color: K.pink }}>Alerts</span>
        {step === 0 && (
          <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 0.5 }}
            className="ml-auto text-xs px-2 py-0.5 rounded font-medium" style={{ background: K.red + '30', color: K.red }}>
            LIVE · {totalCount.toLocaleString()} alerts/hr
          </motion.span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="flood" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 rounded-b-lg overflow-auto" style={{ background: K.bg, border: `1px solid ${K.border}`, borderTop: 'none' }}>
            <div className="grid text-xs px-2 py-1 font-mono sticky top-0" style={{ gridTemplateColumns: '70px 1fr 100px', color: K.muted, background: K.surface, borderBottom: `1px solid ${K.border}` }}>
              <span>Severity</span><span>Rule Name</span><span>Source IP</span>
            </div>
            <LayoutGroup>
              {FLOOD_ALERTS.slice(0, visibleAlerts).map((a) => (
                <motion.div key={a.id} layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="grid text-xs px-2 py-1 font-mono"
                  style={{ gridTemplateColumns: '70px 1fr 100px', borderBottom: `1px solid ${K.border}20` }}>
                  <span className="font-semibold" style={{ color: sevColor(a.severity) }}>{a.severity}</span>
                  <span style={{ color: K.text }}>{a.rule}</span>
                  <span style={{ color: K.blue }}>{a.src}</span>
                </motion.div>
              ))}
            </LayoutGroup>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="cluster" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-4" style={{ background: K.bg, borderRadius: 8, border: `1px solid ${K.border}` }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
              className="w-10 h-10 rounded-full border-2" style={{ borderColor: K.pink, borderTopColor: 'transparent' }} />
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: K.pink }}>Semantic clustering…</p>
              <p className="text-xs mt-1" style={{ color: K.muted }}>Embeddings v5 encoding 10,000 alert descriptions</p>
            </div>
            <div className="flex gap-6 text-center">
              <div><p className="text-2xl font-bold" style={{ color: K.text }}>10,000</p><p className="text-xs" style={{ color: K.muted }}>alerts/day</p></div>
              <div><p className="text-2xl font-bold" style={{ color: K.pink }}>→</p></div>
              <div><p className="text-2xl font-bold" style={{ color: K.pink }}>47</p><p className="text-xs" style={{ color: K.muted }}>true incidents</p></div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="grouped" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col gap-3">
            <p className="text-xs" style={{ color: K.muted }}>10,000 alerts → 47 semantic clusters. Showing top 2:</p>
            {CLUSTERS.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.2 }}
                className="rounded-lg p-3 flex flex-col gap-2" style={{ background: K.surface, border: `1px solid ${c.color}40` }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: K.text }}>{c.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: K.muted }}>{c.count.toLocaleString()} alerts · MITRE {c.tactic}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded shrink-0" style={{ background: c.color + '20', color: c.color }}>{c.severity}</span>
                </div>
                <div className="text-xs flex flex-wrap gap-1">
                  {c.ruleNames.slice(0, 4).map(r => (
                    <span key={r} className="px-1.5 py-0.5 rounded" style={{ background: K.bg, color: K.muted }}>{r}</span>
                  ))}
                  {c.ruleNames.length > 4 && <span className="px-1.5 py-0.5 rounded" style={{ background: K.bg, color: K.muted }}>+{c.ruleNames.length - 4} more</span>}
                </div>
                <div className="text-xs rounded px-2 py-1.5" style={{ background: K.bg }}>
                  <span style={{ color: K.muted }}>Recommendation: </span>
                  <span style={{ color: K.text }}>{c.recommendation}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
            <div className="text-5xl">🎯</div>
            <p className="text-lg font-bold" style={{ color: K.text }}>Same attack. 12 different rule names.</p>
            <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
              <div className="rounded-lg p-3" style={{ background: K.surface }}>
                <p className="text-xl font-bold" style={{ color: K.red }}>10K</p>
                <p className="text-xs mt-1" style={{ color: K.muted }}>alerts/day</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: K.surface }}>
                <p className="text-xl font-bold" style={{ color: K.pink }}>47</p>
                <p className="text-xs mt-1" style={{ color: K.muted }}>true incidents</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: K.surface }}>
                <p className="text-xl font-bold" style={{ color: K.green }}>0</p>
                <p className="text-xs mt-1" style={{ color: K.muted }}>new rules needed</p>
              </div>
            </div>
            <p className="text-sm max-w-xs" style={{ color: K.muted }}>Embeddings found semantic equivalence across 12 different rule names. Attackers can't rename their way out of this.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
