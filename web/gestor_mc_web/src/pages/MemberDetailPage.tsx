import { ArrowLeft, Bike, CalendarClock, MapPin, Pencil, Phone, Plus, Trash2, UserRound } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BloodTypeIndicator } from '../components/BloodTypeIndicator'
import { EmptyState, ErrorState, InlineNotice, LoadingState, Modal, PageHeader, StatusPill } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { formatCurrency, formatDate, monthLabel } from '../lib/format'
import type { MemberDetail, Motorcycle, MotorcyclePayload, MonthlyFee } from '../types'

export function MemberDetailPage() {
  const { id } = useParams()
  const memberId = Number(id)
  const { session, isDiretoria } = useAuth()
  const [member, setMember] = useState<MemberDetail | null>(null)
  const [fees, setFees] = useState<MonthlyFee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editingMotorcycle, setEditingMotorcycle] = useState<Motorcycle | null | undefined>(undefined)

  const load = useCallback(async () => {
    if (!session || !Number.isFinite(memberId)) return
    setLoading(true)
    setError('')
    try {
      const [memberData, history] = await Promise.all([
        api.getMember(session.token, memberId),
        api.listMemberFeeHistory(session.token, memberId),
      ])
      setMember(memberData)
      setFees(history)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao carregar o membro.')
    } finally {
      setLoading(false)
    }
  }, [memberId, session])

  useEffect(() => { void load() }, [load])

  const saveMotorcycle = async (payload: MotorcyclePayload) => {
    if (!session) return
    if (editingMotorcycle) {
      await api.updateMotorcycle(session.token, editingMotorcycle.id, payload)
      setNotice('Motocicleta atualizada.')
    } else {
      await api.createMotorcycle(session.token, memberId, payload)
      setNotice('Motocicleta cadastrada.')
    }
    setEditingMotorcycle(undefined)
    await load()
  }

  const deleteMotorcycle = async (motorcycle: Motorcycle) => {
    if (!session || !window.confirm(`Excluir a motocicleta ${motorcycle.model}?`)) return
    try {
      await api.deleteMotorcycle(session.token, motorcycle.id)
      setNotice('Motocicleta excluída.')
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao excluir motocicleta.')
    }
  }

  const toggleFee = async (fee: MonthlyFee) => {
    if (!session || !isDiretoria) return
    const status = fee.status === 'PAGO' ? 'PENDENTE' : 'PAGO'
    try {
      await api.updateMonthlyFeeStatus(
        session.token,
        fee.id,
        status,
        status === 'PAGO' ? new Date().toISOString().slice(0, 10) : null,
      )
      setNotice('Status da mensalidade atualizado.')
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao atualizar mensalidade.')
    }
  }

  if (loading) return <LoadingState label="Carregando perfil do membro..." />
  if (error && !member) return <ErrorState message={error} onRetry={() => void load()} />
  if (!member) return <ErrorState message="Membro não encontrado." />

  return (
    <div className="page-stack">
      <Link to="/membros" className="back-link"><ArrowLeft size={17} /> Voltar para membros</Link>
      <PageHeader
        eyebrow="Perfil do integrante"
        title={member.fullName}
        description={`Conhecido no clube como “${member.nickname}”.`}
        actions={<StatusPill status={member.status === 'ATIVO' ? 'Ativo' : 'Inativo'} />}
      />

      {notice && <InlineNotice>{notice}</InlineNotice>}
      {error && <InlineNotice tone="error">{error}</InlineNotice>}

      <section className="profile-layout">
        <article className="profile-card">
          <div className="profile-hero">
            <div className="profile-avatar">{member.nickname.slice(0, 2).toUpperCase()}</div>
            <div><h2>{member.nickname}</h2><span>{member.role}</span></div>
          </div>
          <div className="profile-details">
            <div><Phone size={18} /><span><small>Telefone</small><strong>{member.phone}</strong></span></div>
            <div><UserRound size={18} /><span><small>Emergência</small><strong>{member.emergencyContact}</strong></span></div>
            <div><MapPin size={18} /><span><small>Endereço</small><strong>{member.address}</strong></span></div>
            <div><BloodTypeIndicator bloodType={member.bloodType} size="profile" /></div>
          </div>
        </article>

        <article className="panel profile-main-panel">
          <div className="panel-header">
            <div><span className="eyebrow">Garagem</span><h2>Motocicletas</h2></div>
            {isDiretoria && <button className="button button-secondary" onClick={() => setEditingMotorcycle(null)}><Plus size={17} /> Adicionar</button>}
          </div>
          {member.motorcycles.length === 0 ? (
            <EmptyState title="Garagem vazia" description="Nenhuma motocicleta vinculada a este membro." />
          ) : (
            <div className="motorcycle-grid">
              {member.motorcycles.map((motorcycle) => (
                <div className="motorcycle-card" key={motorcycle.id}>
                  <div className="motorcycle-icon"><Bike size={26} /></div>
                  <div className="motorcycle-main"><strong>{motorcycle.model}</strong><span>{motorcycle.year} · {motorcycle.color}</span></div>
                  <span className="plate">{motorcycle.licensePlate}</span>
                  {isDiretoria && (
                    <div className="row-actions">
                      <button className="icon-button" onClick={() => setEditingMotorcycle(motorcycle)} aria-label="Editar moto"><Pencil size={16} /></button>
                      <button className="icon-button danger" onClick={() => void deleteMotorcycle(motorcycle)} aria-label="Excluir moto"><Trash2 size={16} /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div><span className="eyebrow">Financeiro</span><h2>Histórico de mensalidades</h2></div>
          <CalendarClock size={24} className="panel-heading-icon" />
        </div>
        {fees.length === 0 ? (
          <p className="muted">Nenhuma mensalidade encontrada para este membro.</p>
        ) : (
          <div className="table-responsive">
            <table>
              <thead><tr><th>Referência</th><th>Valor</th><th>Vencimento</th><th>Pagamento</th><th>Status</th><th /></tr></thead>
              <tbody>
                {fees.map((fee) => (
                  <tr key={fee.id}>
                    <td><strong>{monthLabel(fee.referenceMonth)}</strong></td>
                    <td>{formatCurrency(fee.amount)}</td>
                    <td>{formatDate(fee.dueDate)}</td>
                    <td>{formatDate(fee.paymentDate)}</td>
                    <td><StatusPill status={fee.status === 'PAGO' ? 'Pago' : 'Pendente'} /></td>
                    <td>{isDiretoria && <button className="button button-table" onClick={() => void toggleFee(fee)}>Marcar {fee.status === 'PAGO' ? 'pendente' : 'pago'}</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editingMotorcycle !== undefined && (
        <MotorcycleForm
          memberId={memberId}
          initial={editingMotorcycle}
          onClose={() => setEditingMotorcycle(undefined)}
          onSave={saveMotorcycle}
        />
      )}
    </div>
  )
}

function MotorcycleForm({
  memberId,
  initial,
  onClose,
  onSave,
}: {
  memberId: number
  initial: Motorcycle | null
  onClose: () => void
  onSave: (payload: MotorcyclePayload) => Promise<void>
}) {
  const [form, setForm] = useState<MotorcyclePayload>({
    model: initial?.model ?? '',
    year: initial?.year ?? new Date().getFullYear(),
    color: initial?.color ?? '',
    licensePlate: initial?.licensePlate ?? '',
    memberId,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try { await onSave(form) } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao salvar motocicleta.')
    } finally { setSaving(false) }
  }

  return (
    <Modal title={initial ? 'Editar motocicleta' : 'Nova motocicleta'} subtitle="Vincule os dados da moto ao integrante." onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        <div className="form-grid two-columns">
          <label className="field field-span"><span>Modelo</span><input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required /></label>
          <label className="field"><span>Ano</span><input type="number" min="1900" max="2100" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} required /></label>
          <label className="field"><span>Cor</span><input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} required /></label>
          <label className="field field-span"><span>Placa</span><input value={form.licensePlate} onChange={(e) => setForm({ ...form, licensePlate: e.target.value.toUpperCase() })} required /></label>
        </div>
        {error && <InlineNotice tone="error">{error}</InlineNotice>}
        <div className="modal-actions"><button className="button button-ghost" type="button" onClick={onClose}>Cancelar</button><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar motocicleta'}</button></div>
      </form>
    </Modal>
  )
}
