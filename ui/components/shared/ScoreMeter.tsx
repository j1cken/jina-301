'use client';

interface ScoreMeterProps {
  score: number;
  maxScore?: number;
  label?: string;
}

export default function ScoreMeter({ score, maxScore = 1, label }: ScoreMeterProps) {
  const pct = Math.min(100, (score / maxScore) * 100);
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>}
      <div className="score-bar flex-1">
        <div className="score-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>
        {score.toFixed(3)}
      </span>
    </div>
  );
}
