#!/usr/bin/env bash
# Goal command for BUG-2 (past slots listed). Exit 0 = spec met.
source "$(dirname "$0")/lib.sh"
fresh_server
step "bug2 acceptance check" npx tsx specs/checks/bug2.check.ts
step "smoke tests (npm test)" bash -c 'npm test >/dev/null 2>&1'
scope bug2 server/index.ts
finish
