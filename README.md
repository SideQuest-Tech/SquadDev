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
| `VITE_SHOW_PORTFOLIO` | Set to `true` to show the portfolio section. Defaults to hidden. |
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com) |

> **Resend domain verification** — to send from `hello@sidequesttech.co.za`, the domain `sidequesttech.co.za` must be verified in your Resend account (Resend → Domains → Add domain → follow the DNS steps).

### Run locally

```bash
npm run dev
```

This runs `vercel dev`, which starts Vite (with HMR) **and** the `/api` serverless functions together — no separate server needed. Open [http://localhost:3000](http://localhost:3000).

---

## Deployment

Push to the connected Vercel project. Vercel auto-builds from `main`.  
Set `RESEND_API_KEY` and `VITE_SHOW_PORTFOLIO` in the Vercel dashboard under **Settings → Environment Variables**.

---

## Admin access

| Field | Value |
|---|---|
| URL | `/` → Admin Login (nav) |
| Email | `admin@sidequesttech.co.za` |
| Password | `SideQuestTech2026` |

> Change the hardcoded credentials in `src/App.jsx` → `AdminLogin` before going live.

---

## Portfolio section

Hidden by default. Set `VITE_SHOW_PORTFOLIO=true` (locally in `.env`, or in the Vercel dashboard) to enable it. When hidden, the section, navbar link, and footer link are all removed — it cannot be reached from any part of the site.
