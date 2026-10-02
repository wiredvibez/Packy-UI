# Packy

Private, single-user dashboard for Yair Tete — a Hebrew, mobile-first glance at every shipment, package, and delivery that’s on the way.

## Stack

Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS v4 · Neon Postgres · Drizzle ORM · npm · Node 24.

Auth is a passcode (no OAuth app). The Packy agent writes data over a key-authenticated HTTP API.

## Local dev

```bash
cp .env.example .env.local
# fill DATABASE_URL, PACKY_PASSCODE, PACKY_INGEST_KEY, SESSION_SECRET
npm install
npm run db:migrate
PACKY_SEED=1 npm run db:seed   # optional fake data, never in production
npm run dev
```

Open http://localhost:3000 and sign in with `PACKY_PASSCODE`.

Scripts:

| script | what it does |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | migrate (if `DATABASE_URL` is set) then `next build` |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (ingest auth + upsert + validation) |
| `npm run db:generate` | drizzle-kit generate |
| `npm run db:migrate` | apply committed migrations (requires `DATABASE_URL`) |
| `npm run db:seed` | local fake data only (`PACKY_SEED=1`) |

## Environment variables

| name | required | purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes (runtime) | Neon pooled connection string, injected by the Vercel Marketplace |
| `DATABASE_URL_UNPOOLED` | no | Direct Neon URL. Migrations use it when present, otherwise `DATABASE_URL` |
| `PACKY_INGEST_KEY` | yes (agent) | Shared secret; send as `x-packy-key` |
| `PACKY_PASSCODE` | yes (UI) | Yair’s login code. Hashed then compared timing-safe |
| `SESSION_SECRET` | yes (UI) | ≥16 chars. Signs the `packy_session` httpOnly cookie |
| `NEXT_PUBLIC_APP_URL` | no | Canonical URL for metadata |
| `SKIP_DB_MIGRATE` | no | Set `1` to skip migrations during `next build` |

See `.env.example`. Never commit real values.

## Auth

Default (and only) login is a passcode. There is no Google OAuth setup.

1. Yair posts the passcode to `POST /api/auth/login`.
2. The server hashes both the input and `PACKY_PASSCODE` with SHA-256 and compares them with `crypto.timingSafeEqual`.
3. Login is rate-limited to 5 attempts / 15 minutes per IP (in-memory; best-effort across serverless instances).
4. Success sets an httpOnly, `SameSite=Lax`, signed JWT cookie (`packy_session`) via [`jose`](https://github.com/panva/jose). Valid 30 days.

`proxy.ts` is the Next.js 16 request guard (renamed from `middleware.ts`). It:

- leaves `/login`, `/api/auth/login`, and `/api/health` public
- requires a valid session cookie on every page
- requires a session **or** `x-packy-key` on `GET /api/shipments*`

Write APIs (`POST`/`PATCH` shipments, events, archive) accept **only** `x-packy-key`. The dashboard mutates data through server actions after a session check.

## Vercel + Neon

1. Import `wiredvibez/Packy-UI` into Vercel (GitHub auto-deploy from `main`).
2. In the Vercel project, add **Neon** from the Marketplace. That injects `DATABASE_URL`.
3. Add the three secrets: `PACKY_PASSCODE`, `PACKY_INGEST_KEY`, `SESSION_SECRET` (Production + Preview).
4. Deploy. `npm run build` runs `tsx scripts/migrate.ts` first. That applies `drizzle/` with Drizzle’s Neon HTTP migrator. It uses `DATABASE_URL_UNPOOLED` when Neon injected it, otherwise `DATABASE_URL`. If neither is set (first deploy before the Marketplace integration), it logs a skip and the build continues. Redeploy once Neon is connected.
5. Optional one-time local migrate: `vercel env pull .env.local` then `npm run db:migrate`.

To skip migrate on a specific build, set `SKIP_DB_MIGRATE=1`.

## Agent API

The Packy agent reads Gmail / carrier pages and upserts here. Contract, filters, and curl examples: [`docs/API.md`](docs/API.md).

Stable `externalKey` values (merchant+order or carrier+tracking) keep repeated runs from duplicating rows.

## Project layout

```
app/            pages + route handlers
components/     Hebrew UI
lib/auth/       passcode, session, ingest key
lib/db/         Drizzle client + schema
lib/shipments/  upsert, grouping, serialize
drizzle/        committed SQL migrations
docs/API.md     agent contract
scripts/        migrate + local seed
```
