#!/usr/bin/env bash
set -euo pipefail

# Stop CodeWith services on Google Cloud Platform with full command visibility
# Usage: ./stop.sh [PROJECT_ID] [REGION]

echo "🛑 CodeWith - GCP Service Termination (Verbose Mode)"
echo "════════════════════════════════════════════════════"

cd "$(dirname "$0")"

PROJECT_ID="${1:-$(gcloud config get-value project 2>/dev/null || true)}"
REGION="${2:-us-central1}"

if [[ -z "${PROJECT_ID}" ]]; then
  echo "❌ Error: GCP project not set. Usage: ./stop.sh <PROJECT_ID> [REGION]" >&2
  echo "   Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

echo "📝 Project: ${PROJECT_ID}"
echo "🌍 Region: ${REGION}"
echo ""

# Function to run commands with full visibility
run_cmd() {
  echo "🔧 EXECUTING: $*"
  echo "────────────────────────────────────────"
  "$@"
  local exit_code=$?
  if [ $exit_code -eq 0 ]; then
    echo "✅ SUCCESS: Command completed"
  else
    echo "⚠️  WARNING: Command failed with exit code $exit_code (continuing...)"
  fi
  echo ""
  return 0  # Don't exit on error for stop operations
}

# Set project
echo "📝 STEP 1: Setting Project"
echo "══════════════════════════"
run_cmd gcloud config set project "${PROJECT_ID}"

# List current services
echo "📋 STEP 2: Listing Current Services"
echo "═══════════════════════════════════"
echo "🔍 Checking for CodeWith services..."
run_cmd gcloud run services list --region="${REGION}" --filter="metadata.name:codewith"

# Stop client service
echo "🛑 STEP 3: Stopping Client Service"
echo "══════════════════════════════════"
if gcloud run services describe codewith-client --region="${REGION}" &>/dev/null; then
    echo "🗑️  Deleting codewith-client service..."
    run_cmd gcloud run services delete codewith-client \
        --region="${REGION}" \
        --quiet
else
    echo "ℹ️  codewith-client service not found (already deleted or never existed)"
fi

# Stop server service
echo "🛑 STEP 4: Stopping Server Service"
echo "══════════════════════════════════"
if gcloud run services describe codewith-server --region="${REGION}" &>/dev/null; then
    echo "🗑️  Deleting codewith-server service..."
    run_cmd gcloud run services delete codewith-server \
        --region="${REGION}" \
        --quiet
else
    echo "ℹ️  codewith-server service not found (already deleted or never existed)"
fi

# Verify cleanup
echo "✅ STEP 5: Verification"
echo "══════════════════════"
echo "🔍 Checking remaining CodeWith services..."
run_cmd gcloud run services list --region="${REGION}" --filter="metadata.name:codewith"

# Show container images (optional cleanup)
echo "📦 STEP 6: Container Images"
echo "═══════════════════════════"
echo "🔍 Listing CodeWith container images (these remain for cache/history)..."
run_cmd gcloud container images list --repository="gcr.io/${PROJECT_ID}" --filter="name:codewith"

echo ""
echo "✅ TERMINATION COMPLETE!"
echo "════════════════════════"
echo "🗑️  All CodeWith Cloud Run services have been stopped and deleted"
echo "📦 Container images remain in Container Registry for cache/history"
echo ""
echo "🔧 Optional cleanup commands:"
echo "   Delete all images: gcloud container images delete gcr.io/${PROJECT_ID}/codewith-server --quiet"
echo "                     gcloud container images delete gcr.io/${PROJECT_ID}/codewith-client --quiet"
echo "   View billing:     gcloud billing accounts list"
echo ""
echo "💡 Your Cloud Run services are now stopped. No more charges will accrue for running services."
