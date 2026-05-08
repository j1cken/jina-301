'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StepProgressBar from '../StepProgressBar';
import DemoSummarySlide from '../DemoSummarySlide';
import type { DemoComponentProps } from '../DemoModal';
import type { InteractiveCardData } from '@/lib/industriesData';

const K = {
  bg: '#1D1E24',
  surface: '#25262E',
  border: '#343741',
  text: '#DFE5EF',
  muted: '#98A2B3',
  blue: '#0B64DD',
  red: '#C61E25',
  orange: '#E7664C',
  yellow: '#FACB3D',
  green: '#008A5E',
  pink: '#F04E98',
};

const REPORT = `Malware disables Windows security features via registry modifications to HKLM\\System\\CurrentControlSet. Injects shellcode into svchost.exe process space. Beacon traffic observed on TCP port 443 using custom encryption. Persistence maintained through startup folder and scheduled tasks. Lateral movement via SMB share enumeration.`;

const TTP_MATCHES = [
  { id: 'T1562.001', name: 'Impair Defenses: Disable or Modify Tools', similarity: 0.96, phase: 'Defense Evasion', color: K.red },
  { id: 'T1055.001', name: 'Process Injection: Dynamic-link Library Injection', similarity: 0.94, phase: 'Privilege Escalation', color: K.red },
  { id: 'T1071.001', name: 'Application Layer Protocol: Web Protocols', similarity: 0.89, phase: 'Command & Control', color: K.orange },
  { id: 'T1547.001', name: 'Boot or Logon Autostart: Registry Run Keys', similarity: 0.87, phase: 'Persistence', color: K.orange },
  { id: 'T1021.002', name: 'Remote Services: SMB/Windows Admin Shares', similarity: 0.81, phase: 'Lateral Movement', color: K.yellow },
];

const HISTORICAL = {
  campaign: 'APT-29 · CozyBear · Operation Ghost',
  date: '2025-11-14',
  region: 'Eastern Europe → APAC',
  confidence: 0.91,
  description: 'Identical registry modification pattern and svchost injection technique. C2 port and custom encryption fingerprint match known CozyBear infrastructure.',
};

const STEPS = ['report', 'embed', 'ttps', 'history', 'summary'];

export default function SecurityTTPDemo({ card, autoPlay, advanceTick, restartTick }: DemoComponentProps) {
  const interactiveCard = card as InteractiveCardData;
  const [step, setStep] = useState(0);
  const [visibleReport, setVisibleReport] = useState(0);
  const [typingComplete, setTypingComplete] = useState(false);
  const [spinDot, setSpinDot] = useState(0);
  const hasAdvancedOnce = useRef(false);

  const advance = () => {
    setStep(s => {
      if (s < STEPS.length - 1) { hasAdvancedOnce.current = true; return s + 1; }
      return s;
    });
  };

  // Typing animation — always runs regardless of autoPlay
  useEffect(() => {
    if (step !== 0) { setVisibleReport(0); setTypingComplete(false); return; }
    let i = 0;
    const t = setInterval(() => {
      i += 3;
      setVisibleReport(Math.min(i, REPORT.length));
      if (i >= REPORT.length) { clearInterval(t); setTypingComplete(true); }
    }, 18);
    return () => clearInterval(t);
  }, [step]);

  // spinDot animation on step 1 — always runs
  useEffect(() => {
    if (step !== 1) return;
    const d = setInterval(() => setSpinDot(x => (x + 1) % 3), 350);
    return () => clearInterval(d);
  }, [step]);

  // Auto-advance — gated on autoPlay flag
  useEffect(() => {
    if (!autoPlay) return;
    if (step === 0) {
      if (!typingComplete) return;
      const t = setTimeout(advance, 800);
      return () => clearTimeout(t);
    }
    if (step >= STEPS.length - 1) return;
    const delay = step === 1 ? 2200 : 3000;
    const t = setTimeout(advance, delay);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, autoPlay, typingComplete]);

  // Restart
  useEffect(() => {
    if (restartTick === 0 || !autoPlay) return;
    if (step >= STEPS.length - 1) return;
    if (step === 0 && !typingComplete) return;
    const delay = step === 1 ? 2200 : 3000;
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
    <div className="flex flex-col gap-3 h-full" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex items-center justify-between">
        <StepProgressBar total={STEPS.length} current={step} accentColor={K.pink} />
        {!autoPlay && step < STEPS.length - 1 && !hasAdvancedOnce.current && (
          <span className="text-xs italic" style={{ color: K.muted + '80' }}>Press → or Next to advance</span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col gap-2">
            <p className="text-xs" style={{ color: K.muted }}>Incoming threat report — analyst paste</p>
            <div className="rounded-lg p-3 flex-1 relative overflow-auto" style={{ background: K.surface, border: `1px solid ${K.border}` }}>
              <p className="text-xs font-mono leading-relaxed" style={{ color: K.text }}>
                {REPORT.slice(0, visibleReport)}
                <span className="animate-pulse">|</span>
              </p>
            </div>
            <div className="flex gap-2 text-xs" style={{ color: K.muted }}>
              <span>0 IOC matches found in signature database</span>
              <span style={{ color: K.red }}>· Unrecognized malware family</span>
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="embed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-5">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-10 h-10 rounded-full border-2" style={{ borderColor: K.pink, borderTopColor: 'transparent' }} />
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: K.pink }}>
                Embedding report{'.'.repeat(spinDot + 1)}
              </p>
              <p className="text-xs mt-1" style={{ color: K.muted }}>Searching 500K CVEs + MITRE ATT&CK TTPs</p>
            </div>
            <div className="flex gap-6 text-center">
              <div><p className="text-xl font-bold" style={{ color: K.text }}>500K</p><p className="text-xs" style={{ color: K.muted }}>CVE descriptions</p></div>
              <div><p className="text-xl font-bold" style={{ color: K.pink }}>+</p></div>
              <div><p className="text-xl font-bold" style={{ color: K.text }}>793</p><p className="text-xs" style={{ color: K.muted }}>MITRE TTPs</p></div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="ttps" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col gap-2">
            <p className="text-xs" style={{ color: K.muted }}>MITRE ATT&CK TTP matches — ranked by Reranker v3</p>
            {TTP_MATCHES.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="rounded-lg flex items-center gap-3 px-3 py-2"
                style={{ background: K.surface, border: `1px solid ${t.color}30` }}>
                <div className="shrink-0 rounded px-1.5 py-0.5 text-xs font-mono" style={{ background: t.color + '20', color: t.color }}>{t.id}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: K.text }}>{t.name}</p>
                  <p className="text-xs" style={{ color: K.muted }}>{t.phase}</p>
                </div>
                <div className="text-xs font-mono shrink-0" style={{ color: t.color }}>{t.similarity}</div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded text-xs" style={{ background: K.yellow + '15', color: K.yellow, border: `1px solid ${K.yellow}30` }}>
              ⚠ Related campaign detected — 6 months ago
            </div>
            <div className="rounded-lg p-4 flex flex-col gap-3" style={{ background: K.surface, border: `1px solid ${K.border}` }}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: K.text }}>{HISTORICAL.campaign}</p>
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: K.pink + '20', color: K.pink }}>{HISTORICAL.confidence} similarity</span>
              </div>
              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between">
                  <span style={{ color: K.muted }}>First observed</span>
                  <span style={{ color: K.text }}>{HISTORICAL.date}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: K.muted }}>Campaign path</span>
                  <span style={{ color: K.text }}>{HISTORICAL.region}</span>
                </div>
              </div>
              <div className="rounded px-3 py-2 text-xs" style={{ background: K.bg }}>
                <span style={{ color: K.text }}>{HISTORICAL.description}</span>
              </div>
            </div>
            <p className="text-xs" style={{ color: K.muted }}>Zero lexical overlap between this report and any prior IOC. Semantic match found the connection.</p>
          </motion.div>
        )}

        {step === 4 && interactiveCard.summaryData && (
          <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1">
            <DemoSummarySlide data={interactiveCard.summaryData} card={card} accentColor={K.pink} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
