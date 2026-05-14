# jina-embeddings-v5-omni: The Real Story

## The Real Story: Why Omni is Special

### The hard part isn't the modalities — it's the geometry

Everyone assumes the hard part of a multimodal model is "building encoders for each type." But encoders are off-the-shelf: SigLIP2 for vision, Whisper for audio, v5 for text. The hard part is that **each of those encoders organizes its space completely differently**. SigLIP's geometry is shaped by image-caption pairs. Whisper's by phonetics needed for transcription. They don't just need to overlap — they need to agree that a photo of a dog, the sound of a dog barking, and the word "dog" all land near each other, while preserving fine-grained structure within each modality.

Most approaches solve this by training all encoders jointly from scratch — which requires massive paired corpora and tens of millions in compute. And every time you update one modality, you retrain everything and break backward compatibility.

**What Jina did differently**: they froze the v5-text backbone and treated its geometry as the canonical coordinate system. The tiny projectors (only 5.5M params) learn to map vision and audio *into* the existing text space — instead of rebuilding the city, they built a few bridges. The text space is the natural lingua franca because humans describe everything in text, so it has the richest semantic structure. This is why Omni can be small and still beat specialists.

---

### What "projectors" actually are

A **projector** (or projection head) is a small neural network — usually just a few linear layers — that maps one embedding space into another.

The problem: SigLIP2 produces image vectors in its own space, Whisper produces audio vectors in its own space. Neither is compatible with v5-text's space — they were trained on completely different objectives with different data.

A projector learns a transformation: *given a vector from space A, output a vector in space B.*

For Omni specifically:
- **Image projector**: SigLIP2 image vector → 1024-dim vector in v5-text coordinate system
- **Audio projector**: Whisper audio vector → 1024-dim vector in v5-text coordinate system

What makes this approach notable:
1. **They're tiny** — only ~5.5M parameters total. The underlying encoders (SigLIP2 = billions of params, Whisper-large = 1.5B) stay frozen. You train a small adapter at the end, not the whole stack.
2. **The target space is fixed** — v5-text backbone is frozen, so projectors must map *into* an already-settled geometry. Harder than joint training, but it's exactly what guarantees text vectors stay bit-identical.
3. **The training signal** — feed matched pairs (hotel photo + text description of that hotel), and the loss pushes the projected image vector to land near the text vector in v5 space. Same for audio.

**FE line**: *"Think of projectors as translators that learned to speak v5-text's language, so images and audio can be looked up in the same index as your existing text documents."*

---

### The bit-identical claim is the commercial unlock

FEs see customers stall on model upgrades constantly. The reason is almost never quality — it's **migration cost**. A customer with 50M documents on v5-text-small has, somewhere in Jira, a ticket called "evaluate new model" that nobody wants to touch. Re-indexing means: re-running inference (real cost), double-storing vectors during cutover, a parallel write path, A/B testing quality, retraining downstream rerankers, recalibrating personalization layers. All-in: often six figures and three months. So they don't do it.

Omni's bit-identical text embeddings change this from **migration project to feature flag**. The 50M vectors sitting in their cluster *are already* Omni vectors. They point their existing `inference_id` at Omni and start sending images and audio through it. Previously-indexed text documents instantly become neighbors of image queries. Zero data movement.

This is the rarest thing in a model-upgrade conversation: **a free lunch**. No internal champion needs to justify a migration budget. For an FE, that eliminates the single biggest objection that kills these deals.

---

### The "beats CLIP on images" paradox — and why it makes sense

CLIP v2 trains on image-text caption pairs only. Its image representations reflect *what humans put in captions* — a biased subset of what's actually in an image. Captions say "a dog on a beach," not "golden retriever, mid-stride, shallow depth of field, afternoon light."

Omni trains against the v5-text space, which was built on a far richer text corpus. And when you train projectors for image *and* audio *and* video against the same anchor, the image projector gets cross-modal regularization — it has to be consistent with how audio describes similar scenes. That forces better fundamentals.

**The FE line**: "Specialists overfit to their training signal. Omni's image encoder trains against a richer space with audio as a cross-check — so it understands images more like humans do, with context a caption alone would miss."

---

### The Elasticsearch-specific win (this is your closer)

In Elasticsearch, the unit of deployment is the `inference_id`. One model = one inference_id = one field = one kNN clause. With separate models today, a customer needs:

- `text_vector` field → inference_id A
- `image_vector` field → inference_id B
- `audio_vector` field → inference_id C
- RRF fusion layer across three kNN sub-queries
- Three ingest pipelines, three cost lines, three monitoring dashboards, three failure modes

With Omni: **one `semantic_text` field → one inference_id → one kNN call → done.**

That's not just simpler architecturally. Every extra moving part is a chance for a deal to slip — extra cost to justify, extra team to align, extra support ticket. And the expansion motion becomes natural: once a customer is on Omni for text, adding image search is *just sending image bytes to the endpoint they're already paying for.* Every v5-text customer is a pre-qualified multimodal prospect with zero migration friction.

---

### When Omni beats CLIP v2 on image retrieval despite not being image-specialized

The model is only beaten on image tasks by models **3x its size**. The reason is counterintuitive: CLIP trains on image-text captions only — a narrow, biased signal. Omni trains the image projector against the richer v5-text geometry, with audio and video as cross-modal regularizers. That forces better image representations than optimizing against captions alone.

---

## Model Specs

| Model | Modalities | Dims | Context | Size (all modalities) |
|---|---|---|---|---|
| `jina-embeddings-v5-omni-small` | Text + Image + Audio + Video | 1,024 | 32,768 tok | 1.66B params |
| `jina-embeddings-v5-omni-nano` | Text + Image + Audio + Video | 768 | 8,192 tok | 1.0B params |

**Truncatable embeddings**: can compress down to 32 dims, with <3% quality loss and **93% storage savings** via binary quantization.

---

## Benchmarks (citable numbers)

- **Image retrieval**: only beaten by models **3x its size**
- **Audio**: only models **3x larger** beat the small variant
- **Video**: top scorer on Charades-STA and MomentSeeker among comparable open-weight models
- **Document retrieval**: competitive with **3–7B parameter models** while staying under 1B params
- **Text**: top performer on MMTEB benchmark suite in its size category

---

## When to Use Omni vs CLIP v2

**Recommend Omni when:**
- Customer has v5-text-small in production (free upgrade — no re-indexing)
- Any non-text modality is in scope now *or* on the roadmap
- New build, no existing model preference
- Running on EIS

**Recommend CLIP v2 when:**
- Image-only or text+image-only, no audio/video ever
- Not on v5-text (bit-identical benefit doesn't apply)
- Existing CLIP deployment that's working fine — don't force a migration

**The trap to avoid**: don't pitch Omni as "CLIP plus audio." That invites a feature-comparison conversation. Pitch it as architectural simplification.

---

## The Lines to Memorize

**For the executive meeting:**
> "Omni lets your customers turn on image, audio, and video search without re-indexing a single text document — because Omni's text embeddings are v5-text's embeddings, and everything else lives in the same space."

**For the architect meeting:**
> "One inference_id. One index. One kNN. All modalities."

---

## Technical: How Media Reaches Elasticsearch

### Text and Images via EIS (works today)

Send as a plain string or base64 data URI in the `input` field — the model detects the format automatically:

```bash
# Text
POST /_inference/embedding/.jina-embeddings-v5-omni-small
{
  "input": ["romantic beachfront hotel with private pool"]
}

# Image (base64 data URI)
POST /_inference/embedding/.jina-embeddings-v5-omni-small
{
  "input": ["data:image/jpeg;base64,/9j/4AAQSkZJRg..."]
}
```

### How Media is Pre-processed

**Images:**
- Resize to reasonable dimensions (cap at ~256px max side recommended)
- Convert to base64 JPEG
- Wrap as `data:image/jpeg;base64,...`

**Video:**
- The model extracts up to **32 frames**, evenly spaced across the clip
- Each frame goes through the same image pipeline
- Frames smaller than 262,144 px are upscaled; larger than 3,072,000 px are downscaled
- Height and width normalized to multiples of 14px

**Audio:**
- Cut into **30-second segments** if longer
- Resampled to **16kHz**
- Transformed into a **128-channel mel-spectrogram**
- Each **40ms = one token**
- Send raw audio file as base64

### All modalities confirmed working via EIS (tested 2026-05-13)

**All 4 modalities work through EIS** — same pattern for all: base64 data URI in the `input` field.
Use `/_inference/embedding/` (not `text_embedding/`).

```bash
# Text
POST /_inference/embedding/.jina-embeddings-v5-omni-small
{ "input": ["romantic beachfront hotel with private pool"] }

# Image
POST /_inference/embedding/.jina-embeddings-v5-omni-small
{ "input": ["data:image/png;base64,<base64>"] }

# Audio — you do NOT need to pre-cut; model handles 30s segmentation internally
POST /_inference/embedding/.jina-embeddings-v5-omni-small
{ "input": ["data:audio/wav;base64,<base64>"] }

# Video — just base64 the MP4 and go; model extracts up to 32 frames automatically
POST /_inference/embedding/.jina-embeddings-v5-omni-small
{ "input": ["data:video/mp4;base64,<base64>"] }
```

All four return a **1024-dim vector**. Cross-modal cosine similarity works as expected
(casino text scores higher against a Vegas hotel image than beach text does).

**Python example — embed an audio file via EIS:**

```python
import base64, json, urllib.request

ES_URL = "https://your-cluster.es.us-east-1.aws.elastic.cloud"
ES_API_KEY = "your_api_key"
ENDPOINT = f"{ES_URL}/_inference/embedding/.jina-embeddings-v5-omni-small"

with open("hotel-ambient.wav", "rb") as f:
    audio_b64 = base64.b64encode(f.read()).decode()

payload = json.dumps({"input": [f"data:audio/wav;base64,{audio_b64}"]}).encode()
req = urllib.request.Request(ENDPOINT, data=payload,
    headers={"Authorization": f"ApiKey {ES_API_KEY}", "Content-Type": "application/json"},
    method="POST")

with urllib.request.urlopen(req) as r:
    vector = json.loads(r.read())["embeddings"][0]["embedding"]  # 1024-dim
```

### Audio via Direct Jina API (alternative path)

```python
import base64, requests

with open("hotel-ambient.wav", "rb") as f:
    audio_b64 = base64.b64encode(f.read()).decode()

response = requests.post(
    "https://api.jina.ai/v1/embeddings",
    headers={"Authorization": "Bearer <JINA_API_KEY>"},
    json={
        "model": "jina-embeddings-v5-omni-small",
        "input": [{"audio": audio_b64}],
        "task": "retrieval.query",
        "normalized": True,
    }
)
vector = response.json()["data"][0]["embedding"]  # 1024-dim
```

---

## Caveats

1. **Bit-identical guarantee is for v5-text-small specifically** — verify before promising "no re-index" to a customer on a different v5 variant.
2. **Always cite a benchmark source** when claiming "beats CLIP v2" — vague superiority claims invite technical pushback.
3. **Self-hosted latency**: Omni's full modality stack (SigLIP2 + Whisper paths) is heavier than dedicated CLIP. EIS hides this; bare-metal customers should benchmark.
4. **"One vector per document" works for entity-level docs** (a product with text + images + video). For retrieving specific *scenes within* a video, store per-modality vectors as separate embeddings under one inference_id.
5. **Commercial licensing**: CC-BY-NC-4.0 for non-commercial use. Commercial use requires an Elastic license — every Omni deal goes through Elastic sales.
