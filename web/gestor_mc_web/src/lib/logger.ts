export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  event: string
  message: string
  context?: unknown
}

const STORAGE_KEY = 'gestor-mc-frontend-logs'
const MAX_ENTRIES = 200
const levelWeight: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 }
const configuredLevel = (import.meta.env.VITE_LOG_LEVEL as LogLevel | undefined)
  ?? (import.meta.env.DEV ? 'debug' : 'info')
const sensitiveKey = /password|senha|token|authorization|secret|credential/i

function sanitize(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack }
  }
  if (Array.isArray(value)) return value.map((item) => sanitize(item, seen))
  if (value && typeof value === 'object') {
    if (seen.has(value)) return '[circular]'
    seen.add(value)
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, sensitiveKey.test(key) ? '[redacted]' : sanitize(item, seen)]),
    )
  }
  return value
}

function readEntries(): LogEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) as LogEntry[] : []
  } catch {
    return []
  }
}

function persist(entry: LogEntry) {
  try {
    const entries = [...readEntries(), entry].slice(-MAX_ENTRIES)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // Logging must never break the application (private mode/quota/security policies).
  }
}

function write(level: LogLevel, event: string, message: string, context?: unknown) {
  if (levelWeight[level] < levelWeight[configuredLevel]) return
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    message,
    ...(context === undefined ? {} : { context: sanitize(context) }),
  }
  const consoleMethod = level === 'debug' ? console.debug : level === 'info' ? console.info : level === 'warn' ? console.warn : console.error
  consoleMethod(`[${entry.timestamp}] [${level.toUpperCase()}] ${event}: ${message}`, entry.context ?? '')
  persist(entry)
}

export const logger = {
  debug: (event: string, message: string, context?: unknown) => write('debug', event, message, context),
  info: (event: string, message: string, context?: unknown) => write('info', event, message, context),
  warn: (event: string, message: string, context?: unknown) => write('warn', event, message, context),
  error: (event: string, message: string, context?: unknown) => write('error', event, message, context),
  getEntries: readEntries,
  clear: () => localStorage.removeItem(STORAGE_KEY),
}

export function installGlobalErrorLogging() {
  window.addEventListener('error', (event) => {
    logger.error('window.error', event.message || 'Erro não tratado na interface.', {
      filename: event.filename,
      line: event.lineno,
      column: event.colno,
      error: event.error,
    })
  })
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('window.unhandledrejection', 'Promise rejeitada sem tratamento.', { reason: event.reason })
  })
  logger.info('app.start', 'Frontend iniciado.', {
    url: window.location.href,
    online: navigator.onLine,
    userAgent: navigator.userAgent,
  })
}
