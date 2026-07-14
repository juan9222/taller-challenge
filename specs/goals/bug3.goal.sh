#!/usr/bin/env bash
# Goal command for BUG-3 (timezone display). Exit 0 = spec met. No server needed.
source "$(dirname "$0")/lib.sh"
step "bug3 acceptance check (TZ=America/New_York)" bash -c 'TZ=America/New_York npx tsx specs/checks/bug3.check.ts'
step "bug3 acceptance check (TZ=Asia/Tokyo)" bash -c 'TZ=Asia/Tokyo npx tsx specs/checks/bug3.check.ts'
scope bug3 client/api.ts
finish
