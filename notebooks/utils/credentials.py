"""
Horizon — Credential Management Utility

Credential resolution order:
  1. ui/.env.local   — primary source (shared with the Next.js UI)
  2. <project>/.env  — optional override for notebook-specific creds
  3. Environment vars — for CI / container injection
  4. Interactive prompt via getpass — last resort
"""

import os
import getpass
import random
import string
from pathlib import Path
from dotenv import load_dotenv

_PROJECT_ROOT = Path(__file__).parent.parent.parent

UI_ENV_FILE = _PROJECT_ROOT / "ui" / ".env.local"
ENV_FILE = _PROJECT_ROOT / ".env"


def _generate_suffix() -> str:
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))


def _get_user_suffix() -> str:
    if os.getenv("USER_SUFFIX"):
        return os.getenv("USER_SUFFIX")
    try:
        username = os.getlogin()
        suffix = ''.join(c for c in username.lower() if c.isalnum())[:8]
        if suffix:
            return suffix
    except (OSError, AttributeError):
        pass
    return _generate_suffix()


def get_credentials(
    require_elastic: bool = True,
    require_jina: bool = True,
    save_prompt: bool = True
) -> dict:
    # Load .env files in priority order
    for env_file in [UI_ENV_FILE, ENV_FILE]:
        if env_file.exists():
            load_dotenv(env_file, override=False)

    creds = {}

    # Elastic
    if require_elastic:
        url = os.getenv("ELASTICSEARCH_URL")
        api_key = os.getenv("ELASTICSEARCH_API_KEY") or os.getenv("ELASTIC_API_KEY")

        if not url:
            url = getpass.getpass("Elasticsearch URL: ")
        if not api_key:
            api_key = getpass.getpass("Elasticsearch API Key: ")

        creds["ELASTICSEARCH_URL"] = url
        creds["ELASTIC_API_KEY"] = api_key

    # Jina
    if require_jina:
        jina_key = os.getenv("JINA_API_KEY")
        if not jina_key:
            jina_key = getpass.getpass("Jina API Key: ")
        creds["JINA_API_KEY"] = jina_key

    # Gemini (for nano-banana)
    creds["GEMINI_API_KEY"] = os.getenv("GEMINI_API_KEY", "")

    creds["USER_SUFFIX"] = _get_user_suffix()

    if save_prompt and any(not os.getenv(k) for k in ["ELASTICSEARCH_URL", "JINA_API_KEY"]):
        save = input("\nSave credentials to ui/.env.local? [y/N] ").strip().lower()
        if save == 'y':
            _save_env(creds)

    return creds


def _save_env(creds: dict):
    lines = []
    if creds.get("ELASTICSEARCH_URL"):
        lines.append(f'ELASTICSEARCH_URL={creds["ELASTICSEARCH_URL"]}')
    if creds.get("ELASTIC_API_KEY"):
        lines.append(f'ELASTICSEARCH_API_KEY={creds["ELASTIC_API_KEY"]}')
    if creds.get("JINA_API_KEY"):
        lines.append(f'JINA_API_KEY={creds["JINA_API_KEY"]}')
    UI_ENV_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(UI_ENV_FILE, 'w') as f:
        f.write('\n'.join(lines) + '\n')
    print(f"Saved to {UI_ENV_FILE}")


def get_elasticsearch_client(credentials: dict):
    from elasticsearch import Elasticsearch
    return Elasticsearch(
        hosts=[credentials["ELASTICSEARCH_URL"]],
        api_key=credentials["ELASTIC_API_KEY"]
    )


def setup_notebook(require_elastic: bool = True, require_jina: bool = True) -> dict:
    print("=" * 50)
    print("  Horizon — Notebook Setup")
    print("=" * 50)
    creds = get_credentials(require_elastic=require_elastic, require_jina=require_jina)
    print(f"\n  Elasticsearch: {creds.get('ELASTICSEARCH_URL', 'N/A')}")
    print(f"  Index: horizon-hotels")
    print(f"  Embeddings: .jina-embeddings-v5-text-small")
    print(f"  Reranker:   .jina-reranker-v3")
    print("─" * 50 + "\n")
    return creds
