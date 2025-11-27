#!/usr/bin/env bash
# scripts/upload_manifest.sh
# Usage:
#   VERISENSE_API_KEY=sk_xxx VERISENSE_REGISTRY_URL=https://dashboard.verisense.network/api/agents ./scripts/upload_manifest.sh
set -e

REGISTRY_URL="${VERISENSE_REGISTRY_URL:-https://dashboard.verisense.network/api/agents}"
API_KEY="${VERISENSE_API_KEY:-}"

if [ -z "$API_KEY" ]; then
  echo "Error: set VERISENSE_API_KEY environment variable before running."
  exit 1
fi

MANIFEST_FILE="$(pwd)/verisense-agent-manifest.json"
if [ ! -f "$MANIFEST_FILE" ]; then
  echo "Manifest not found at $MANIFEST_FILE — run node scripts/register_agent.js first."
  exit 1
fi

echo "Uploading $MANIFEST_FILE to $REGISTRY_URL (endpoint: /register)"
curl -X POST "${REGISTRY_URL%/}/register" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  --data-binary @"$MANIFEST_FILE"

echo "\nUpload request sent. Check the Verisense Dashboard for registration status."

