import type {
  AuthSession,
  ClubEvent,
  EventPayload,
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

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8080'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
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

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  if (!response.ok) {
    let message = `A requisição falhou com o código ${response.status}.`
    try {
      const payload = (await response.json()) as { message?: string }
      if (payload.message) message = payload.message
    } catch {
      const text = await response.text().catch(() => '')
      if (text) message = text
    }
    throw new ApiError(message, response.status)
  }

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
  createEvent: (token: string, body: EventPayload) =>
    request<ClubEvent>('/api/events', { method: 'POST', token, body }),
  updateEvent: (token: string, eventId: number, body: EventPayload) =>
    request<ClubEvent>(`/api/events/${eventId}`, { method: 'PUT', token, body }),
  deleteEvent: (token: string, eventId: number) =>
    request<void>(`/api/events/${eventId}`, { method: 'DELETE', token }),

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
  ) =>
    request<MonthlyFee>(`/api/monthly-fees/${monthlyFeeId}/status`, {
      method: 'PATCH',
      token,
      body: { status, paymentDate },
    }),
}
