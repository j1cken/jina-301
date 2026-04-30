#!/usr/bin/env python3
"""
Generate hotel images using nano-banana CLI.

Usage: python generate_images.py [--limit N]
Output: ../ui/public/images/hotels/{id}_{n}.png

Reads hotels from ../data/hotels.json, generates 1-3 images per hotel,
updates image_paths in hotels.json.
"""

import json
import os
import subprocess
import sys
import time
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:
    print("pip install python-dotenv")
    sys.exit(1)

PROJECT_ROOT = Path(__file__).parent.parent
HOTELS_FILE = PROJECT_ROOT / "data" / "hotels.json"
OUTPUT_DIR = PROJECT_ROOT / "ui" / "public" / "images" / "hotels"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

for env_file in [PROJECT_ROOT / "ui" / ".env.local", PROJECT_ROOT / ".env"]:
    if env_file.exists():
        load_dotenv(env_file, override=False)

GEMINI_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_KEY:
    print("GEMINI_API_KEY not set")
    sys.exit(1)

# Resolve nano-banana — check PATH first, then common install locations
def _find_nano_banana() -> str:
    result = subprocess.run(["which", "nano-banana"], capture_output=True, text=True)
    if result.returncode == 0:
        return result.stdout.strip()
    for candidate in [
        Path.home() / ".bun/bin/nano-banana",
        Path.home() / ".npm-global/bin/nano-banana",
        Path("/usr/local/bin/nano-banana"),
    ]:
        if candidate.exists():
            return str(candidate)
    print("nano-banana not found in PATH or common locations")
    sys.exit(1)

NANO_BANANA = _find_nano_banana()


def generate_image(prompt: str, hotel_id: str, image_num: int) -> str | None:
    """Generate image via nano-banana, return local path or None."""
    filename = f"{hotel_id}_{image_num}"
    output_path = OUTPUT_DIR / f"{filename}.png"

    if output_path.exists():
        print(f"  Skipping {filename} (already exists)")
        return f"/images/hotels/{filename}.png"

    cmd = [
        NANO_BANANA,
        prompt,
        "-s", "2K",
        "-a", "16:9",
        "-d", str(OUTPUT_DIR),
        "-o", filename,
    ]

    try:
        env = {k: v for k, v in os.environ.items() if k != "GEMINI_API_KEY"}
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=90, env=env)
        if result.returncode == 0 and output_path.exists():
            # nano-banana also writes a compressed companion ({filename}_1.png) — remove it
            companion = OUTPUT_DIR / f"{filename}_1.png"
            if companion.exists() and companion != output_path:
                companion.unlink()
            return f"/images/hotels/{filename}.png"
        else:
            print(f"  nano-banana failed for {filename}: {result.stderr[:200]}")
            return None
    except subprocess.TimeoutExpired:
        print(f"  Timeout for {filename}")
        return None
    except Exception as e:
        print(f"  Error for {filename}: {e}")
        return None


def build_prompt(hotel: dict, image_num: int) -> str:
    style = " ".join(hotel.get("style", ["luxury"]))
    name = hotel["name"]
    location = hotel.get("location_name", "")
    amenities = hotel.get("amenities", [])[:3]
    amenity_str = ", ".join(amenities) if amenities else "pool"

    prompts = [
        f"Luxury hotel exterior photography, {name}, {location}, {style} architecture, golden hour lighting, professional travel photography",
        f"Hotel interior photography, {style} design, {amenity_str}, warm ambient lighting, editorial style",
        f"Hotel room photography, {style} decor, panoramic view, high-end hospitality photography",
    ]
    return prompts[min(image_num, len(prompts) - 1)]


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None, help="Max hotels to process")
    parser.add_argument("--images-per-hotel", type=int, default=2, help="Images per hotel (1-3)")
    args = parser.parse_args()

    if not HOTELS_FILE.exists():
        print(f"hotels.json not found at {HOTELS_FILE}")
        sys.exit(1)

    hotels = json.loads(HOTELS_FILE.read_text())
    total = args.limit or len(hotels)
    hotels_to_process = hotels[:total]

    print(f"Generating images for {len(hotels_to_process)} hotels ({args.images_per_hotel} each)...")

    for i, hotel in enumerate(hotels_to_process):
        hid = hotel["id"]
        print(f"[{i+1}/{len(hotels_to_process)}] {hotel['name']}")

        paths = []
        for n in range(args.images_per_hotel):
            prompt = build_prompt(hotel, n)
            path = generate_image(prompt, hid, n + 1)
            if path:
                paths.append(path)
            time.sleep(1)

        hotel["image_paths"] = paths
        if not paths:
            print(f"  WARNING: no images generated for {hid}")

    # Save updated hotels.json
    HOTELS_FILE.write_text(json.dumps(hotels, indent=2, ensure_ascii=False))
    print(f"\nDone. Updated {HOTELS_FILE}")


if __name__ == "__main__":
    main()
