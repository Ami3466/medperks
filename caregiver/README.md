# Care Companion

Expo app for medication adherence across iOS, Android, and web. The app is local-first
and can run offline, but when `EXPO_PUBLIC_API_URL` is set it syncs state, uploads dose
clips, and asks the self-hosted API to verify clips with Gemini.

## Local Development

```bash
npm install
npm start
```

Press `w` for web, or scan the QR with Expo Go.

## Web App Container

```bash
docker build -t care-companion-web .
docker run -p 8080:80 \
  -e EXPO_PUBLIC_API_URL="https://api.your-domain.com" \
  care-companion-web
```

The container writes `/env.js` at startup, so the same image works on Coolify, Render,
Fly, Railway, or any Docker host without rebuilding for each environment.

## Full Stack With Compose

From the repository root:

```bash
cp .env.example .env
docker compose up --build
```

Services:

- web: http://localhost:8080
- API: http://localhost:3000
- Postgres: internal `db` service

## Coolify

Recommended setup:

- App 1: API
  - Root directory: `api`
  - Dockerfile: `api/Dockerfile`
  - Port: `3000`
  - Env: `DATABASE_URL`, `PUBLIC_BASE_URL`, `WEB_ORIGIN`, `GEMINI_API_KEY`, Stripe vars
- App 2: Web
  - Root directory: `caregiver`
  - Dockerfile: `caregiver/Dockerfile`
  - Port: `80`
  - Env: `EXPO_PUBLIC_API_URL`
- Database: Coolify Postgres, connected to the API via `DATABASE_URL`

## Mobile Builds

```bash
npm i -g eas-cli
eas login
eas build -p android --profile preview
eas build -p ios --profile preview
```

For production:

```bash
eas build -p android --profile production
eas build -p ios --profile production
```

Set these public EAS/GitHub secrets:

- `EXPO_PUBLIC_API_URL`

Server-only secrets belong only in the API service:

- `GEMINI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## GitHub Actions

At the repository root:

- `.github/workflows/ci.yml` checks API + app and builds both Docker images.
- `.github/workflows/eas-build.yml` manually builds Android/iOS through EAS.

## Current Behavior

- Without `EXPO_PUBLIC_API_URL`: app stays fully local/offline; recordings are flagged for caregiver review.
- With `EXPO_PUBLIC_API_URL`: state/doses sync to the API; dose clips upload; Gemini can confirm or flag.
- If Gemini is not configured on the API, recordings are kept as `flagged`.
