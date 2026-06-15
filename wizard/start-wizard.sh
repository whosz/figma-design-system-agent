#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── .env.local setup ──────────────────────────────────────────────────────────
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo ""
  echo "  Created .env.local from .env.example."
  echo "  Fill in your keys before the wizard will fully work:"
  echo ""
  echo "    ANTHROPIC_API_KEY   — from https://console.anthropic.com/settings/keys"
  echo "    FIGMA_CLIENT_ID     — from https://www.figma.com/developers/apps"
  echo "    FIGMA_CLIENT_SECRET — same app"
  echo "    NEXTAUTH_SECRET     — run: openssl rand -base64 32"
  echo ""
  echo "  (ANTHROPIC_API_KEY is optional — users can bring their own key in Step 1)"
  echo ""
fi

# ── Dependencies ───────────────────────────────────────────────────────────────
if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

# ── Dev server ─────────────────────────────────────────────────────────────────
echo "Starting wizard — browser will open automatically at http://localhost:3000/wizard/1"

# Poll until the server responds, then open the browser
(until curl -sf http://localhost:3000 >/dev/null 2>&1; do sleep 0.5; done
 open "http://localhost:3000/wizard/1" 2>/dev/null || \
 xdg-open "http://localhost:3000/wizard/1" 2>/dev/null || true) &

npm run dev
