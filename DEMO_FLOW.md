# Horizon Demo Flow — SKO May 13 2026
## 25 Minutes · 7 Stations · Two-Lane Script

**Audience**: ~296 Field Engineers, Venetian Las Vegas  
**Narrative arc**: Evolution of search — keyword → semantic → multimodal → agentic  
**Core message**: We are not selling features. We are selling solutions to business problems.

---

## The 6-Beat Evolution Spine
Say one of these lines at every transition. Repeat the shape five times so FEs leave able to pitch it Monday.

1. "Search used to mean matching words." ← the past (never demoed)
2. "Then it meant matching meaning." → **Find**
3. "Then it meant getting the order right." → **Rank**
4. "Then it meant seeing what your customer sees." → **Look + Describe**
5. "Then it meant handling every format — one index." → **Omni station**
6. "And now — it means answering the question they actually asked." → **Concierge climax**
7. "This isn't a hotel problem. This is every problem." → **Industries**

---

## Flow

### 00:00–01:00 | COLD OPEN — Horizon Home (1:00)

| Lane | Content |
|---|---|
| **Front End** | Land on Horizon home. Scroll the hero slowly — looks like a real booking site. Hover over property cards. Cursor drifts to **"Ask the Concierge"** button (sparkle icon). Click it. Type *"quiet hotel near a good coffee scene where I can take 9am calls"*. Watch the sub-query decomposition START rendering — then **interrupt deliberately**. Close the panel. |
| **Backend** | Say nothing technical here. This is pure narrative. |
| **Business problem** | Customers don't search anymore — they *ask*. |
| **Key line** | "This is where search is in 2026. I'm going to show you the four capabilities that make this possible — then we'll come back here." |
| **Transition** | "Search used to mean matching words. Let's start where that broke." |

---

### 01:00–03:45 | FIND — Semantic Search (2:45)

| Lane | Content |
|---|---|
| **Front End** | Find station. Type engineered query #1: *"quiet hotel for focused remote work, no casino noise"*. Results render as hotel cards with images + prices. Point out top 3. |
| **Backend** | "`semantic_text` field. `.jina-embeddings-v5-text-small` via EIS. Single `_search` call — the embedding happens inline, no separate pipeline." |
| **Business problem** | Customers leave when the site can't understand what they *mean*. Every abandoned search is a lost booking, a missed alert, a lost sale. |
| **Key line** | "Notice: 'casino noise' isn't an amenity field. The model caught the intent. The customer didn't have to choose better words." |
| **Transition** | "Good results. But are they in the right order?" |

---

### 03:45–07:15 | RANK — Reranker v3 (3:30)

| Lane | Content |
|---|---|
| **Front End** | Same query. Toggle reranker **OFF** → show top 5. Toggle **ON** → top 5 reorder live. Highlight one card jumping from #6 to #1. Run query #3 if time: *"boutique heritage hotel with authentic local architecture"* — on/off side-by-side. |
| **Backend** | "`.jina-reranker-v3` via EIS. Cross-encoder scoring — the query and every candidate document are scored *together*, not independently. That's what catches subtle relevance." |
| **Business problem** | Wrong order = lost sale. Wrong incident prioritized = missed SLA. Wrong threat ranked low = breach. Position 1 is the only position that matters. |
| **Key line** | "Embeddings get you in the neighborhood. Reranking gets you the right house. One toggle. No re-architecture." |
| **Transition** | "Quick: how did these hotels get into the index?" |

---

### 07:15–08:00 | INGEST — Reader API cameo (0:45)

| Lane | Content |
|---|---|
| **Front End** | Ingest station. Paste one hotel URL. Markdown streams in. Pre-loaded — no live wait. |
| **Backend** | "`r.jina.ai/<url>` — one HTTP call. Returns LLM-ready markdown from any JS-rendered page. Piped into a standard ingest pipeline → `semantic_text` field → embeddings at index time." |
| **Business problem** | Your customer's data is trapped in HTML, PDFs, and web pages. This is how you free it. Cuts weeks off ingestion projects. |
| **Key line** | "30 seconds. That's the whole pipeline from URL to queryable text." |
| **Transition** | "Text is solved. But your customer isn't always typing — they're looking." |

---

### 08:00–11:30 | LOOK + DESCRIBE — CLIP v2 + VLM (3:30)

| Lane | Content |
|---|---|
| **Front End** | Find station → camera icon. Upload sample pool image. CLIP results render — visually similar hotels. Click top result → VLM-generated description appears inline. |
| **Backend** | "Image → `.jina-clip-v2` via EIS → 1024-dim kNN against `dense_vector` CLIP field on the **same index**. Describe: image bytes to VLM API → natural language caption. Same shard, same query path." |
| **Business problem** | Image-first browsing is how users actually shop. And every image needs a description for accessibility, SEO, and LLM context. |
| **Key line** | "Same index. The customer didn't build a second system for images. CLIP + text, colocated, no separate vector DB." |
| **Transition** | "What if the customer has audio too? Or scanned documents? Or video?" |

---

### 11:30–14:00 | OMNI STATION — v5-omni model showcase (2:30)

| Lane | Content |
|---|---|
| **Front End** | Navigate to Omni station. Hero lands: "ONE MODEL. EVERY MODALITY." — two badges visible: `✅ ON EIS` and `Drop-in for v5-text indices`. Go straight to **ModalitySwitcher** — toggle Text + Image + Audio on. Left column shows 3 separate models, 3 indices, "fusion layer required." Right column: 1 model, 1 index, no fusion code. Then scroll to **When to reach for Omni** — point out the Financial/Legal card: "filings, contracts, scanned reports — layout is signal." |
| **Backend** | "Text embeddings are bit-identical to v5-text-small — so customers already on v5 don't re-index. They just point new modalities at the same field. Frontier-class performance in a compact footprint — see the model comparison table." |
| **Business problem** | Customers are maintaining 2–3 separate embedding pipelines for text, images, audio. Omni collapses them. |
| **Key line** | "One inference_id. If your customer's data has more than one modality — or they're tired of three embedding pipelines — this is the conversation." |
| **Transition** | "Words, images, audio, documents — solved. Now what if the user just… asks?" |

---

### 14:00–18:00 | CONCIERGE CLIMAX — AgentChat (4:00)

| Lane | Content |
|---|---|
| **Front End** | Home → "Ask the Concierge." Re-run the opening query — **let it complete this time**. Sub-query decomposition trace renders: semantic sub-query, geo sub-query, price filter. Fused answer with hotel cards + reasoning trace. |
| **Backend** | "Agent decomposes intent → fans out parallel tool calls → Find + Rank + geo + price filters → fuses results. Every capability you just saw, orchestrated. The trace is real — not staged." |
| **Business problem** | Customers don't search anymore — they ask. The search bar is dying. The question is who's going to be there to answer. |
| **Key line** | "This is every primitive you just saw — embeddings, rerank, CLIP, Omni — composed by an agent loop. Same index. No new infra." |
| **Transition** | "And here's the punchline — this isn't a hotel problem." |

---

### 18:00–21:00 | INDUSTRIES — Zoom out (3:00)

| Lane | Content |
|---|---|
| **Front End** | Industries station. Flash all 15 tiles for 10 seconds — breadth registers visually. Subtitle reads: *"Customers don't buy embeddings. They buy faster incident triage, fewer false-positive alerts, and analysts who can actually find the right document."* Drill **2 cards deeply** (one per sector): (1) **Search** card — e-commerce or healthcare, (2) **O11y** — RCA log search or metric anomaly, (3) **Security** — TTP or CVE. ~45s each. |
| **Backend** | "Same five models. Different domain. Identical pattern." |
| **Business problem** | Every customer with a haystack of unstructured data and a user trying to find something is in scope. |
| **Key line** | "If your customer has documents, logs, alerts, tickets, images, or call recordings — they have this problem. The Industries tab is your field kit for Monday." |
| **Transition** | "Three things to take with you." |

---

### 21:00–22:15 | TAKEAWAYS (1:15)

Three lines. Presenter talks. Slide stays on screen.

1. **Sell solutions, not models.** The arc is your pitch: meaning → order → multimodal → agentic.
2. **Reranking is the cheapest win.** One toggle. No rebuild. Highest-ROI first conversation with any customer.
3. **One index. Five models. Four via EIS.** Zero extra infra. The Industries tab is your cross-vertical story.

---

### 22:15–25:00 | Q&A BUFFER (2:45)

---

## Cuts Under Pressure (in order)
1. Drop query #3 from Rank → saves ~45s
2. Skip VLM live-render; show pre-captured caption → saves ~30s
3. Compress ModalitySwitcher demo; just show the result state → saves ~45s
4. Trim Industries to 2 cards, 1 per sector → saves ~30s
5. **Never cut Concierge climax or Takeaways** — these are the Monday-morning payload

## Pre-flight Checklist (morning of May 13)
- [ ] `make fallbacks` — refresh all 5 model fallback files
- [ ] Confirm Concierge decomposition trace is legible at projector distance
- [ ] Ingest view pre-loaded to one URL + one click
- [ ] Sample pool image ready in clipboard/desktop for Look station
- [ ] `make dev` → full walkthrough of all 7 stations
- [ ] Industries tab: confirm all 15 cards render, 2 target cards identified
