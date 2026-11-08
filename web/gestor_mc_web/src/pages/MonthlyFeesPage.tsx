import { CheckCircle2, CircleDollarSign, RefreshCw, Sparkles, WalletCards } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { DataTable, MemberIdentity } from '../components/DataTable'
import { MonthField } from '../components/FormControls'
import { EmptyState, ErrorState, InlineNotice, LoadingState, MonthlyFeeStatusPill, PageHeader } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { currentMonth, formatCurrency, formatDate, monthLabel } from '../lib/format'
import type { MonthlyFee } from '../types'

export function MonthlyFeesPage() {
  const { session, isDiretoria } = useAuth()
  const [month, setMonth] = useState(currentMonth())
  const [amount, setAmount] = useState('50.00')
  const [dueDate, setDueDate] = useState(`${currentMonth()}-10`)
  const [fees, setFees] = useState<MonthlyFee[]>([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async (referenceMonth = month) => {
    if (!session) return
    setLoading(true); setError('')
    try { setFees(await api.listMonthlyFees(session.token, referenceMonth)) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao carregar mensalidades.') }
    finally { setLoading(false) }
  }, [month, session])

  useEffect(() => { void load() }, [session]) // eslint-disable-line react-hooks/exhaustive-deps

  const summary = useMemo(() => ({
    paid: fees.filter((fee) => fee.status === 'PAGO'),
    pending: fees.filter((fee) => fee.status === 'PENDENTE'),
  }), [fees])

  const generate = async (event: FormEvent) => {
    event.preventDefault()
    if (!session) return
    setWorking(true); setError(''); setNotice('')
    try {
      const result = await api.generateMonthlyFees(session.token, { referenceMonth: month, amount: Number(amount.replace(',', '.')), dueDate })
      setNotice(`Mensalidades processadas: ${result.created} criadas e ${result.existing} já existentes.`)
      await load(month)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao gerar mensalidades.') }
    finally { setWorking(false) }
  }

  const toggleStatus = async (fee: MonthlyFee) => {
    if (!session || !isDiretoria) return
    const next = fee.status === 'PAGO' ? 'PENDENTE' : 'PAGO'
    setWorking(true); setError('')
    try {
      await api.updateMonthlyFeeStatus(session.token, fee.id, next, next === 'PAGO' ? new Date().toISOString().slice(0, 10) : null)
      setNotice('Status atualizado com sucesso.')
      await load(month)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao atualizar status.') }
    finally { setWorking(false) }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Contribuições"
        title="Mensalidades"
        description="Gere as cobranças do mês e acompanhe a situação de cada integrante."
        actions={<button className="button button-secondary" onClick={() => void load(month)}><RefreshCw size={17} /> Atualizar</button>}
      />

      {notice && <InlineNotice>{notice}</InlineNotice>}
      {error && <InlineNotice tone="error">{error}</InlineNotice>}

      <section className="fees-control-panel">
        <form className="fees-form" onSubmit={generate}>
          <MonthField value={month} onChange={(value) => { setMonth(value); setDueDate(`${value}-10`) }} />
          {isDiretoria && <label className="field"><span>Valor padrão</span><input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></label>}
          {isDiretoria && <label className="field"><span>Vencimento</span><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required /></label>}
          <button className="button button-secondary consult-button" type="button" onClick={() => void load(month)}>Consultar</button>
          {isDiretoria && <button className="button button-primary generate-button" type="submit" disabled={working}><Sparkles size={17} /> {working ? 'Processando...' : 'Gerar mensalidades'}</button>}
        </form>
      </section>

      <section className="fee-summary-grid">
        <article><div className="summary-icon"><WalletCards size={21} /></div><span>Total previsto</span><strong>{formatCurrency(fees.reduce((sum, fee) => sum + fee.amount, 0))}</strong><small>{fees.length} mensalidades</small></article>
        <article><div className="summary-icon success"><CheckCircle2 size={21} /></div><span>Recebido</span><strong>{formatCurrency(summary.paid.reduce((sum, fee) => sum + fee.amount, 0))}</strong><small>{summary.paid.length} pagamentos</small></article>
        <article><div className="summary-icon warning"><CircleDollarSign size={21} /></div><span>Em aberto</span><strong>{formatCurrency(summary.pending.reduce((sum, fee) => sum + fee.amount, 0))}</strong><small>{summary.pending.length} pendências</small></article>
      </section>

      <section className="panel">
        <div className="panel-header"><div><span className="eyebrow">{monthLabel(month)}</span><h2>Relação de mensalidades</h2></div></div>
        {loading && <LoadingState label="Carregando mensalidades..." />}
        {!loading && error && fees.length === 0 && <ErrorState message={error} onRetry={() => void load(month)} />}
        {!loading && !error && fees.length === 0 && <EmptyState title="Nenhuma mensalidade" description="Consulte outro mês ou gere as mensalidades para o período selecionado." />}
        {!loading && fees.length > 0 && (
          <DataTable>
              <thead><tr><th>Membro</th><th>Valor</th><th>Vencimento</th><th>Pagamento</th><th>Status</th><th /></tr></thead>
              <tbody>
                {fees.map((fee) => (
                  <tr key={fee.id}>
                    <td><MemberIdentity fullName={fee.memberFullName} nickname={fee.memberNickname} compact /></td>
                    <td><strong>{formatCurrency(fee.amount)}</strong></td>
                    <td>{formatDate(fee.dueDate)}</td>
                    <td>{formatDate(fee.paymentDate)}</td>
                    <td><MonthlyFeeStatusPill status={fee.status} /></td>
                    <td>{isDiretoria && <button className="button button-table" disabled={working} onClick={() => void toggleStatus(fee)}>Marcar {fee.status === 'PAGO' ? 'pendente' : 'pago'}</button>}</td>
                  </tr>
                ))}
              </tbody>
          </DataTable>
        )}
      </section>
    </div>
  )
}
