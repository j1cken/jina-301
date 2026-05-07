#!/usr/bin/env python3
"""
Create an Elastic Agent Builder agent for the Horizon hotel search demo.

Run:   python scripts/create_agent.py
       python scripts/create_agent.py --dry-run          # print payload, no POST
       python scripts/create_agent.py --list             # list managed agents
       python scripts/create_agent.py --get <id>         # inspect an agent
       python scripts/create_agent.py --delete <id>      # delete an agent
       python scripts/create_agent.py --force            # delete existing + recreate
       python scripts/create_agent.py --smoke <id>       # verify tools fire via converse
       python scripts/create_agent.py --write-env        # write AGENT_ID to ui/.env.local

Requires in ui/.env.local (or env):
  KIBANA_URL           e.g. https://my-project.kb.us-east-1.aws.found.io
  KIBANA_API_KEY       Kibana API key with agent_builder privilege
  AGENT_CONNECTOR_ID   LLM connector id (e.g. Google-Gemini-2-5-Flash)

After creation, add the printed AGENT_ID to ui/.env.local and run: make deploy
"""

import argparse
import json
import os
import re
import subprocess
import sys
import uuid
from pathlib import Path
from typing import Optional

try:
    import requests
    from dotenv import load_dotenv, set_key
except ImportError:
    print("pip install requests python-dotenv")
    sys.exit(1)

PROJECT_ROOT = Path(__file__).parent.parent

for env_file in [PROJECT_ROOT / "ui" / ".env.local", PROJECT_ROOT / ".env"]:
    if env_file.exists():
        load_dotenv(env_file, override=False)

KIBANA_URL = os.getenv("KIBANA_URL", "").rstrip("/")
KIBANA_API_KEY = os.getenv("KIBANA_API_KEY", "")
AGENT_CONNECTOR_ID = os.getenv("AGENT_CONNECTOR_ID", "")

INDEX = "horizon-hotels"
RERANKER_ID = ".jina-reranker-v3"
DEFAULT_AGENT_NAME = "horizon-hotel-concierge"
MANAGED_MARKER = "horizon-demo-managed"

# Isolated so they're trivial to patch if the Kibana build uses different paths
AGENTS_PATH = "/api/agent_builder/agents"
TOOLS_PATH = "/api/agent_builder/tools"
SKILLS_PATH = "/api/agent_builder/skills"
CONVERSE_PATH = "/api/agent_builder/converse"
CONNECTORS_PATH = "/api/actions/connectors"

SYSTEM_PROMPT = """\
You are the Horizon hotel concierge, a live demo assistant. You have access to the
`horizon-hotels` Elasticsearch index (~150 curated properties worldwide).

RULES
- ALWAYS call at least one tool before answering. Never invent hotel names or details
  — every property you mention must come from a tool result in this turn.
- Keep responses concise: this is a live on-stage demo. Present 2-5 hotels max,
  each in one or two short lines.
- Respond conversationally. Brief framing → hotels → short follow-up offer.
- If 0 results are returned, say so plainly and offer to broaden the search.
- Include each hotel's `id` field in your internal reasoning (the UI uses it to render cards).

TOOLS — choose based on the query:

`hotel_search` (semantic + reranked): for vibe-based, open-ended queries.
  Best for: "romantic beachfront with spa", "eco-lodge for wildlife photography"
  Under the hood it uses Jina Embeddings v5 + Jina Reranker v3 for high-quality results.
  Pass a natural-language query string.

`hotel_query` (ES|QL): for structured constraints, sorting, aggregations.
  Best for: "cheapest in Italy", "highest rated with pool under $200/night"
  Index: horizon-hotels
  Columns: id (keyword), name (keyword), location_name (text), country (keyword),
           region (keyword), price_per_night_usd (int), price_tier (keyword:
           budget|mid-range|luxury|ultra-luxury), rating (float 1-5),
           amenities (keyword[]), style (keyword[]), nearby_landmarks (keyword[]),
           descriptions_text (text)
  Example: FROM horizon-hotels | WHERE country == "Italy"
             AND price_per_night_usd < 200 | SORT rating DESC | LIMIT 5

You may call both tools in a single turn (semantic to find candidates, ES|QL to sort/filter).

ANSWER FORMAT — CRITICAL
The UI displays hotel results as full visual cards (image, name, price, rating,
description). The user can already see all of that detail.

DO NOT list hotels by name. DO NOT use bullet points or numbered lists of hotels.
DO NOT repeat per-hotel price, rating, location, or description.

Instead, respond as a human hotel concierge would: 2–4 sentences of warm, specific
prose framing the set of recommendations — what vibe they share, how they differ from
each other, and one short invitation to refine. You may reference a hotel by short name
only when contrasting ("the Wynn leans polished, the Venetian leans grand suites").
Never restate facts the cards already show.

REFINEMENTS
Each follow-up is a refinement of the prior request ("cheaper", "with a spa",
"in Spain instead"). Re-call the appropriate tool with updated criteria — do not
re-use cached results from a prior turn.
"""


def kbn_headers() -> dict:
    return {
        "Authorization": f"ApiKey {KIBANA_API_KEY}",
        "kbn-xsrf": "true",
        "Content-Type": "application/json",
    }


def kbn_url(path: str) -> str:
    return f"{KIBANA_URL}{path}"


def validate_base_env() -> None:
    missing = [v for v, val in [("KIBANA_URL", KIBANA_URL), ("KIBANA_API_KEY", KIBANA_API_KEY)] if not val]
    if missing:
        for v in missing:
            print(f"Missing env var: {v}")
        sys.exit(1)


def validate_connector_env() -> None:
    if not AGENT_CONNECTOR_ID:
        print("Missing env var: AGENT_CONNECTOR_ID")
        sys.exit(1)


def check_connector_exists(connector_id: str) -> None:
    try:
        r = requests.get(kbn_url(CONNECTORS_PATH), headers=kbn_headers(), timeout=15)
    except requests.ConnectionError:
        print(f"Cannot reach Kibana at {KIBANA_URL} — check KIBANA_URL")
        sys.exit(1)

    if not r.ok:
        print(f"Could not list connectors: {r.status_code} {r.text[:200]}")
        sys.exit(1)

    ids = [c.get("id") for c in r.json()]
    if connector_id not in ids:
        print(f"Connector '{connector_id}' not found. Available connectors:")
        for c in r.json():
            print(f"  {c.get('id')}  ({c.get('connector_type_id', '?')}  name={c.get('name', '?')})")
        sys.exit(1)


SEARCH_TOOL_ID = "horizon-hotel-search"
SEARCH_TOOL_PAYLOAD = {
    "id": SEARCH_TOOL_ID,
    "type": "index_search",
    "description": (
        "Semantic search over the Horizon hotel index using Jina Embeddings v5. "
        "Use for natural-language / vibe-based queries like 'romantic beachfront with spa' "
        "or 'eco-lodge for wildlife photography'. Returns full hotel documents including "
        "id, name, location_name, country, price_per_night_usd, price_tier, rating, "
        "amenities, style, and descriptions."
    ),
    "tags": ["horizon", "demo"],
    "configuration": {
        "pattern": INDEX,
    },
}


SCHEMA_SKILL_ID = "horizon-hotel-schema"
SCHEMA_SKILL_PAYLOAD = {
    "id": SCHEMA_SKILL_ID,
    "name": "Horizon Hotel Schema Reference",
    "description": (
        "Reference guide for the horizon-hotels Elasticsearch index. "
        "Use when constructing ES|QL queries against hotel data to ensure correct "
        "field names, types, and valid query patterns."
    ),
    "content": """\
# Horizon Hotels — Index Schema

Index name: `horizon-hotels`

## Fields

| Field | Type | Notes |
|---|---|---|
| id | keyword | unique hotel identifier |
| name | keyword | hotel display name |
| location_name | text | city / area description |
| country | keyword | e.g. "Italy", "USA" |
| region | keyword | geographic region |
| price_per_night_usd | integer | nightly rate in USD |
| price_tier | keyword | budget \\| mid-range \\| luxury \\| ultra-luxury |
| rating | float | 1.0 – 5.0 |
| amenities | keyword[] | e.g. ["pool", "spa", "gym"] |
| style | keyword[] | e.g. ["boutique", "beachfront"] |
| nearby_landmarks | keyword[] | points of interest |
| descriptions_text | text | full hotel description |

## Valid ES|QL Patterns

```esql
FROM horizon-hotels | WHERE country == "Italy" AND price_per_night_usd < 200 | SORT rating DESC | LIMIT 5
FROM horizon-hotels | WHERE "pool" IN amenities AND price_tier == "luxury" | SORT rating DESC | LIMIT 5
FROM horizon-hotels | WHERE region == "Southeast Asia" | SORT price_per_night_usd ASC | LIMIT 5
```

## Constraints

- **No date or availability fields exist.** Never use `time_range`, date filters,
  or any availability-related parameters — they will cause tool errors.
- Ignore any travel dates the user mentions; they cannot be applied to this dataset.
- Use `IN` for array fields like `amenities` and `style`.
- `location_name` is full-text; use `WHERE location_name LIKE "%Las Vegas%"` for partial matches.
""",
    "tool_ids": ["platform.core.execute_esql"],
}


def ensure_skill() -> str:
    r = api_call("GET", f"{SKILLS_PATH}/{SCHEMA_SKILL_ID}")
    if r.ok:
        print(f"Schema skill already exists: {SCHEMA_SKILL_ID}")
        return SCHEMA_SKILL_ID
    r = api_call("POST", SKILLS_PATH, SCHEMA_SKILL_PAYLOAD)
    if not r.ok:
        print(f"Failed to create schema skill: {r.status_code} {r.text[:400]}")
        sys.exit(1)
    print(f"Created schema skill: {SCHEMA_SKILL_ID}")
    return SCHEMA_SKILL_ID


def ensure_search_tool() -> str:
    r = api_call("GET", f"{TOOLS_PATH}/{SEARCH_TOOL_ID}")
    if r.ok:
        print(f"Search tool already exists: {SEARCH_TOOL_ID}")
        return SEARCH_TOOL_ID
    r = api_call("POST", TOOLS_PATH, SEARCH_TOOL_PAYLOAD)
    if not r.ok:
        print(f"Failed to create search tool: {r.status_code} {r.text[:400]}")
        sys.exit(1)
    print(f"Created search tool: {SEARCH_TOOL_ID}")
    return SEARCH_TOOL_ID


def build_payload(name: str, search_tool_id: str, skill_id: str) -> dict:
    return {
        "id": str(uuid.uuid4()),
        "name": name,
        "description": MANAGED_MARKER,
        "configuration": {
            "instructions": SYSTEM_PROMPT,
            "skill_ids": [skill_id],
            "tools": [
                {"tool_ids": [search_tool_id]},
                {"tool_ids": ["platform.core.execute_esql"]},
            ],
        },
    }


def extract_agent_id(result: dict) -> Optional[str]:
    return (
        result.get("id")
        or result.get("agent_id")
        or (result.get("data") or {}).get("id")
        or (result.get("attributes") or {}).get("id")
    )


def api_call(method: str, path: str, payload: Optional[dict] = None, timeout: int = 30) -> requests.Response:
    try:
        r = requests.request(
            method,
            kbn_url(path),
            headers=kbn_headers(),
            data=json.dumps(payload) if payload else None,
            timeout=timeout,
        )
    except requests.ConnectionError:
        print(f"Cannot reach Kibana at {KIBANA_URL} — check KIBANA_URL")
        sys.exit(1)

    if r.status_code == 401:
        print("401 Unauthorized — check KIBANA_API_KEY has agent_builder Kibana privilege")
        sys.exit(1)
    if r.status_code == 404 and method == "POST":
        print(f"404 on {path} — is Agent Builder enabled on this Kibana project?")
        sys.exit(1)

    return r


def do_list() -> None:
    r = api_call("GET", AGENTS_PATH)
    if not r.ok:
        print(f"List failed: {r.status_code} {r.text[:400]}")
        sys.exit(1)
    agents = r.json() if isinstance(r.json(), list) else r.json().get("data", [])
    managed = [a for a in agents if a.get("description") == MANAGED_MARKER or a.get("attributes", {}).get("description") == MANAGED_MARKER]
    print(f"{'ID':<36}  {'NAME':<36}  MANAGED")
    for a in agents:
        aid = extract_agent_id(a) or a.get("id", "?")
        aname = a.get("name") or a.get("attributes", {}).get("name", "?")
        adesc = a.get("description") or a.get("attributes", {}).get("description", "")
        flag = "yes" if adesc == MANAGED_MARKER else ""
        print(f"{aid:<36}  {aname:<36}  {flag}")
    if managed:
        print(f"\n{len(managed)} managed agent(s) (description={MANAGED_MARKER!r})")


def do_get(agent_id: str) -> None:
    r = api_call("GET", f"{AGENTS_PATH}/{agent_id}")
    if r.status_code == 404:
        print(f"Agent {agent_id} not found")
        sys.exit(1)
    print(json.dumps(r.json(), indent=2))


def do_delete(agent_id: str) -> None:
    r = api_call("GET", f"{AGENTS_PATH}/{agent_id}")
    if r.status_code == 404:
        print(f"Agent {agent_id} not found — nothing to delete")
        return
    agent = r.json()
    desc = agent.get("description") or agent.get("attributes", {}).get("description", "")
    if desc != MANAGED_MARKER:
        print(f"Agent {agent_id} does not have description={MANAGED_MARKER!r} — refusing to delete.")
        print("Pass --force to override this safety check.")
        sys.exit(1)
    r = api_call("DELETE", f"{AGENTS_PATH}/{agent_id}")
    if r.status_code not in (200, 204, 404):
        print(f"Delete failed: {r.status_code} {r.text[:400]}")
        sys.exit(1)
    print(f"Deleted agent {agent_id}")


def do_delete_unsafe(agent_id: str) -> None:
    r = api_call("DELETE", f"{AGENTS_PATH}/{agent_id}")
    if r.status_code not in (200, 204, 404):
        print(f"Delete failed: {r.status_code} {r.text[:400]}")
        sys.exit(1)
    print(f"Deleted agent {agent_id}")


def find_existing_managed(name: str) -> Optional[str]:
    r = api_call("GET", AGENTS_PATH)
    if not r.ok:
        return None
    agents = r.json() if isinstance(r.json(), list) else r.json().get("data", [])
    for a in agents:
        aname = a.get("name") or a.get("attributes", {}).get("name", "")
        adesc = a.get("description") or a.get("attributes", {}).get("description", "")
        if aname == name and adesc == MANAGED_MARKER:
            return extract_agent_id(a)
    return None


def do_create(name: str, connector_id: str, llm_type: str, force: bool, dry_run: bool, write_env: bool) -> None:
    validate_connector_env()
    check_connector_exists(connector_id)

    skill_id = ensure_skill()
    search_tool_id = ensure_search_tool()
    payload = build_payload(name, search_tool_id, skill_id)

    if dry_run:
        print("=== DRY RUN — payload that would be POSTed ===")
        print(json.dumps(payload, indent=2))
        return

    existing_id = find_existing_managed(name)
    if existing_id:
        if not force:
            print(f"Agent '{name}' already exists (id={existing_id}).")
            print("Use --force to delete and recreate, or --get to inspect.")
            print(f"\n  AGENT_ID={existing_id}")
            return
        print(f"--force: deleting existing agent {existing_id} ...")
        do_delete_unsafe(existing_id)

    r = api_call("POST", AGENTS_PATH, payload)
    if not r.ok:
        print(f"Create failed: {r.status_code}")
        print(r.text[:600])
        sys.exit(1)

    result = r.json()
    agent_id = extract_agent_id(result)
    if not agent_id:
        print("Could not extract agent id from response:")
        print(json.dumps(result, indent=2))
        sys.exit(1)

    print()
    print("=" * 60)
    print("Created Agent Builder agent")
    print(f"  id:        {agent_id}")
    print(f"  name:      {name}")
    print(f"  connector: {connector_id}")
    print("=" * 60)

    if write_env:
        env_path = PROJECT_ROOT / "ui" / ".env.local"
        env_path.touch(exist_ok=True)
        _upsert_env_line(env_path, "AGENT_ID", agent_id)
        print(f"\nWrote AGENT_ID={agent_id} to {env_path}")
        print("Next step: make deploy")
    else:
        print("\nNext steps:")
        print(f"  1. Add to ui/.env.local:")
        print(f"       AGENT_ID={agent_id}")
        print("  2. Run: make deploy")


def _upsert_env_line(path: Path, key: str, value: str) -> None:
    content = path.read_text() if path.exists() else ""
    pattern = re.compile(rf"^{re.escape(key)}=.*$", re.MULTILINE)
    new_line = f"{key}={value}"
    if pattern.search(content):
        content = pattern.sub(new_line, content)
    else:
        content = content.rstrip("\n") + f"\n{new_line}\n"
    path.write_text(content)


def do_smoke(agent_id: str) -> None:
    payload = {
        "input": "Show me hotels in Italy under $200 per night",
        "agent_id": agent_id,
    }
    print(f"Sending smoke-test query to agent {agent_id} ...")
    r = api_call("POST", CONVERSE_PATH, payload, timeout=60)
    if not r.ok:
        print(f"Converse failed: {r.status_code} {r.text[:400]}")
        sys.exit(1)
    body = r.json()
    print("Response:")
    print(json.dumps(body, indent=2)[:2000])
    content = json.dumps(body).lower()
    if "hotel" in content or "italy" in content or "per_night" in content:
        print("\nSmoke test PASSED — response references hotel data.")
    else:
        print("\nSmoke test UNCERTAIN — no obvious hotel content in response. Review above.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Create/manage Horizon Agent Builder agent")
    parser.add_argument("--name", default=DEFAULT_AGENT_NAME, help="Agent name")
    parser.add_argument("--connector-id", default=None, help="Override AGENT_CONNECTOR_ID")
    parser.add_argument("--llm-type", default="gemini", help="LLM type (gemini|openai|bedrock)")
    parser.add_argument("--dry-run", action="store_true", help="Print payload without POSTing")
    parser.add_argument("--force", action="store_true", help="Delete existing managed agent and recreate")
    parser.add_argument("--write-env", action="store_true", help="Write AGENT_ID to ui/.env.local after creation")
    parser.add_argument("--list", action="store_true", help="List all agents (highlights managed ones)")
    parser.add_argument("--get", metavar="ID", help="Inspect an agent by id")
    parser.add_argument("--delete", metavar="ID", help="Delete a managed agent by id")
    parser.add_argument("--smoke", metavar="ID", help="Smoke-test agent tools via a converse call")
    args = parser.parse_args()

    validate_base_env()

    connector_id = args.connector_id or AGENT_CONNECTOR_ID

    if args.list:
        do_list()
    elif args.get:
        do_get(args.get)
    elif args.delete:
        do_delete(args.delete)
    elif args.smoke:
        do_smoke(args.smoke)
    else:
        do_create(
            name=args.name,
            connector_id=connector_id,
            llm_type=args.llm_type,
            force=args.force,
            dry_run=args.dry_run,
            write_env=args.write_env,
        )


if __name__ == "__main__":
    main()
