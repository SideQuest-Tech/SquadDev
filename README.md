# SideQuest Tech — Platform

Full-stack business platform for SideQuest Tech (Pty) Ltd, hosted on Vercel at [sidequesttech.co.za](https://www.sidequesttech.co.za).

Includes a public marketing site, an internal admin CRM, and a client-facing project portal.

---

## Architecture overview

| Layer | Technology |
|---|---|
| Frontend | React + Vite (SPA, state-based routing) |
| Serverless API | Vercel Functions (`/api/*.js`) |
| Database | Upstash Redis (REST) |
| Auth | bcryptjs password hashing + JWT (7-day) |
| Email | Resend |
| Project management | ClickUp API v2 |
| Calendar / Meet | Google Calendar API (OAuth2) |

---

## Development setup

### Prerequisites

- Node.js 18+
- [Vercel CLI](https://vercel.com/docs/cli) — `npm i -g vercel`

### Install dependencies

```bash
npm install
```

### Environment variables

Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |
| `JWT_SECRET` | Random secret for signing client JWTs (min 32 chars) |
| `ADMIN_SECRET` | Shared secret for admin API calls (header `x-admin-secret`) |
| `VITE_ADMIN_SECRET` | Same value as `ADMIN_SECRET` — exposed to the frontend for admin dashboard API calls |
| `CLICKUP_API_TOKEN` | ClickUp personal API token |
| `CLICKUP_WORKSPACE_ID` | ClickUp workspace ID |
| `CLICKUP_SPACE_ID` | ClickUp space where client folders are auto-created on approval |
| `GOOGLE_CLIENT_ID` | Google OAuth2 client ID (for Google Meet creation) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth2 client secret |
| `GOOGLE_REFRESH_TOKEN` | Long-lived refresh token (generated once via `scripts/google-auth.js`) |
| `VITE_SENTRY_DSN` | Sentry DSN for frontend error and log capture (optional — Sentry is disabled if unset) |

> **Resend domain** — to send from `hello@sidequesttech.co.za`, verify the domain in Resend → Domains.
>
> **`VITE_` prefix** — Vite only exposes variables prefixed with `VITE_` to browser code. `ADMIN_SECRET` and `VITE_ADMIN_SECRET` must have the same value.

### Run locally

Always use `vercel dev` — this runs both Vite and the `/api` serverless functions together:

```bash
vercel dev
```

Open [http://localhost:3000](http://localhost:3000).

> Plain `npm run dev` starts Vite only and will not serve any `/api` routes.

### Build

```bash
npm run build      # Production build → dist/
npm run preview    # Preview the production build locally
```

### Tests

```bash
npm run test:unit  # Run unit tests once (Vitest)
npm test           # Run unit tests in watch mode
npm run test:e2e   # Run Playwright end-to-end tests
```

---

## One-time setup

### 1. Set admin credentials

Run this once to hash the admin password and store the record in Redis:

```bash
node --env-file=.env scripts/setup-admin.js admin@sidequesttech.co.za YourSecurePassword
```

This writes a `sidequest_admin` key to Redis with a bcrypt-hashed password. After running it, the hardcoded credentials are not used anywhere.

### 2. Set up Sentry (optional)

1. Create a project at [sentry.io](https://sentry.io) — select **React** as the platform
2. Copy the DSN from **Settings → Projects → [your project] → Client Keys**
3. Add it as `VITE_SENTRY_DSN` in your `.env` and in the Cloudflare Pages dashboard

In production, all `logger.info/warn/error` calls are sent to Sentry silently — nothing appears in the browser console. In development, logs print to the browser console only and Sentry is not used.

Configure three environments in the Sentry dashboard: `development`, `staging`, `production`.

### 3. Get a Google refresh token

Run this once to authorise Google Calendar access for auto-creating Google Meet links:

```bash
node --env-file=.env scripts/google-auth.js
```

Follow the browser prompt, then copy the printed `GOOGLE_REFRESH_TOKEN` value into your `.env` and Vercel environment variables.

---

## Deployment

Push to `main`. Vercel auto-builds from the connected project.

Add all environment variables listed above under **Settings → Environment Variables** in the Vercel dashboard.

---

## Login

There is a single **Login** button in the site navbar. It routes to a unified login page at `/` (view: `login`). The system detects the account type from the credentials and routes accordingly:

- **Admin credentials** → Admin CRM dashboard
- **Client credentials** → Client project portal (first login triggers a forced password change)

Admin credentials are stored in Redis (set via `scripts/setup-admin.js`). Client credentials are created automatically when a client request is approved via the admin CRM.

---

## Admin CRM (`/api` + `src/components/AdminDashboard.jsx`)

Accessible to admins only. Protected via `x-admin-secret` header on all API calls.

### Views

| View | Description |
|---|---|
| Overview | Summary stats and recent activity |
| Project Requests | Intake pipeline — all submitted requests |
| Pipeline | Kanban board by request status |
| Analytics | Conversion, budget and urgency breakdowns |
| Clients | All approved clients — activate, deactivate, add projects |
| Projects | Status tracking across all client projects (In Progress / Paused / Cancelled / Completed) |
| Meetings | Incoming and outgoing meeting requests with Google Meet links |

### Approving a client request

1. Open a request in the Project Requests view
2. Click **Approve request**
3. Confirm the company name and project name
4. The system automatically:
   - Creates a ClickUp folder for the company (or reuses an existing one)
   - Creates a ClickUp list for the project
   - Generates a temporary password (`SQT-Xxxxxx` format)
   - Writes the client record to Redis
   - Sends a welcome email via Resend with login credentials

---

## Client portal (`src/components/ClientDashboard/`)

Accessible to approved clients only. Protected via JWT stored in `localStorage`.

### Features

| Feature | Description |
|---|---|
| Project switcher | Switch between multiple active projects |
| Task board | Kanban view of ClickUp tasks (read-only) |
| Task list | Flat list view of tasks |
| Chat | Per-task comment thread with image attachments, real-time polling |
| Meetings | Request meetings, accept admin-proposed times, view Google Meet links, add to calendar |
| Account | Change password |

### Project states

| Status | Client experience |
|---|---|
| `in_progress` | Full board and chat access |
| `paused` | Board visible with pause reason banner; chat disabled |
| `cancelled` / `completed` | Static status card; no ClickUp data fetched |

---

## API routes

All routes live in `/api/*.js` as Vercel serverless functions.

| Route | Auth | Description |
|---|---|---|
| `POST /api/login` | None | Unified login — checks admin then client, returns role + JWT |
| `POST /api/change-password` | JWT | First-login forced password change |
| `GET /api/client-projects` | JWT | Returns all projects for the authenticated client |
| `GET/POST /api/clickup-proxy` | JWT | Proxies scoped ClickUp API calls (tasks, comments, attachments) |
| `GET/POST /api/meetings` | JWT or admin secret | Fetch or create meeting requests |
| `POST /api/meetings-respond` | Admin secret | Accept or decline a meeting; on accept creates Google Calendar event + Meet link |
| `POST /api/admin-approve` | Admin secret | Approve a client request, provision ClickUp structure, send welcome email |
| `GET/POST /api/clients` | Admin secret | List clients; deactivate, remove, or add a project to a client |
| `GET/POST /api/projects` | Admin secret | List or update project statuses |
| `POST /api/requests` | None | Submit a public project intake request |
| `POST /api/send-email` | None | Send notification email for a new intake request |

---

## Redis data schema

Keys follow a flat-key pattern (no key scanning — Upstash free tier compatible).

| Key | Type | Description |
|---|---|---|
| `sidequest_admin` | Object | Admin account with bcrypt-hashed password |
| `client:{email}` | Object | Client account record |
| `approved_clients` | Array | List of all approved client emails |
| `project:{listId}` | Object | Project record linked to a ClickUp list |
| `client_projects:{email}` | Array | List IDs for a client's projects |
| `meeting:{id}` | Object | Meeting request record |
| `all_meetings` | Array | All meeting IDs (admin index) |
| `client_meetings:{email}` | Array | Meeting IDs for a specific client |

---

## Concepts section

The Concepts showcase is part of the main homepage. Content is data-driven from `src/data/concepts.js` and optimized previews live in `src/assets/concepts`.

---

## Custom cursor

The custom cursor (target-style, desktop only) can be toggled with **Alt+C**. The preference is saved to `localStorage`. A brief toast confirms the change.
