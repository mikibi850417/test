#!/usr/bin/env sh
set -eu

echo "[rollback] update image tags in .env or compose before running this script."
docker compose up -d
echo "[rollback] complete"
