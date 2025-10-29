#!/usr/bin/env bash
set -euo pipefail

APP="${1:-aiprc-sim}"

if ! command -v fly >/dev/null 2>&1; then
  echo "flyctl not found. Install with: brew install flyctl"
  exit 1
fi

echo "Target Fly app: ${APP}"

read -r -s -p "Enter Gemini API key (VITE_GEMINI_API_KEY) or leave blank: " VITE_GEMINI_API_KEY; echo
read -r -s -p "Enter OpenRouter API key (VITE_OPENROUTER_API_KEY) or leave blank: " VITE_OPENROUTER_API_KEY; echo

CMD=(fly deploy -a "${APP}")
if [[ -n "${VITE_GEMINI_API_KEY}" ]]; then
  CMD+=(--build-arg "VITE_GEMINI_API_KEY=${VITE_GEMINI_API_KEY}")
fi
if [[ -n "${VITE_OPENROUTER_API_KEY}" ]]; then
  CMD+=(--build-arg "VITE_OPENROUTER_API_KEY=${VITE_OPENROUTER_API_KEY}")
fi

echo "Deploying with client-embedded keys (suitable for demos; consider adding a server proxy for production)."
"${CMD[@]}"

echo "\nDone. Visit: https://${APP}.fly.dev/"
