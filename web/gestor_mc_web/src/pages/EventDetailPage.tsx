import { ArrowLeft, CalendarDays, CheckCheck, MapPin, Save, UserCheck, UsersRound } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DataTable, MemberIdentity } from '../components/DataTable'
import { ErrorState, InlineNotice, LoadingState, PageHeader } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { currentDate, eventTypeLabel, formatDate } from '../lib/format'
import type { AttendanceRecord, AttendanceStatus, ClubEvent } from '../types'

const statusLabel: Record<AttendanceStatus, string> = {
  NAO_REGISTRADO: 'Não registrado',
  PRESENTE: 'Presente',
  AUSENTE: 'Ausente',
  JUSTIFICADO: 'Justificado',
}

export function EventDetailPage() {
  const { id } = useParams()
  const eventId = Number(id)
  const { session, isDiretoria } = useAuth()
  const [event, setEvent] = useState<ClubEvent | null>(null)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    if (!session || !Number.isFinite(eventId)) return
    setLoading(true); setError('')
    try {
      const [eventData, attendanceData] = await Promise.all([
        api.getEvent(session.token, eventId),
        api.listEventAttendances(session.token, eventId),
      ])
      setEvent(eventData)
      setRecords(attendanceData)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao carregar o evento.')
    } finally { setLoading(false) }
  }, [eventId, session])

  useEffect(() => { void load() }, [load])

  const canRegister = Boolean(isDiretoria && event && event.eventDate <= currentDate())
  const totals = useMemo(() => ({
    present: records.filter((record) => record.status === 'PRESENTE').length,
    absent: records.filter((record) => record.status === 'AUSENTE').length,
    justified: records.filter((record) => record.status === 'JUSTIFICADO').length,
    pending: records.filter((record) => record.status === 'NAO_REGISTRADO').length,
  }), [records])
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('pt-BR')
    return term ? records.filter((record) => `${record.memberFullName} ${record.memberNickname}`.toLocaleLowerCase('pt-BR').includes(term)) : records
  }, [query, records])

  const updateRecord = (memberId: number, changes: Partial<AttendanceRecord>) =>
    setRecords((current) => current.map((record) => record.memberId === memberId ? { ...record, ...changes } : record))

  const markAll = (status: AttendanceStatus, onlyPending = false) => {
    setRecords((current) => current.map((record) => onlyPending && record.status !== 'NAO_REGISTRADO' ? record : { ...record, status }))
  }

  const save = async () => {
    if (!session || !canRegister) return
    setSaving(true); setError(''); setNotice('')
    try {
      const updated = await api.saveEventAttendances(session.token, eventId, records.map((record) => ({
        memberId: record.memberId,
        status: record.status,
        notes: record.notes,
      })))
      setRecords(updated)
      setNotice('Lista de presença salva com sucesso.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao salvar a lista de presença.')
    } finally { setSaving(false) }
  }

  if (loading) return <LoadingState label="Carregando lista de presença..." />
  if (error && !event) return <ErrorState message={error} onRetry={() => void load()} />
  if (!event) return <ErrorState message="Evento não encontrado." />

  return (
    <div className="page-stack">
      <Link to="/eventos" className="back-link"><ArrowLeft size={17} /> Voltar para eventos</Link>
      <PageHeader
        eyebrow={eventTypeLabel[event.type]}
        title={event.title}
        description={event.description}
        actions={canRegister && <button className="button button-primary" disabled={saving} onClick={() => void save()}><Save size={17} /> {saving ? 'Salvando...' : 'Salvar presença'}</button>}
      />

      <section className="event-detail-meta">
        <span><CalendarDays size={18} /> {formatDate(event.eventDate)}</span>
        <span><MapPin size={18} /> {event.place}</span>
      </section>
      {event.eventDate > currentDate() && <InlineNotice tone="error">A chamada será liberada no dia do evento.</InlineNotice>}
      {notice && <InlineNotice>{notice}</InlineNotice>}
      {error && <InlineNotice tone="error">{error}</InlineNotice>}

      <section className="attendance-summary-grid">
        <article><UserCheck size={20} /><span>Presentes</span><strong>{totals.present}</strong></article>
        <article><UsersRound size={20} /><span>Ausentes</span><strong>{totals.absent}</strong></article>
        <article><CheckCheck size={20} /><span>Justificados</span><strong>{totals.justified}</strong></article>
        <article><CalendarDays size={20} /><span>Pendentes</span><strong>{totals.pending}</strong></article>
      </section>

      <section className="panel">
        <div className="attendance-toolbar">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar membro ou apelido" aria-label="Buscar membro" />
          {canRegister && <div className="attendance-bulk-actions"><button className="button button-secondary" onClick={() => markAll('PRESENTE')}>Todos presentes</button><button className="button button-secondary" onClick={() => markAll('AUSENTE', true)}>Pendentes ausentes</button></div>}
        </div>
        <DataTable>
          <thead><tr><th>Membro</th><th>Cargo</th><th>Presença</th><th>Observação</th></tr></thead>
          <tbody>
            {filtered.map((record) => (
              <tr key={record.memberId}>
                <td><MemberIdentity fullName={record.memberFullName} nickname={record.memberNickname} compact /></td>
                <td>{record.memberRole}</td>
                <td><select className={`attendance-status status-${record.status.toLowerCase()}`} value={record.status} disabled={!canRegister || saving} onChange={(e) => updateRecord(record.memberId, { status: e.target.value as AttendanceStatus })}>{Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td>
                <td><input className="attendance-notes" value={record.notes ?? ''} disabled={!canRegister || saving} maxLength={500} placeholder="Observação opcional" onChange={(e) => updateRecord(record.memberId, { notes: e.target.value })} /></td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </section>
    </div>
  )
}
