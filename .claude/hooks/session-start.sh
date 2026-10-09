#!/bin/bash
# Prepare HyperFrames rendering in Claude Code cloud sessions.
set -euo pipefail
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
cd "$CLAUDE_PROJECT_DIR/video"
npx --yes hyperframes@0.8.143 browser ensure >/dev/null 2>&1 || echo "hyperframes: Chrome download failed; run 'npx hyperframes browser ensure' in video/" >&2
