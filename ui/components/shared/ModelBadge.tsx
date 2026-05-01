'use client';

interface ModelBadgeProps {
  model: string;
  api?: 'eis' | 'jina';
  size?: 'sm' | 'md';
}

const MODEL_COLORS: Record<string, string> = {
  'Embeddings v5': '#0077CC',
  'Reranker v3': '#F04E98',
  'CLIP v2': '#00BFB3',
  'VLM': '#A855F7',
  'Reader': '#FEC514',
};

export default function ModelBadge({ model, api, size = 'md' }: ModelBadgeProps) {
  const color = MODEL_COLORS[model] ?? '#0077CC';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const px = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1';

  return (
    <span
      data-model-badge
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${textSize} ${px}`}
      style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      Jina {model}
      {api && (
        <span className="opacity-60 text-xs font-normal">
          {api === 'eis' ? '· EIS' : '· jina.ai'}
        </span>
      )}
    </span>
  );
}
