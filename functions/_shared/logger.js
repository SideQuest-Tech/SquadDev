import * as Sentry from '@sentry/cloudflare'

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 }

function emit(level, service, traceId, message, context, minLevel) {
  if (LEVELS[level] < minLevel) return
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service,
    traceId,
    message,
    ...(context && Object.keys(context).length > 0 && { context }),
  }
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
  fn(JSON.stringify(entry))

  if (level === 'warn' || level === 'error') {
    Sentry.captureMessage(message, { level, extra: { ...context, service, traceId } })
  }
}

export function createLogger(service, traceId, env = {}) {
  const minLevel = LEVELS[env.LOG_LEVEL ?? 'info'] ?? 1
  return {
    debug: (message, context) => emit('debug', service, traceId, message, context, minLevel),
    info:  (message, context) => emit('info',  service, traceId, message, context, minLevel),
    warn:  (message, context) => emit('warn',  service, traceId, message, context, minLevel),
    error: (message, context) => emit('error', service, traceId, message, context, minLevel),
  }
}
