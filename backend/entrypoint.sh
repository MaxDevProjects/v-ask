#!/bin/sh
set -eu

# Ensure SQLite volume is writable for the non-root user.
# Named volumes are typically root-owned at first run.
if [ "$(id -u)" = "0" ]; then
  mkdir -p /app/data
  chown -R appuser:appgroup /app/data
  exec su-exec appuser:appgroup node dist/index.js
fi

exec node dist/index.js

