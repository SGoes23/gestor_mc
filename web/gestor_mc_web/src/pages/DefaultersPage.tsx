import { AlertTriangle, CalendarSearch, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusPill } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { currentMonth, daysOverdue, formatCurrency, formatDate, monthLabel } from '../lib/format'
import type { MonthlyFee } from '../types'

export function DefaultersPage() {
  const { session } = useAuth()
  const [month, setMonth] = useState(currentMonth())
  const [items, setItems] = useState<MonthlyFee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (referenceMonth = month) => {
    if (!session) return
    setLoading(true); setError('')
    try { setItems(await api.listDefaulters(session.token, referenceMonth)) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao consultar inadimplentes.') }
    finally { setLoading(false) }
  }, [month, session])

  useEffect(() => { void load() }, [session]) // eslint-disable-line react-hooks/exhaustive-deps
  const total = useMemo(() => items.reduce((sum, fee) => sum + fee.amount, 0), [items])

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Acompanhamento" title="Inadimplentes" description="Identifique contribuições em aberto e mantenha o financeiro organizado." />
      <section className="defaulters-hero">
        <div className="defaulters-icon"><AlertTriangle size={26} /></div>
        <div><span>Em aberto em {monthLabel(month)}</span><strong>{formatCurrency(total)}</strong><small>{items.length} {items.length === 1 ? 'mensalidade pendente' : 'mensalidades pendentes'}</small></div>
      </section>
      <section className="toolbar-card">
        <div className="month-control"><CalendarSearch size={19} /><label><span>Mês de referência</span><input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></label><button className="button button-secondary" onClick={() => void load(month)}><RefreshCw size={17} /> Consultar</button></div>
      </section>
      {loading && <LoadingState label="Consultando pendências..." />}
      {!loading && error && <ErrorState message={error} onRetry={() => void load(month)} />}
      {!loading && !error && items.length === 0 && <EmptyState title="Tudo em dia" description={`Não existem mensalidades pendentes em ${monthLabel(month)}.`} />}
      {!loading && !error && items.length > 0 && (
        <section className="table-card">
          <div className="table-responsive">
            <table>
              <thead><tr><th>Membro</th><th>Valor</th><th>Vencimento</th><th>Atraso</th><th>Status</th></tr></thead>
              <tbody>{items.map((fee) => <tr key={fee.id}><td><div className="table-person"><div className="member-avatar alert-avatar">{fee.memberFullName.slice(0, 2).toUpperCase()}</div><div><strong>{fee.memberFullName}</strong><span>{fee.memberNickname}</span></div></div></td><td><strong>{formatCurrency(fee.amount)}</strong></td><td>{formatDate(fee.dueDate)}</td><td><span className="overdue-text">{daysOverdue(fee.dueDate)} dias</span></td><td><StatusPill status="Pendente" /></td></tr>)}</tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
