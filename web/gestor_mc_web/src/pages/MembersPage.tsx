import { Eye, Pencil, Plus, Search, Trash2, UsersRound } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { BloodTypeIndicator } from '../components/BloodTypeIndicator'
import { EmptyState, ErrorState, InlineNotice, LoadingState, Modal, PageHeader, StatusPill } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { bloodTypeLabel } from '../lib/format'
import type { BloodType, MemberPayload, MemberStatus, MemberSummary } from '../types'

const emptyMember: MemberPayload = {
  fullName: '',
  nickname: '',
  phone: '',
  bloodType: 'O_POSITIVE',
  emergencyContact: '',
  address: '',
  role: 'Membro',
  status: 'ATIVO',
}

export function MembersPage() {
  const { session, isDiretoria } = useAuth()
  const [members, setMembers] = useState<MemberSummary[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState<MemberSummary | null | undefined>(undefined)

  const load = useCallback(async (search = query) => {
    if (!session) return
    setLoading(true)
    setError('')
    try {
      setMembers(await api.listMembers(session.token, search.trim()))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao carregar membros.')
    } finally {
      setLoading(false)
    }
  }, [query, session])

  useEffect(() => { void load('') }, [session]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    void load(query)
  }

  const handleSave = async (payload: MemberPayload) => {
    if (!session) return
    if (editing) {
      await api.updateMember(session.token, editing.id, payload)
      setNotice('Cadastro atualizado com sucesso.')
    } else {
      await api.createMember(session.token, payload)
      setNotice('Novo membro cadastrado com sucesso.')
    }
    setEditing(undefined)
    await load()
  }

  const handleDelete = async (member: MemberSummary) => {
    if (!session || !window.confirm(`Excluir o cadastro de ${member.fullName}?`)) return
    try {
      await api.deleteMember(session.token, member.id)
      setNotice('Membro excluído com sucesso.')
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao excluir membro.')
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Pessoas"
        title="Membros"
        description="Consulte cadastros, funções e informações dos integrantes do clube."
        actions={isDiretoria && (
          <button className="button button-primary" type="button" onClick={() => setEditing(null)}>
            <Plus size={18} /> Novo membro
          </button>
        )}
      />

      {notice && <InlineNotice>{notice}</InlineNotice>}

      <section className="toolbar-card">
        <form className="search-form" onSubmit={handleSearch}>
          <Search size={19} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome ou apelido"
            aria-label="Buscar membros"
          />
          <button className="button button-secondary" type="submit">Buscar</button>
        </form>
        <span className="result-count"><strong>{members.length}</strong> resultados</span>
      </section>

      {loading && <LoadingState label="Carregando membros..." />}
      {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
      {!loading && !error && members.length === 0 && (
        <EmptyState
          title="Nenhum membro encontrado"
          description="Ajuste a busca ou cadastre o primeiro integrante do clube."
          action={isDiretoria && <button className="button button-primary" onClick={() => setEditing(null)}>Cadastrar membro</button>}
        />
      )}

      {!loading && !error && members.length > 0 && (
        <section className="table-card">
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Membro</th>
                  <th>Contato</th>
                  <th>Cargo</th>
                  <th>Tipo sanguíneo</th>
                  <th>Status</th>
                  <th><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div className="table-person">
                        <div className="member-avatar">{member.nickname.slice(0, 2).toUpperCase()}</div>
                        <div><strong>{member.fullName}</strong><span>“{member.nickname}”</span></div>
                      </div>
                    </td>
                    <td><strong className="table-primary">{member.phone}</strong><span className="table-secondary">Emergência: {member.emergencyContact}</span></td>
                    <td>{member.role}</td>
                    <td><BloodTypeIndicator bloodType={member.bloodType} /></td>
                    <td><StatusPill status={member.status === 'ATIVO' ? 'Ativo' : 'Inativo'} /></td>
                    <td>
                      <div className="row-actions">
                        <Link className="icon-button" to={`/membros/${member.id}`} aria-label={`Ver ${member.fullName}`} title="Ver detalhes"><Eye size={18} /></Link>
                        {isDiretoria && (
                          <>
                            <button className="icon-button" onClick={() => setEditing(member)} aria-label="Editar" title="Editar"><Pencil size={17} /></button>
                            <button className="icon-button danger" onClick={() => void handleDelete(member)} aria-label="Excluir" title="Excluir"><Trash2 size={17} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {editing !== undefined && (
        <MemberForm
          initial={editing}
          onClose={() => setEditing(undefined)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function MemberForm({
  initial,
  onClose,
  onSave,
}: {
  initial: MemberSummary | null
  onClose: () => void
  onSave: (payload: MemberPayload) => Promise<void>
}) {
  const [form, setForm] = useState<MemberPayload>(initial ? {
    fullName: initial.fullName,
    nickname: initial.nickname,
    phone: initial.phone,
    bloodType: initial.bloodType,
    emergencyContact: initial.emergencyContact,
    address: initial.address,
    role: initial.role,
    status: initial.status,
  } : emptyMember)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const update = <K extends keyof MemberPayload>(key: K, value: MemberPayload[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onSave(form)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao salvar cadastro.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={initial ? 'Editar membro' : 'Novo membro'}
      subtitle="Preencha as informações pessoais e administrativas."
      onClose={onClose}
      wide
    >
      <form className="modal-form" onSubmit={submit}>
        <div className="form-grid two-columns">
          <label className="field"><span>Nome completo</span><input value={form.fullName} onChange={(e) => update('fullName', e.target.value)} required /></label>
          <label className="field"><span>Apelido</span><input value={form.nickname} onChange={(e) => update('nickname', e.target.value)} required /></label>
          <label className="field"><span>Telefone</span><input value={form.phone} onChange={(e) => update('phone', e.target.value)} required /></label>
          <label className="field"><span>Contato de emergência</span><input value={form.emergencyContact} onChange={(e) => update('emergencyContact', e.target.value)} required /></label>
          <label className="field field-span"><span>Endereço</span><input value={form.address} onChange={(e) => update('address', e.target.value)} required /></label>
          <label className="field"><span>Cargo</span><input value={form.role} onChange={(e) => update('role', e.target.value)} required /></label>
          <label className="field"><span>Tipo sanguíneo</span>
            <select value={form.bloodType} onChange={(e) => update('bloodType', e.target.value as BloodType)}>
              {(Object.entries(bloodTypeLabel) as [BloodType, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="field"><span>Status</span>
            <select value={form.status} onChange={(e) => update('status', e.target.value as MemberStatus)}>
              <option value="ATIVO">Ativo</option><option value="INATIVO">Inativo</option>
            </select>
          </label>
        </div>
        {error && <InlineNotice tone="error">{error}</InlineNotice>}
        <div className="modal-actions">
          <button className="button button-ghost" type="button" onClick={onClose}>Cancelar</button>
          <button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Salvando...' : initial ? 'Salvar alterações' : 'Cadastrar membro'}</button>
        </div>
      </form>
    </Modal>
  )
}
