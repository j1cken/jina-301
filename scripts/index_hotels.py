#!/usr/bin/env python3
"""
Index hotels into Elasticsearch with CLIP embeddings pre-computed.

Run: python index_hotels.py
Requires: ELASTICSEARCH_URL, ELASTICSEARCH_API_KEY, JINA_API_KEY in ui/.env.local or env
"""

import base64
import json
import os
import sys
import time
from pathlib import Path

try:
    from elasticsearch import Elasticsearch, helpers
    from dotenv import load_dotenv
    import requests
except ImportError:
    print("pip install elasticsearch python-dotenv requests")
    sys.exit(1)

PROJECT_ROOT = Path(__file__).parent.parent

for env_file in [PROJECT_ROOT / "ui" / ".env.local", PROJECT_ROOT / ".env"]:
    if env_file.exists():
        load_dotenv(env_file, override=False)

ES_URL = os.getenv("ELASTICSEARCH_URL")
ES_KEY = os.getenv("ELASTICSEARCH_API_KEY") or os.getenv("ELASTIC_API_KEY")
JINA_KEY = os.getenv("JINA_API_KEY")
INDEX = "horizon-hotels"
EMBEDDING_ID = ".jina-embeddings-v5-text-small"

for var, val in [("ELASTICSEARCH_URL", ES_URL), ("ELASTICSEARCH_API_KEY", ES_KEY), ("JINA_API_KEY", JINA_KEY)]:
    if not val:
        print(f"Missing {var}")
        sys.exit(1)

es = Elasticsearch(hosts=[ES_URL], api_key=ES_KEY)

INDEX_MAPPING = {
    "mappings": {
        "properties": {
            "id": {"type": "keyword"},
            "name": {"type": "keyword"},
            "name_semantic": {
                "type": "semantic_text",
                "inference_id": EMBEDDING_ID,
            },
            "descriptions": {
                "type": "semantic_text",
                "inference_id": EMBEDDING_ID,
            },
            "descriptions_text": {"type": "text"},
            "location": {"type": "geo_point"},
            "location_name": {
                "type": "text",
                "fields": {"keyword": {"type": "keyword"}},
            },
            "country": {"type": "keyword"},
            "region": {"type": "keyword"},
            "amenities": {"type": "keyword"},
            "style": {"type": "keyword"},
            "price_tier": {"type": "keyword"},
            "price_per_night_usd": {"type": "integer"},
            "image_paths": {"type": "keyword"},
            "image_embedding": {
                "type": "dense_vector",
                "dims": 1024,
                "index": True,
                "similarity": "cosine",
            },
            "rating": {"type": "float"},
            "nearby_landmarks": {"type": "keyword"},
        }
    }
}


def get_clip_embedding(image_path_or_url: str) -> list[float] | None:
    """Get 1024-dim CLIP embedding from Jina API."""
    # Build image payload
    if image_path_or_url.startswith("/images/"):
        local_path = PROJECT_ROOT / "ui" / "public" / image_path_or_url.lstrip("/")
        if not local_path.exists():
            return None
        with open(local_path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode()
        payload = {"image": b64}
    else:
        payload = {"url": image_path_or_url}

    try:
        res = requests.post(
            "https://api.jina.ai/v1/embeddings",
            headers={"Authorization": f"Bearer {JINA_KEY}", "Content-Type": "application/json"},
            json={"model": "jina-clip-v2", "input": [payload], "encoding_type": "float"},
            timeout=30,
        )
        if res.status_code == 200:
            data = res.json()
            vec = data["data"][0]["embedding"]
            return vec if len(vec) == 1024 else None
        else:
            print(f"  CLIP error {res.status_code}: {res.text[:100]}")
            return None
    except Exception as e:
        print(f"  CLIP exception: {e}")
        return None


def create_index(force: bool = False):
    if es.indices.exists(index=INDEX):
        if not force:
            print(f"Index {INDEX} already exists. Delete and recreate? [y/N] ", end="")
            try:
                answer = input().strip().lower()
            except EOFError:
                answer = "y"
            if answer != "y":
                print("Keeping existing index.")
                return False
        es.indices.delete(index=INDEX)
        print(f"Deleted {INDEX}")

    es.indices.create(index=INDEX, body=INDEX_MAPPING)
    print(f"Created {INDEX}")
    return True


def build_doc(hotel: dict) -> dict:
    descriptions = list(hotel.get("descriptions", []))
    room_desc = hotel.get("room_description")
    if room_desc:
        descriptions = descriptions + [room_desc]
    doc = {
        "id": hotel["id"],
        "name": hotel["name"],
        "name_semantic": hotel["name"],
        "descriptions": descriptions,
        "descriptions_text": " ".join(descriptions),
        "location": hotel.get("location", {"lat": 0, "lon": 0}),
        "location_name": hotel.get("location_name", ""),
        "country": hotel.get("country", ""),
        "region": hotel.get("region", ""),
        "amenities": hotel.get("amenities", []),
        "style": hotel.get("style", []),
        "price_tier": hotel.get("price_tier", "mid"),
        "price_per_night_usd": hotel.get("price_per_night_usd", 0),
        "image_paths": hotel.get("image_paths", []),
        "rating": hotel.get("rating", 0),
        "nearby_landmarks": hotel.get("nearby_landmarks", []),
    }

    # CLIP embed primary image
    image_paths = hotel.get("image_paths", [])
    if image_paths:
        print(f"  Computing CLIP embedding for {hotel['name']}...")
        vec = get_clip_embedding(image_paths[0])
        if vec:
            doc["image_embedding"] = vec
        time.sleep(0.5)  # Rate limit

    return doc


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None, help="Max hotels to index")
    parser.add_argument("--yes", action="store_true", help="Auto-confirm index recreation")
    args = parser.parse_args()

    hotels_file = PROJECT_ROOT / "data" / "hotels.json"
    if not hotels_file.exists():
        print(f"hotels.json not found. Run generate_hotels.py first.")
        sys.exit(1)

    hotels = json.loads(hotels_file.read_text())
    if args.limit:
        hotels = hotels[:args.limit]
    print(f"Loaded {len(hotels)} hotels from {hotels_file}")

    create_index(force=args.yes)

    print(f"\nIndexing {len(hotels)} hotels...")
    actions = []
    for i, hotel in enumerate(hotels):
        print(f"[{i+1}/{len(hotels)}] {hotel['name']}")
        doc = build_doc(hotel)
        actions.append({
            "_index": INDEX,
            "_id": hotel["id"],
            "_source": doc,
        })

        # Bulk every 10 docs
        if len(actions) >= 10:
            success, errors = helpers.bulk(es, actions, raise_on_error=False)
            print(f"  Bulk: {success} ok, {len(errors)} errors")
            actions = []

    if actions:
        success, errors = helpers.bulk(es, actions, raise_on_error=False)
        print(f"  Final bulk: {success} ok, {len(errors)} errors")

    # Verify
    es.indices.refresh(index=INDEX)
    count = es.count(index=INDEX)["count"]
    print(f"\nDone. {count} documents in {INDEX}")

    # Quick smoke test
    print("\nSmoke test — searching 'romantic beachfront':")
    res = es.search(index=INDEX, body={
        "query": {"semantic": {"field": "descriptions", "query": "romantic beachfront"}},
        "size": 3, "_source": ["name", "location_name"],
    })
    for hit in res["hits"]["hits"]:
        print(f"  {hit['_source']['name']} ({hit['_source']['location_name']}) score={hit['_score']:.3f}")


if __name__ == "__main__":
    main()
