#!/usr/bin/env bash
# Goal command for BUG-4 (optimistic update). Exit 0 = spec met.
source "$(dirname "$0")/lib.sh"
need_jsdom
fresh_server
step "bug4 acceptance check (jsdom, real App.tsx)" npx tsx specs/checks/bug4.check.ts
step "smoke tests (npm test)" bash -c 'npm test >/dev/null 2>&1'
scope bug4 client/App.tsx
finish
