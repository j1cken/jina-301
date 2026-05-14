# Horizon — Jina AI 301: SKO FY27 Enablement Demo

**Event**: SKO FY27 — May 13, 2026 · Venetian Las Vegas  
**Audience**: ~296 Field Engineers  
**Format**: 17-min slides → 33-min live demo (6 stations) → 5-min Q&A

---

## What This Is

Horizon is a live travel hotel search app built specifically for SKO FY27 to teach Field Engineers how to sell and explain Jina AI's model portfolio, now available natively through Elastic. Every station in the demo maps to a real Jina model, showing what it does, why it matters, and how Elastic makes it enterprise-ready.

The demo is built around a fictional hotel search experience — visually polished, realistic enough to feel like a real product, engineered with deliberate semantic traps and edge cases that make each Jina model shine in exactly the right moment.

---

## Full Session Breakdown

### Part 1 — Slides (17 min)

> _Slide assets: `docs/presentation/`_

**Slide 1–2: Opening — Jina AI is Elastic (2 min)**
- Jina AI is now part of Elastic — this is the first SKO where we're enabling FEs on their model portfolio
- The acquisition brings best-in-class neural search models directly into the Elastic platform
- FEs don't need to learn a new vendor or new API — it's the same Elastic they already know

**Slide 3–6: The Model Portfolio — 5 Models, One Platform (5 min)**
- **Jina Reader** — give it any URL, get back clean structured text. No scraper setup, no HTML parsing, one API call
- **Jina Embeddings v5** — state-of-the-art text embeddings. Understands meaning, not keywords. Multilingual for free — same model handles English, German, Japanese, 89 languages
- **Jina Reranker v3** — takes search results and re-reads them alongside your query. Finds the precise answer that broad similarity search misses. Before/after is the "wow" moment
- **Jina CLIP v2** — multimodal embeddings. Images and text in the same vector space — search by image, find by text, or mix both
- **Jina VLM** — point it at any image and get a detailed natural language description. Architecture diagrams, hotel photos, product images — all become searchable text

**Slide 7–9: What EIS Gives You — Enterprise-Ready (3 min)**
- Every Serverless and Cloud Hosted cluster already has `.jina-embeddings-v5-text-small` and `.jina-reranker-v3` pre-configured — zero setup
- `semantic_text` field type: one field declaration, Elastic handles embedding at index time. No ML pipeline to build, no embeddings to manage
- Auth, scaling, observability — all handled by Elastic. The same Inference API shape whether it's embeddings, reranking, or chat: `_inference/{task}/{id}`

**Slide 10–13: The Business Conversation — What FEs Should Say (4 min)**
- Discovery question: "Does your search today return the right result or just the most popular keyword match?"
- Reranker is the upgrade path from basic semantic search — customers who've already deployed embeddings are ready for this
- CLIP/VLM unlock new use cases: e-commerce visual search, document intelligence, multimodal RAG
- Competitive positioning: this is Jina's model quality running on Elastic's enterprise infrastructure — not a point tool, not a cloud function, a production-grade service

**Slide 14–15: Demo Setup — What You're About to See (3 min)**
- Horizon: a travel hotel search app built on ~150 hotels across Las Vegas, Europe, Asia Pacific, and beyond
- 6 stations, each one isolates a single model so the "this model did that" moment is obvious
- Watch for the before/after at the Rank station — that's the conversation starter with customers

---

### Part 2 — Live Demo (33 min, 6 stations)

Presenter-only. ~296 Field Engineers watch live while the presenter walks through each station in sequence. Each station is self-contained with a clear before/after moment.

> See [The 6 Demo Stations](#the-6-demo-stations) below.

---

### Part 3 — Q&A (5 min)

Open floor.

---

## The Business Story

Jina AI is now part of Elastic. Their model portfolio — embeddings, reranking, multimodal search, and web reading — is being integrated into the Elastic Inference Service (EIS), making it available natively within the Elastic platform. SKO FY27 is the first time Field Engineers are being enabled on this capability at scale.

Field Engineers need to be able to:

1. **Explain** what each Jina model does in plain language
2. **Demo** it live in a realistic product context
3. **Position** Elastic as the platform that makes these models enterprise-ready (auth, scaling, data pipeline, observability)

The session gives Field Engineers a script to follow, a live app to show, and 6 discrete moments where the technology does something genuinely impressive.

---

## The 6 Demo Stations

| Station | Model | What It Shows |
|---|---|---|
| **Ingest** | Jina Reader | Scrape any hotel URL and extract clean structured content — no scraper setup, just an API call |
| **Find** | Jina Embeddings v5 | Semantic search across 150+ hotels — understands meaning, not just keywords |
| **Rank** | Jina Reranker v3 | Takes search results and reorders by true relevance — the "why did #1 actually win?" moment |
| **Look** | Jina CLIP v2 | Search by uploading an image — finds hotels that *look like* what you showed it |
| **Describe** | Jina VLM | Point the model at a hotel image and it generates a detailed natural language description |
| **Capstone** | All of the above | Full pipeline: ingest → embed → rank → describe, showing how the models compose together |

---

## Architecture

```
User Browser (Next.js 14)
    ↓ API routes
Elastic Inference Service (EIS)
    ├── .jina-embeddings-v5-text-small  (Find station)
    └── .jina-reranker-v3               (Rank station)

Jina AI Direct APIs
    ├── r.jina.ai                        (Ingest station)
    ├── api.jina.ai/v1/embeddings        (Look station — CLIP v2)
    └── api-beta-vlm.jina.ai             (Describe station — VLM)

Elasticsearch (horizon-hotels index)
    ├── semantic_text fields             (text embeddings via EIS)
    ├── dense_vector field               (CLIP image embeddings)
    └── geo_point field                  (map view)
```

The app is intentionally built without a backend server — Next.js API routes call Elasticsearch and Jina directly. This keeps the demo dependency surface small and makes offline/fallback mode reliable.

---

## Demo Data

- **~150 synthetic hotels** spread across Las Vegas, Western Europe, Mediterranean, Asia Pacific, Maldives, Middle East, Africa, Mountain, and Americas
- Hotels are generated by Gemini Pro with hyper-realistic descriptions (sensory details, noise character, neighborhood context)
- Images generated by nano-banana (Gemini Imagen) at 2K resolution
- Las Vegas hotels explicitly tagged as Strip-facing or off-Strip in descriptions — critical for semantic search demos
- **8 engineered hotels** are hand-crafted with deliberate semantic traps for the Reranker station (e.g., a hotel named "Zephyr Work Club" that is actually quiet and work-friendly despite the name)

### Critical Reranker Demo Queries
These four queries are tuned to produce dramatic reranking — the #1 result before reranking is wrong, and after reranking is right:

1. "quiet hotel for focused remote work, no casino noise"
2. "romantic beachfront with private pool villa and spa"
3. "boutique heritage hotel with authentic local architecture"
4. "eco-lodge for wildlife photography safaris"

---

## Fallback / Offline Mode

Every station supports pre-recorded responses via a **Fallback Mode** toggle in the header. When enabled, the app loads responses from `data/fallbacks/` instead of making live API calls. This is the safety net for unreliable conference WiFi.

Run `make fallbacks` before the event to capture fresh responses.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Styling | Elastic on-brand theme (dark navy, Elastic Blue, Teal, Pink) |
| Search | Elasticsearch (serverless) |
| AI Models | Jina AI via EIS + direct API |
| Image Gen | nano-banana (Gemini Imagen) |
| Hotel Gen | Gemini Pro via Vertex AI (elastic-sa project) |

---

## Setup & Running

### Quickstart (recommended)

```bash
make wizard     # Interactive setup — checks prereqs, configures env, indexes data
```

The wizard walks you through everything: prerequisites, credentials, Elasticsearch connectivity, EIS endpoint validation, dependency install, and data indexing. Re-run anytime:

```bash
./scripts/setup.sh --reconfigure    # Update credentials only
./scripts/setup.sh --skip-install   # Skip npm/uv install
./scripts/setup.sh --skip-index     # Skip data indexing
```

---

### Manual Setup

#### Prerequisites
- Node.js 18+, Python 3.11+
- [`uv`](https://astral.sh/uv) for Python venv management (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- Elastic Cloud Serverless or Cloud Hosted project with EIS enabled
  - Required inference endpoints: `.jina-embeddings-v5-text-small`, `.jina-reranker-v3`
  - These are pre-provisioned — check Kibana → Machine Learning → Inference Endpoints
- Jina AI API key — [jina.ai](https://jina.ai) (free tier available)
- `nano-banana` CLI — only needed if regenerating hotel images (`bun install -g nano-banana`)

#### Environment
Copy `.env.example` to `ui/.env.local` and fill in:

| Variable | Required | Description |
|---|---|---|
| `JINA_API_KEY` | ✅ | Jina AI API key — Reader, CLIP, VLM |
| `ELASTICSEARCH_URL` | ✅ | Elastic Cloud endpoint |
| `ELASTICSEARCH_API_KEY` | ✅ | Elastic Cloud API key |
| `KIBANA_URL` | Agent station | Kibana endpoint (same project) |
| `KIBANA_API_KEY` | Agent station | Kibana API key |
| `GEMINI_API_KEY` | Image gen only | Only needed to re-run `make images` |
| `CLIP_VIA_EIS` | — | Route CLIP through EIS (default: `true`) |
| `OMNI_VIA_EIS` | — | Route Omni through EIS (default: `true`) |

#### Install & Run
```bash
make install    # Node.js dependencies
make setup      # Python venv + dependencies
make index      # Index pre-built hotel data into Elasticsearch (~3–5 min)
make dev        # Start Next.js at http://localhost:3000
make fallbacks  # Capture fallback responses for offline mode
```

#### Generate Data from Scratch (~45 min)
```bash
make all-data   # hotels → images → describe → index
# or
make sample-data  # 2 hotels/region, 10 images — quick smoke test
```

---

## Repo Structure

```
jina-301/
├── scripts/
│   ├── generate_hotels.py    # Gemini Pro → hotels.json (~150 hotels)
│   ├── generate_images.py    # nano-banana → ui/public/images/hotels/
│   ├── index_hotels.py       # Push to Elasticsearch + CLIP embeddings
│   └── generate_fallbacks.py # Capture API responses for offline mode
├── data/
│   ├── hotels.json           # Generated hotel dataset
│   └── fallbacks/            # Pre-recorded API responses
├── ui/                       # Next.js app
│   ├── app/
│   │   ├── api/              # API routes (clip/, ingest/, rerank/, search/, vision/)
│   │   └── page.tsx          # Main app — station router
│   └── components/
│       ├── stations/         # One component per demo station
│       └── shared/           # HotelCard, MapPanel, StationNav, etc.
└── docs/
    └── presentation/         # Slide assets
```

---

## Pre-Event Checklist

- [ ] `make all-data` — full hotel + image + index pipeline complete
- [ ] `make fallbacks` — offline responses captured
- [ ] Smoke test all 6 stations live
- [ ] Verify Fallback Mode works for each station
- [ ] Confirm Elasticsearch index `horizon-hotels` has correct doc count (~150)
- [ ] Test on event machine — confirm `nano-banana` not needed at showtime (images pre-generated)
- [ ] Confirm Jina VLM beta endpoint is still accessible (beta URL, check with Jina)
