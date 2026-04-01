# Wirye Concierge Monorepo

Phase 1 foundation for the Wirye Militopia Hotel concierge kiosk platform.

## Stack

- API: FastAPI + Alembic + PostgreSQL + Redis
- Web: Next.js App Router
- Infra: Docker Compose + NGINX reverse proxy

## Quick Start

1. Copy environment file:

```bash
cp .env.example .env
```

2. Start services:

```bash
docker compose up -d --build
```

3. Check health:

- Public API: `http://localhost/api/v1/public/health`
- Public Home: `http://localhost/api/v1/public/hotels/HOTEL_WIRYE_MILITOPIA_001/home`
- Admin API: `http://localhost/api/v1/admin/health`
- Internal API: `http://localhost/api/v1/internal/health`
- Web kiosk: `http://localhost/`
- Web admin: `http://localhost/admin`

## Services

- `nginx`: exposed at 80/443, reverse proxy
- `web`: Next.js app on 3000 (internal)
- `api`: FastAPI app on 8000 (internal)
- `postgres`: PostGIS on 5432
- `redis`: Redis on 6379

## Alembic

Run migration in container:

```bash
docker compose exec api alembic upgrade head
```

## Import (JSON)

```bash
docker compose exec api python -m app.tasks.import_dataset --file /app/data/imports/wirye_militopia_concierge_data_v2.json
```

## Phase 1 Scope

- Monorepo directory scaffold
- API health routes (public/admin/internal)
- Next.js kiosk/admin starter pages
- Docker Compose, NGINX, environment template
- Backup/deploy/rollback script placeholders

## Current API Coverage

- Public:
  - `/api/v1/public/health`
  - `/api/v1/public/hotels/{hotel_id}/home`
  - `/api/v1/public/hotels/{hotel_id}/dining`
  - `/api/v1/public/hotels/{hotel_id}/facilities`
  - `/api/v1/public/hotels/{hotel_id}/services`
  - `/api/v1/public/hotels/{hotel_id}/transport`
  - `/api/v1/public/hotels/{hotel_id}/nearby-places`
  - `/api/v1/public/hotels/{hotel_id}/nearby-places/{place_id}`
  - `/api/v1/public/hotels/{hotel_id}/routes/{place_id}`
  - `/api/v1/public/hotels/{hotel_id}/emergency`
  - `/api/v1/public/hotels/{hotel_id}/notices`
  - `/api/v1/public/hotels/{hotel_id}/faq/search`
  - `/api/v1/public/hotels/{hotel_id}/snapshot`

## Concierge Web APIs (Next.js)

- `/api/concierge/chat` (POST): Gemini/Fallback 답변 + intent + suggestions + handoff 상태
- `/api/concierge/inbox` (GET/POST): 핸드오프 운영 인박스 조회/생성
- `/api/concierge/inbox/{id}` (PATCH): 인박스 상태/담당자/태그/내부메모 업데이트
- Admin:
  - `/api/v1/admin/auth/login`
  - `/api/v1/admin/me`
  - `/api/v1/admin/hotels/{hotel_id}` (GET/PATCH)
  - `/api/v1/admin/nearby-places` (GET/POST)
  - `/api/v1/admin/nearby-places/{place_id}` (PATCH)
  - `/api/v1/admin/conflicts` (GET)
  - `/api/v1/admin/conflicts/{conflict_id}/resolve` (PATCH)
  - `/api/v1/admin/publish` (POST)
  - `/api/v1/admin/publish/versions` (GET)
  - `/api/v1/admin/imports` (GET/POST upload)
  - `/api/v1/admin/devices` (GET)
  - `/api/v1/admin/audit-logs` (GET)

## Android Kiosk Shell (Scaffold)

- Path: `apps/android-kiosk`
- Included:
  - `MainActivity` with WebView, immersive mode, lock task hook
  - `BootReceiver` for auto-launch after reboot
  - `KioskWebViewClient` for domain restrictions
  - `HeartbeatWorker` placeholder
  - Gradle and manifest baseline for dedicated kiosk app development
