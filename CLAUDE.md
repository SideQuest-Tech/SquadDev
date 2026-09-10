# SideQuest Tech — AI Context

This file is read by Claude Code on every session. Follow everything here without being asked.
Detailed docs live in `.claude/docs/`.

---

## Stack

- **Frontend:** Vite 6 + React 19 + TypeScript — source in `src/`
- **API:** Cloudflare Pages Functions — source in `functions/` (migrating from `api/` Vercel format)
- **Database:** Upstash Redis (REST via `@upstash/redis`)
- **Hosting:** Cloudflare Pages (frontend + functions)
- **Auth:** JWT (HS256), validated in each function handler
- **Email:** SendGrid
- **Key integrations:** ClickUp (project tracking), Upstash Redis (data store)

## Project Overview

SideQuest Tech is an agency website + client portal. The public site lets prospective clients
submit project requests. The portal gives existing clients visibility into their active projects,
meetings, and billing. Admins manage all clients and requests through a CRM dashboard.

## File Structure

```
/
├── src/
│   ├── App.tsx                  # Root: routing between site/login/dashboard views
│   ├── components/
│   │   ├── ui/                  # Reusable shadcn-style primitives
│   │   ├── AdminDashboard/      # Admin CRM view
│   │   ├── ClientDashboard/     # Client portal view
│   │   └── ...                  # Feature components
│   ├── styles.css               # All styles — NO inline styles
│   ├── tailwind.css             # Tailwind utilities only
│   └── data.ts                  # Static content + types
├── api/                         # Current Vercel serverless functions (being migrated)
├── functions/                   # Cloudflare Pages Functions (migration target)
├── public/                      # Static assets copied to dist/
├── e2e/                         # Playwright integration tests
├── .github/workflows/           # CI/CD — see .claude/docs/ci-cd.md
└── CLAUDE.md                    # This file
```

## Non-Negotiable Rules

### Code
- **Components over raw markup** — extract anything used more than once into `src/components/`
- **CSS stylesheets over inline styles** — all styles go in `src/styles.css` or a component `.css` file; never `style={{}}` in JSX
- **No `console.log`** — use structured logging (see `.claude/docs/logging.md`)
- **No `any` in TypeScript** — use proper types or `unknown` with a type guard
- **No abstractions before 3 uses** — duplicate twice, abstract on the third
- **Validate all external input** at the function boundary — reject before touching business logic
- **Never log secrets** — scrub passwords, tokens, and keys before any log call

### Architecture
- **One responsibility per component/function** — if you need to scroll to understand what it does, split it
- **Pure functions for business logic** — no side effects, no shared mutable state
- **Inject dependencies** — don't instantiate services inside business logic; pass them in
- **Immutable types** — `readonly` arrays and objects, `as const` for static data

### Design (read `.claude/docs/design.md` before any UI work)
- Minimalistic dark theme — `var(--bg)` base, single blue accent `var(--blue)`
- Human, rounded typography — DM Sans body, Manrope headings — never technical/cold
- Less text, more visual — concise labels, icons to guide, no AI bloat copy
- Every UI decision must answer: "would a non-technical person understand this immediately?"

## What to Avoid

- Do not add features beyond what the task requires
- Do not add error handling for scenarios that cannot happen
- Do not use Vercel-specific APIs in new code — target Cloudflare Pages Functions
- Do not commit `.env` files — use GitHub Secrets in CI and Cloudflare dashboard env vars
- Do not add comments explaining WHAT code does — only WHY if non-obvious
- Do not use `position: relative; z-index: N` on sections without a documented reason

## Related Docs

| Topic | File |
|-------|------|
| Design system & principles | `.claude/docs/design.md` |
| Logging standards | `.claude/docs/logging.md` |
| Testing standards | `.claude/docs/testing.md` |
| CI/CD + Cloudflare deployment | `.claude/docs/ci-cd.md` |
