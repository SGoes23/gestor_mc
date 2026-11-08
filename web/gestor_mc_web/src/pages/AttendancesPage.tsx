import { ArrowRight, CalendarCheck, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DataTable } from '../components/DataTable'
import { EmptyState, ErrorState, LoadingState, PageHeader } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { eventTypeLabel, formatDate } from '../lib/format'
import type { EventAttendanceSummary } from '../types'

export function AttendancesPage() {
  const { session } = useAuth()
  const [items, setItems] = useState<EventAttendanceSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!session) return
    setLoading(true); setError('')
    try { setItems(await api.listAttendanceEvents(session.token)) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao carregar presenças.') }
    finally { setLoading(false) }
  }, [session])

  useEffect(() => { void load() }, [load])

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Histórico" title="Listas de presença" description="Acompanhe as chamadas dos eventos realizados e consulte a participação dos membros." actions={<button className="button button-secondary" onClick={() => void load()}><RefreshCw size={17} /> Atualizar</button>} />
      {loading && <LoadingState label="Carregando histórico de presença..." />}
      {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
      {!loading && !error && items.length === 0 && <EmptyState title="Nenhum evento realizado" description="As listas aparecerão aqui a partir da data dos eventos." />}
      {!loading && !error && items.length > 0 && (
        <DataTable standalone>
          <thead><tr><th>Evento</th><th>Data</th><th>Presentes</th><th>Ausentes</th><th>Justificados</th><th>Pendentes / elegíveis</th><th>Frequência</th><th /></tr></thead>
          <tbody>{items.map((item) => (
            <tr key={item.eventId}>
              <td><strong className="table-primary">{item.eventTitle}</strong><span className="table-secondary">{eventTypeLabel[item.eventType]} · {item.place}</span></td>
              <td>{formatDate(item.eventDate)}</td>
              <td>{item.present}</td><td>{item.absent}</td><td>{item.justified}</td>
              <td><span className={item.pending > 0 ? 'attendance-pending' : undefined}>{item.pending} / {item.totalMembers}</span></td>
              <td><strong>{item.attendanceRate.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%</strong></td>
              <td><Link className="icon-button" to={`/eventos/${item.eventId}`} aria-label={`Abrir presença de ${item.eventTitle}`}><ArrowRight size={18} /></Link></td>
            </tr>
          ))}</tbody>
        </DataTable>
      )}
      <div className="attendance-legend"><CalendarCheck size={18} /><span>Pendentes compara registros ainda não preenchidos com o total de membros elegíveis quando o evento foi criado.</span></div>
    </div>
  )
}
