'use client';

interface DemoModeBannerProps {
  onDisable: () => void;
}

export default function DemoModeBanner({ onDisable }: DemoModeBannerProps) {
  return (
    <div className="demo-banner py-2 px-4 flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span>⚡</span>
        <span>DEMO MODE ACTIVE — All API calls use pre-recorded responses (offline-safe)</span>
      </div>
      <button
        onClick={onDisable}
        className="underline opacity-70 hover:opacity-100 transition-opacity text-xs"
      >
        Disable
      </button>
    </div>
  );
}
