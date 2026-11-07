export type AccessProfile = 'DIRETORIA' | 'MEMBRO'

export interface AuthSession {
  token: string
  email: string
  profile: AccessProfile
}

export type MemberStatus = 'ATIVO' | 'INATIVO'
export type BloodType =
  | 'A_POSITIVE'
  | 'A_NEGATIVE'
  | 'B_POSITIVE'
  | 'B_NEGATIVE'
  | 'AB_POSITIVE'
  | 'AB_NEGATIVE'
  | 'O_POSITIVE'
  | 'O_NEGATIVE'

export interface Motorcycle {
  id: number
  model: string
  year: number
  color: string
  licensePlate: string
  memberId: number
}

export interface MemberSummary {
  id: number
  fullName: string
  nickname: string
  phone: string
  bloodType: BloodType
  emergencyContact: string
  address: string
  role: string
  status: MemberStatus
}

export interface MemberDetail extends MemberSummary {
  motorcycles: Motorcycle[]
}

export type MemberPayload = Omit<MemberSummary, 'id'>
export type MotorcyclePayload = Omit<Motorcycle, 'id'>

export type EventType = 'ROLE' | 'EVENTO' | 'REUNIAO'

export interface ClubEvent {
  id: number
  title: string
  type: EventType
  eventDate: string
  place: string
  description: string
}

export type EventPayload = Omit<ClubEvent, 'id'>

export type MonthlyFeeStatus = 'PAGO' | 'PENDENTE'

export interface MonthlyFee {
  id: number
  memberId: number
  memberFullName: string
  memberNickname: string
  referenceMonth: string
  amount: number
  dueDate: string
  status: MonthlyFeeStatus
  paymentDate: string | null
}

export interface GenerateMonthlyFeesPayload {
  referenceMonth: string
  amount: number
  dueDate: string
}

export interface GenerateMonthlyFeesResult {
  referenceMonth: string
  created: number
  existing: number
}
