#!/usr/bin/env bash
# Goal command for BUG-6A (double submit). Exit 0 = spec met.
source "$(dirname "$0")/lib.sh"
need_jsdom
fresh_server
step "bug6a acceptance check (jsdom, real App.tsx)" npx tsx specs/checks/bug6a.check.ts
step "smoke tests (npm test)" bash -c 'npm test >/dev/null 2>&1'
scope bug6a client/App.tsx
finish
