import {
  ArrowDownLeft,
  ArrowUpRight,
  CircleDollarSign,
  Filter,
  Plus,
  ReceiptText,
  RefreshCw,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { DataTable } from '../components/DataTable'
import { ErrorState, LoadingState, Modal, PageHeader } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { currentDate, formatCurrency, formatDate } from '../lib/format'
import type { CashMovement, CashMovementType, CashSummary, CreateCashMovementPayload } from '../types'

const CATEGORY_SUGGESTIONS = [
  'SEDE',
  'EVENTO',
  'ALIMENTACAO',
  'MANUTENCAO',
  'DOACAO',
  'PATROCINIO',
  'COMUNICACAO',
  'OUTROS',
]

export function CashFlowPage() {
  const { session } = useAuth()
  const [summary, setSummary] = useState<CashSummary | null>(null)
  const [movements, setMovements] = useState<CashMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Filtros
  const [typeFilter, setTypeFilter] = useState<'TODOS' | CashMovementType>('TODOS')
  const [categoryFilter, setCategoryFilter] = useState<string>('TODAS')
  const [search, setSearch] = useState('')

  // Modal de novo lançamento
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<CreateCashMovementPayload>({
    type: 'SAIDA',
    category: 'SEDE',
    amount: 0,
    movementDate: currentDate(),
    description: '',
  })

  // Exclusão
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const canManage = session?.profile === 'DIRETORIA' || session?.profile === 'ADMINISTRATIVO'

  const load = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError('')
    try {
      const [sum, list] = await Promise.all([
        api.getCashSummary(session.token),
        api.listCashMovements(session.token),
      ])
      setSummary(sum)
      setMovements(list)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao carregar fluxo de caixa.')
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    void load()
  }, [load])

  const categories = useMemo(() => {
    const set = new Set<string>()
    movements.forEach((m) => {
      if (m.category) set.add(m.category)
    })
    return Array.from(set).sort()
  }, [movements])

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      if (typeFilter !== 'TODOS' && m.type !== typeFilter) return false
      if (categoryFilter !== 'TODAS' && m.category !== categoryFilter) return false
      if (search.trim()) {
        const query = search.toLowerCase()
        const matchDesc = m.description.toLowerCase().includes(query)
        const matchCat = m.category.toLowerCase().includes(query)
        const matchUser =
          m.createdBy?.memberName?.toLowerCase().includes(query) ||
          m.createdBy?.memberNickname?.toLowerCase().includes(query) ||
          m.createdBy?.email.toLowerCase().includes(query)
        if (!matchDesc && !matchCat && !matchUser) return false
      }
      return true
    })
  }, [movements, typeFilter, categoryFilter, search])

  const handleOpenModal = (defaultType: CashMovementType = 'SAIDA') => {
    setFormData({
      type: defaultType,
      category: defaultType === 'SAIDA' ? 'SEDE' : 'DOACAO',
      amount: 0,
      movementDate: currentDate(),
      description: '',
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return
    if (formData.amount <= 0) {
      setError('O valor deve ser maior que zero.')
      return
    }
    if (!formData.description.trim()) {
      setError('A descrição é obrigatória.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await api.createCashMovement(session.token, formData)
      setIsModalOpen(false)
      setNotice(
        formData.type === 'SAIDA'
          ? 'Despesa registrada com sucesso no caixa!'
          : 'Receita registrada com sucesso no caixa!'
      )
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao salvar lançamento no caixa.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (movement: CashMovement) => {
    if (!session) return
    if (movement.monthlyFeeId) {
      setError('Lançamento originado de mensalidade. Para alterá-lo, use a tela de mensalidades.')
      return
    }
    const confirm = window.confirm(`Deseja realmente excluir o lançamento "${movement.description}"?`)
    if (!confirm) return

    setDeletingId(movement.id)
    try {
      await api.deleteCashMovement(session.token, movement.id)
      setNotice('Lançamento removido com sucesso.')
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao excluir lançamento.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Financeiro & Auditoria"
        title="Fluxo de Caixa & Despesas"
        description="Gestão de receitas e despesas com transparência total e histórico de lançamentos."
        actions={
          <div className="page-actions">
            <button className="button button-secondary" type="button" onClick={() => void load()}>
              <RefreshCw size={17} /> Atualizar
            </button>
            {canManage && (
              <>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => handleOpenModal('ENTRADA')}
                >
                  <TrendingUp size={17} /> Nova Receita
                </button>
                <button
                  className="button button-primary"
                  type="button"
                  onClick={() => handleOpenModal('SAIDA')}
                >
                  <TrendingDown size={17} /> Nova Despesa
                </button>
              </>
            )}
          </div>
        }
      />

      {notice && (
        <div className="callout callout-success" style={{ margin: '0 0 16px' }}>
          <p>{notice}</p>
        </div>
      )}

      {loading && <LoadingState label="Carregando movimentações do caixa..." />}
      {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}

      {!loading && summary && (
        <>
          <section className="metric-grid" aria-label="Resumo do caixa">
            <div className="metric-card metric-dark">
              <div className="metric-card-top">
                <div className="metric-icon">
                  <Wallet size={24} />
                </div>
              </div>
              <span>Saldo Atual em Caixa</span>
              <strong className="metric-placeholder">{formatCurrency(summary.balance)}</strong>
              <small>Saldo consolidado de entradas e saídas</small>
            </div>

            <div className="metric-card">
              <div className="metric-card-top">
                <div className="metric-icon" style={{ color: 'var(--green)', background: 'var(--green-soft)' }}>
                  <ArrowUpRight size={24} />
                </div>
              </div>
              <span>Total de Entradas (Receitas)</span>
              <strong className="metric-placeholder" style={{ color: 'var(--green)' }}>
                {formatCurrency(summary.totalIncome)}
              </strong>
              <small>Mensalidades, doações e receitas avulsas</small>
            </div>

            <div className="metric-card">
              <div className="metric-card-top">
                <div className="metric-icon" style={{ color: 'var(--red)', background: 'var(--red-soft)' }}>
                  <ArrowDownLeft size={24} />
                </div>
              </div>
              <span>Total de Saídas (Despesas)</span>
              <strong className="metric-placeholder" style={{ color: 'var(--red)' }}>
                {formatCurrency(summary.totalExpense)}
              </strong>
              <small>Gastos operacionais, sede e eventos</small>
            </div>

            <div className="metric-card">
              <div className="metric-card-top">
                <div className="metric-icon">
                  <ReceiptText size={24} />
                </div>
              </div>
              <span>Lançamentos Registrados</span>
              <strong>{movements.length}</strong>
              <small>{canManage ? 'Acesso total de gestão' : 'Visualização transparente (Membro)'}</small>
            </div>
          </section>

          <section className="panel" style={{ marginTop: '20px' }}>
            <div className="panel-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span className="eyebrow">Extrato</span>
                <h2>Histórico de Movimentações</h2>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    className={`button button-small ${typeFilter === 'TODOS' ? 'button-primary' : 'button-secondary'}`}
                    onClick={() => setTypeFilter('TODOS')}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    className={`button button-small ${typeFilter === 'ENTRADA' ? 'button-primary' : 'button-secondary'}`}
                    onClick={() => setTypeFilter('ENTRADA')}
                  >
                    Entradas
                  </button>
                  <button
                    type="button"
                    className={`button button-small ${typeFilter === 'SAIDA' ? 'button-primary' : 'button-secondary'}`}
                    onClick={() => setTypeFilter('SAIDA')}
                  >
                    Despesas
                  </button>
                </div>

                {categories.length > 0 && (
                  <select
                    className="select"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '13px' }}
                  >
                    <option value="TODAS">Todas categorias</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}

                <input
                  type="search"
                  className="input"
                  placeholder="Buscar descrição ou autor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: '220px', padding: '6px 10px', fontSize: '13px' }}
                />
              </div>
            </div>

            {filteredMovements.length === 0 ? (
              <p className="muted" style={{ padding: '32px 16px', textAlign: 'center' }}>
                Nenhuma movimentação encontrada com os filtros selecionados.
              </p>
            ) : (
              <DataTable>
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Data</th>
                    <th>Categoria</th>
                    <th>Descrição</th>
                    <th style={{ textAlign: 'right' }}>Valor</th>
                    <th>Lançado por (Auditoria)</th>
                    {canManage && <th style={{ textAlign: 'center' }}>Ações</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredMovements.map((m) => {
                    const isIncome = m.type === 'ENTRADA'
                    const authorDisplay = m.createdBy
                      ? m.createdBy.memberName
                        ? `${m.createdBy.memberName} (${m.createdBy.memberNickname || m.createdBy.email})`
                        : m.createdBy.email
                      : m.monthlyFeeId
                      ? 'Sistema (Mensalidade)'
                      : 'Não registrado'

                    return (
                      <tr key={m.id}>
                        <td>
                          <span
                            className="status-pill"
                            style={{
                              background: isIncome ? 'var(--green-soft)' : 'var(--red-soft)',
                              color: isIncome ? 'var(--green)' : 'var(--red)',
                            }}
                          >
                            {isIncome ? 'Entrada' : 'Despesa'}
                          </span>
                        </td>
                        <td>{formatDate(m.movementDate)}</td>
                        <td>
                          <span className="profile-badge">{m.category}</span>
                        </td>
                        <td>
                          <strong>{m.description}</strong>
                          {m.monthlyFeeId && (
                            <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>
                              Vínculo automático com mensalidade
                            </span>
                          )}
                        </td>
                        <td
                          style={{
                            textAlign: 'right',
                            fontWeight: 700,
                            color: isIncome ? 'var(--green)' : 'var(--red)',
                          }}
                        >
                          {isIncome ? '+' : '-'} {formatCurrency(m.amount)}
                        </td>
                        <td>
                          <div style={{ fontSize: '13px' }}>
                            <strong>{authorDisplay}</strong>
                            {m.createdAt && (
                              <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>
                                {new Date(m.createdAt).toLocaleString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </td>
                        {canManage && (
                          <td style={{ textAlign: 'center' }}>
                            {!m.monthlyFeeId ? (
                              <button
                                className="icon-button"
                                type="button"
                                title="Excluir lançamento"
                                disabled={deletingId === m.id}
                                onClick={() => void handleDelete(m)}
                                style={{ color: 'var(--red)' }}
                              >
                                <Trash2 size={16} />
                              </button>
                            ) : (
                              <span
                                title="Lançamento automático de mensalidade. Para estornar, altere a mensalidade."
                                style={{ color: 'var(--muted)', fontSize: '12px' }}
                              >
                                —
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </DataTable>
            )}
          </section>
        </>
      )}

      {/* Modal de Novo Lançamento */}
      {isModalOpen && (
        <Modal
          title={formData.type === 'SAIDA' ? 'Nova Despesa' : 'Nova Receita / Entrada'}
          subtitle="O lançamento será vinculado ao seu usuário para fins de auditoria e transparência."
          onClose={saving ? () => undefined : () => setIsModalOpen(false)}
        >
          <form onSubmit={handleSave} className="form-stack">
            <div className="form-field">
              <label>Tipo de Movimentação</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className={`button ${formData.type === 'SAIDA' ? 'button-primary' : 'button-secondary'}`}
                  style={{ flex: 1 }}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      type: 'SAIDA',
                      category: prev.category === 'DOACAO' ? 'SEDE' : prev.category,
                    }))
                  }
                >
                  <TrendingDown size={17} /> Despesa (Saída)
                </button>
                <button
                  type="button"
                  className={`button ${formData.type === 'ENTRADA' ? 'button-primary' : 'button-secondary'}`}
                  style={{ flex: 1 }}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      type: 'ENTRADA',
                      category: prev.category === 'SEDE' ? 'DOACAO' : prev.category,
                    }))
                  }
                >
                  <TrendingUp size={17} /> Receita (Entrada)
                </button>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="cash-category">Categoria</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  id="cash-category"
                  className="input"
                  type="text"
                  required
                  placeholder="Ex: SEDE, EVENTO, MANUTENCAO..."
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, category: e.target.value.toUpperCase() }))
                  }
                />
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                {CATEGORY_SUGGESTIONS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className="button button-small button-secondary"
                    onClick={() => setFormData((prev) => ({ ...prev, category: cat }))}
                    style={{ fontSize: '11px', padding: '3px 8px' }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-field">
                <label htmlFor="cash-amount">Valor (R$)</label>
                <input
                  id="cash-amount"
                  className="input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0,00"
                  value={formData.amount || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="cash-date">Data da Movimentação</label>
                <input
                  id="cash-date"
                  className="input"
                  type="date"
                  required
                  value={formData.movementDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, movementDate: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="cash-desc">Descrição / Justificativa</label>
              <textarea
                id="cash-desc"
                className="input"
                rows={3}
                required
                placeholder="Ex: Compra de suprimentos para o churrasco oficial do clube..."
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button
                className="button button-secondary"
                type="button"
                disabled={saving}
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </button>
              <button className="button button-primary" type="submit" disabled={saving}>
                {saving ? 'Gravando...' : 'Confirmar e Lançar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
