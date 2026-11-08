import type {
  AuthSession,
  AttendanceItemPayload,
  AttendanceRecord,
  ClubEvent,
  EventPayload,
  EventAttendanceSummary,
  GenerateMonthlyFeesPayload,
  GenerateMonthlyFeesResult,
  MemberDetail,
  MemberPayload,
  MemberSummary,
  Motorcycle,
  MotorcyclePayload,
  MonthlyFee,
  MonthlyFeeStatus,
} from '../types'
import { logger } from './logger'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8080'

export class ApiError extends Error {
  status: number
  code: 'HTTP_ERROR' | 'NETWORK_ERROR' | 'TIMEOUT' | 'OFFLINE' | 'MIXED_CONTENT'
  requestId: string

  constructor(
    message: string,
    status: number,
    code: ApiError['code'] = 'HTTP_ERROR',
    requestId = '',
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.requestId = requestId
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  token?: string
  body?: unknown
  query?: Record<string, string | number | undefined>
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(path, API_BASE_URL)
  Object.entries(options.query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value))
  })

  const method = options.method ?? 'GET'
  const requestId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
  const startedAt = performance.now()
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 15_000)
  options.signal?.addEventListener('abort', () => controller.abort(), { once: true })
  logger.debug('api.request', `${method} ${url.pathname}`, { requestId, url: url.toString() })

  let response: Response
  try {
    response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': requestId,
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...options.headers,
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch (cause) {
    const durationMs = Math.round(performance.now() - startedAt)
    const isTimeout = controller.signal.aborted && !options.signal?.aborted
    const isOffline = navigator.onLine === false
    const isMixedContent = window.location.protocol === 'https:' && url.protocol === 'http:'
    const code: ApiError['code'] = isTimeout ? 'TIMEOUT' : isOffline ? 'OFFLINE' : isMixedContent ? 'MIXED_CONTENT' : 'NETWORK_ERROR'
    const message = isTimeout
      ? 'A API não respondeu em até 15 segundos.'
      : isOffline
        ? 'O dispositivo está sem conexão com a internet ou rede local.'
        : isMixedContent
          ? 'O navegador bloqueou a API HTTP porque o frontend está usando HTTPS.'
          : `Não foi possível conectar à API em ${url.origin}. Verifique se ela está ativa, a porta publicada e a configuração de CORS.`
    logger.error('api.connection_failed', message, {
      requestId,
      method,
      url: url.toString(),
      code,
      durationMs,
      online: navigator.onLine,
      frontendOrigin: window.location.origin,
      cause,
    })
    throw new ApiError(message, 0, code, requestId)
  } finally {
    window.clearTimeout(timeoutId)
  }

  if (!response.ok) {
    let message = `A requisição falhou com o código ${response.status}.`
    const errorText = await response.text().catch(() => '')
    if (errorText) {
      try {
        const payload = JSON.parse(errorText) as { message?: string }
        message = payload.message || errorText
      } catch { message = errorText }
    }
    const context = {
      requestId,
      method,
      url: url.toString(),
      status: response.status,
      statusText: response.statusText,
      durationMs: Math.round(performance.now() - startedAt),
    }
    if (response.status >= 500) logger.error('api.http_error', message, context)
    else logger.warn('api.http_error', message, context)
    throw new ApiError(message, response.status, 'HTTP_ERROR', requestId)
  }

  logger.debug('api.response', `${method} ${url.pathname} concluído.`, {
    requestId,
    status: response.status,
    durationMs: Math.round(performance.now() - startedAt),
  })
  if (response.status === 204) return undefined as T
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthSession>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  listMembers: (token: string, query = '') =>
    request<MemberSummary[]>('/api/members', { token, query: { query } }),
  getMember: (token: string, memberId: number) =>
    request<MemberDetail>(`/api/members/${memberId}`, { token }),
  createMember: (token: string, body: MemberPayload) =>
    request<MemberSummary>('/api/members', { method: 'POST', token, body }),
  updateMember: (token: string, memberId: number, body: MemberPayload) =>
    request<MemberSummary>(`/api/members/${memberId}`, { method: 'PUT', token, body }),
  deleteMember: (token: string, memberId: number) =>
    request<void>(`/api/members/${memberId}`, { method: 'DELETE', token }),

  createMotorcycle: (token: string, memberId: number, body: MotorcyclePayload) =>
    request<Motorcycle>(`/api/members/${memberId}/motorcycles`, { method: 'POST', token, body }),
  updateMotorcycle: (token: string, motorcycleId: number, body: MotorcyclePayload) =>
    request<Motorcycle>(`/api/motorcycles/${motorcycleId}`, { method: 'PUT', token, body }),
  deleteMotorcycle: (token: string, motorcycleId: number) =>
    request<void>(`/api/motorcycles/${motorcycleId}`, { method: 'DELETE', token }),

  listEvents: (token: string) => request<ClubEvent[]>('/api/events', { token }),
  getEvent: (token: string, eventId: number) => request<ClubEvent>(`/api/events/${eventId}`, { token }),
  createEvent: (token: string, body: EventPayload) =>
    request<ClubEvent>('/api/events', { method: 'POST', token, body }),
  updateEvent: (token: string, eventId: number, body: EventPayload) =>
    request<ClubEvent>(`/api/events/${eventId}`, { method: 'PUT', token, body }),
  deleteEvent: (token: string, eventId: number) =>
    request<void>(`/api/events/${eventId}`, { method: 'DELETE', token }),
  listEventAttendances: (token: string, eventId: number) =>
    request<AttendanceRecord[]>(`/api/events/${eventId}/attendances`, { token }),
  saveEventAttendances: (token: string, eventId: number, attendances: AttendanceItemPayload[]) =>
    request<AttendanceRecord[]>(`/api/events/${eventId}/attendances`, {
      method: 'PUT', token, body: { attendances },
    }),
  listAttendanceEvents: (token: string, from?: string, to?: string) =>
    request<EventAttendanceSummary[]>('/api/attendances/events', { token, query: { from, to } }),

  listMonthlyFees: (token: string, referenceMonth: string) =>
    request<MonthlyFee[]>('/api/monthly-fees', { token, query: { referenceMonth } }),
  listDefaulters: (token: string, referenceMonth: string) =>
    request<MonthlyFee[]>('/api/monthly-fees/defaulters', { token, query: { referenceMonth } }),
  listMemberFeeHistory: (token: string, memberId: number) =>
    request<MonthlyFee[]>(`/api/monthly-fees/history/member/${memberId}`, { token }),
  generateMonthlyFees: (token: string, body: GenerateMonthlyFeesPayload) =>
    request<GenerateMonthlyFeesResult>('/api/monthly-fees/generate', { method: 'POST', token, body }),
  updateMonthlyFeeStatus: (
    token: string,
    monthlyFeeId: number,
    status: MonthlyFeeStatus,
    paymentDate: string | null,
    addToCash = false,
  ) =>
    request<MonthlyFee>(`/api/monthly-fees/${monthlyFeeId}/status`, {
      method: 'PATCH',
      token,
      body: { status, paymentDate, addToCash },
    }),
  getCashBalance: (token: string) =>
    request<{ balance: number }>('/api/cash/balance', { token }),
}
