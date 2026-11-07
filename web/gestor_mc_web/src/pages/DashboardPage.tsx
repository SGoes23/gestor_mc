import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  RefreshCw,
  ShieldAlert,
  UsersRound,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ErrorState, LoadingState, PageHeader, StatusPill } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { currentMonth, daysOverdue, eventTypeLabel, formatCurrency, formatDate, monthLabel } from '../lib/format'
import type { ClubEvent, MemberSummary, MonthlyFee } from '../types'

interface DashboardData {
  members: MemberSummary[]
  events: ClubEvent[]
  defaulters: MonthlyFee[]
}

export function DashboardPage() {
  const { session } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const month = currentMonth()

  const load = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError('')
    try {
      const [members, events, defaulters] = await Promise.all([
        api.listMembers(session.token),
        api.listEvents(session.token),
        api.listDefaulters(session.token, month),
      ])
      setData({ members, events, defaulters })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao carregar o dashboard.')
    } finally {
      setLoading(false)
    }
  }, [month, session])

  useEffect(() => { void load() }, [load])

  const metrics = useMemo(() => {
    const activeMembers = data?.members.filter((member) => member.status === 'ATIVO').length ?? 0
    const meetings = data?.events.filter((event) => event.type === 'REUNIAO' && event.eventDate.startsWith(month)).length ?? 0
    const overdueTotal = data?.defaulters.reduce((total, fee) => total + fee.amount, 0) ?? 0
    return { activeMembers, meetings, overdueTotal }
  }, [data, month])

  const upcomingEvents = useMemo(
    () => (data?.events ?? [])
      .filter((event) => new Date(`${event.eventDate}T23:59:59`).getTime() >= Date.now())
      .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
      .slice(0, 4),
    [data],
  )

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Central de comando"
        title="Visão geral"
        description={`Acompanhe os principais números do clube em ${monthLabel(month)}.`}
        actions={
          <button className="button button-secondary" type="button" onClick={() => void load()}>
            <RefreshCw size={17} /> Atualizar
          </button>
        }
      />

      {loading && <LoadingState label="Consolidando informações do clube..." />}
      {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}

      {!loading && data && (
        <>
          <section className="metric-grid" aria-label="Indicadores do clube">
            <article className="metric-card metric-dark">
              <div className="metric-icon"><UsersRound size={24} /></div>
              <span>Membros ativos</span>
              <strong>{metrics.activeMembers}</strong>
              <small>de {data.members.length} cadastrados</small>
            </article>
            <article className="metric-card">
              <div className="metric-icon"><CalendarDays size={24} /></div>
              <span>Reuniões no mês</span>
              <strong>{metrics.meetings}</strong>
              <small>conforme o calendário</small>
            </article>
            <article className="metric-card metric-alert">
              <div className="metric-icon"><ShieldAlert size={24} /></div>
              <span>Mensalidades pendentes</span>
              <strong>{data.defaulters.length}</strong>
              <small>{formatCurrency(metrics.overdueTotal)} em aberto</small>
            </article>
            <article className="metric-card">
              <div className="metric-icon"><CircleDollarSign size={24} /></div>
              <span>Caixa do clube</span>
              <strong className="metric-placeholder">Em breve</strong>
              <small>Módulo financeiro planejado</small>
            </article>
          </section>

          <section className="dashboard-columns">
            <article className="panel">
              <div className="panel-header">
                <div>
                  <span className="eyebrow">Agenda</span>
                  <h2>Próximos compromissos</h2>
                </div>
                <Link className="text-link" to="/eventos">Ver calendário <ArrowRight size={16} /></Link>
              </div>
              <div className="event-list compact-list">
                {upcomingEvents.length === 0 && <p className="muted">Nenhum evento futuro cadastrado.</p>}
                {upcomingEvents.map((event) => (
                  <div className="compact-row" key={event.id}>
                    <div className="date-tile">
                      <strong>{event.eventDate.slice(8, 10)}</strong>
                      <span>{new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(`${event.eventDate}T12:00:00`)).replace('.', '')}</span>
                    </div>
                    <div className="compact-main">
                      <strong>{event.title}</strong>
                      <span>{event.place}</span>
                    </div>
                    <span className="type-tag">{eventTypeLabel[event.type]}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panel-header">
                <div>
                  <span className="eyebrow">Atenção</span>
                  <h2>Mensalidades em aberto</h2>
                </div>
                <Link className="text-link" to="/inadimplentes">Ver todos <ArrowRight size={16} /></Link>
              </div>
              <div className="compact-list">
                {data.defaulters.length === 0 && <p className="muted">Nenhuma mensalidade pendente neste mês.</p>}
                {data.defaulters.slice(0, 5).map((fee) => (
                  <div className="compact-row" key={fee.id}>
                    <div className="member-mini-avatar">{fee.memberFullName.slice(0, 1)}</div>
                    <div className="compact-main">
                      <strong>{fee.memberFullName}</strong>
                      <span>Vencimento {formatDate(fee.dueDate)} · {daysOverdue(fee.dueDate)} dias</span>
                    </div>
                    <div className="compact-value">
                      <strong>{formatCurrency(fee.amount)}</strong>
                      <StatusPill status="Pendente" />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </>
      )}
    </div>
  )
}
