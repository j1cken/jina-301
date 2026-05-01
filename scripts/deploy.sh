#!/usr/bin/env bash
# Deploy horizon-demo to Cloud Run behind IAP at demos.gcp.elasticsa.co/horizon
set -euo pipefail

PROJECT="elastic-sa"
REGION="us-central1"
SERVICE="horizon-demo"
REPO="us-central1-docker.pkg.dev/${PROJECT}/demos/${SERVICE}"
IMAGE="${REPO}:$(git rev-parse --short HEAD 2>/dev/null || echo latest)"
GCS_BUCKET="gs://horizon-hotels-images"
IMAGE_BASE="https://storage.googleapis.com/horizon-hotels-images"
BASE_PATH="/horizon"

# Load env from ui/.env.local
ENV_FILE="$(dirname "$0")/../ui/.env.local"
if [[ -f "$ENV_FILE" ]]; then
  set -a; source "$ENV_FILE"; set +a
fi

for var in ELASTICSEARCH_URL ELASTICSEARCH_API_KEY JINA_API_KEY; do
  [[ -z "${!var:-}" ]] && { echo "Missing $var"; exit 1; }
done
# Kibana/Agent vars are optional (agent station degrades gracefully without them)
KIBANA_URL="${KIBANA_URL:-}"
KIBANA_API_KEY="${KIBANA_API_KEY:-}"
AGENT_ID="${AGENT_ID:-}"

if [[ -z "$AGENT_ID" ]]; then
  echo "WARNING: AGENT_ID is not set. The /agent station will be disabled."
  echo "         Run: make agent  (then add AGENT_ID=… to ui/.env.local)"
fi

echo "=== 1. Ensure Artifact Registry repo exists ==="
gcloud artifacts repositories describe demos \
  --location="$REGION" --project="$PROJECT" &>/dev/null || \
gcloud artifacts repositories create demos \
  --repository-format=docker \
  --location="$REGION" \
  --project="$PROJECT"

echo "=== 2. Build and push Docker image ==="
cd "$(dirname "$0")/../ui"
gcloud builds submit . \
  --config=cloudbuild.yaml \
  --substitutions="_IMAGE=${IMAGE}" \
  --project="$PROJECT"
cd - >/dev/null

echo "=== 3. Store secrets in Secret Manager ==="
for secret_name in elasticsearch-url elasticsearch-api-key jina-api-key kibana-url kibana-api-key agent-id; do
  gcloud secrets describe "$secret_name" --project="$PROJECT" &>/dev/null || \
  gcloud secrets create "$secret_name" --project="$PROJECT" --replication-policy=automatic
done

printf '%s' "$ELASTICSEARCH_URL"    | gcloud secrets versions add elasticsearch-url    --data-file=- --project="$PROJECT"
printf '%s' "$ELASTICSEARCH_API_KEY"| gcloud secrets versions add elasticsearch-api-key --data-file=- --project="$PROJECT"
printf '%s' "$JINA_API_KEY"         | gcloud secrets versions add jina-api-key          --data-file=- --project="$PROJECT"
[[ -n "$KIBANA_URL" ]]     && printf '%s' "$KIBANA_URL"     | gcloud secrets versions add kibana-url      --data-file=- --project="$PROJECT"
[[ -n "$KIBANA_API_KEY" ]] && printf '%s' "$KIBANA_API_KEY" | gcloud secrets versions add kibana-api-key  --data-file=- --project="$PROJECT"
[[ -n "$AGENT_ID" ]]       && printf '%s' "$AGENT_ID"       | gcloud secrets versions add agent-id        --data-file=- --project="$PROJECT"

echo "=== 4. Deploy Cloud Run service ==="
gcloud run deploy "$SERVICE" \
  --image="$IMAGE" \
  --region="$REGION" \
  --project="$PROJECT" \
  --platform=managed \
  --ingress=internal-and-cloud-load-balancing \
  --port=3000 \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5 \
  --timeout=60 \
  --set-secrets="ELASTICSEARCH_URL=elasticsearch-url:latest,ELASTICSEARCH_API_KEY=elasticsearch-api-key:latest,JINA_API_KEY=jina-api-key:latest,KIBANA_URL=kibana-url:latest,KIBANA_API_KEY=kibana-api-key:latest,AGENT_ID=agent-id:latest" \
  --no-allow-unauthenticated

echo "=== 5. Allow Cloud Run invoker (required for IAP + LB) ==="
gcloud run services add-iam-policy-binding "$SERVICE" \
  --region="$REGION" \
  --project="$PROJECT" \
  --member="allUsers" \
  --role="roles/run.invoker"

echo "=== 6. Create serverless NEG ==="
gcloud compute network-endpoint-groups describe "${SERVICE}-neg" \
  --region="$REGION" --project="$PROJECT" &>/dev/null || \
gcloud compute network-endpoint-groups create "${SERVICE}-neg" \
  --region="$REGION" \
  --network-endpoint-type=serverless \
  --cloud-run-service="$SERVICE" \
  --project="$PROJECT"

echo "=== 7. Create backend service ==="
gcloud compute backend-services describe "${SERVICE}-backend" \
  --global --project="$PROJECT" &>/dev/null || \
gcloud compute backend-services create "${SERVICE}-backend" \
  --global \
  --protocol=HTTP \
  --timeout=60s \
  --project="$PROJECT"

echo "=== 8. Add NEG to backend ==="
gcloud compute backend-services describe "${SERVICE}-backend" \
  --global --project="$PROJECT" --format="json(backends)" | \
  grep -q "${SERVICE}-neg" || \
gcloud compute backend-services add-backend "${SERVICE}-backend" \
  --global \
  --network-endpoint-group="${SERVICE}-neg" \
  --network-endpoint-group-region="$REGION" \
  --project="$PROJECT"

echo "=== 9. Enable IAP ==="
gcloud compute backend-services update "${SERVICE}-backend" \
  --global \
  --iap=enabled \
  --project="$PROJECT"

echo "=== 10. Grant IAP access to elastic.co domain ==="
gcloud iap web add-iam-policy-binding \
  --resource-type=backend-services \
  --service="${SERVICE}-backend" \
  --member="domain:elastic.co" \
  --role="roles/iap.httpsResourceAccessor" \
  --project="$PROJECT" 2>/dev/null || true

echo "=== 11. Update URL map ==="
TMPMAP=$(mktemp /tmp/urlmap-XXXXXX.yaml)
gcloud compute url-maps export elastic-demos-gateway \
  --destination="$TMPMAP" \
  --project="$PROJECT"

if ! grep -q "${SERVICE}-backend" "$TMPMAP"; then
  BACKEND_URI="https://www.googleapis.com/compute/v1/projects/${PROJECT}/global/backendServices/${SERVICE}-backend"
  python3 - "$TMPMAP" "$BACKEND_URI" <<'PYEOF'
import sys, yaml

path = sys.argv[1]
backend_uri = sys.argv[2]

with open(path) as f:
    data = yaml.safe_load(f)

new_rule = {
    'paths': ['/horizon', '/horizon/*'],
    'service': backend_uri,
}

for pm in data.get('pathMatchers', []):
    rules = pm.get('pathRules', [])
    if not any(r.get('service', '').endswith('horizon-demo-backend') for r in rules):
        rules.append(new_rule)
        pm['pathRules'] = rules
        break

with open(path, 'w') as f:
    yaml.dump(data, f, default_flow_style=False)
PYEOF

  gcloud compute url-maps import elastic-demos-gateway \
    --source="$TMPMAP" \
    --project="$PROJECT" \
    --quiet
else
  echo "  URL map already has /horizon route"
fi
rm -f "$TMPMAP"

echo ""
echo "=== Deploy complete ==="
echo "URL: https://demos.gcp.elasticsa.co/horizon"
echo "(DNS propagation + LB provisioning may take 5-10 min)"
