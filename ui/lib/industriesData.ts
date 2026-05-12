export interface ModelTag {
  label: string;
  color: string;
}

export interface SummaryData {
  businessProblem: string;
  technicalSolution: string;
  positionWhen: string[];
  dontPositionWhen: string[];
}

export interface CompactDemoStep {
  label: string;
  heading: string;
  body: string;
  highlight?: string;
  tag?: string;
}

export interface CompactDemoSpec {
  steps: CompactDemoStep[];
  summaryData: SummaryData;
}

export interface InteractiveCardData {
  id: string;
  sector: string;
  sectorIcon: string;
  title: string;
  hook: string;
  models: ModelTag[];
  summaryData?: SummaryData;
}

export interface InfoCardData {
  id: string;
  sector: string;
  sectorIcon: string;
  title: string;
  hook: string;
  bullets: string[];
  models: ModelTag[];
  compactDemo?: CompactDemoSpec;
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
const OMNI: ModelTag = { label: 'Omni v5', color: '#7C3AED' };

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
        summaryData: {
          businessProblem: 'CFOs bury critical financial commitments in 100-page earnings transcripts — analysts spend hours reading every page to find one figure.',
          technicalSolution: 'The pipeline runs in three stages inside Elasticsearch. First, BM25 and kNN retrieval over semantic_text fields pull a broad candidate set — Jina Embeddings v5 generates the dense vectors so a query like "supply chain risk in Q3" matches passages that never use those exact words. Second, Reranker v3 takes the top ~50 candidates and re-scores each one by reading the query and passage together as a pair, which catches nuance that single-vector similarity misses (negations, entity roles, temporal qualifiers). For customers: hybrid retrieval gets you in the neighborhood; the reranker picks the right house.',
          positionWhen: [
            'Customer has large document corpora: earnings calls, filings, contracts, research reports',
            'Analysts manually read full transcripts to find specific data points',
            'Keyword search returns too many false positives',
          ],
          dontPositionWhen: [
            'Customer needs exact numeric extraction — use structured NER/parsing, not semantic search',
            'Document corpus is small (<100 docs) — BM25 alone is sufficient',
            'All queries are exact-match lookups (ticker symbols, IDs, dates)',
          ],
        },
      },
      {
        id: 'manufacturing-parts',
        sector: 'Manufacturing',
        sectorIcon: '⚙️',
        title: 'Visual Parts Search',
        hook: 'Mechanic snaps a photo of a damaged sensor. CLIP finds the exact part from a 50,000-item CAD library. No part name needed.',
        models: [CLIP],
        summaryData: {
          businessProblem: 'A mechanic cannot name a damaged part — keyword search requires knowing the part name, but a photo does not.',
          technicalSolution: 'At index time, CLIP v2 on EIS encodes every part image into a 1024-dimension vector — no text descriptions needed. When a mechanic photographs a damaged sensor, CLIP v2 encodes that photo into the same vector space and kNN retrieves the top visual matches in milliseconds. The embedding space captures shape, texture, and connector geometry: a bent capacitor matches its catalog entry even when dented or partially obscured. For customers: if your team has images but not part numbers, this is the only search that works.',
          positionWhen: [
            'Customer has a visual product or parts catalog with images',
            'Users often have images but not part names, SKUs, or descriptions',
            'Catalog has meaningful visual variation between similar parts',
          ],
          dontPositionWhen: [
            'All parts have unique, scannable barcodes or QR codes — exact lookup is faster and more accurate',
            'Catalog is text-only with no associated images',
            'Parts are visually identical to each other (requires text/attribute search)',
          ],
        },
      },
    ],
    infoCards: [
      {
        id: 'search-legal',
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
        compactDemo: {
          steps: [
            {
              label: 'problem',
              heading: '500 contracts. 3 languages. Legal team reads manually.',
              body: 'Query: "termination clauses allowing exit without penalty." BM25 returns 12 results — all in English, all with the literal word "termination."',
              tag: 'BM25',
            },
            {
              label: 'embed',
              heading: 'Embeddings v5 encodes regardless of language.',
              body: 'Japanese contract clause: "解約は30日前通知により..." Embedded into the same vector space as English query — no translation pipeline.',
              tag: 'Embeddings v5',
            },
            {
              label: 'result',
              heading: 'Cross-lingual match — zero translation.',
              body: 'Reranker surfaces French contract clause ranked #1: "Résiliation sans pénalité avec préavis de 30 jours." Exact semantic match, never surfaced by keyword.',
              highlight: 'Found indemnity clause in Japanese contract — no translation pipeline',
              tag: 'Reranker v3',
            },
          ],
          summaryData: {
            businessProblem: 'Legal teams waste weeks manually reviewing multilingual contracts looking for specific clause types.',
            technicalSolution: 'Jina Embeddings v5 encodes clauses across 89+ languages into a shared vector space. Reranker v3 re-scores by semantic relevance, not lexical match.',
            positionWhen: [
              'Customer has multilingual document corpora (contracts, policies, filings)',
              'Legal team spends significant time on manual document review',
              'Semantic nuance matters (e.g., "exit without notice" ≠ "termination for cause")',
            ],
            dontPositionWhen: [
              'Documents are all in one language and keyword search works well',
              'Customer needs legally binding extraction with provenance — pair with human review',
              'Corpus is very small (<50 docs) — manual review is faster',
            ],
          },
        },
      },
      {
        id: 'search-video',
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
        compactDemo: {
          steps: [
            {
              label: 'problem',
              heading: '10,000 hours of footage. Zero metadata on 80% of it.',
              body: 'Editor needs: "crowd cheering at night, stadium lights." Tag-based search returns 0 results for this archive — it was never manually tagged.',
              tag: 'Keyword: 0 results',
            },
            {
              label: 'encode',
              heading: 'CLIP v2 encodes frames and text into the same space.',
              body: 'Video frames sampled at 1fps, embedded via Jina CLIP v2 on EIS. Text query encoded with the same model — directly comparable vectors.',
              tag: 'CLIP v2',
            },
            {
              label: 'result',
              heading: 'Frame 4:23 — exact scene, no tags required.',
              body: 'kNN search returns top-5 matching frames with timestamps. The exact stadium-at-night shot is #1. Editor clicks through to the source clip.',
              highlight: 'Frame 4:23 — 0.91 similarity, zero manual tags',
              tag: 'kNN',
            },
          ],
          summaryData: {
            businessProblem: 'Media archives are 80% untagged — editors can only search what was manually labeled, missing the majority of the library.',
            technicalSolution: 'Jina CLIP v2 on EIS encodes video frames at index time. Text queries at search time compare directly against frame vectors — no tags needed.',
            positionWhen: [
              'Customer has large video archive with incomplete or inconsistent tagging',
              'Editors or producers need to find specific visual moments by description',
              'Cross-lingual team queries content in multiple languages',
            ],
            dontPositionWhen: [
              'Footage is fully and accurately tagged — metadata search is faster',
              'Customer needs audio search (CLIP is visual-only — Omni handles audio+video)',
              'Real-time video search required (frame indexing has latency)',
            ],
          },
        },
      },
      {
        id: 'search-healthcare',
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
        compactDemo: {
          steps: [
            {
              label: 'problem',
              heading: 'Patient: anti-NMDA receptor encephalitis. Referral coordinator searches manually.',
              body: 'Rare condition. No exact specialty tag. Keyword search for "encephalitis specialist" returns general neurologists — none with autoimmune subspecialty.',
              tag: 'Keyword: wrong results',
            },
            {
              label: 'embed',
              heading: 'kNN over 8,000 embedded specialist profiles.',
              body: 'Specialist profiles embed expertise descriptions: "autoimmune encephalitis, paraneoplastic disorders, NMDAR antibody syndromes." Patient record embedded with same model.',
              tag: 'Embeddings v5',
            },
            {
              label: 'result',
              heading: 'Dr. Chen — neuroimmunology. 0.94 match.',
              body: 'Correct subspecialist surfaced despite zero keyword overlap between patient record and specialist profile. Referral placed within minutes.',
              highlight: 'Dr. Chen — neuroimmunology subspecialty, 0.94 match',
              tag: 'kNN',
            },
          ],
          summaryData: {
            businessProblem: 'Rare-condition patients get misrouted to generalists because referral systems rely on exact specialty tags that don\'t exist for complex presentations.',
            technicalSolution: 'Jina Embeddings v5 encodes both patient case notes and specialist expertise descriptions into a shared semantic space. kNN finds the best-matching specialist.',
            positionWhen: [
              'Customer has large specialist network with rich profile descriptions',
              'Referral accuracy for complex or rare conditions is a measurable pain point',
              'Patient records use clinical narrative (not just structured ICD codes)',
            ],
            dontPositionWhen: [
              'Matching is purely by specialty code — structured lookup is simpler and faster',
              'Regulatory constraints require explainable, rule-based matching only',
              'Specialist profiles are sparse or poorly maintained',
            ],
          },
        },
      },
    ],
  },
  {
    id: 'observability',
    label: 'Observability',
    icon: '📊',
    accentColor: '#00BFB3',
    description: 'Surface root cause faster with semantic understanding of logs, traces, and incidents — without embedding your entire log stream.',
    interactiveCards: [
      {
        id: 'olly-rca-log-search',
        sector: 'Observability',
        sectorIcon: '🔍',
        title: 'RCA via Semantic Log Search',
        hook: 'The log that explains the incident is buried at #47. The reranker pulls it to #1 in seconds — zero re-indexing required.',
        models: [RERANK],
        summaryData: {
          businessProblem: 'SREs lose hours during incidents because keyword search misses the log that explains the failure — it uses different words than the query.',
          technicalSolution: 'BM25 retrieves a time-bounded candidate window (last 1-2 hours) — no re-indexing, no new pipelines, just a text_similarity_reranker query against existing log indices. Reranker v3 on EIS then re-scores each (query, log_line) pair by reading them together: it understands that "connection pool exhausted after 3pm deploy" and "java.sql.SQLException: timeout waiting for connection" describe the same event. The log that explains the incident jumps from rank 47 to rank 1 in seconds. For customers: your logs are already there — the reranker just reads them smarter.',
          positionWhen: [
            'Customer has existing log indices and wants semantic value without re-indexing anything',
            'Incident-response or on-call workflow with time-bounded queries (last 1-2 hours)',
            'SREs already complain that "Elastic search misses things" during incidents',
          ],
          dontPositionWhen: [
            'Customer wants real-time alerting on log content — use ML detection rules, not query-time reranking',
            'Unbounded always-on dashboard queries — rerank cost per query is non-trivial at volume',
            'Customer expects this to replace structured field extraction or metric alerting',
          ],
        },
      },
      {
        id: 'olly-metric-anomaly',
        sector: 'Observability',
        sectorIcon: '📈',
        title: 'Metric Anomaly Historical Match',
        hook: 'Elastic ML detected it. This looks 89% like the Black Friday 2024 outage — here\'s the fix that worked.',
        models: [EMB],
        summaryData: {
          businessProblem: 'Elastic ML detects anomalies but cannot tell on-call engineers "you\'ve seen this before" — institutional memory dies with team turnover.',
          technicalSolution: 'Elastic ML detects the anomaly; Embeddings v5 explains it. When ML flags an anomaly, its output fingerprint (anomaly type, affected service, magnitude, context) is embedded with Jina Embeddings v5 and run as a kNN query against a pre-indexed corpus of historical postmortems. The corpus is small and bounded — a few hundred documents — so embedding it is a one-time cost with nightly refresh. For customers: you already have the institutional memory; we just make it retrievable.',
          positionWhen: [
            'Customer has written postmortem culture with at least 50 historical incident docs',
            'Mature SRE org with recurring incident patterns across quarters',
            'High on-call rotation where institutional memory is fragile',
          ],
          dontPositionWhen: [
            'Fewer than ~50 historical postmortems — corpus too thin for meaningful matches',
            'Postmortems are unstructured Slack threads with no narrative',
            'Customer expects anomaly detection — Elastic ML does that; this explains what the anomaly resembles',
          ],
        },
      },
    ],
    infoCards: [
      {
        id: 'olly-trace-sim',
        sector: 'APM',
        sectorIcon: '🔭',
        title: 'Trace Similarity Search',
        hook: 'Find all traces that look like a known slow trace — from sampled APM data only.',
        bullets: [
          'Embed trace structure (service call graph + timing) from sampled spans — APM samples by default',
          'Surfaces 0.1% of traces with the regression pattern — impossible with threshold rules',
          'Pinpoints which span broke across deploys without re-reading every trace',
        ],
        models: [EMB],
        compactDemo: {
          steps: [
            {
              label: 'problem',
              heading: 'Checkout is slow again. Which trace matches the May 12 regression?',
              body: 'APM samples 1% of traces by default. 10,000 sampled spans indexed. Engineers manually comparing traces in Kibana APM — slow and error-prone.',
              tag: 'APM sampled traces',
            },
            {
              label: 'embed',
              heading: 'Known-slow trace fingerprinted and embedded.',
              body: 'The May 12 regression trace (service call graph + span timing) embedded as a single vector. kNN search against the sampled span corpus.',
              tag: 'Embeddings v5',
            },
            {
              label: 'result',
              heading: 'Regression pattern matches — same span depth as May 12.',
              body: 'Top-3 traces surface: all show the same external payment API span taking 2.8s+ in the checkout flow. Root cause pinpointed without reading 10,000 traces.',
              highlight: 'Regression trace found — same span depth as May 12 incident',
              tag: 'kNN',
            },
          ],
          summaryData: {
            businessProblem: 'Engineers spend hours manually comparing traces to find which ones match a known regression pattern — a needle-in-haystack problem at APM scale.',
            technicalSolution: 'Trace structure (service call graph + timing) embedded with Jina Embeddings v5. kNN against a corpus of sampled spans (APM default: ~1% sample rate keeps volume bounded).',
            positionWhen: [
              'Customer uses Elastic APM with default or custom trace sampling',
              'Engineering team has known-bad trace exemplars they want to find matches for',
              'Regression tracking across deploys is a recurring need',
            ],
            dontPositionWhen: [
              'Customer ingests 100% unsampled traces at high volume — embedding the firehose is cost-prohibitive',
              'Trace structure is too homogeneous (single-service apps) — similarity adds no signal',
              'Customer already has deterministic trace comparison tooling that works',
            ],
          },
        },
      },
      {
        id: 'olly-deploy-diff',
        sector: 'AIOps',
        sectorIcon: '🔀',
        title: 'Deploy Diff → Incident Correlation',
        hook: 'PR #4823 caused it — 6 hours ago. No keyword overlap with "checkout latency."',
        bullets: [
          '18 merged PRs from last 24h embedded once on merge — tiny bounded corpus',
          'Reranker scores each PR description against the live incident symptom',
          'Surfaces the causal commit without tags or structured metadata',
        ],
        models: [EMB, RERANK],
        compactDemo: {
          steps: [
            {
              label: 'problem',
              heading: 'Incident: checkout p99 spike. 18 PRs merged today. Which one?',
              body: 'On-call engineer scans 18 PRs manually. PR titles mention HikariCP, connection pool, Spring Boot config — nothing about "checkout" or "latency."',
              tag: 'Manual review',
            },
            {
              label: 'rerank',
              heading: 'Reranker scores 18 PRs against the incident symptom.',
              body: 'Incident: "checkout p99 3x baseline, DB-bound." 18 PR descriptions embedded on merge and reranked against the symptom. PR #4823: "refactor HikariCP connection pool sizing config" — rank #11 → #1.',
              tag: 'Reranker v3',
            },
            {
              label: 'result',
              heading: 'PR #4823 — rank #11 → #1. No shared keywords.',
              body: '"Refactor HikariCP pool config" has zero keyword overlap with "checkout latency spike." Semantic match surfaces the causal PR in seconds.',
              highlight: 'PR #4823: rank #11 → #1 (+10 delta). No shared keywords.',
              tag: 'Reranker v3',
            },
          ],
          summaryData: {
            businessProblem: 'On-call engineers manually scan dozens of recent PRs trying to identify which deploy caused an incident — a time-consuming and error-prone process.',
            technicalSolution: 'PR descriptions embedded with Jina Embeddings v5 on merge (tiny bounded corpus, ~10-50 PRs). Reranker v3 re-scores PRs against the live incident symptom at query time.',
            positionWhen: [
              'Customer has active CI/CD with multiple daily deploys and frequent incident correlation',
              'PR descriptions follow a reasonable narrative (not just ticket IDs)',
              'Incident MTTR is a tracked metric the team wants to improve',
            ],
            dontPositionWhen: [
              'Customer already has deterministic deploy-to-incident correlation via feature flags or canary tooling',
              'PR titles and descriptions are too sparse ("fix bug", "update deps")',
              'Deploys are infrequent enough that manual review is trivial',
            ],
          },
        },
      },
      {
        id: 'olly-runbook',
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
        compactDemo: {
          steps: [
            {
              label: 'problem',
              heading: 'Alert: "database latency spike." 300 runbooks. Which one?',
              body: 'Junior on-call engineer. Alert fires at 2am. Keyword search in Confluence: "database latency" returns 0 runbooks — the relevant one is titled "Slow SQL Queries."',
              tag: 'Keyword: 0 results',
            },
            {
              label: 'rerank',
              heading: 'Runbook corpus reranked against alert text.',
              body: '300 runbook titles and summaries pre-embedded with Embeddings v5. Alert text reranked against the full corpus. "Slow SQL Queries" scores 0.87 — highest relevance despite zero keyword overlap.',
              tag: 'Reranker v3',
            },
            {
              label: 'result',
              heading: '"Slow SQL Queries" runbook — zero keyword overlap.',
              body: 'Top-3 runbooks surface with match explanations. Engineer follows the correct runbook. Escalation avoided. No senior engineer paged.',
              highlight: '"Slow SQL Queries" runbook — zero keyword overlap with alert',
              tag: 'Reranker v3',
            },
          ],
          summaryData: {
            businessProblem: 'Junior on-call engineers escalate incidents that senior engineers could have resolved — the right runbook exists but isn\'t findable by the alert\'s exact wording.',
            technicalSolution: 'Runbook corpus (titles + summaries) pre-embedded with Jina Embeddings v5. Reranker v3 re-scores top candidates against the alert text at query time. Fixed, small corpus — no ingest pipeline.',
            positionWhen: [
              'Customer has a documented runbook library (even 50+ docs is enough)',
              'On-call escalation rate for junior engineers is a tracked pain point',
              'Alerts use different terminology than runbook titles',
            ],
            dontPositionWhen: [
              'Runbooks are already indexed with consistent tags that match alert names',
              'Customer uses a dedicated incident management platform with native runbook linking',
              'Runbook library is actively maintained to match alert naming conventions',
            ],
          },
        },
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
        id: 'security-cve-service',
        sector: 'Security Operations',
        sectorIcon: '🔒',
        title: 'CVE → Running Service',
        hook: 'New CVE drops. Keyword search on service names returns 0. Reranker finds 3 exposed services in the catalog in 8 seconds.',
        models: [EMB, RERANK],
        summaryData: {
          businessProblem: 'New CVE drops at 9am; security team spends the day manually asking every service owner "do you run this?" instead of patching.',
          technicalSolution: 'When a new CVE drops, its full description is embedded with Jina Embeddings v5 and reranked against a pre-embedded service catalog. The catalog is a fixed, bounded corpus — typically hundreds of entries — refreshed nightly on any catalog change. Reranker v3 scores each (CVE description, service description) pair together, catching implicit technology references: a CVE for "Spring Boot actuator exposure" matches services that mention "Spring framework microservices" with no shared keywords. For customers: exposure window goes from days to minutes.',
          positionWhen: [
            'Customer has service catalog or CMDB with tech-stack descriptions',
            'Vulnerability management team is overwhelmed by CVE volume',
            'Existing SBOM coverage is incomplete or stale',
          ],
          dontPositionWhen: [
            'Customer has complete, accurate SBOM — exact version matching beats semantic match',
            'Service catalog is empty or descriptions are too sparse',
            'Customer wants exploit prediction or severity scoring — this is asset-match only',
          ],
        },
      },
      {
        id: 'security-ttp',
        sector: 'Threat Intelligence',
        sectorIcon: '🕵️',
        title: 'CVE / TTP Correlation',
        hook: 'Zero lexical overlap with any known IOC. Semantic match reveals a coordinated 6-month campaign.',
        models: [EMB, RERANK],
        summaryData: {
          businessProblem: 'SOC analysts see alerts as isolated events — the MITRE ATT&CK kill-chain story across alerts is invisible until post-breach forensics.',
          technicalSolution: 'Each alert in the SOC queue is embedded with Embeddings v5 and reranked against the full MITRE ATT&CK technique corpus — a fixed ~600 techniques that changes quarterly, so re-embedding is rare and cheap. Reranker v3 reads each (alert description, technique description) pair together to score procedural similarity: "staged credentials in /tmp before exfil" maps to T1003 even without "credential dumping" in the alert text. Across a time window, technique matches across multiple alerts reveal the kill-chain sequence. For customers: the attacker\'s playbook is readable from your existing alerts.',
          positionWhen: [
            'SOC has alert fatigue and wants narrative TTP context beyond raw IOC matching',
            'Customer is mature enough to act on TTP-level intel (threat hunting team exists)',
            'Alert descriptions follow a consistent narrative format',
          ],
          dontPositionWhen: [
            'Customer\'s primary need is IOC matching — that\'s a join, not semantic search',
            'Alert pipeline lacks normalized description schema',
            'Customer expects this to replace SIEM correlation rules — it augments, not replaces',
          ],
        },
      },
    ],
    infoCards: [
      {
        id: 'security-malware',
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
        compactDemo: {
          steps: [
            {
              label: 'problem',
              heading: 'Sandboxed binary. No known signature match. Zero IOCs.',
              body: 'EDR flags a suspicious binary for sandbox analysis. Signature DB: no match. Hash: no match. Security team analyzes syscall sequence manually.',
              tag: 'Signature: 0 matches',
            },
            {
              label: 'embed',
              heading: 'Syscall sequence embedded as behavioral fingerprint.',
              body: 'CreateRemoteThread → VirtualAllocEx → WriteProcessMemory sequence extracted and embedded. Compared against pre-embedded known-malware behavioral corpus.',
              tag: 'Embeddings v5',
            },
            {
              label: 'result',
              heading: '0.97 cosine match — Mirai botnet variant.',
              body: 'Behavioral embedding matches Mirai botnet variant despite different function order and obfuscated API names. Classified without any signature update.',
              highlight: '0.97 cosine to Mirai botnet variant — no signature match needed',
              tag: 'kNN',
            },
          ],
          summaryData: {
            businessProblem: 'Polymorphic malware evades signature-based detection by swapping, reordering, or obfuscating API calls — the behavior remains the same even when the signature doesn\'t.',
            technicalSolution: 'Syscall sequences from sandboxed binaries embedded with Jina Embeddings v5. kNN against a pre-embedded corpus of known malware behavioral patterns — post-detection enrichment, not ingest-time streaming.',
            positionWhen: [
              'Customer already has sandbox analysis in their EDR/malware pipeline',
              'Signature evasion (polymorphic/metamorphic malware) is a documented threat',
              'Security team wants automated behavioral classification after sandbox detonation',
            ],
            dontPositionWhen: [
              'As a replacement for EDR or kernel-level signal collection — this is post-detection enrichment only',
              'Customer expects real-time stream classification of all process events (too high volume)',
              'Malware corpus is too small (<100 samples) for meaningful nearest-neighbor matching',
            ],
          },
        },
      },
      {
        id: 'security-phishing',
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
        compactDemo: {
          steps: [
            {
              label: 'problem',
              heading: 'Novel phishing email. No known IOCs. Passes signature filters.',
              body: 'Subject: "Immediate action required: your access expires in 24 hours." No known sender domain. No blacklisted links. Passes all rule-based filters.',
              tag: 'Signature: pass',
            },
            {
              label: 'embed',
              heading: 'Full email embedded (subject + body + sender context).',
              body: 'Email encoded as a single vector via Embeddings v5. Compared against 90-day rolling corpus of confirmed phishing campaigns.',
              tag: 'Embeddings v5',
            },
            {
              label: 'result',
              heading: '0.96 match — same August campaign, different wording.',
              body: '"Your access expires" → 0.96 cosine similarity to August "Your password will expire" campaign. Same actor, different wording, zero keyword overlap.',
              highlight: '0.96 match to August campaign — actor fingerprinted despite rewording',
              tag: 'kNN',
            },
          ],
          summaryData: {
            businessProblem: 'Phishing actors reword templates to evade signature rules — the same campaign looks new to rule-based filters even though the intent and structure are identical.',
            technicalSolution: 'Full email (subject + body + sender context) embedded with Jina Embeddings v5. kNN against a rolling 90-day confirmed phishing corpus. Batch-processed — not real-time stream embedding of all email.',
            positionWhen: [
              'Customer has a corpus of confirmed phishing emails (even 500+ is sufficient)',
              'Phishing actors are known to reword campaigns across waves',
              'Current rule-based filters have high false-negative rate on novel phrasing',
            ],
            dontPositionWhen: [
              'Customer expects real-time classification of all email at inbox scale without GPU (too expensive)',
              'Corpus of confirmed phishing is too small or too stale to be meaningful',
              'Customer wants zero false positives — semantic similarity has inherent false positive risk',
            ],
          },
        },
      },
      {
        id: 'security-threat-intel',
        sector: 'Threat Intelligence',
        sectorIcon: '🎯',
        title: 'Threat Intel → Asset Match',
        hook: '"Identity federation gateway" matches an APT41 advisory about SAML — zero keyword overlap.',
        bullets: [
          'Advisory prose reranked against pre-indexed service catalog (~500 services)',
          'Finds assets matching the threat combination: org type + tech stack + exposure',
          'Works when CMDB terminology differs from advisory language',
        ],
        models: [EMB, RERANK],
        compactDemo: {
          steps: [
            {
              label: 'problem',
              heading: 'APT41 advisory: "targeting healthcare, Citrix NetScaler 13.x + SAML."',
              body: 'Security team needs to know: do we have exposed assets matching this profile? Keyword search on service names: "Citrix" returns 2 services — but the SAML federation gateway isn\'t named "Citrix."',
              tag: 'Keyword: 2 results',
            },
            {
              label: 'rerank',
              heading: 'Advisory prose reranked against 500 service catalog entries.',
              body: 'Full advisory text embedded and reranked against service catalog. "Identity federation gateway using SAML 2.0 for healthcare SSO" — description matches the advisory combination.',
              tag: 'Reranker v3',
            },
            {
              label: 'result',
              heading: '"Identity federation gateway" — keyword search missed it.',
              body: '3 services match the advisory profile. The SAML gateway is #1 — its description says "identity federation" not "Citrix." Keyword search returned 0 for this service.',
              highlight: '"Identity federation gateway" — keyword search returned 0',
              tag: 'Reranker v3',
            },
          ],
          summaryData: {
            businessProblem: 'Threat intel advisories use vendor-specific terminology; internal service catalogs use internal names — keyword matching misses exposed assets when the terms don\'t align.',
            technicalSolution: 'Threat intel advisory prose embedded with Jina Embeddings v5, reranked against pre-embedded internal service catalog. Finds assets matching the threat combination (tech + exposure + org type) without exact term match.',
            positionWhen: [
              'Customer has service catalog or CMDB with narrative tech-stack descriptions',
              'Security team regularly triages threat intel advisories for internal asset exposure',
              'Internal naming conventions differ from vendor/advisory terminology',
            ],
            dontPositionWhen: [
              'Service catalog is sparse (just service names, no descriptions)',
              'Customer already has SBOM with exact CPE/version mapping to CVE advisories',
              'Advisory volume is low enough that manual review is practical',
            ],
          },
        },
      },
    ],
  },
  {
    id: 'travel',
    label: 'Travel',
    icon: '✈️',
    accentColor: '#F59E0B',
    description: 'The same stack that powers Horizon — semantic hotel search, visual room matching, multilingual guests — applies to every hospitality property.',
    interactiveCards: [],
    infoCards: [
      {
        id: 'travel-hotel-search',
        sector: 'Travel & Hospitality',
        sectorIcon: '🏨',
        title: 'Hotel Semantic Search',
        hook: '"Quiet Vegas hotel near coffee for 9am calls" — no tags, no filters. Embeddings v5 returns the right property.',
        bullets: [
          'Understands intent across 89 languages — no tag taxonomy required',
          'Reranker v3 re-scores by nuance: soundproofing vs. "quiet" lobby',
          'Powers Horizon: the demo you just watched',
        ],
        models: [EMB, RERANK],
        compactDemo: {
          steps: [
            {
              label: 'query',
              tag: 'User query',
              heading: '"Quiet Vegas hotel near coffee for 9am calls"',
              body: 'No star rating filter. No neighborhood tag. No keyword "soundproof." BM25 returns 0 results — no literal keyword match.',
            },
            {
              label: 'embed',
              tag: 'Embeddings v5',
              heading: 'Query embedded alongside 150 hotel descriptions.',
              body: 'Embeddings v5 encodes "near a good coffee scene" into the same vector space as "steps from a Starbucks Reserve." Semantic proximity, not string match.',
            },
            {
              label: 'rerank',
              tag: 'Reranker v3',
              heading: 'Reranker catches the nuance vectors miss.',
              body: 'Vector recall surfaces 10 candidates. Reranker v3 reads query + full description together — moves the hotel with in-room soundproofing and lobby café to #1.',
              highlight: 'Wynn Las Vegas ranked #1 — soundproofed suites, espresso bar on-site',
            },
          ],
          summaryData: {
            businessProblem: 'Hotel booking apps rely on tag-based filters that miss nuanced traveler intent. "Quiet for remote work" doesn\'t match keyword "business center."',
            technicalSolution: 'Jina Embeddings v5 on EIS encodes intent semantically. Reranker v3 refines recall with cross-attention. Horizon is the reference implementation.',
            positionWhen: [
              'Customer has unstructured property descriptions (hotels, rentals, venues)',
              'Users express nuanced preference, not exact filter criteria',
              'Travel, hospitality, or real-estate vertical',
            ],
            dontPositionWhen: [
              'Customer only needs exact attribute filtering (3-star, pet-friendly)',
              'Catalog is <100 items — simple BM25 is sufficient',
            ],
          },
        },
      },
      {
        id: 'travel-visual-room',
        sector: 'Travel & Hospitality',
        sectorIcon: '📷',
        title: 'Visual Room Search',
        hook: 'Guest uploads a photo of the aesthetic they want. CLIP finds matching hotel rooms across 150 properties. No keywords.',
        bullets: [
          'CLIP v2 encodes text and images in the same 1024-dim vector space',
          'Same kNN index — no separate image pipeline',
          'Works cross-modal: text query also retrieves matching room images',
        ],
        models: [CLIP],
        compactDemo: {
          steps: [
            {
              label: 'upload',
              tag: 'Image query',
              heading: 'Guest uploads a photo: bright modern room, floor-to-ceiling windows.',
              body: 'No text. No tags. Just a JPEG. Traditional search has nothing to work with — returns a "please use the search bar" error.',
            },
            {
              label: 'embed',
              tag: 'CLIP v2',
              heading: 'CLIP encodes the image and every room photo in the same vector space.',
              body: 'At index time, CLIP embedded all hotel room images alongside text descriptions — one index. The query image is embedded with the same model at search time.',
            },
            {
              label: 'result',
              tag: 'kNN match',
              heading: 'Visually similar rooms returned — no keywords required.',
              body: 'Top 5 results share the same aesthetic: floor-to-ceiling windows, light color palette. Users can also type "bright modern room" and get the same results.',
              highlight: '5 visually matching properties — same index as text search',
            },
          ],
          summaryData: {
            businessProblem: 'Travelers often know what they want visually but can\'t express it in words. Existing image search requires separate pipelines and custom ML.',
            technicalSolution: 'CLIP v2 on EIS encodes images and text into the same vector space. One Elasticsearch index handles both modalities — same kNN query syntax.',
            positionWhen: [
              'Customer has product/property image catalogs',
              'Users browse visually (fashion, real estate, hospitality, e-commerce)',
              'Customer wants to add image search without a separate ML pipeline',
            ],
            dontPositionWhen: [
              'Customer only has text data — CLIP adds no value without images',
              'Privacy requirements prevent storing or encoding user-uploaded images',
            ],
          },
        },
      },
      {
        id: 'travel-omni',
        sector: 'Travel & Hospitality',
        sectorIcon: '🌐',
        title: 'Omni Property Discovery',
        hook: 'One kNN query covers text descriptions, room photos, and virtual tour audio. Single Elasticsearch index.',
        bullets: [
          'Omni v5 embeds text, image, audio, and video — same vector space',
          'No modality-specific pipelines or separate indices',
          'Same search syntax regardless of what the user uploads',
        ],
        models: [OMNI],
        compactDemo: {
          steps: [
            {
              label: 'problem',
              tag: 'Traditional stack',
              heading: 'Three modalities → three pipelines → three indices.',
              body: 'Text search index. Separate image similarity service. Separate audio-tour recommendation engine. Three teams, three maintenance burdens, three query paths.',
            },
            {
              label: 'embed',
              tag: 'Omni v5',
              heading: 'Omni v5 encodes everything into one shared vector space.',
              body: 'Hotel description text, room photos, and 3-minute virtual tour audio — all embedded by the same model. One Elasticsearch index. One kNN query covers all three.',
            },
            {
              label: 'result',
              tag: 'One index',
              heading: 'Guest query returns results from all modalities at once.',
              body: 'User types "oceanfront suite with a jazz vibe." Results include text matches, room photos with ocean-view framing, and audio tours with smooth jazz background.',
              highlight: 'One query — text, image, and audio results from the same index',
            },
          ],
          summaryData: {
            businessProblem: 'Multimodal search requires separate embedding pipelines, indices, and merge logic per modality — multiplicative complexity.',
            technicalSolution: 'Jina Omni v5 is a single model that encodes text, image, audio, and video into one shared vector space. One Elasticsearch index, one kNN query.',
            positionWhen: [
              'Customer has multiple media types (text + images + audio/video)',
              'Customer wants to avoid building modality-specific pipelines',
              'New Elastic customer evaluating Jina for multimodal search',
            ],
            dontPositionWhen: [
              'Customer only has text data — Embeddings v5 is simpler and sufficient',
              'Customer needs Omni on EIS now — Coming to EIS, not live yet',
            ],
          },
        },
      },
    ],
  },
];
