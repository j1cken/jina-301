export type DemoStation = 'find' | 'rank' | 'look' | 'describe' | 'ingest' | 'omni' | 'industries' | 'wrapup';

export type FlowAction =
  | { type: 'navigate'; station: 'home' | DemoStation }
  | { type: 'set-find-query'; query: string }
  | { type: 'set-rank-reveal'; enabled: boolean }
  | { type: 'set-geo-filter'; enabled: boolean }
  | { type: 'type-hero-query'; query: string }
  | { type: 'open-agent'; query?: string }
  | { type: 'close-agent' }
  | { type: 'add-first-agent-hotel' }
  | { type: 'trigger-image-search' }
  | { type: 'trigger-ingest' }
  | { type: 'wait' };

export interface FlowStep {
  id: string;
  label: string;
  action: FlowAction;
  autoAdvanceMs?: number;
  readyDelayMs?: number;
}

const COLD_OPEN_QUERY = 'quiet hotel in Las Vegas near a good coffee scene where I can take 9am calls';

export const DEMO_SCRIPT: FlowStep[] = [
  // --- Cold open ---
  {
    id: 's0',
    label: 'Horizon — the hotel booking of 2026',
    action: { type: 'navigate', station: 'home' },
  },
  {
    id: 's1',
    label: 'Meet the Concierge',
    action: { type: 'type-hero-query', query: COLD_OPEN_QUERY },
    autoAdvanceMs: 2000,
  },
  {
    id: 's1.5',
    label: 'Ask the Concierge',
    action: { type: 'open-agent', query: COLD_OPEN_QUERY },
  },
  {
    id: 's1b',
    label: 'Agent responds — see the result',
    action: { type: 'wait' },
    autoAdvanceMs: 5000,
  },
  {
    id: 's1c',
    label: 'Add to Trip → Book it',
    action: { type: 'add-first-agent-hotel' },
  },
  {
    id: 's1d',
    label: '',
    action: { type: 'close-agent' },
    autoAdvanceMs: 800,
  },

  // --- ACT 1: Text intelligence ---
  {
    id: 's3-prep',
    label: '',
    action: { type: 'set-geo-filter', enabled: false },
    autoAdvanceMs: 50,
  },
  {
    id: 's3',
    label: 'Find — semantic search',
    action: { type: 'navigate', station: 'find' },
    autoAdvanceMs: 600,
  },
  {
    id: 's4',
    label: 'Typing query...',
    action: { type: 'set-find-query', query: 'quiet hotel for focused remote work, no casino noise' },
    autoAdvanceMs: 2000,
  },
  {
    id: 's5',
    label: 'Results — global semantic, no geo filter',
    action: { type: 'wait' },
  },
  {
    id: 's5b',
    label: 'Apply geo filter — narrow to Vegas',
    action: { type: 'set-geo-filter', enabled: true },
  },
  {
    id: 's6',
    label: 'Rank — naive order (before reranking)',
    action: { type: 'navigate', station: 'rank' },
  },
  {
    id: 's7',
    label: 'Reranker reveals the right order',
    action: { type: 'set-rank-reveal', enabled: true },
    autoAdvanceMs: 2500,
  },
  {
    id: 's8',
    label: 'Reranker moved the right hotel to #1 — ask it why',
    action: { type: 'wait' },
  },
  {
    id: 's9',
    label: "Ingest — let's back up: how is this built?",
    action: { type: 'navigate', station: 'ingest' },
  },
  {
    id: 's10',
    label: 'URL → clean markdown',
    action: { type: 'trigger-ingest' },
    autoAdvanceMs: 3500,
  },
  {
    id: 's11',
    label: 'Data freed from HTML',
    action: { type: 'wait' },
  },

  // --- ACT 2: Multimodal ---
  {
    id: 's12',
    label: 'Look — image search (camera icon)',
    action: { type: 'navigate', station: 'find' },
  },
  {
    id: 's13',
    label: 'CLIP finds visual matches',
    action: { type: 'trigger-image-search' },
    autoAdvanceMs: 2500,
  },
  {
    id: 's14',
    label: 'One index — text and images colocated',
    action: { type: 'wait' },
  },
  {
    id: 's15',
    label: 'Omni — one model, every modality',
    action: { type: 'navigate', station: 'omni' },
  },
  {
    id: 's16',
    label: 'One index. All media.',
    action: { type: 'wait' },
  },

  // --- Concierge climax ---
  {
    id: 's17',
    label: 'Concierge — full run',
    action: { type: 'open-agent', query: 'romantic beachfront under $400, near old town, great for a photographer' },
    autoAdvanceMs: 3500,
  },
  {
    id: 's18',
    label: 'Agent decomposes the intent...',
    action: { type: 'wait' },
  },
  {
    id: 's19',
    label: 'Answer — not a list of results',
    action: { type: 'wait' },
  },

  // Close agent cleanly before industries mounts
  {
    id: 's19b',
    label: '',
    action: { type: 'close-agent' },
    autoAdvanceMs: 100,
  },

  // --- Industries zoom-out ---
  {
    id: 's20',
    label: 'Industries — 15 problems, 3 sectors',
    action: { type: 'navigate', station: 'industries' },
  },
  {
    id: 's21',
    label: 'Same primitives. Every industry.',
    action: { type: 'wait' },
  },
  // --- Wrap up ---
  {
    id: 's23',
    label: 'Three things to take back to your customer',
    action: { type: 'navigate', station: 'wrapup' },
  },
];
