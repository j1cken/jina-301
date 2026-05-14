#!/usr/bin/env bash
# Horizon — Interactive Setup Wizard
# Run: ./scripts/setup.sh  OR  make wizard
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$REPO_ROOT/ui/.env.local"
ENV_EXAMPLE="$REPO_ROOT/.env.example"

# Flags
SKIP_INSTALL=false
SKIP_INDEX=false
SKIP_FALLBACKS=false
RECONFIGURE=false

for arg in "$@"; do
  case $arg in
    --skip-install)   SKIP_INSTALL=true ;;
    --skip-index)     SKIP_INDEX=true ;;
    --skip-fallbacks) SKIP_FALLBACKS=true ;;
    --reconfigure)    RECONFIGURE=true ;;
  esac
done

# Colors
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

ok()   { echo -e "${GREEN}✓${RESET} $*"; }
warn() { echo -e "${YELLOW}⚠${RESET}  $*"; }
err()  { echo -e "${RED}✗${RESET} $*"; }
info() { echo -e "${CYAN}→${RESET} $*"; }
header() { echo -e "\n${BOLD}$*${RESET}"; }

# Trap for cleanup
TMP_ENV=""
cleanup() { [[ -n "$TMP_ENV" && -f "$TMP_ENV" ]] && rm -f "$TMP_ENV"; }
trap cleanup EXIT

# ─────────────────────────────────────────────
# Helper: read a value from ui/.env.local
# ─────────────────────────────────────────────
get_env() {
  local key="$1"
  if [[ -f "$ENV_FILE" ]]; then
    grep -E "^${key}=" "$ENV_FILE" 2>/dev/null | head -1 | sed "s/^${key}=//" | tr -d "'"
  fi
}

# ─────────────────────────────────────────────
# Helper: set/update a key in ui/.env.local
# ─────────────────────────────────────────────
set_env() {
  local key="$1" value="$2"
  TMP_ENV=$(mktemp)
  if [[ -f "$ENV_FILE" ]]; then
    grep -v "^${key}=" "$ENV_FILE" > "$TMP_ENV" || true
  fi
  # Wrap in single quotes to handle special chars
  echo "${key}='${value}'" >> "$TMP_ENV"
  mv "$TMP_ENV" "$ENV_FILE"
  TMP_ENV=""
  chmod 600 "$ENV_FILE"
}

# ─────────────────────────────────────────────
echo -e "\n${BOLD}Horizon — Setup Wizard${RESET}"
echo "────────────────────────────────────────"

# ══════════════════════════════════════════════
# PHASE 1 — Prerequisites
# ══════════════════════════════════════════════
header "Phase 1 — Prerequisites"

PREREQ_FAIL=false

# Node.js 18+
if command -v node &>/dev/null; then
  NODE_VER=$(node -e "process.stdout.write(process.version.slice(1).split('.')[0])")
  if [[ "$NODE_VER" -ge 18 ]]; then
    ok "Node.js $(node --version)"
  else
    err "Node.js 18+ required (found $(node --version))"
    info "Install: https://nodejs.org or use nvm"
    PREREQ_FAIL=true
  fi
else
  err "Node.js not found"
  info "Install: https://nodejs.org or use nvm"
  PREREQ_FAIL=true
fi

# Python 3.11+
if command -v python3 &>/dev/null; then
  PY_VER=$(python3 -c "import sys; print(f'{sys.version_info.major}{sys.version_info.minor:02d}')")
  if [[ "$PY_VER" -ge 311 ]]; then
    ok "Python $(python3 --version | awk '{print $2}')"
  else
    err "Python 3.11+ required (found $(python3 --version))"
    info "Install: https://python.org or use pyenv"
    PREREQ_FAIL=true
  fi
else
  err "Python 3 not found"
  info "Install: https://python.org"
  PREREQ_FAIL=true
fi

# uv
if command -v uv &>/dev/null; then
  ok "uv $(uv --version | awk '{print $2}')"
else
  err "uv not found"
  info "Install: curl -LsSf https://astral.sh/uv/install.sh | sh"
  PREREQ_FAIL=true
fi

# nano-banana (optional)
if command -v nano-banana &>/dev/null; then
  ok "nano-banana (image generation available)"
else
  warn "nano-banana not found — image regeneration unavailable (pre-built images will be used)"
  info "Install if needed: bun install -g nano-banana"
fi

if [[ "$PREREQ_FAIL" == true ]]; then
  echo ""
  err "Required prerequisites missing. Install them and re-run."
  exit 1
fi

# ══════════════════════════════════════════════
# PHASE 2 — Environment configuration
# ══════════════════════════════════════════════
header "Phase 2 — Environment Configuration"

# Bootstrap env file
if [[ ! -f "$ENV_FILE" ]]; then
  cp "$ENV_EXAMPLE" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  info "Created ui/.env.local from .env.example"
fi

prompt_required() {
  local key="$1" label="$2" hint="$3" silent="${4:-false}"
  local current
  current=$(get_env "$key")
  if [[ -n "$current" && "$RECONFIGURE" == false ]]; then
    ok "$key already set"
    return
  fi
  echo ""
  echo -e "  ${BOLD}${label}${RESET}"
  [[ -n "$hint" ]] && echo -e "  ${CYAN}${hint}${RESET}"
  if [[ "$silent" == true ]]; then
    read -rsp "  Enter value: " value; echo ""
  else
    read -rp "  Enter value: " value
  fi
  if [[ -z "$value" ]]; then
    err "$key is required"
    exit 1
  fi
  set_env "$key" "$value"
  ok "$key saved"
}

prompt_optional() {
  local key="$1" label="$2" hint="$3" silent="${4:-false}"
  local current
  current=$(get_env "$key")
  if [[ -n "$current" && "$RECONFIGURE" == false ]]; then
    ok "$key already set"
    return
  fi
  echo ""
  echo -e "  ${BOLD}${label}${RESET} (optional — press Enter to skip)"
  [[ -n "$hint" ]] && echo -e "  ${CYAN}${hint}${RESET}"
  if [[ "$silent" == true ]]; then
    read -rsp "  Enter value: " value; echo ""
  else
    read -rp "  Enter value: " value
  fi
  if [[ -n "$value" ]]; then
    set_env "$key" "$value"
    ok "$key saved"
  else
    warn "$key skipped"
  fi
}

echo ""
info "Required credentials:"
prompt_required "JINA_API_KEY"          "Jina AI API Key"          "Get yours free at: https://jina.ai" true
prompt_required "ELASTICSEARCH_URL"     "Elasticsearch URL"        "Your Elastic Cloud Serverless or Cloud Hosted endpoint\n  e.g. https://my-project.es.us-east-1.aws.elastic.cloud"
prompt_required "ELASTICSEARCH_API_KEY" "Elasticsearch API Key"    "Elastic Cloud → your project → Security → API Keys" true

echo ""
info "Optional credentials (for Agent station):"
prompt_optional "KIBANA_URL"     "Kibana URL"     "Same project as Elasticsearch, .kb. subdomain"
prompt_optional "KIBANA_API_KEY" "Kibana API Key" "Same key or a new one with Kibana permissions" true

echo ""
info "Optional credentials (for regenerating demo data):"
prompt_optional "GEMINI_API_KEY" "Google Gemini API Key" "Only needed if re-running make hotels or make images" true

# ══════════════════════════════════════════════
# PHASE 3 — Elasticsearch connectivity
# ══════════════════════════════════════════════
header "Phase 3 — Elasticsearch Connectivity"

ES_URL=$(get_env "ELASTICSEARCH_URL")
ES_KEY=$(get_env "ELASTICSEARCH_API_KEY")

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: ApiKey $ES_KEY" \
  "$ES_URL" 2>/dev/null || echo "000")

if [[ "$HTTP_STATUS" == "200" ]]; then
  ok "Elasticsearch reachable"
else
  err "Cannot reach Elasticsearch (HTTP $HTTP_STATUS)"
  info "Check your ELASTICSEARCH_URL and ELASTICSEARCH_API_KEY in ui/.env.local"
  info "URL should look like: https://my-project.es.us-east-1.aws.elastic.cloud"
  exit 1
fi

# ══════════════════════════════════════════════
# PHASE 4 — EIS inference endpoint checks
# ══════════════════════════════════════════════
header "Phase 4 — Elastic Inference Service (EIS) Endpoints"

check_eis() {
  local endpoint="$1" label="$2"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: ApiKey $ES_KEY" \
    "$ES_URL/_inference/${endpoint}" 2>/dev/null || echo "000")
  if [[ "$status" == "200" ]]; then
    ok "$label"
    return 0
  else
    err "$label not found (HTTP $status)"
    return 1
  fi
}

EIS_FAIL=false

check_eis "text_embedding/.jina-embeddings-v5-text-small" "Jina Embeddings v5 (text_embedding)" || EIS_FAIL=true
check_eis "rerank/.jina-reranker-v3" "Jina Reranker v3 (rerank)" || EIS_FAIL=true

if [[ "$EIS_FAIL" == true ]]; then
  echo ""
  err "One or more EIS inference endpoints are not available."
  info "These endpoints are pre-provisioned on Elastic Cloud Serverless and Cloud Hosted clusters."
  info "To enable:"
  info "  1. Make sure EIS is enabled on your Elastic project"
  info "  2. Check Kibana → Machine Learning → Inference Endpoints"
  info "  3. The endpoints appear automatically — you do not need to create them manually"
  info "  4. If you recently created the cluster, wait a few minutes and retry"
  echo ""
  warn "You can skip indexing for now and come back: re-run with --skip-index"
  exit 1
fi

echo ""
info "Inference endpoints that will be used during indexing:"
info "  Embeddings : .jina-embeddings-v5-text-small"
info "  Reranker   : .jina-reranker-v3"
info "  CLIP       : .jina-clip-v2 (called via JINA_API_KEY at index time)"

# ══════════════════════════════════════════════
# PHASE 5 — Install dependencies
# ══════════════════════════════════════════════
header "Phase 5 — Installing Dependencies"

if [[ "$SKIP_INSTALL" == true ]]; then
  warn "Skipping dependency install (--skip-install)"
else
  info "Installing Node.js dependencies..."
  (cd "$REPO_ROOT/ui" && npm install --silent)
  ok "Node.js dependencies installed"

  info "Setting up Python environment..."
  (cd "$REPO_ROOT" && uv venv .venv --quiet && \
    uv pip install --python .venv/bin/python --quiet \
      google-genai python-dotenv requests elasticsearch)
  ok "Python environment ready"
fi

# ══════════════════════════════════════════════
# PHASE 6 — Data / indexing
# ══════════════════════════════════════════════
header "Phase 6 — Hotel Data"

if [[ "$SKIP_INDEX" == true ]]; then
  warn "Skipping indexing (--skip-index)"
else
  echo ""
  echo "  How do you want to set up the hotel dataset?"
  echo "  1) Index pre-built data — quick (~3–5 min)  [recommended]"
  echo "  2) Generate from scratch — full pipeline (~45 min, needs GEMINI_API_KEY + nano-banana)"
  echo "  3) Skip for now"
  echo ""
  read -rp "  Choice [1/2/3]: " data_choice

  case "$data_choice" in
    2)
      GEMINI=$(get_env "GEMINI_API_KEY")
      if [[ -z "$GEMINI" ]]; then
        warn "GEMINI_API_KEY not set — skipping data generation"
      elif ! command -v nano-banana &>/dev/null; then
        warn "nano-banana not installed — skipping data generation"
      else
        info "Running full data pipeline (this takes a while)..."
        (cd "$REPO_ROOT" && make all-data)
        ok "Full dataset generated and indexed"
      fi
      ;;
    3)
      warn "Skipping data indexing"
      ;;
    *)
      if [[ -f "$REPO_ROOT/data/hotels.json" ]]; then
        info "Indexing pre-built hotel data..."
        (cd "$REPO_ROOT" && make index)
        ok "Hotels indexed"
      else
        warn "data/hotels.json not found — run make hotels first, then make index"
      fi
      ;;
  esac
fi

# ══════════════════════════════════════════════
# PHASE 7 — Fallback responses
# ══════════════════════════════════════════════
header "Phase 7 — Offline Fallback Responses"

if [[ "$SKIP_FALLBACKS" == true ]]; then
  warn "Skipping fallback capture (--skip-fallbacks)"
else
  echo ""
  read -rp "  Capture fallback responses for offline demo mode? [Y/n]: " fb_choice
  if [[ "${fb_choice:-y}" =~ ^[Yy]$ ]]; then
    info "Capturing fallback responses (requires make dev to be running in another terminal)..."
    warn "Make sure 'make dev' is running at http://localhost:3000 before continuing"
    read -rp "  Ready? Press Enter to continue (or Ctrl+C to skip): "
    (cd "$REPO_ROOT" && make fallbacks)
    ok "Fallback responses captured"
  else
    warn "Skipping fallback capture — run 'make fallbacks' before your demo"
  fi
fi

# ══════════════════════════════════════════════
# PHASE 8 — Done
# ══════════════════════════════════════════════
header "Setup Complete"
echo ""
ok "Horizon is ready to run!"
echo ""
echo -e "  ${BOLD}Next steps:${RESET}"
echo "    make dev                    # Start the dev server"
echo "    open http://localhost:3000  # Open the app"
echo ""
echo -e "  ${YELLOW}Note:${RESET} If you just created ui/.env.local, make sure to"
echo "  start a fresh dev server (not one already running)."
echo ""
echo "  Re-run options:"
echo "    ./scripts/setup.sh --reconfigure    # Update env vars only"
echo "    ./scripts/setup.sh --skip-install   # Skip npm/uv install"
echo "    ./scripts/setup.sh --skip-index     # Skip data indexing"
echo ""
