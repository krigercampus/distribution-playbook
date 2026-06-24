#!/bin/bash
# Run once after `vercel login` to deploy + set all env vars
set -e

VERCEL=$(which vercel 2>/dev/null || echo "npx vercel")

echo "→ Deploying to Vercel..."
$VERCEL --prod

echo "→ Setting env vars..."
source .env.local

$VERCEL env add NEXT_PUBLIC_SUPABASE_URL production <<< "$NEXT_PUBLIC_SUPABASE_URL"
$VERCEL env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
$VERCEL env add SUPABASE_SERVICE_KEY production <<< "$SUPABASE_SERVICE_KEY"
$VERCEL env add OPENAI_API_KEY production <<< "$OPENAI_API_KEY"

echo "→ Redeploying with env vars..."
$VERCEL --prod

echo "✓ Done. API endpoint: https://<your-project>.vercel.app/api/chat"
