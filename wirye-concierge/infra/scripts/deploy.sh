#!/usr/bin/env sh
set -eu

echo "[deploy] pulling/building images..."
docker compose pull
docker compose up -d --build

echo "[deploy] applying migrations..."
docker compose exec api alembic upgrade head

echo "[deploy] done"
