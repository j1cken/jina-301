'use client';

const ELASTIC_BLUE = '#0077CC';

interface DemoFlowOverlayProps {
  isFlowing: boolean;
  stepIndex: number;
  totalSteps: number;
  currentLabel: string;
  stepReady?: boolean;
}

export default function DemoFlowOverlay({
  isFlowing,
  stepIndex,
  totalSteps,
  currentLabel,
  stepReady,
}: DemoFlowOverlayProps) {
  if (!isFlowing) return null;

  const progress = totalSteps > 0 ? ((stepIndex + 1) / totalSteps) * 100 : 0;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999]"
      style={{
        background: 'rgba(10, 15, 30, 0.92)',
        backdropFilter: 'blur(8px)',
        borderTop: `1px solid ${ELASTIC_BLUE}40`,
      }}
    >
      {/* Progress bar */}
      <div className="h-0.5" style={{ background: `${ELASTIC_BLUE}20` }}>
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${progress}%`, background: ELASTIC_BLUE }}
        />
      </div>

      <div className="flex items-center justify-between px-6 py-3 max-w-7xl mx-auto">
        {/* Left: mode indicator + step count */}
        <div className="flex items-center gap-3 min-w-[140px]">
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: ELASTIC_BLUE }}
          />
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: ELASTIC_BLUE }}
          >
            FLOW MODE
          </span>
          <span className="text-xs text-white/40">
            {stepIndex + 1} / {totalSteps}
          </span>
        </div>

        {/* Center: current step label */}
        {currentLabel && (
          <span className="text-sm text-white/80 font-medium text-center truncate px-4 max-w-[500px]">
            {currentLabel}
          </span>
        )}

        {/* Right: key hints */}
        <div className="flex items-center gap-4 text-xs text-white/40 min-w-[140px] justify-end">
          <span>← back</span>
          <span className="font-semibold" style={{ color: stepReady ? '#22c55e' : 'rgba(255,255,255,0.4)' }}>→ advance</span>
          <span>esc exit</span>
        </div>
      </div>
    </div>
  );
}
