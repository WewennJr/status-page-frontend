# Status Page — Frontend

Vue 3 + Vite frontend for a self-hosted status page. It renders the public
status page (uptime, response charts, incidents), the first-run setup, the login
page and the admin panel (dashboard, sites, incidents, settings).

- **Stack**: Vue 3 (`<script setup>` + TypeScript), Vite, Pinia, Vue Router
- **Routing**: `/` (public), `/setup`, `/login`, `/admin`
- **i18n**: French / English, light / dark / system themes
- **API**: all requests go to `/api`, proxied to the backend on port 8002

## Requirements

- Node.js `^22.18.0` or `>=24.12.0`
- The backend running on `http://127.0.0.1:8002` (see the backend repository)

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173 (proxies /api -> 127.0.0.1:8002)
```

First run redirects to `/setup` to create the admin account.

## Scripts

| Command             | Description                                  |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Dev server with hot reload (port 5173)       |
| `npm run build`     | Type-check + production build into `dist/`   |
| `npm run preview`   | Serve `dist/` locally (port 4173) with proxy |
| `npm run type-check`| `vue-tsc` type checking only                 |
| `npm run build-only`| Vite build without type checking             |

`dev` and `preview` both proxy `/api` to `http://127.0.0.1:8002` (see
`vite.config.ts`). In production, nginx serves `dist/` and proxies `/api/` to the
backend, so the app always uses same-origin relative URLs.

## Features

- **Public page**: global banner, status badges, grouped monitors, uptime bars,
  response-time chart (1/7/30/90 days), active and resolved incidents,
  20-second auto-refresh, dynamic title / favicon / accent colors from settings.
- **Admin dashboard**: stat cards (sites, uptime, response time, incidents),
  30-day uptime bars, 24 h response chart and live per-site status.
- **Sites**: grouped by category, inline create/edit, per-group “+” quick add,
  drag & drop reordering (including moving between groups), persisted through
  the reorder endpoint.
- **Incidents**: create/edit incidents and add timeline updates.
- **Settings**: identity, appearance (colors, theme, language), behavior
  (retention, history window, default display options) and admin account
  (username/password).
- **UX**: FR/EN switch, light/dark/system theme, accessible modals (Escape,
  backdrop), reduced-motion support.

## Project layout

```
src/
  api/              # fetch client + API types
  assets/base.css   # design system (themes, layout, components)
  components/       # status badge, uptime bars, response chart, modal,
                    # header controls, admin tabs/forms
  i18n/             # minimal FR/EN dictionary
  router/           # routes and auth guard
  stores/           # Pinia app store (settings, theme, language)
  views/            # Status, Setup, Login, Admin
deploy/             # nginx config template (headers, CSP, API proxy)
public/             # static assets (favicon)
```

## Deployment

```bash
npm run build
# copy dist/ to the webroot, e.g. /var/www/status-page
```

Then use `deploy/nginx-status-page.conf` as an nginx site: it serves the SPA,
proxies `/api/` to `127.0.0.1:8002`, sets long-lived caching for `/assets/`, and
adds security headers plus a Content-Security-Policy.

## Security notes

- Vue escapes all rendered content; there is no `v-html` or `innerHTML` usage.
- `site_url` / `favicon_url` / `site_icon` are rendered only after server-side
  validation (`http(s)://`), and colors are validated as hex.
- Admin routes are guarded client-side and by the API session cookie
  (`HttpOnly`, `SameSite=Lax`); the template nginx config adds CSP as defense in
  depth.

---

Made with ♥ by WewennJr
