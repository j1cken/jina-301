#!/usr/bin/env python3
"""
Generate ~150 hyper-realistic hotel dataset using Gemini Pro.

Run: python generate_hotels.py
Output: ../data/hotels.json
"""

import json
import os
import sys
import time
from pathlib import Path

try:
    from google import genai
    from google.genai import types as genai_types
except ImportError:
    print("pip install google-genai")
    sys.exit(1)

try:
    from dotenv import load_dotenv
except ImportError:
    print("pip install python-dotenv")
    sys.exit(1)

PROJECT_ROOT = Path(__file__).parent.parent
OUTPUT = PROJECT_ROOT / "data" / "hotels.json"
OUTPUT.parent.mkdir(exist_ok=True)

for env_file in [PROJECT_ROOT / "ui" / ".env.local", PROJECT_ROOT / ".env"]:
    if env_file.exists():
        load_dotenv(env_file, override=False)

client = genai.Client(vertexai=True, project="elastic-sa", location="us-central1")

# Engineered demo pair hotels — must be generated first and precisely
ENGINEERED_PAIRS = """
Generate EXACTLY these 8 hotels for the reranker demo pairs. Be precise about the semantic traps:

1. id: "zephyr-workclub-amsterdam"
   name: "Zephyr Work Club Amsterdam"
   The name suggests a coworking space, not a hotel. Descriptions mention: "boutique lodging", amenities include standard hotel fare. CRITICAL: bury this exact phrase in a room description: "Our north-wing studios feature hushed workspaces away from the canal-side bar — ideal for deep focus sessions." Do NOT mention "remote work" prominently anywhere else.

2. id: "grand-casino-palace-vegas"
   name: "Grand Casino Palace Las Vegas"
   Classic Vegas hotel. Descriptions should mention: "24-hour gaming floor adjacent to guest corridors", "lively entertainment", "slot machines audible from lower floors". NO mention of quiet or work.

3. id: "villa-serenata-maldives"
   name: "Villa Serenata Maldives"
   Small luxury resort. Descriptions: "secluded water villa", "private plunge pool on your sunset terrace", "couple's spa rituals performed at dusk", "intimate setting for two". NO keywords like "romantic" or "beachfront" — let the meaning carry it.

4. id: "cancun-palace-resort"
   name: "Cancun Palace All-Inclusive Resort"
   Large all-inclusive. Descriptions must include: "beachfront location", "multiple pools", "all-inclusive party resort with nightly foam events and DJ sets", "family-friendly entertainment".

5. id: "riad-al-andalus-marrakech"
   name: "Riad Al Andalus"
   Historic Marrakech riad. Descriptions: "hand-carved cedar lattice", "original zellige tilework", "12th-century courtyard", "built in 1847 by a local merchant family". AVOID words "boutique", "heritage", "authentic", "local" — let the architecture speak.

6. id: "heritage-collection-suites-dubai"
   name: "Heritage Collection Suites Dubai"
   Modern corporate hotel with heritage branding. Descriptions: "contemporary business amenities in a heritage-inspired building", "international chain property", "glass tower overlooking the financial district".

7. id: "laikipia-conservation-lodge"
   name: "Laikipia Conservation Lodge"
   Kenyan eco-lodge. Descriptions: "solar-powered bandas", "resident naturalist guide", "photography blinds at the watering hole at dawn", "conservation levy funds anti-poaching operations", "Big Five wildlife". AVOID "eco-lodge", "safari" keywords.

8. id: "safari-star-hotel-nairobi"
   name: "Safari Star Hotel Nairobi"
   City business hotel in Nairobi. Descriptions: "centrally located in Nairobi CBD", "business conference facilities", "safari tour desk in lobby arranges day trips". NOT a wildlife property.
"""

BATCH_PROMPT = """Generate a JSON array of {n} realistic hotels for a travel search demo app.

Region focus: {region}

Each hotel must have this exact structure:
{{
  "id": "kebab-case-unique-id",
  "name": "Full Hotel Name",
  "descriptions": [
    "Main property overview 100-150 words",
    "Signature amenity (spa/pool/restaurant) description 80-100 words",
    "Location and neighborhood context 60-80 words",
    "Guest experience / vibe 60-80 words",
    "Standard room description including view, quiet/noise character 60-80 words",
    "Suite or premium room description 60-80 words"
  ],
  "location": {{"lat": 0.0, "lon": 0.0}},
  "location_name": "City, Country",
  "country": "Country Name",
  "region": "geographic region",
  "amenities": ["pool", "spa", "gym", "restaurant", "bar", "concierge"],
  "style": ["luxury", "boutique", "wellness", "business", "resort", "heritage"],
  "price_tier": "budget|mid|upscale|luxury|ultra",
  "price_per_night_usd": 250,
  "image_paths": [],
  "rating": 4.5,
  "nearby_landmarks": ["Eiffel Tower", "Louvre"]
}}

Rules:
- Use real GPS coordinates for the city (accurate to 3 decimal places)
- Make descriptions hyper-realistic with specific sensory details
- Vary price tiers: mix budget/mid/upscale/luxury
- Room descriptions MUST include noise/quiet character (e.g., "north-facing rooms overlook the quiet courtyard")
- For Las Vegas hotels: descriptions MUST state Strip proximity explicitly. On-Strip examples: "fronts Las Vegas Boulevard", "steps from the Bellagio fountains", "directly on the Strip". Off-Strip/Downtown examples: "on Fremont Street", "tucked away from Strip noise", "15-minute drive from the casino corridor". GPS must match the actual neighborhood.
- Return ONLY valid JSON array, no markdown, no explanation

Hotels to generate:
"""

REGIONS = [
    ("Las Vegas Strip (Bellagio, Venetian, Wynn, MGM, Caesars Palace area — on Las Vegas Blvd)", 12),
    ("Las Vegas Off-Strip & Downtown (Fremont Street, Henderson, Summerlin, Paradise Road)", 8),
    ("Western Europe (Paris, London, Barcelona, Amsterdam, Rome)", 20),
    ("Mediterranean / Southern Europe (Amalfi, Santorini, Dubrovnik, Lisbon)", 12),
    ("Asia Pacific (Tokyo, Bali, Singapore, Bangkok, Kyoto)", 20),
    ("Maldives / Pacific Islands (visual beauty for CLIP demo)", 15),
    ("Middle East (Dubai, Abu Dhabi, Oman)", 12),
    ("Africa / Safari (Kenya, Tanzania, South Africa)", 12),
    ("Mountain / Adventure (Swiss Alps, Patagonia, Nepal, Colorado)", 15),
    ("Americas (New York, Mexico City, Buenos Aires, Caribbean)", 16),
]


def generate_batch(region: str, count: int, retries: int = 3) -> list:
    prompt = BATCH_PROMPT.format(n=count, region=region)
    for attempt in range(retries):
        try:
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
                config=genai_types.GenerateContentConfig(temperature=0.8, max_output_tokens=8192),
            )
            text = response.text.strip()
            # Strip markdown fences
            if text.startswith("```"):
                text = text[text.index("\n")+1:]
                if text.endswith("```"):
                    text = text[:-3].strip()
            return json.loads(text)
        except Exception as e:
            print(f"  Attempt {attempt+1} failed: {e}")
            if attempt < retries - 1:
                time.sleep(5)
    return []


def generate_engineered() -> list:
    prompt = f"""Generate these 8 specific hotels as a JSON array. Follow the descriptions exactly.

{ENGINEERED_PAIRS}

Return ONLY valid JSON array with all 8 hotels."""
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=genai_types.GenerateContentConfig(temperature=0.3, max_output_tokens=8192),
        )
        text = response.text.strip()
        if text.startswith("```"):
            text = text[text.index("\n")+1:]
            if text.endswith("```"):
                text = text[:-3].strip()
        return json.loads(text)
    except Exception as e:
        print(f"Engineered generation failed: {e}")
        return []


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--sample", type=int, default=None, help="Generate N hotels per region instead of full counts (skips engineered pairs)")
    args = parser.parse_args()

    all_hotels = []

    if args.sample is None:
        print("Generating engineered demo-pair hotels...")
        engineered = generate_engineered()
        print(f"  → {len(engineered)} engineered hotels")
        all_hotels.extend(engineered)
    else:
        print(f"--sample mode: {args.sample} hotels per region, skipping engineered pairs")

    CHUNK_SIZE = 10
    for region, count in REGIONS:
        target = args.sample if args.sample is not None else count
        print(f"Generating {target} hotels for: {region}...")
        region_hotels = []
        remaining = target
        while remaining > 0:
            chunk = min(remaining, CHUNK_SIZE)
            batch = generate_batch(region, chunk)
            region_hotels.extend(batch)
            remaining -= chunk
            if remaining > 0:
                time.sleep(2)
        print(f"  → {len(region_hotels)} generated")
        all_hotels.extend(region_hotels)
        time.sleep(2)

    # Deduplicate by id
    seen = set()
    unique = []
    for h in all_hotels:
        hid = h.get("id", "")
        if hid not in seen:
            seen.add(hid)
            unique.append(h)

    # Initialize image_paths as empty (filled by generate_images.py)
    for h in unique:
        if not h.get("image_paths"):
            h["image_paths"] = []

    print(f"\nTotal: {len(unique)} hotels")
    OUTPUT.write_text(json.dumps(unique, indent=2, ensure_ascii=False))
    print(f"Saved to {OUTPUT}")


if __name__ == "__main__":
    main()
