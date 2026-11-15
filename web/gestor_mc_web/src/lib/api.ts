import type {
  AuthSession,
  AttendanceItemPayload,
  AttendanceRecord,
  CashMovement,
  CashSummary,
  ClubEvent,
  CreateCashMovementPayload,
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
  AccountPayable,
  AccountPayablePayload,
  AccountPayableStatus,
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

  const headers = new Headers(options.headers)
  if (options.token) headers.set('Authorization', `Bearer ${options.token}`)
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const requestId = crypto.randomUUID().slice(0, 8)
  const method = options.method ?? 'GET'
  const endpoint = url.pathname + url.search

  logger.info('api', `${method} ${endpoint} (req #${requestId})`, {
    method,
    endpoint,
    requestId,
  })

  const startedAt = performance.now()

  let response: Response
  try {
    response = await fetch(url.toString(), {
      ...options,
      headers,
      body:
        options.body instanceof FormData
          ? options.body
          : options.body
          ? JSON.stringify(options.body)
          : undefined,
    })
  } catch (rawError) {
    const elapsed = Math.round(performance.now() - startedAt)
    const message = rawError instanceof Error ? rawError.message : String(rawError)

    let code: ApiError['code'] = 'NETWORK_ERROR'
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      code = 'OFFLINE'
    } else if (
      typeof window !== 'undefined' &&
      window.location.protocol === 'https:' &&
      url.protocol === 'http:'
    ) {
      code = 'MIXED_CONTENT'
    }

    logger.error('api', `${method} ${endpoint} FALHOU em ${elapsed}ms: ${message}`, {
      method,
      endpoint,
      requestId,
      elapsed,
      code,
      error: message,
    })

    throw new ApiError(
      code === 'OFFLINE'
        ? 'Sem conexao com a internet.'
        : code === 'MIXED_CONTENT'
        ? 'Bloqueio de seguranca (Mixed Content): o site seguro nao pode acessar a API em HTTP.'
        : `Erro de conexao com a API: ${message}`,
      0,
      code,
      requestId,
    )
  }

  const elapsed = Math.round(performance.now() - startedAt)

  if (!response.ok) {
    let message = 'Falha ao processar requisicao'
    try {
      const payload = await response.json()
      message = payload.message || payload.error || message
    } catch {
      message = response.statusText || message
    }

    logger.warn('api', `${method} ${endpoint} HTTP ${response.status} em ${elapsed}ms: ${message}`, {
      method,
      endpoint,
      requestId,
      status: response.status,
      elapsed,
      message,
    })

    throw new ApiError(message, response.status, 'HTTP_ERROR', requestId)
  }

  logger.info('api', `${method} ${endpoint} HTTP ${response.status} em ${elapsed}ms`, {
    method,
    endpoint,
    requestId,
    status: response.status,
    elapsed,
  })

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

async function requestBlob(path: string, token: string): Promise<Blob> {
  const url = new URL(path, API_BASE_URL)
  const headers = new Headers({ Authorization: `Bearer ${token}` })
  const response = await fetch(url.toString(), { headers })
  if (!response.ok) {
    throw new ApiError('Falha ao baixar arquivo', response.status)
  }
  return response.blob()
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthSession>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  listMembers: (token: string, search?: string) =>
    request<MemberSummary[]>('/api/members', { token, query: { search } }),
  getMember: (token: string, id: number) =>
    request<MemberDetail>(`/api/members/${id}`, { token }),
  createMember: (token: string, body: MemberPayload) =>
    request<MemberDetail>('/api/members', { method: 'POST', token, body }),
  updateMember: (token: string, id: number, body: MemberPayload) =>
    request<MemberDetail>(`/api/members/${id}`, { method: 'PUT', token, body }),
  deleteMember: (token: string, id: number) =>
    request<void>(`/api/members/${id}`, { method: 'DELETE', token }),

  createMotorcycle: (token: string, body: MotorcyclePayload) =>
    request<Motorcycle>('/api/motorcycles', { method: 'POST', token, body }),
  updateMotorcycle: (token: string, id: number, body: MotorcyclePayload) =>
    request<Motorcycle>(`/api/motorcycles/${id}`, { method: 'PUT', token, body }),
  deleteMotorcycle: (token: string, id: number) =>
    request<void>(`/api/motorcycles/${id}`, { method: 'DELETE', token }),

  listEvents: (token: string) =>
    request<ClubEvent[]>('/api/events', { token }),
  getEvent: (token: string, id: number) =>
    request<ClubEvent>(`/api/events/${id}`, { token }),
  createEvent: (token: string, body: EventPayload) =>
    request<ClubEvent>('/api/events', { method: 'POST', token, body }),
  updateEvent: (token: string, id: number, body: EventPayload) =>
    request<ClubEvent>(`/api/events/${id}`, { method: 'PUT', token, body }),
  deleteEvent: (token: string, id: number) =>
    request<void>(`/api/events/${id}`, { method: 'DELETE', token }),

  listAttendances: (token: string, eventId: number) =>
    request<AttendanceRecord[]>(`/api/events/${eventId}/attendances`, { token }),
  saveAttendances: (token: string, eventId: number, attendances: AttendanceItemPayload[]) =>
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
  getCashSummary: (token: string) =>
    request<CashSummary>('/api/cash/summary', { token }),
  listCashMovements: (token: string) =>
    request<CashMovement[]>('/api/cash/movements', { token }),
  createCashMovement: (token: string, body: CreateCashMovementPayload) =>
    request<CashMovement>('/api/cash/movements', { method: 'POST', token, body }),
  deleteCashMovement: (token: string, id: number) =>
    request<void>(`/api/cash/movements/${id}`, { method: 'DELETE', token }),

  listAccountsPayable: (token: string) =>
    request<AccountPayable[]>('/api/accounts-payable', { token }),
  createAccountPayable: (token: string, payload: AccountPayablePayload) => {
    const body = new FormData()
    body.append('description', payload.description)
    body.append('amount', String(payload.amount))
    body.append('dueDate', payload.dueDate)
    body.append('file', payload.file)
    return request<AccountPayable>('/api/accounts-payable', { method: 'POST', token, body })
  },
  updateAccountPayableStatus: (
    token: string,
    accountId: number,
    status: AccountPayableStatus,
    paidDate: string | null,
  ) => request<AccountPayable>(`/api/accounts-payable/${accountId}/status`, {
    method: 'PATCH', token, body: { status, paidDate },
  }),
  downloadAccountPayableDocument: (token: string, accountId: number) =>
    requestBlob(`/api/accounts-payable/${accountId}/document`, token),
  markAccountPayablePaid: (token: string, accountId: number, paidDate: string, file: File | null) => {
    const body = new FormData()
    body.append('paidDate', paidDate)
    if (file) body.append('file', file)
    return request<AccountPayable>(`/api/accounts-payable/${accountId}/payment`, {
      method: 'PATCH', token, body,
    })
  },
  replaceAccountPayableDocument: (token: string, accountId: number, file: File) => {
    const body = new FormData()
    body.append('file', file)
    return request<AccountPayable>(`/api/accounts-payable/${accountId}/document`, {
      method: 'PUT', token, body,
    })
  },
  replaceAccountPayablePaymentProof: (token: string, accountId: number, file: File) => {
    const body = new FormData()
    body.append('file', file)
    return request<AccountPayable>(`/api/accounts-payable/${accountId}/payment-proof`, {
      method: 'PUT', token, body,
    })
  },
  downloadAccountPayablePaymentProof: (token: string, accountId: number) =>
    requestBlob(`/api/accounts-payable/${accountId}/payment-proof`, token),
}
