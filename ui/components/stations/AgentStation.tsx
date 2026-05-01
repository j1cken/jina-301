'use client';

import AgentChat from '@/components/AgentChat';
import JinaCallout from '@/components/JinaCallout';
import ModelBadge from '@/components/shared/ModelBadge';
import { useDemoMode } from '@/lib/demoMode';

export default function AgentStation() {
  const demoMode = useDemoMode();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h2 style={{ color: 'var(--text-primary)' }}>Agent</h2>
          <ModelBadge model="Agent Builder" />
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>
          Conversational AI powered by Elastic Agent Builder — searches the hotel index,
          reasons over results, and holds multi-turn context across your conversation.
        </p>
      </div>

      <JinaCallout
        model="Agent Builder"
        loading={false}
        loadingMessage=""
        doneMessage="Agent Builder orchestrates Jina embeddings, reranking, and hotel search in a single conversational interface."
      />

      <AgentChat embedded />

      {demoMode && (
        <div data-bp-card="gold" className="text-xs px-3 py-2 rounded-lg"
          style={{ background: 'rgba(254,197,20,0.08)', color: 'var(--elastic-gold)', border: '1px solid rgba(254,197,20,0.2)' }}>
          Demo mode — showing canned responses. Disable to use the live agent.
        </div>
      )}
    </div>
  );
}
