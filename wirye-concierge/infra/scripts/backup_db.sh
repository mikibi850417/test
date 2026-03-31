#!/usr/bin/env sh
set -eu

TS="$(date +%Y%m%d_%H%M%S)"
OUT_DIR="${1:-/app/data/backups}"
FILE="${OUT_DIR}/wirye_kiosk_${TS}.sql"

mkdir -p "$OUT_DIR"
pg_dump -h "${POSTGRES_HOST:-postgres}" -p "${POSTGRES_PORT:-5432}" -U "${POSTGRES_USER:-wirye_app}" "${POSTGRES_DB:-wirye_kiosk}" > "$FILE"
echo "Backup written: $FILE"
