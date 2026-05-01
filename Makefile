PYTHON := .venv/bin/python

.PHONY: dev dev-hot index fallbacks images hotels install setup sample-data deploy agent agent-delete

dev:
	cd ui && npm run dev

dev-prod:
	cd ui && npm run build && cp -r public .next/standalone/public && cp -r .next/static .next/standalone/.next/static && set -a && . .env.local && set +a && PORT=3000 node .next/standalone/server.js

# Run in order: hotels → images → index → fallbacks
all-data: hotels images index

# Quick smoke test: 2 hotels per region, 2 images each
sample-data:
	$(PYTHON) scripts/generate_hotels.py --sample 2
	$(PYTHON) scripts/generate_images.py --limit 10
	$(PYTHON) scripts/index_hotels.py --limit 10

hotels:
	$(PYTHON) scripts/generate_hotels.py

images:
	$(PYTHON) scripts/generate_images.py

index:
	$(PYTHON) scripts/index_hotels.py

fallbacks:
	$(PYTHON) scripts/generate_fallbacks.py

deploy:
	bash scripts/deploy.sh

agent:
	$(PYTHON) scripts/create_agent.py --write-env

agent-delete:
	@test -n "$(ID)" || (echo "Usage: make agent-delete ID=<agent_id>"; exit 1)
	$(PYTHON) scripts/create_agent.py --delete $(ID)

install:
	cd ui && npm install

setup:
	uv venv .venv
	uv pip install --python .venv/bin/python google-genai python-dotenv requests elasticsearch
