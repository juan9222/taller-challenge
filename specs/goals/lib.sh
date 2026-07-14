#!/usr/bin/env bash
# Shared helpers for goal commands. A goal script exits 0 iff every
# acceptance criterion of its spec passes — it is the loop's stop condition.
set -u
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO"
FAIL=0

step() { # step "<label>" <command...>
  local label="$1"; shift
  if "$@"; then echo "PASS goal: $label"; else echo "FAIL goal: $label"; FAIL=1; fi
}

fresh_server() {
  pkill -f "tsx server/index.ts" 2>/dev/null
  sleep 0.5
  (npx tsx server/index.ts >/dev/null 2>&1 &)
  sleep 1.2
}

need_jsdom() {
  [ -d node_modules/jsdom ] || npm i --no-save jsdom >/dev/null 2>&1
}

# scope <bug-id> <allowed-file>...
# Fails if the worktree diff vs HEAD touches files that are neither allowed
# for this bug nor already dirty when this goal first ran (baseline snapshot,
# so pre-existing uncommitted work doesn't trip the guard).
scope() {
  local id="$1"; shift
  local base="specs/goals/.baseline-$id"
  [ -f "$base" ] || git diff --name-only HEAD > "$base"
  local bad=""
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    grep -qxF "$f" "$base" 2>/dev/null && continue
    local ok=""
    for a in "$@"; do [ "$f" = "$a" ] && ok=1; done
    [ -z "$ok" ] && bad="$bad $f"
  done < <(git diff --name-only HEAD)
  if [ -n "$bad" ]; then
    echo "FAIL goal: out-of-scope changes in:$bad (allowed: $*)"
    FAIL=1
  else
    echo "PASS goal: diff confined to allowed files ($*)"
  fi
}

finish() {
  if [ "$FAIL" -eq 0 ]; then echo "GOAL MET — all acceptance criteria pass"; else echo "GOAL NOT MET"; fi
  exit $FAIL
}
