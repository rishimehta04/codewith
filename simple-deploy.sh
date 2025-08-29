#!/usr/bin/env bash
set -euo pipefail

# Simple CodeWith Deployment Script
# This script replicates the exact steps that fixed the WebSocket deployment

echo "🚀 CodeWith - Simple Deployment"
echo "==============================="

cd "$(dirname "$0")"

PROJECT_ID="${1:-$(gcloud config get-value project 2>/dev/null || true)}"
REGION="${2:-us-central1}"

if [[ -z "${PROJECT_ID}" ]]; then
  echo "❌ Error: GCP project not set. Usage: ./simple-deploy.sh <PROJECT_ID> [REGION]" >&2
  echo "   Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

echo "📝 Project: ${PROJECT_ID}"
echo "🌍 Region: ${REGION}"
echo ""

# Set project
echo "📝 Setting project..."
gcloud config set project "${PROJECT_ID}"

# Enable APIs
echo "🔧 Enabling APIs..."
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com

echo ""
echo "🏗️  STEP 1: Deploy Server"
echo "========================"

# Build and deploy server
echo "📦 Building server..."
gcloud builds submit --tag "gcr.io/${PROJECT_ID}/codewith-server" ./server

echo "🚀 Deploying server..."
gcloud run deploy codewith-server \
  --image="gcr.io/${PROJECT_ID}/codewith-server" \
  --region="${REGION}" \
  --allow-unauthenticated \
  --port=3001 \
  --memory=1Gi \
  --cpu=1 \
  --max-instances=10

# Get server URL
SERVER_URL=$(gcloud run services describe codewith-server --region="${REGION}" --format='value(status.url)')
echo "✅ Server deployed: ${SERVER_URL}"

echo ""
echo "🏗️  STEP 2: Deploy Client"
echo "========================"

# Create client environment with server URL
echo "🔧 Configuring client with server URL..."
cat > ./client/.env.production <<EOF
REACT_APP_SERVER_URL=${SERVER_URL}
EOF

# Build and deploy client
echo "📦 Building client..."
gcloud builds submit --tag "gcr.io/${PROJECT_ID}/codewith-client" ./client

echo "🚀 Deploying client..."
gcloud run deploy codewith-client \
  --image="gcr.io/${PROJECT_ID}/codewith-client" \
  --region="${REGION}" \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --max-instances=10

# Get client URL
CLIENT_URL=$(gcloud run services describe codewith-client --region="${REGION}" --format='value(status.url)')

# Cleanup
rm -f ./client/.env.production

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================="
echo "📱 Client: ${CLIENT_URL}"
echo "🖥️  Server: ${SERVER_URL}"
echo ""
echo "✨ Your collaborative C++ editor is live!"
echo "💡 Open the Client URL to start coding together!"
