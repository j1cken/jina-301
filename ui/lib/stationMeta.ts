import type { Station } from '@/lib/types';

export type FlowNodeVariant = 'neutral' | 'jina' | 'elastic';

export type FlowNode = {
  label: string;
  sub: string;
  variant: FlowNodeVariant;
};

export type StationMeta = {
  id: Station;
  label: string;
  model: string;
  modelFull: string;
  icon: string;
  color: string;
  inferenceId?: string;
  endpoint?: string;
  retriever?: string;
  dims?: string;
  esIndex?: string;
  esField?: string;
  lede?: string;
  flow: FlowNode[];
  wiringNotes: string[];
};

export const STATION_META: StationMeta[] = [
  {
    id: 'ingest',
    label: 'Ingest',
    model: 'Reader',
    modelFull: 'Jina Reader API',
    icon: '🌐',
    color: '#FEC514',
    endpoint: 'r.jina.ai',
    esIndex: 'horizon-hotels',
    esField: 'semantic_text',
    lede: 'Jina Reader fetches any URL and converts it to clean markdown. Elasticsearch auto-embeds the content at index time using `.jina-embeddings-v5-text-small` — no vector code in the app.',
    flow: [
      { label: 'Hotel URL', sub: 'input', variant: 'neutral' },
      { label: 'Jina Reader API', sub: 'r.jina.ai', variant: 'jina' },
      { label: 'Markdown Content', sub: 'parsed', variant: 'neutral' },
      { label: 'Elasticsearch', sub: 'index write', variant: 'elastic' },
      { label: 'Indexed Document', sub: 'stored', variant: 'neutral' },
    ],
    wiringNotes: [
      'Jina Reader converts any hotel URL to clean markdown, stripping nav and ads',
      'Elasticsearch auto-embeds content via `.jina-embeddings-v5-text-small` on the `semantic_text` field',
      'Documents stored in the `horizon-hotels` index — ready for semantic and keyword search',
    ],
  },
  {
    id: 'find',
    label: 'Find',
    model: 'Embeddings v5',
    modelFull: 'Jina Embeddings v5 · text-small',
    icon: '🔍',
    color: '#0077CC',
    inferenceId: '.jina-embeddings-v5-text-small',
    retriever: 'knn on semantic_text',
    dims: '384',
    esIndex: 'horizon-hotels',
    esField: 'semantic_text',
    lede: 'Your text query is converted to a 384-dim vector via EIS and run against the `semantic_text` field using kNN. Elasticsearch handles embedding, indexing, and approximate nearest-neighbor scoring.',
    flow: [
      { label: 'Text Query', sub: 'input', variant: 'neutral' },
      { label: 'Jina Embeddings v5', sub: 'via EIS', variant: 'jina' },
      { label: 'Query Vector', sub: '384 dims', variant: 'neutral' },
      { label: 'Elasticsearch kNN', sub: 'semantic_text', variant: 'elastic' },
      { label: 'Hotel Results', sub: 'ranked by score', variant: 'neutral' },
    ],
    wiringNotes: [
      'Query text → EIS generates a 384-dim vector via `.jina-embeddings-v5-text-small`',
      'Elasticsearch runs kNN on the `semantic_text` field — no keyword matching required',
      'Returns semantic, BM25, and RRF hybrid result sets for side-by-side comparison',
    ],
  },
  {
    id: 'rank',
    label: 'Rank',
    model: 'Reranker v3',
    modelFull: 'Jina Reranker v3',
    icon: '⚡',
    color: '#F04E98',
    inferenceId: '.jina-reranker-v3',
    retriever: 'text_similarity_reranker',
    esIndex: 'horizon-hotels',
    esField: 'semantic_text',
    lede: 'After Find returns candidates, the Reranker re-reads every hotel description against your query using cross-attention — not just vectors. Results are reordered by deep semantic relevance.',
    flow: [
      { label: 'Query + Candidates', sub: 'from Find', variant: 'neutral' },
      { label: 'Jina Reranker v3', sub: 'via EIS', variant: 'jina' },
      { label: 'Relevance Scores', sub: 'cross-attention', variant: 'neutral' },
      { label: 'Elasticsearch', sub: 'text_similarity_reranker', variant: 'elastic' },
      { label: 'Reranked Hotels', sub: 'final order', variant: 'neutral' },
    ],
    wiringNotes: [
      'Elasticsearch `text_similarity_reranker` retriever calls EIS to score each candidate',
      'Reranker v3 reads full hotel descriptions against the query with cross-attention (not just vectors)',
      'Rank deltas show how much each hotel moved — positive = promoted by reranker',
    ],
  },
  {
    id: 'look',
    label: 'Look',
    model: 'CLIP v2',
    modelFull: 'Jina CLIP v2 · jina-clip-v2',
    icon: '📷',
    color: '#00BFB3',
    endpoint: 'api.jina.ai/v1/embeddings',
    retriever: 'knn on image_embedding',
    dims: '1024',
    esIndex: 'horizon-hotels',
    esField: 'image_embedding',
    lede: 'Your uploaded image becomes a 1024-dim CLIP vector via the Jina API. Elasticsearch runs kNN against hotel photo embeddings in the `image_embedding` field — pure visual similarity, no text.',
    flow: [
      { label: 'Image Upload', sub: 'input', variant: 'neutral' },
      { label: 'Jina CLIP v2', sub: 'direct API', variant: 'jina' },
      { label: 'Image Vector', sub: '1024 dims', variant: 'neutral' },
      { label: 'Elasticsearch kNN', sub: 'dense_vector', variant: 'elastic' },
      { label: 'Visual Matches', sub: 'similar hotels', variant: 'neutral' },
    ],
    wiringNotes: [
      'Uploaded image → direct Jina API generates a 1024-dim multimodal CLIP vector',
      'Elasticsearch kNN search on the `image_embedding` dense_vector field',
      'No text involved — purely visual similarity between your image and hotel photos',
    ],
  },
  {
    id: 'describe',
    label: 'Describe',
    model: 'VLM',
    modelFull: 'Jina VLM · jina-vlm',
    icon: '👁',
    color: '#A855F7',
    endpoint: 'api-beta-vlm.jina.ai',
    lede: 'A hotel image is sent to Jina VLM, which returns structured JSON: style, mood, amenities, guest profile. The output can feed back into Elasticsearch as a semantic text query.',
    flow: [
      { label: 'Hotel Image', sub: 'input', variant: 'neutral' },
      { label: 'Jina VLM', sub: 'api-beta-vlm.jina.ai', variant: 'jina' },
      { label: 'JSON Analysis', sub: 'structured', variant: 'neutral' },
      { label: 'Style · Mood · Amenities', sub: 'rendered card', variant: 'neutral' },
    ],
    wiringNotes: [
      'Hotel image sent directly to Jina VLM API — beta endpoint, not EIS',
      'VLM returns structured JSON: style, mood, amenities, guest profile via Zod schema',
      '"Find with Query" button feeds the VLM description back into Elasticsearch semantic search',
    ],
  },
  {
    id: 'capstone',
    label: 'Data Flow',
    model: '5 Models',
    modelFull: 'Reader · Embeddings v5 · Reranker v3 · CLIP v2 · VLM',
    icon: '🔀',
    color: '#0077CC',
    lede: 'All five Jina models work in a single pipeline — from URL ingestion to visual search. Each model hands off to Elasticsearch or the next model in sequence.',
    flow: [],
    wiringNotes: [
      'All 5 Jina models run in sequence: ingest → find → rank → look → describe',
      'Each model hands off to Elasticsearch or to the next model in the chain',
      'The full pipeline powers a single hotel search experience end-to-end',
    ],
  },
  {
    id: 'agent',
    label: 'Agent',
    model: 'Agent Builder',
    modelFull: 'Elastic Agent Builder (Kibana)',
    icon: '✨',
    color: '#00BFB3',
    lede: 'Elastic Agent Builder orchestrates multi-step hotel search using natural language. It selects the right Jina model and Elasticsearch retriever based on the user\'s intent.',
    flow: [],
    wiringNotes: [
      'Agent Builder in Kibana orchestrates multi-step hotel search via natural language',
      'Tools wired: Elasticsearch connector + Jina model endpoints as skills',
      'Agent interprets intent and selects the right retrieval path — semantic, visual, or reranked',
    ],
  },
];

export function getStationMeta(id: Station): StationMeta {
  return STATION_META.find(s => s.id === id)!;
}
