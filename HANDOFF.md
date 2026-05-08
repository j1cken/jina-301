# Horizon Demo — Handoff Notes

---

## Session Handoff — 2026-05-08 (Miss LaBonz → Barry)

*Read this section before touching any code. All changes committed and pushed on `main`.*

### What Was Built

**CLIP Image Search (Find + Agent tabs)**
Camera icon in SearchBar (`onImageSearch` prop). Upload a hotel room image → POST `/api/clip` → results with `📷` banner + thumbnail + clear. "Use sample hotel room image →" shortcut hits the same endpoint server-side. AgentChat also has a camera button — CLIP results appear inline with a "Direct CLIP v2 lookup" badge (bypasses the agent, badge communicates that).

Files: `ui/components/shared/SearchBar.tsx`, `ui/components/stations/FindStation.tsx`, `ui/components/AgentChat.tsx`

**EIS CLIP v2 Wiring**
`getClipEmbeddingViaEIS()` in `ui/lib/elasticsearch.ts` calls `/_inference/embedding/.jina-clip-v2`. Env gate: `CLIP_VIA_EIS=true` uses EIS; else direct Jina API (`JINA_API_KEY`). Both paths preserved. Run `make fallbacks` after confirming EIS works to refresh `data/fallbacks/clip.json`.

**Omni Tab Hero**
`ui/public/images/omni/omni-hero.png` — ChatGPT Burns+Lisa at ocean net scene. Uses plain `<img src={resolveImageUrl(...)}>` (not Next.js `<Image>`) to avoid basePath/optimizer null bug. Heading uses `<span style={{ color: '#ffffff' }}>` inside `<h1>` to escape the `!important` rule at `globals.css:210-217`. If hero looks wrong on Barry: adjust `objectPosition` in `OmniStation.tsx` — currently `'20% 65%'` to show characters lower-left.

**Industries Tab — Demo Replacements**
Three bad demos (embedded all logs on ingest) replaced:
- OllyLogAnomalyDemo → OllyRCALogSearchDemo (BM25 → Reranker v3 at query time, zero re-indexing)
- OllyAlertStormDemo → OllyMetricAnomalyDemo (Elastic ML + Embeddings v5 on postmortem corpus)
- SecurityAlertTriageDemo → SecurityCVEServiceDemo (CVE → service catalog rerank)

New `CompactDemo.tsx` handles all 9 info card demos (data-driven from `industriesData.ts`).

**Industries Tab — UX Polish**
- `[Manual | Auto]` segmented pill replaces ambiguous `Manual ⏸` button
- Position cards: `text-white/85`, left-border accent stripes (not invisible tint backgrounds)
- Info card text: `text-slate-600/700/900` (was `text-white/*` — invisible on light page background)
- All 6 spotlight demos: richer 3-4 sentence `technicalSolution` with customer talking points

### Verify On First Boot (Barry)
1. Omni tab: Burns+Lisa visible lower-left, white heading readable, ocean/net shows
2. Find tab: Camera icon → upload image → results with `📷` banner
3. Find tab: "Use sample image →" → same flow without file picker
4. Industries tab: click any info card → compact demo opens; summary slide position cards are readable
5. `npx tsc --noEmit` from `ui/` should pass clean

### Env Vars Needed
```
ELASTICSEARCH_URL=...
ELASTICSEARCH_API_KEY=...
CLIP_VIA_EIS=true         # uses EIS; omit to fall back to direct Jina API
JINA_API_KEY=...          # only needed if CLIP_VIA_EIS not set
```

---

## Live URL
https://demos.gcp.elasticsa.co/horizon

## Key IDs (not secrets — safe to share)

| Variable | Value |
|---|---|
| `AGENT_ID` | `6e729f42-8cab-4860-b9ce-2b653ff7c259` |
| Kibana cluster | `chatty-mcchatbot-c0f827.kb.us-east-1.aws.elastic.cloud` |
| Agent name | `horizon-hotel-concierge` |
| GCP project | `elastic-sa` |
| Cloud Run service | `horizon-demo` (us-central1) |

> **Note**: `AGENT_ID` must be the UUID above, NOT the display name "horizon-hotel-concierge". The Agent Builder API only accepts UUIDs.

## Deployment

```bash
make deploy   # builds Docker image, updates GCP secrets, redeploys Cloud Run
```

Secrets live in GCP Secret Manager (`elastic-sa` project). Editing `ui/.env.local` alone does NOT update the deployed app — you must run `make deploy`.

## Agent Station env vars (all required)

```
KIBANA_URL=https://chatty-mcchatbot-c0f827.kb.us-east-1.aws.elastic.cloud
KIBANA_API_KEY=<see ui/.env.local>
AGENT_ID=6e729f42-8cab-4860-b9ce-2b653ff7c259
```
