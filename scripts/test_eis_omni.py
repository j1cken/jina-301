#!/usr/bin/env python3
"""
Test script: Can EIS embed image, audio, and video for jina-embeddings-v5-omni-small?

Tests three input types against the EIS inference endpoint and reports:
- Whether each modality works
- Vector shape returned
- First 4 values as a sanity check (text vectors should match v5-text-small)
"""

import base64
import json
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

ES_URL = os.environ.get("ELASTICSEARCH_URL", "").rstrip("/")
ES_API_KEY = os.environ.get("ELASTICSEARCH_API_KEY", "")
INFERENCE_ID = ".jina-embeddings-v5-omni-small"
ENDPOINT = f"{ES_URL}/_inference/embedding/{INFERENCE_ID}"

REPO_ROOT = Path(__file__).parent.parent
SAMPLE_IMAGE = REPO_ROOT / "ui/public/images/hotels/park-mgm-las-vegas_1.png"
SAMPLE_AUDIO = REPO_ROOT / "ui/public/audio/hotel-ambient.wav"


def eis_embed(input_value: str) -> dict:
    """POST a single input string to EIS and return the response dict."""
    payload = json.dumps({"input": [input_value]}).encode()
    req = urllib.request.Request(
        ENDPOINT,
        data=payload,
        headers={
            "Authorization": f"ApiKey {ES_API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return {"status": resp.status, "body": json.loads(resp.read())}
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        return {"status": e.code, "error": body}
    except Exception as e:
        return {"status": 0, "error": str(e)}


def print_result(label: str, result: dict):
    status = result.get("status")
    if "error" in result:
        print(f"  ❌ {label}: HTTP {status} — {result['error'][:300]}")
        return
    body = result.get("body", {})
    embeddings = body.get("embeddings", [])
    if embeddings:
        vec = embeddings[0].get("embedding", [])
        print(f"  ✅ {label}: {len(vec)}-dim vector | first 4: {[round(v,4) for v in vec[:4]]}")
    else:
        print(f"  ⚠️  {label}: HTTP {status} but unexpected shape — {json.dumps(body)[:300]}")


def main():
    if not ES_URL or not ES_API_KEY:
        print("ERROR: set ELASTICSEARCH_URL and ELASTICSEARCH_API_KEY env vars")
        sys.exit(1)

    print(f"Endpoint: {ENDPOINT}\n")

    # ── 1. Text ──────────────────────────────────────────────────────────────
    print("TEST 1: Text")
    result = eis_embed("romantic beachfront hotel with private pool and spa")
    print_result("text string", result)

    # ── 2. Image (data URI) ───────────────────────────────────────────────────
    print("\nTEST 2: Image (PNG → base64 data URI)")
    if SAMPLE_IMAGE.exists():
        img_b64 = base64.b64encode(SAMPLE_IMAGE.read_bytes()).decode()
        result = eis_embed(f"data:image/png;base64,{img_b64}")
        print_result("image data URI", result)
    else:
        print(f"  ⚠️  Sample image not found at {SAMPLE_IMAGE}")

    # ── 3. Audio (WAV → base64 data URI) ─────────────────────────────────────
    print("\nTEST 3: Audio (WAV → base64 data URI)")
    if SAMPLE_AUDIO.exists():
        audio_b64 = base64.b64encode(SAMPLE_AUDIO.read_bytes()).decode()
        result = eis_embed(f"data:audio/wav;base64,{audio_b64}")
        print_result("audio data URI (wav)", result)
    else:
        print(f"  ⚠️  Sample audio not found at {SAMPLE_AUDIO}")
        print("       Trying with a tiny synthetic WAV (44 bytes, silence)...")
        # Minimal valid WAV header (silence, 1 channel, 16kHz, 16-bit, 0 samples)
        minimal_wav = bytes([
            0x52,0x49,0x46,0x46, 0x24,0x00,0x00,0x00,  # RIFF....
            0x57,0x41,0x56,0x45, 0x66,0x6d,0x74,0x20,  # WAVEfmt
            0x10,0x00,0x00,0x00, 0x01,0x00,0x01,0x00,  # chunk=16, PCM, 1ch
            0x80,0x3e,0x00,0x00, 0x00,0x7d,0x00,0x00,  # 16000 Hz, byte_rate
            0x02,0x00,0x10,0x00, 0x64,0x61,0x74,0x61,  # block=2, 16bit, data
            0x00,0x00,0x00,0x00,                        # 0 bytes of samples
        ])
        audio_b64 = base64.b64encode(minimal_wav).decode()
        result = eis_embed(f"data:audio/wav;base64,{audio_b64}")
        print_result("audio data URI (minimal wav)", result)

    # ── 4. Audio — raw base64 without data URI prefix ─────────────────────────
    print("\nTEST 4: Audio (raw base64, no data URI prefix)")
    if SAMPLE_AUDIO.exists():
        audio_b64 = base64.b64encode(SAMPLE_AUDIO.read_bytes()).decode()
        result = eis_embed(audio_b64)
        print_result("audio raw base64", result)

    print("\nDone.")


if __name__ == "__main__":
    main()
