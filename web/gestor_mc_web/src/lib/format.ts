import type { BloodType, EventType } from '../types'

export const currentMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export const currentDate = () => {
  const now = new Date()
  return `${currentMonth()}-${String(now.getDate()).padStart(2, '0')}`
}

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)

export const formatDate = (value?: string | null) => {
  if (!value) return '—'
  const [year, month, day] = value.slice(0, 10).split('-')
  return `${day}/${month}/${year}`
}

export const formatPhone = (value?: string | null) => {
  const digits = (value ?? '').replace(/\D/g, '').slice(0, 11)
  if (!digits) return ''
  if (digits.length <= 2) return `(${digits}`
  const local = digits.slice(2)
  const prefixLength = digits.length === 11 ? 5 : 4
  const prefix = local.slice(0, prefixLength)
  const suffix = local.slice(prefixLength)
  return `(${digits.slice(0, 2)}) ${prefix}${suffix ? `-${suffix}` : ''}`
}

export const formatPostalCode = (value?: string | null) => {
  const digits = (value ?? '').replace(/\D/g, '').slice(0, 8)
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits
}

export const formatCpf = (value?: string | null) => {
  const digits = (value ?? '').replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
}

export const monthLabel = (value: string) => {
  const [year, month] = value.split('-').map(Number)
  if (!year || !month) return value
  const date = new Date(year, month - 1, 1)
  const label = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export const bloodTypeLabel: Record<BloodType, string> = {
  A_POSITIVE: 'A+',
  A_NEGATIVE: 'A−',
  B_POSITIVE: 'B+',
  B_NEGATIVE: 'B−',
  AB_POSITIVE: 'AB+',
  AB_NEGATIVE: 'AB−',
  O_POSITIVE: 'O+',
  O_NEGATIVE: 'O−',
}

export const eventTypeLabel: Record<EventType, string> = {
  ROLE: 'Passeio',
  EVENTO: 'Evento',
  REUNIAO: 'Reunião',
}

export const daysOverdue = (dueDate: string) => {
  const due = new Date(`${dueDate.slice(0, 10)}T12:00:00`)
  return Math.max(0, Math.floor((Date.now() - due.getTime()) / 86_400_000))
}
