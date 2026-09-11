import * as Sentry from '@sentry/cloudflare'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis/cloudflare'

const LIMITS = {
  '/api/login':           { requests: 10, window: '15 m' },
  '/api/forgot-password': { requests: 5,  window: '60 m' },
  '/api/requests':        { requests: 10, window: '60 m' },
  '/api/send-email':      { requests: 10, window: '60 m' },
}

async function rateLimit(context) {
  const url = new URL(context.request.url)
  const cfg = LIMITS[url.pathname]

  if (!cfg || context.request.method === 'OPTIONS') return context.next()

  const redis = new Redis({ url: context.env.UPSTASH_REDIS_REST_URL, token: context.env.UPSTASH_REDIS_REST_TOKEN })
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(cfg.requests, cfg.window),
    prefix: '@rl',
    analytics: false,
  })

  const ip = context.request.headers.get('CF-Connecting-IP') ?? 'unknown'
  const { success, limit, remaining, reset } = await limiter.limit(`${url.pathname}:${ip}`)

  if (!success) {
    Sentry.metrics.count('rate_limit.blocked', 1, { tags: { path: url.pathname } })
    return Response.json(
      { ok: false, error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
        }
      }
    )
  }

  return context.next()
}

export const onRequest = [
  Sentry.sentryPagesPlugin((context) => ({
    dsn: context.env.SENTRY_DSN,
    environment: context.env.ENVIRONMENT ?? 'production',
    tracesSampleRate: 0.1,
    enabled: !!context.env.SENTRY_DSN,
  })),
  rateLimit,
]
