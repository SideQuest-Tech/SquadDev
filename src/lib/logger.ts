import * as Sentry from '@sentry/react'

type Level = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: Level
  service: string
  message: string
  context?: Record<string, unknown>
  timestamp: string
}

const SERVICE = 'sidequest-frontend'
const isDev = import.meta.env.DEV

function emit(level: Level, message: string, context?: Record<string, unknown>) {
  if (isDev) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: SERVICE,
      message,
      ...(context && Object.keys(context).length > 0 && { context }),
    }
    // eslint-disable-next-line no-console
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
    fn(JSON.stringify(entry))
    return
  }

  Sentry.captureMessage(message, { level, extra: context })
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => emit('debug', message, context),
  info:  (message: string, context?: Record<string, unknown>) => emit('info',  message, context),
  warn:  (message: string, context?: Record<string, unknown>) => emit('warn',  message, context),
  error: (message: string, context?: Record<string, unknown>) => emit('error', message, context),
}
