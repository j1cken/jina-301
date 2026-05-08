#!/usr/bin/env python3
"""
Capture live API responses for fallback mode.

Run before the event: python generate_fallbacks.py
Output: ../ui/public/fallbacks/{ingest,search,rerank,clip,vision}.json
  (served statically at /fallbacks/*.json by Next.js)
"""

import json
import os
import sys
import time
from pathlib import Path

try:
    import requests
    from dotenv import load_dotenv
except ImportError:
    print("pip install requests python-dotenv")
    sys.exit(1)

PROJECT_ROOT = Path(__file__).parent.parent
FALLBACKS_DIR = PROJECT_ROOT / "ui" / "public" / "fallbacks"
FALLBACKS_DIR.mkdir(exist_ok=True)

for env_file in [PROJECT_ROOT / "ui" / ".env.local", PROJECT_ROOT / ".env"]:
    if env_file.exists():
        load_dotenv(env_file, override=False)

BASE_URL = os.getenv("DEMO_APP_URL", "http://localhost:3000")

DEMO_QUERIES = [
    "quiet hotel for focused remote work, no casino noise",
    "romantic beachfront with private pool villa and spa",
    "boutique heritage hotel with authentic local architecture",
    "eco-lodge for wildlife photography safaris",
    "quiet hotel near convention center, good for remote work",
]

DEMO_URL = "https://www.venetianlasvegas.com"


def capture_search():
    results = {}
    for query in DEMO_QUERIES:
        print(f"  Capturing search: {query[:40]}...")
        res = requests.post(f"{BASE_URL}/api/search", json={"query": query, "demoMode": False})
        if res.ok:
            results[query] = res.json()
        time.sleep(1)
    return results


def capture_rerank():
    results = {}
    for query in DEMO_QUERIES:
        print(f"  Capturing rerank: {query[:40]}...")
        res = requests.post(f"{BASE_URL}/api/rerank", json={"query": query, "demoMode": False})
        if res.ok:
            results[query] = res.json()
        time.sleep(2)
    return results


def capture_clip():
    """Use first hotel's image for CLIP fallback."""
    hotels_file = PROJECT_ROOT / "data" / "hotels.json"
    if not hotels_file.exists():
        return None

    hotels = json.loads(hotels_file.read_text())
    first_image = next((h["image_paths"][0] for h in hotels if h.get("image_paths")), None)
    if not first_image:
        return None

    # Read image from public dir
    img_path = PROJECT_ROOT / "ui" / "public" / first_image.lstrip("/")
    if not img_path.exists():
        return None

    import base64
    with open(img_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()

    print(f"  Capturing CLIP with {first_image}...")
    res = requests.post(f"{BASE_URL}/api/clip", json={"imageBase64": b64, "mimeType": "image/png", "demoMode": False})
    return res.json() if res.ok else None


def capture_vision():
    """Use first hotel's image for VLM fallback."""
    hotels_file = PROJECT_ROOT / "data" / "hotels.json"
    if not hotels_file.exists():
        return None

    hotels = json.loads(hotels_file.read_text())
    first = next((h for h in hotels if h.get("image_paths")), None)
    if not first:
        return None

    image_url = f"{BASE_URL}{first['image_paths'][0]}"
    print(f"  Capturing VLM for {first['name']}...")
    res = requests.post(f"{BASE_URL}/api/vision", json={"imageUrl": image_url, "hotelId": first["id"], "demoMode": False})
    return res.json() if res.ok else None


def capture_omni():
    """Capture omni embeddings for text queries + image/audio demo keys."""
    hotels_file = PROJECT_ROOT / "data" / "hotels.json"
    results = {}

    # Text queries
    for query in DEMO_QUERIES:
        print(f"  Capturing omni (text): {query[:40]}...")
        res = requests.post(f"{BASE_URL}/api/omni", json={"query": query, "demoMode": False})
        if res.ok:
            results[query] = res.json()
        time.sleep(2)  # omni is slow — ~10s each, give server breathing room

    # Image demo — use the drone-frame hotel image
    import base64
    hotels = json.loads(hotels_file.read_text()) if hotels_file.exists() else []
    first_image = next((h["image_paths"][0] for h in hotels if h.get("image_paths")), None)
    if first_image:
        img_path = PROJECT_ROOT / "ui" / "public" / first_image.lstrip("/")
        if img_path.exists():
            print(f"  Capturing omni (image_demo): {first_image}...")
            b64 = base64.b64encode(img_path.read_bytes()).decode()
            res = requests.post(f"{BASE_URL}/api/omni", json={"imageBase64": b64, "demoMode": False})
            if res.ok:
                results["image_demo"] = res.json()
            time.sleep(2)

    # Audio demo — use a text proxy query representing the audio concept
    print("  Capturing omni (audio_demo): ocean waves ambient lobby sound...")
    res = requests.post(f"{BASE_URL}/api/omni", json={"query": "ocean waves ambient hotel lobby relaxing sound", "demoMode": False})
    if res.ok:
        results["audio_demo"] = res.json()

    return results


def capture_ingest():
    """Pre-baked ingest steps for demo mode."""
    return [
        {"step": "fetch", "status": "start", "message": "Jina Reader is fetching the page..."},
        {"step": "fetch", "status": "done", "message": "Received 12,480 characters of clean markdown"},
        {"step": "parse", "status": "start", "message": "Extracting hotel fields from markdown..."},
        {"step": "parse", "status": "done", "message": "Parsed: The Venetian Resort Las Vegas", "detail": {"name": "The Venetian Resort Las Vegas"}},
        {"step": "index", "status": "start", "message": "Indexing with .jina-embeddings-v5-text-small..."},
        {"step": "index", "status": "done", "message": "1 document indexed with auto-embedding"},
        {"step": "complete", "status": "done", "message": "Hotel ready for search"},
    ]


def main():
    print(f"Capturing fallbacks from {BASE_URL}...")
    print("(Start the app with 'make dev' first)\n")

    print("Capturing search fallbacks...")
    search = capture_search()
    (FALLBACKS_DIR / "search.json").write_text(json.dumps(search, indent=2))
    print(f"  → {len(search)} queries saved")

    print("Capturing rerank fallbacks...")
    rerank = capture_rerank()
    (FALLBACKS_DIR / "rerank.json").write_text(json.dumps(rerank, indent=2))
    print(f"  → {len(rerank)} queries saved")

    print("Capturing CLIP fallback...")
    clip = capture_clip()
    if clip:
        (FALLBACKS_DIR / "clip.json").write_text(json.dumps(clip, indent=2))
        print("  → saved")
    else:
        print("  → skipped (no image found)")

    print("Capturing VLM fallback...")
    vision = capture_vision()
    if vision:
        (FALLBACKS_DIR / "vision.json").write_text(json.dumps(vision, indent=2))
        print("  → saved")
    else:
        print("  → skipped")

    print("Capturing omni fallbacks (slow — ~10s per query)...")
    omni = capture_omni()
    if omni:
        (FALLBACKS_DIR / "omni.json").write_text(json.dumps(omni, indent=2))
        print(f"  → {len(omni)} keys saved")
    else:
        print("  → skipped")

    print("Saving ingest fallback...")
    ingest = capture_ingest()
    (FALLBACKS_DIR / "ingest.json").write_text(json.dumps(ingest, indent=2))
    print("  → saved")

    print("\nAll fallbacks captured. Commit data/fallbacks/ before the event.")


if __name__ == "__main__":
    main()
