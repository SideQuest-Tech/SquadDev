const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 }
const minLevel = LEVELS[process.env.LOG_LEVEL ?? 'info'] ?? 1

// Fire-and-forget Sentry event via HTTP store API — no SDK needed in this layer
function reportToSentry(level, message, context) {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) return
  try {
    const url = new URL(dsn)
    const key = url.username
    const projectId = url.pathname.replace(/^\//, '')
    const endpoint = `${url.protocol}//${url.host}/api/${projectId}/store/`
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${key}`,
      },
      body: JSON.stringify({
        message,
        level: level === 'warn' ? 'warning' : level,
        platform: 'node',
        timestamp: Date.now() / 1000,
        extra: context,
      }),
    }).catch(() => {})
  } catch {}
}

function emit(level, service, traceId, message, context) {
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
    reportToSentry(level, message, { ...context, service, traceId })
  }
}

export function createLogger(service, traceId) {
  return {
    debug: (message, context) => emit('debug', service, traceId, message, context),
    info:  (message, context) => emit('info',  service, traceId, message, context),
    warn:  (message, context) => emit('warn',  service, traceId, message, context),
    error: (message, context) => emit('error', service, traceId, message, context),
  }
}
