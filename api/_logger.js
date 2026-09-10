const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 }
const minLevel = LEVELS[process.env.LOG_LEVEL ?? 'info'] ?? 1

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
}

export function createLogger(service, traceId) {
  return {
    debug: (message, context) => emit('debug', service, traceId, message, context),
    info:  (message, context) => emit('info',  service, traceId, message, context),
    warn:  (message, context) => emit('warn',  service, traceId, message, context),
    error: (message, context) => emit('error', service, traceId, message, context),
  }
}
