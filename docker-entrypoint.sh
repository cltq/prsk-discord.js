#!/bin/sh
set -e

bun run deploy || echo "[entrypoint] deploy failed, continuing"
exec bun run start
