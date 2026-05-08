'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StepProgressBar from '../StepProgressBar';
import DemoSummarySlide from '../DemoSummarySlide';
import type { DemoComponentProps } from '../DemoModal';
import type { InfoCardData } from '@/lib/industriesData';

const ACCENT = '#10B981';

export default function CompactDemo({ card, autoPlay, advanceTick, restartTick }: DemoComponentProps) {
  const infoCard = card as InfoCardData;
  const spec = infoCard.compactDemo;
  const [step, setStep] = useState(0);
  const hasAdvancedOnce = useRef(false);

  const totalSteps = (spec?.steps.length ?? 3) + 1; // steps + summary

  const advance = () => {
    setStep(s => {
      if (s < totalSteps - 1) { hasAdvancedOnce.current = true; return s + 1; }
      return s;
    });
  };

  // Auto-play step advance
  useEffect(() => {
    if (!autoPlay) return;
    if (step >= totalSteps - 1) return;
    const t = setTimeout(advance, 2500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, autoPlay]);

  // Restart
  useEffect(() => {
    if (restartTick === 0 || !autoPlay) return;
    if (step >= totalSteps - 1) return;
    const t = setTimeout(advance, 2500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restartTick]);

  // Manual advance
  useEffect(() => {
    if (advanceTick === 0) return;
    advance();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advanceTick]);

  if (!spec) {
    return (
      <div className="flex items-center justify-center h-full text-white/40 text-sm">
        No demo spec for: {card.title}
      </div>
    );
  }

  const isSummaryStep = step >= spec.steps.length;
  const currentStep = isSummaryStep ? null : spec.steps[step];
  const accentColor = infoCard.models[0]?.color ?? ACCENT;

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <StepProgressBar total={totalSteps} current={step} accentColor={accentColor} />
        {!autoPlay && step < totalSteps - 1 && !hasAdvancedOnce.current && (
          <span className="text-xs text-white/30 italic">Press → or Next to advance</span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {currentStep && (
          <motion.div
            key={`step-${step}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-3 flex-1"
          >
            {/* Step indicator */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: accentColor + '15', color: accentColor }}>
                Step {step + 1} / {spec.steps.length}
              </span>
              {currentStep.tag && (
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#F04E9815', color: '#F04E98' }}>
                  {currentStep.tag}
                </span>
              )}
            </div>

            {/* Heading */}
            <h4 className="text-sm font-semibold text-white leading-snug">{currentStep.heading}</h4>

            {/* Body */}
            <p className="text-xs text-white/60 leading-relaxed">{currentStep.body}</p>

            {/* Highlight metric */}
            {currentStep.highlight && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="rounded-xl p-4 text-center mt-1"
                style={{ background: accentColor + '0d', border: `1px solid ${accentColor}30` }}
              >
                <p className="text-xs text-white/40 mb-1">Result</p>
                <p className="text-sm font-medium leading-relaxed" style={{ color: accentColor }}>
                  {currentStep.highlight}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}

        {isSummaryStep && spec.summaryData && (
          <motion.div
            key="summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1"
          >
            <DemoSummarySlide data={spec.summaryData} card={card} accentColor={accentColor} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
