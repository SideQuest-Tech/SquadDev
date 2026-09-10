# CI/CD — GitHub Actions + Cloudflare Pages

## Branch → Environment Map

| Branch | Environment | URL |
|--------|-------------|-----|
| `feature/*` | Local only | — |
| `dev` | Test | Cloudflare preview URL |
| `test` | Staging | staging.sidequesttech.co.za |
| `main` | Production | sidequesttech.co.za |

**Revert on staging:** Re-push `dev` to `test`. Cloudflare Pages overwrites with no manual steps.

---

## Required GitHub Secrets

Set these in GitHub → Settings → Secrets and Variables → Actions:

| Secret | Where to get it |
|--------|----------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare dashboard → API Tokens → Create (Pages:Edit permission) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → right sidebar |
| `CLOUDFLARE_PROJECT_NAME` | Your Cloudflare Pages project name (e.g. `sidequest-tech`) |
| `TEST_API_URL` | Base URL for test Cloudflare Pages deploy |
| `STAGING_URL` | `https://staging.sidequesttech.co.za` |
| `TEST_USER_EMAIL` | Playwright test account email |
| `TEST_USER_PASSWORD` | Playwright test account password |

---

## Cloudflare Pages — How Deployment Works

- Build command: `npm run build`
- Output directory: `dist`
- Functions directory: `functions/` (Cloudflare Pages Functions — Workers runtime)
- Environment variables: set per-environment in Cloudflare Pages dashboard (not in wrangler.toml for Pages)

The `wrangler.toml` at project root configures the project name and compatibility settings.

---

## Workflow Files

### `.github/workflows/deploy-test.yml` — fires on push to `dev`

Builds, runs unit tests, deploys to Cloudflare Pages preview branch `dev`.

### `.github/workflows/deploy-staging.yml` — fires on push to `test`

Builds, runs unit tests, deploys to `test` branch (staging alias), then runs full Playwright suite.

### `.github/workflows/deploy-prod.yml` — fires on merge/push to `main`

Builds, runs unit tests, runs smoke tests against staging URL, deploys to production,
then runs Lighthouse CI.

---

## Cloudflare Pages Functions (API Layer)

When migrating API routes from `api/` (Vercel) to `functions/` (Cloudflare):

**File → route mapping:**
```
functions/api/login.js          →  /api/login
functions/api/clients.js        →  /api/clients
functions/api/[id].js           →  /api/:id  (dynamic)
```

**Function signature (replaces Vercel `handler(req, res)`):**
```js
// functions/api/login.js
export async function onRequestPost({ request, env }) {
  const traceId = request.headers.get('X-Trace-Id') ?? crypto.randomUUID()

  try {
    const body = await request.json()
    // env.UPSTASH_REDIS_REST_URL, env.JWT_SECRET etc. from Cloudflare dashboard
    const result = await handleLogin(body, env)

    return Response.json(result, {
      status: 200,
      headers: {
        'X-Trace-Id': traceId,
        'Access-Control-Allow-Origin': 'https://sidequesttech.co.za',
      },
    })
  } catch (err) {
    return Response.json({ ok: false, error: 'Login failed' }, { status: 500 })
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://sidequesttech.co.za',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Trace-Id',
    },
  })
}
```

**Key differences from Vercel:**
- `env` object replaces `process.env`
- Return `Response` / `Response.json()` — no `res.status().json()`
- CORS headers must be set manually on each response
- Workers runtime: no Node.js APIs (`fs`, `path`, `crypto` module is Web Crypto)
- `crypto.randomUUID()` works natively (Web Crypto)

---

## `wrangler.toml`

```toml
name = "sidequest-tech"
compatibility_date = "2024-01-01"
pages_build_output_dir = "dist"
```

---

## Monitoring Post-Deploy

After production deploys confirm in order:
1. Cloudflare Pages dashboard — deployment status green
2. UptimeRobot — HTTP monitor returns 200
3. Sentry — no new error spike in the 10 min post-deploy window
4. Cloudflare Web Analytics — traffic flowing to new deployment
