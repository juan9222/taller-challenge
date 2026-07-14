#!/usr/bin/env bash
# Goal command for BUG-6B (email validation). Exit 0 = spec met.
source "$(dirname "$0")/lib.sh"
fresh_server
step "bug6b acceptance check" npx tsx specs/checks/bug6b.check.ts
step "smoke tests (npm test)" bash -c 'npm test >/dev/null 2>&1'
scope bug6b server/index.ts
finish
