export interface ModelTag {
  label: string;
  color: string;
}

export interface InteractiveCardData {
  id: string;
  sector: string;
  sectorIcon: string;
  title: string;
  hook: string;
  models: ModelTag[];
}

export interface InfoCardData {
  sector: string;
  sectorIcon: string;
  title: string;
  hook: string;
  bullets: string[];
  models: ModelTag[];
}

export interface SectorData {
  id: string;
  label: string;
  icon: string;
  accentColor: string;
  description: string;
  interactiveCards: InteractiveCardData[];
  infoCards: InfoCardData[];
}

const EMB: ModelTag = { label: 'Embeddings v5', color: '#0077CC' };
const RERANK: ModelTag = { label: 'Reranker v3', color: '#F04E98' };
const CLIP: ModelTag = { label: 'CLIP v2', color: '#00BFB3' };

export const SECTORS: SectorData[] = [
  {
    id: 'search',
    label: 'Search',
    icon: '🔍',
    accentColor: '#0077CC',
    description: 'Semantic search unlocks insight buried in complex, multilingual, and visual data — beyond keyword matching.',
    interactiveCards: [
      {
        id: 'finance-earnings',
        sector: 'Financial Services',
        sectorIcon: '💹',
        title: 'Earnings Intelligence',
        hook: 'Find the exact CapEx figure a CFO buried in a 100-page transcript — keyword search returns 47 irrelevant matches.',
        models: [EMB, RERANK],
      },
      {
        id: 'manufacturing-parts',
        sector: 'Manufacturing',
        sectorIcon: '⚙️',
        title: 'Visual Parts Search',
        hook: 'Mechanic snaps a photo of a damaged sensor. CLIP finds the exact part from a 50,000-item CAD library. No part name needed.',
        models: [CLIP],
      },
    ],
    infoCards: [
      {
        sector: 'Legal',
        sectorIcon: '⚖️',
        title: 'Contract Discovery',
        hook: 'Search 500 contracts across three languages without translation.',
        bullets: [
          'Find termination clauses that allow exit without penalties',
          'Cross-lingual: query in English, retrieve French and Spanish contracts',
          'Semantic nuance catches "exit without notice" vs "termination for cause"',
        ],
        models: [EMB, RERANK],
      },
      {
        sector: 'Media & Entertainment',
        sectorIcon: '🎬',
        title: 'Video Scene Search',
        hook: 'Text query finds matching video frames — no metadata, no tags.',
        bullets: [
          '"Car chase in neon rain" retrieves the exact timestamp across 10,000 hours of footage',
          'CLIP encodes both frames and text into the same vector space',
          '89-language cross-lingual asset discovery without translation',
        ],
        models: [CLIP],
      },
      {
        sector: 'Healthcare',
        sectorIcon: '🏥',
        title: 'Patient–Specialist Matching',
        hook: 'Match rare-condition patients to the right specialist at scale.',
        bullets: [
          'Embed patient profiles and specialist expertise descriptions semantically',
          'Finds "autoimmune neuropathy specialist" even when the patient record says "peripheral nerve inflammation"',
          'Reduces referral delays for complex, hard-to-name conditions',
        ],
        models: [EMB],
      },
    ],
  },
  {
    id: 'observability',
    label: 'Observability',
    icon: '📊',
    accentColor: '#00BFB3',
    description: 'Embeddings turn log noise into signal — detecting anomalies, collapsing alert storms, and surfacing root cause without hardcoded rules.',
    interactiveCards: [
      {
        id: 'olly-log-anomaly',
        sector: 'Observability',
        sectorIcon: '📋',
        title: 'Log Anomaly Detection',
        hook: 'Detect impossible log sequences — novel attack patterns that no rule engine has ever seen before.',
        models: [EMB],
      },
      {
        id: 'olly-alert-storm',
        sector: 'Observability',
        sectorIcon: '🌩️',
        title: 'Alert Storm Deduplication',
        hook: '1,003 raw alerts become 2 true incidents. On-call engineers actually sleep.',
        models: [EMB],
      },
    ],
    infoCards: [
      {
        sector: 'APM',
        sectorIcon: '🔭',
        title: 'Trace Similarity Search',
        hook: 'Find all traces that look like a known slow trace.',
        bullets: [
          'Embed trace structure (service call graph + timing) as a single vector',
          'Surfaces 0.1% of traces with regression pattern — impossible with thresholds',
          'Pinpoints which span broke across deploys without re-reading every trace',
        ],
        models: [EMB],
      },
      {
        sector: 'AIOps',
        sectorIcon: '🤖',
        title: 'Multi-Modal Root Cause Analysis',
        hook: 'Your current system state is 89% similar to a DB connection pool exhaustion from 6 months ago.',
        bullets: [
          'Compress metrics + logs + traces into a single vector via VAE',
          'Reconstruction error = anomaly score — no rules to write',
          'Historical similarity surfaces root cause before the incident becomes an outage',
        ],
        models: [EMB],
      },
      {
        sector: 'Incident Management',
        sectorIcon: '📖',
        title: 'Alert → Runbook Matching',
        hook: 'Junior engineer gets an unfamiliar alert — the right runbook surfaces instantly.',
        bullets: [
          '"Database latency spike" finds runbook titled "Slow SQL Queries" — zero shared keywords',
          'Reranker surfaces the most procedurally relevant runbook, not just the most similar title',
          'Cuts escalation rate for novel alerts by removing the "which runbook?" lookup',
        ],
        models: [EMB, RERANK],
      },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    icon: '🛡️',
    accentColor: '#F04E98',
    description: 'Attackers actively evade regex and signatures. Semantic embeddings find the meaning of an attack — impossible to obfuscate.',
    interactiveCards: [
      {
        id: 'security-alert-triage',
        sector: 'Security Operations',
        sectorIcon: '🚨',
        title: 'Alert Triage & Clustering',
        hook: 'Same attack, 12 different rule names. Semantic clustering finds them all — 10,000 alerts become 47 true incidents.',
        models: [EMB],
      },
      {
        id: 'security-ttp',
        sector: 'Threat Intelligence',
        sectorIcon: '🕵️',
        title: 'CVE / TTP Correlation',
        hook: 'Zero lexical overlap with any known IOC. Semantic match reveals a coordinated 6-month campaign.',
        models: [EMB, RERANK],
      },
    ],
    infoCards: [
      {
        sector: 'Endpoint Security',
        sectorIcon: '💻',
        title: 'Malware Behavioral Analysis',
        hook: 'Embed syscall sequences to catch polymorphic variants that swap API calls.',
        bullets: [
          'Treats CreateRemoteThread → VirtualAllocEx → WriteProcessMemory as "meaning"',
          'Detects reordered or obfuscated variants with 0.97 cosine similarity to known malware',
          'Zero-day detection: no signature required — behavioral pattern is the fingerprint',
        ],
        models: [EMB],
      },
      {
        sector: 'Email Security',
        sectorIcon: '📧',
        title: 'Phishing Detection',
        hook: 'Zero-day phishing caught because its vector is 96% similar to a campaign from 3 months ago.',
        bullets: [
          'Embed full email (subject + body + sender) as a single vector',
          'Catches "Your access expires" even though known template says "Your password will expire"',
          'Homograph attacks caught by full email context, not domain-only matching',
        ],
        models: [EMB],
      },
      {
        sector: 'Incident Response',
        sectorIcon: '🔥',
        title: 'Incident → Runbook Matching',
        hook: 'Unfamiliar alert? The exact runbook surfaces in seconds — no escalation needed.',
        bullets: [
          '"Unauthorized SSH from external IP" finds runbook "Lateral Movement — SSH Anomaly"',
          'Reranker ranks runbooks by procedural relevance, not just title similarity',
          'Works across 300+ runbooks with no re-indexing after wording changes',
        ],
        models: [EMB, RERANK],
      },
    ],
  },
];
