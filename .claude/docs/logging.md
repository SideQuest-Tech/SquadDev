# Logging Standards

## Rule Zero

**Never use `console.log`, `console.warn`, or `console.error` directly.**
Use the structured helpers below. Unstructured logs are unsearchable in production.

---

## Log Shape

Every log entry must include these fields:

```json
{
  "timestamp": "2026-09-10T10:00:00.000Z",
  "level": "info",
  "service": "sidequest-frontend",
  "traceId": "a1b2c3d4-...",
  "message": "User authenticated",
  "context": {
    "userId": "usr_abc123",
    "requestId": "req_xyz789"
  }
}
```

`traceId` flows from the frontend request through every Cloudflare Function call via the
`X-Trace-Id` header. Generate once per user action; forward on every downstream fetch.

---

## Frontend (Vite + React)

This is a client-side SPA — no Node.js server. Frontend logging is split:

### Errors → Sentry
```ts
// src/lib/sentry.ts
import * as Sentry from '@sentry/react'

export function captureError(err: unknown, context?: Record<string, unknown>) {
  Sentry.captureException(err, { extra: context })
}
```

Use in catch blocks and error boundaries:
```ts
try {
  await submitRequest(data)
} catch (err) {
  captureError(err, { traceId, action: 'submit-request' })
  // show user-facing error message
}
```

### Structured dev logs → custom logger
```ts
// src/lib/logger.ts
type Level = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: Level
  message: string
  traceId?: string
  context?: Record<string, unknown>
}

const isDev = import.meta.env.DEV

export const logger = {
  info:  (message: string, ctx?: LogEntry['context']) => log('info', message, ctx),
  warn:  (message: string, ctx?: LogEntry['context']) => log('warn', message, ctx),
  error: (message: string, ctx?: LogEntry['context']) => log('error', message, ctx),
  debug: (message: string, ctx?: LogEntry['context']) => { if (isDev) log('debug', message, ctx) },
}

function log(level: Level, message: string, context?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    message,
    context,
  }
  // In production only errors go to console (Sentry captures them anyway)
  if (isDev || level === 'error') {
    // eslint-disable-next-line no-console
    console[level](JSON.stringify(entry))
  }
}
```

Usage:
```ts
import { logger } from '@/lib/logger'

logger.info('Project request submitted', { projectType, budget })
logger.warn('ClickUp sync delayed', { clientId, retryCount })
logger.error('Login failed', { email: '[redacted]', reason: err.message })
```

---

## Cloudflare Pages Functions (API Layer)

Functions are V8 Workers — no Node.js. Use structured `console.log` with JSON shape.
Logs appear in Cloudflare dashboard → Pages → Functions → Logs.

```js
// functions/_shared/logger.js
export function createLogger(service, traceId) {
  const base = { service, traceId, timestamp: new Date().toISOString() }

  return {
    info:  (message, context = {}) => console.log(JSON.stringify({ ...base, level: 'info',  message, context })),
    warn:  (message, context = {}) => console.warn(JSON.stringify({ ...base, level: 'warn',  message, context })),
    error: (message, context = {}) => console.error(JSON.stringify({ ...base, level: 'error', message, context })),
  }
}
```

Usage in a function:
```js
// functions/api/login.js
import { createLogger } from '../_shared/logger.js'

export async function onRequestPost({ request, env }) {
  const traceId = request.headers.get('X-Trace-Id') ?? crypto.randomUUID()
  const log = createLogger('fn-login', traceId)

  try {
    const { email } = await request.json()
    log.info('Login attempt', { email: '[redacted]' })
    // ...
    log.info('Login success', { role: 'client' })
    return Response.json({ ok: true }, {
      headers: { 'X-Trace-Id': traceId }
    })
  } catch (err) {
    log.error('Login failed', { message: err.message })
    return Response.json({ ok: false, error: 'Login failed' }, { status: 500 })
  }
}
```

---

## What to Never Log

- Passwords, password hashes
- JWT tokens or session tokens
- Full credit card numbers
- Raw Redis keys containing user IDs combined with sensitive data
- Full request bodies if they may contain the above

Scrub before logging:
```ts
// Bad
logger.error('Login failed', { body: req.body })

// Good
logger.error('Login failed', { email: '[redacted]', reason: err.message })
```

---

## Sentry Setup (when adding)

```bash
npm install @sentry/react
```

```ts
// src/main.tsx — before rendering
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
})
```

Configure three environments in Sentry dashboard: `development`, `staging`, `production`.
Set alerts: New Issue, Regression, Error Volume Spike > 10 in 5 min.
