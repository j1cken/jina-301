'use client';

interface StepProgressBarProps {
  total: number;
  current: number;
  accentColor?: string;
}

export default function StepProgressBar({ total, current, accentColor = '#0077CC' }: StepProgressBarProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-1.5 rounded-full transition-all duration-300"
          style={{
            width: i === current ? 24 : 12,
            background: i === current ? accentColor : i < current ? `${accentColor}60` : '#ffffff20',
          }}
        />
      ))}
    </div>
  );
}
