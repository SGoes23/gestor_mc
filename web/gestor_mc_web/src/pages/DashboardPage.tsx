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
import { MetricLinkCard } from '../components/MetricLinkCard'
import { ErrorState, LoadingState, PageHeader, StatusPill } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { currentDate, currentMonth, daysOverdue, eventTypeLabel, formatCurrency, formatDate, monthLabel } from '../lib/format'
import type { ClubEvent, MemberSummary, MonthlyFee } from '../types'

interface DashboardData {
  members: MemberSummary[]
  events: ClubEvent[]
  defaulters: MonthlyFee[]
  cashBalance: number
}

export function DashboardPage() {
  const { session } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const month = currentMonth()
  const today = currentDate()

  const load = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError('')
    try {
      const [members, events, defaulters, cash] = await Promise.all([
        api.listMembers(session.token),
        api.listEvents(session.token),
        api.listDefaulters(session.token, month),
        api.getCashBalance(session.token),
      ])
      setData({ members, events, defaulters, cashBalance: cash.balance })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao carregar o dashboard.')
    } finally {
      setLoading(false)
    }
  }, [month, session])

  useEffect(() => { void load() }, [load])

  const metrics = useMemo(() => {
    const activeMembers = data?.members.filter((member) => member.status === 'ATIVO').length ?? 0
    const monthlyEvents = data?.events.filter(
      (event) => event.eventDate.startsWith(month) && event.eventDate >= today,
    ).length ?? 0
    const overdueTotal = data?.defaulters.reduce((total, fee) => total + fee.amount, 0) ?? 0
    return { activeMembers, monthlyEvents, overdueTotal }
  }, [data, month, today])

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
            <MetricLinkCard
              to="/membros"
              icon={<UsersRound size={24} />}
              title="Membros ativos"
              value={metrics.activeMembers}
              subtitle={`de ${data.members.length} cadastrados`}
              tone="dark"
            />
            <MetricLinkCard
              to="/eventos"
              icon={<CalendarDays size={24} />}
              title="Próximos eventos no mês"
              value={metrics.monthlyEvents}
              subtitle="conforme o calendário"
            />
            <MetricLinkCard
              to="/inadimplentes"
              icon={<ShieldAlert size={24} />}
              title="Mensalidades pendentes"
              value={data.defaulters.length}
              subtitle={`${formatCurrency(metrics.overdueTotal)} em aberto`}
              tone="alert"
            />
            <MetricLinkCard
              to="/mensalidades"
              icon={<CircleDollarSign size={24} />}
              title="Caixa do clube"
              value={formatCurrency(data.cashBalance)}
              subtitle="Saldo de mensalidades lançadas"
              compactValue
            />
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
