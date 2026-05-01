# Horizon Demo — Handoff Notes

## Live URL
https://demos.gcp.elasticsa.co/horizon

## Key IDs (not secrets — safe to share)

| Variable | Value |
|---|---|
| `AGENT_ID` | `6e729f42-8cab-4860-b9ce-2b653ff7c259` |
| Kibana cluster | `chatty-mcchatbot-c0f827.kb.us-east-1.aws.elastic.cloud` |
| Agent name | `horizon-hotel-concierge` |
| GCP project | `elastic-sa` |
| Cloud Run service | `horizon-demo` (us-central1) |

> **Note**: `AGENT_ID` must be the UUID above, NOT the display name "horizon-hotel-concierge". The Agent Builder API only accepts UUIDs.

## Deployment

```bash
make deploy   # builds Docker image, updates GCP secrets, redeploys Cloud Run
```

Secrets live in GCP Secret Manager (`elastic-sa` project). Editing `ui/.env.local` alone does NOT update the deployed app — you must run `make deploy`.

## Agent Station env vars (all required)

```
KIBANA_URL=https://chatty-mcchatbot-c0f827.kb.us-east-1.aws.elastic.cloud
KIBANA_API_KEY=<see ui/.env.local>
AGENT_ID=6e729f42-8cab-4860-b9ce-2b653ff7c259
```
