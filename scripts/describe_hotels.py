#!/usr/bin/env python3
"""
Run Jina VLM on each hotel's interior image (_2.png), write room_description to hotels.json.

Usage:
  python describe_hotels.py                # skip hotels already described
  python describe_hotels.py --force        # overwrite existing descriptions
  python describe_hotels.py --limit 5      # process first 5 only
"""
import argparse
import base64
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
HOTELS_FILE = PROJECT_ROOT / "data" / "hotels.json"
IMG_DIR = PROJECT_ROOT / "ui" / "public"
VLM_URL = "https://api-beta-vlm.jina.ai/v1/chat/completions"
COLD_START_CODES = {502, 503, 429}

PROMPT = (
    "Describe this hotel room or interior in 2-3 sentences as a hotel booking site would. "
    "Focus on visual style, atmosphere, visible amenities, and the experience offered. "
    "Use natural language a traveler would search for. Return only the description — no JSON, no headers."
)


def call_vlm(b64: str, api_key: str) -> str | None:
    payload = {
        "model": "jina-vlm",
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": PROMPT},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}},
            ],
        }],
        "max_tokens": 300,
    }
    delays = [0, 15, 30]
    for delay in delays:
        if delay:
            print(f"  Waiting {delay}s for VLM warm-up...")
            time.sleep(delay)
        try:
            res = requests.post(
                VLM_URL,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json=payload,
                timeout=60,
            )
        except Exception as e:
            print(f"  Request error: {e}")
            return None
        if res.status_code in COLD_START_CODES:
            print(f"  Cold start ({res.status_code}), retrying...")
            continue
        if not res.ok:
            print(f"  VLM error {res.status_code}: {res.text[:200]}")
            return None
        content = res.json().get("choices", [{}])[0].get("message", {}).get("content", "").strip()
        return content if content else None
    print("  VLM still unavailable after retries, skipping.")
    return None


def main():
    parser = argparse.ArgumentParser(description="Describe hotel interiors with Jina VLM")
    parser.add_argument("--limit", type=int, help="Max hotels to process")
    parser.add_argument("--force", action="store_true", help="Overwrite existing room_description")
    args = parser.parse_args()

    for env_file in [PROJECT_ROOT / "ui" / ".env.local", PROJECT_ROOT / ".env"]:
        if env_file.exists():
            load_dotenv(env_file, override=False)

    api_key = os.getenv("JINA_API_KEY")
    if not api_key:
        print("Missing JINA_API_KEY")
        sys.exit(1)

    if not HOTELS_FILE.exists():
        print(f"hotels.json not found at {HOTELS_FILE}")
        sys.exit(1)

    hotels = json.loads(HOTELS_FILE.read_text())
    to_process = hotels[:args.limit] if args.limit else hotels
    print(f"Processing {len(to_process)} of {len(hotels)} hotels")

    changed = 0
    skipped = 0
    failed = 0

    for i, hotel in enumerate(to_process):
        name = hotel.get("name", hotel.get("id", "?"))
        if hotel.get("room_description") and not args.force:
            print(f"[{i+1}/{len(to_process)}] {name} — already described, skipping")
            skipped += 1
            continue

        paths = hotel.get("image_paths", [])
        interior_path = next((p for p in paths if "_2.png" in p), None)
        if not interior_path:
            print(f"[{i+1}/{len(to_process)}] {name} — no _2.png, skipping")
            skipped += 1
            continue

        local_file = IMG_DIR / interior_path.lstrip("/")
        if not local_file.exists():
            print(f"[{i+1}/{len(to_process)}] {name} — file missing ({local_file.name}), skipping")
            skipped += 1
            continue

        b64 = base64.b64encode(local_file.read_bytes()).decode()
        print(f"[{i+1}/{len(to_process)}] {name} — calling VLM...")
        desc = call_vlm(b64, api_key)

        if desc:
            hotel["room_description"] = desc
            changed += 1
            print(f"  → {desc[:100]}{'...' if len(desc) > 100 else ''}")
        else:
            failed += 1
            print(f"  → FAILED")

        time.sleep(1)  # polite rate limiting between calls

    # Write back to hotels.json (update the full list, not just the slice)
    if args.limit:
        hotels[:args.limit] = to_process
    if changed:
        HOTELS_FILE.write_text(json.dumps(hotels, indent=2, ensure_ascii=False) + "\n")
        print(f"\nDone. {changed} described, {skipped} skipped, {failed} failed.")
        print(f"Written to {HOTELS_FILE}")
    else:
        print(f"\nNo changes. {skipped} skipped, {failed} failed.")


if __name__ == "__main__":
    main()
