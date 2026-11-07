import type { BloodType, EventType } from '../types'

export const currentMonth = () => new Date().toISOString().slice(0, 7)

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
