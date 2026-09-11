import * as Sentry from '@sentry/cloudflare'

export const onRequest = Sentry.sentryPagesPlugin((context) => ({
  dsn: context.env.SENTRY_DSN,
  environment: context.env.ENVIRONMENT ?? 'production',
  tracesSampleRate: 0.1,
  enabled: !!context.env.SENTRY_DSN,
}))
