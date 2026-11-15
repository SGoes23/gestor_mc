export type AccessProfile = 'DIRETORIA' | 'ADMINISTRATIVO' | 'MEMBRO'

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
  postalCode: string
  cpf: string
  role: string
  status: MemberStatus
  email: string | null
  profile: AccessProfile
}

export interface MemberDetail extends MemberSummary {
  motorcycles: Motorcycle[]
}

export type MemberPayload = Omit<MemberSummary, 'id' | 'email'> & {
  email: string
  password?: string
}
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

export type AttendanceStatus = 'NAO_REGISTRADO' | 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADO'

export interface AttendanceRecord {
  memberId: number
  memberFullName: string
  memberNickname: string
  memberRole: string
  memberStatus: MemberStatus
  status: AttendanceStatus
  notes: string | null
  checkedAt: string | null
  checkedBy: string | null
}

export interface AttendanceItemPayload {
  memberId: number
  status: AttendanceStatus
  notes: string | null
}

export interface EventAttendanceSummary {
  eventId: number
  eventTitle: string
  eventType: EventType
  eventDate: string
  place: string
  totalMembers: number
  present: number
  absent: number
  justified: number
  pending: number
  attendanceRate: number
}

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

export type AccountPayableStatus = 'PENDENTE' | 'PAGO'

export interface AccountPayable {
  id: number
  description: string
  amount: number
  dueDate: string
  status: AccountPayableStatus
  paidDate: string | null
  documentName: string
  documentContentType: string
  documentSize: number
  hasPaymentProof: boolean
  paymentProofName: string | null
  paymentProofContentType: string | null
  paymentProofSize: number | null
  createdAt: string
}

export interface AccountPayablePayload {
  description: string
  amount: number
  dueDate: string
  file: File
}

export type CashMovementType = 'ENTRADA' | 'SAIDA'

export interface CashSummary {
  balance: number
  totalIncome: number
  totalExpense: number
}

export interface CashMovementCreatedBy {
  id: number
  email: string
  memberName: string | null
  memberNickname: string | null
}

export interface CashMovement {
  id: number
  monthlyFeeId: number | null
  type: CashMovementType
  category: string
  amount: number
  movementDate: string
  description: string
  createdBy: CashMovementCreatedBy | null
  createdAt: string
}

export interface CreateCashMovementPayload {
  type: CashMovementType
  category: string
  amount: number
  movementDate: string
  description: string
}
