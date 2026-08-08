# SideQuest Tech — Website

Business website and project intake platform for SideQuest Tech (Pty) Ltd.  
Hosted on Vercel at [sidequesttech.co.za](https://www.sidequesttech.co.za).

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

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com) |

> **Resend domain verification** — to send from `hello@sidequesttech.co.za`, the domain `sidequesttech.co.za` must be verified in your Resend account (Resend → Domains → Add domain → follow the DNS steps).

### Run locally

For frontend-only development:

```bash
npm run dev
```

This starts Vite with HMR. Open [http://localhost:5173](http://localhost:5173).

To run Vite and the `/api` serverless functions together:

```bash
npm run dev:vercel
```

This runs `vercel dev`. Open [http://localhost:3000](http://localhost:3000).

---

## Deployment

Push to the connected Vercel project. Vercel auto-builds from `main`.  
Set `RESEND_API_KEY` in the Vercel dashboard under **Settings → Environment Variables**.

---

## Admin access

| Field | Value |
|---|---|
| URL | `/` → Admin Login (nav) |
| Email | `admin@sidequesttech.co.za` |
| Password | `SideQuestTech2026` |

> Change the hardcoded credentials in `src/App.jsx` → `AdminLogin` before going live.

---

## Concepts section

The Concepts exhibition is part of the main homepage. Concept content is data-driven from `src/data/concepts.js`, and its optimized website previews live in `src/assets/concepts`.
