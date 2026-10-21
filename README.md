# Studio frontend

React + Vite console for [studio.karanparmar.in](https://studio.karanparmar.in).
Sign in with SSO, create AI products, mint API keys, and set the model links
(local PC gateways / VPS LLM gateway). Pattern matches `portfolio-frontend`.

## Quick start

```bash
npm ci
cp .env.example .env
npm run dev        # http://localhost:5174 (0.0.0.0, strict port)
```

Dev proxies: `/api/auth` → SSO backend on 8002, `/api/studio` → Studio API on 8001
(see `vite.config.ts`). In production Caddy does the same on `studio.karanparmar.in`.

## Apps

`apps/desktop` (Windows/Linux) and `apps/android` (floating bubble) are the Studio Flow
clients. See `apps/README.md`. `apps-ci.yml` runs the desktop tests; installers are built
on this PC with `apps/release.sh` and uploaded to Studio, which serves them from Garage.

## Build

```bash
npm run build      # tsc -b && vite build
```

`VITE_SSO_URL` is the only build-time variable; CI passes
`https://auth.karanparmar.in` as a Docker build-arg.

## Deploy

Push to `master` → type-check/build → GHCR image
`ghcr.io/karan-parmar-007/studio-frontend` → `docker compose up` of
`studio-frontend` only, in `/srv/docker/apps/studio` on the VPS.
