#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

mkdir -p "$ROOT/mobile/public/game/js"
cp "$ROOT/game/assets/js/binary.js" "$ROOT/mobile/public/game/js/binary.js"
cp "$ROOT/game/assets/js/custom.js" "$ROOT/mobile/public/game/js/custom.js"
cp "$ROOT/game/assets/js/loader.js" "$ROOT/mobile/public/game/js/loader.js"

echo "Synced game assets to mobile/public/game/"
