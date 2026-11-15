import { CheckCircle2, Download, FileCheck2, FileUp, Landmark, Pencil, Plus, RefreshCw, RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { DataTable } from '../components/DataTable'
import { ModalFormActions } from '../components/FormControls'
import { EmptyState, ErrorState, InlineNotice, LoadingState, Modal, PageHeader, StatusPill } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { currentDate, formatCurrency, formatDate } from '../lib/format'
import type { AccountPayable } from '../types'

type AttachmentKind = 'document' | 'paymentProof'

const readableSize = (bytes: number) => bytes < 1024 * 1024
  ? `${Math.max(1, Math.round(bytes / 1024))} KB`
  : `${(bytes / 1024 / 1024).toFixed(1)} MB`

export function AccountsPayablePage() {
  const { session, isDiretoria } = useAuth()
  const [accounts, setAccounts] = useState<AccountPayable[]>([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [paymentAccount, setPaymentAccount] = useState<AccountPayable | null>(null)
  const [replacement, setReplacement] = useState<{ account: AccountPayable; kind: AttachmentKind } | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    if (!session) return
    setLoading(true); setError('')
    try { setAccounts(await api.listAccountsPayable(session.token)) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao carregar as contas.') }
    finally { setLoading(false) }
  }, [session])

  useEffect(() => { void load() }, [load])

  const summary = useMemo(() => ({
    pending: accounts.filter((account) => account.status === 'PENDENTE'),
    paid: accounts.filter((account) => account.status === 'PAGO'),
  }), [accounts])

  const reopen = async (account: AccountPayable) => {
    if (!session || !isDiretoria) return
    setWorking(true); setError(''); setNotice('')
    try {
      await api.updateAccountPayableStatus(session.token, account.id, 'PENDENTE', null)
      setNotice('Conta reaberta com sucesso. O comprovante foi preservado.')
      await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao reabrir a conta.') }
    finally { setWorking(false) }
  }

  const download = async (account: AccountPayable, kind: AttachmentKind) => {
    if (!session) return
    setWorking(true); setError('')
    try {
      const blob = kind === 'document'
        ? await api.downloadAccountPayableDocument(session.token, account.id)
        : await api.downloadAccountPayablePaymentProof(session.token, account.id)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = kind === 'document' ? account.documentName : account.paymentProofName ?? 'comprovante'
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao baixar o arquivo.') }
    finally { setWorking(false) }
  }

  const saved = async (message: string) => {
    setShowForm(false); setPaymentAccount(null); setReplacement(null); setNotice(message)
    await load()
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Financeiro"
        title="Contas a pagar"
        description="Registre despesas, anexe documentos e mantenha os comprovantes de pagamento organizados."
        actions={<>
          <button className="button button-secondary" onClick={() => void load()}><RefreshCw size={17} /> Atualizar</button>
          {isDiretoria && <button className="button button-primary" onClick={() => setShowForm(true)}><Plus size={17} /> Nova conta</button>}
        </>}
      />

      {notice && <InlineNotice>{notice}</InlineNotice>}
      {error && <InlineNotice tone="error">{error}</InlineNotice>}

      <section className="fee-summary-grid">
        <article><div className="summary-icon"><Landmark size={21} /></div><span>Total cadastrado</span><strong>{formatCurrency(accounts.reduce((sum, item) => sum + item.amount, 0))}</strong><small>{accounts.length} contas</small></article>
        <article><div className="summary-icon warning"><FileUp size={21} /></div><span>Em aberto</span><strong>{formatCurrency(summary.pending.reduce((sum, item) => sum + item.amount, 0))}</strong><small>{summary.pending.length} pendências</small></article>
        <article><div className="summary-icon success"><CheckCircle2 size={21} /></div><span>Pago</span><strong>{formatCurrency(summary.paid.reduce((sum, item) => sum + item.amount, 0))}</strong><small>{summary.paid.length} pagamentos</small></article>
      </section>

      <section className="panel">
        <div className="panel-header"><div><span className="eyebrow">Lançamentos</span><h2>Relação de contas</h2></div></div>
        {loading && <LoadingState label="Carregando contas..." />}
        {!loading && error && accounts.length === 0 && <ErrorState message={error} onRetry={() => void load()} />}
        {!loading && !error && accounts.length === 0 && <EmptyState title="Nenhuma conta cadastrada" description="Cadastre a primeira conta e anexe o boleto, nota ou documento correspondente." />}
        {!loading && accounts.length > 0 && (
          <DataTable>
            <thead><tr><th>Conta</th><th>Valor</th><th>Vencimento</th><th>Pagamento</th><th>Arquivos</th><th>Status</th><th /></tr></thead>
            <tbody>{accounts.map((account) => (
              <tr key={account.id}>
                <td><strong className="table-primary">{account.description}</strong></td>
                <td><strong>{formatCurrency(account.amount)}</strong></td>
                <td>{formatDate(account.dueDate)}</td>
                <td>{formatDate(account.paidDate)}</td>
                <td><div className="attachment-list">
                  <AttachmentRow label="Documento" name={account.documentName} size={account.documentSize} disabled={working} onDownload={() => void download(account, 'document')} onReplace={isDiretoria ? () => setReplacement({ account, kind: 'document' }) : undefined} />
                  {account.hasPaymentProof && account.paymentProofName && account.paymentProofSize != null
                    ? <AttachmentRow label="Comprovante" name={account.paymentProofName} size={account.paymentProofSize} disabled={working} onDownload={() => void download(account, 'paymentProof')} onReplace={isDiretoria ? () => setReplacement({ account, kind: 'paymentProof' }) : undefined} />
                    : account.status === 'PAGO' && isDiretoria && <button className="attachment-missing" type="button" onClick={() => setReplacement({ account, kind: 'paymentProof' })}><FileCheck2 size={14} /> Enviar comprovante</button>}
                </div></td>
                <td><StatusPill status={account.status === 'PAGO' ? 'Pago' : 'Pendente'} /></td>
                <td>{isDiretoria && (account.status === 'PAGO'
                  ? <button className="button button-table" disabled={working} onClick={() => void reopen(account)}><RotateCcw size={14} /> Reabrir</button>
                  : <button className="button button-table" disabled={working} onClick={() => setPaymentAccount(account)}><CheckCircle2 size={14} /> Marcar paga</button>)}</td>
              </tr>
            ))}</tbody>
          </DataTable>
        )}
      </section>

      {showForm && <AccountPayableForm submitting={working} onClose={() => setShowForm(false)} onSaved={() => saved('Conta cadastrada e documento enviado com sucesso.')} onError={setError} />}
      {paymentAccount && <PaymentModal account={paymentAccount} onClose={() => setPaymentAccount(null)} onSaved={() => saved('Conta marcada como paga.')} onError={setError} />}
      {replacement && <ReplaceAttachmentModal account={replacement.account} kind={replacement.kind} onClose={() => setReplacement(null)} onSaved={() => saved(replacement.kind === 'document' ? 'Documento substituído com sucesso.' : 'Comprovante enviado com sucesso.')} onError={setError} />}
    </div>
  )
}

function AttachmentRow({ label, name, size, disabled, onDownload, onReplace }: { label: string; name: string; size: number; disabled: boolean; onDownload: () => void; onReplace?: () => void }) {
  return <div className="attachment-row"><button className="document-button" type="button" disabled={disabled} onClick={onDownload}><Download size={15} /><span><small>{label}</small><strong>{name}</strong><small>{readableSize(size)}</small></span></button>{onReplace && <button className="attachment-replace" type="button" onClick={onReplace} title={`Substituir ${label.toLowerCase()}`} aria-label={`Substituir ${label.toLowerCase()}`}><Pencil size={13} /></button>}</div>
}

function FileField({ label, required = true, onChange }: { label: string; required?: boolean; onChange: (file: File | null) => void }) {
  return <label className="field field-span file-field"><span>{label}</span><input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => onChange(event.target.files?.[0] ?? null)} required={required} /><small>PDF, JPG, PNG ou WebP, com no máximo 10 MB.</small></label>
}

function AccountPayableForm({ submitting, onClose, onSaved, onError }: { submitting: boolean; onClose: () => void; onSaved: () => Promise<void>; onError: (message: string) => void }) {
  const { session } = useAuth()
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState(currentDate())
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (!session || !file) return
    setSaving(true); onError('')
    try { await api.createAccountPayable(session.token, { description: description.trim(), amount: Number(amount.replace(',', '.')), dueDate, file }); await onSaved() }
    catch (cause) { onError(cause instanceof Error ? cause.message : 'Falha ao cadastrar a conta.') }
    finally { setSaving(false) }
  }
  return <Modal title="Nova conta a pagar" subtitle="O documento será armazenado no bucket privado gestor-mc-contas." onClose={onClose}><form className="modal-form" onSubmit={submit}><div className="form-grid two-columns">
    <label className="field field-span"><span>Conta / descrição</span><input maxLength={180} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ex.: Energia elétrica da sede" required /></label>
    <label className="field"><span>Valor</span><input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0,00" required /></label>
    <label className="field"><span>Vencimento</span><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required /></label>
    <FileField label="Documento da conta" onChange={setFile} />
  </div><ModalFormActions onCancel={onClose} submitting={saving || submitting} submitLabel="Cadastrar conta" submittingLabel="Enviando..." /></form></Modal>
}

function PaymentModal({ account, onClose, onSaved, onError }: { account: AccountPayable; onClose: () => void; onSaved: () => Promise<void>; onError: (message: string) => void }) {
  const { session } = useAuth()
  const [paidDate, setPaidDate] = useState(currentDate())
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (!session) return
    setSaving(true); onError('')
    try { await api.markAccountPayablePaid(session.token, account.id, paidDate, file); await onSaved() }
    catch (cause) { onError(cause instanceof Error ? cause.message : 'Falha ao registrar o pagamento.') }
    finally { setSaving(false) }
  }
  return <Modal title="Registrar pagamento" subtitle={`${account.description} — ${formatCurrency(account.amount)}`} onClose={onClose}><form className="modal-form" onSubmit={submit}><div className="form-grid"><label className="field"><span>Data do pagamento</span><input type="date" value={paidDate} onChange={(event) => setPaidDate(event.target.value)} required /></label><FileField label="Comprovante de pagamento (opcional)" required={false} onChange={setFile} /></div><ModalFormActions onCancel={onClose} submitting={saving} submitLabel="Confirmar pagamento" submittingLabel="Enviando..." /></form></Modal>
}

function ReplaceAttachmentModal({ account, kind, onClose, onSaved, onError }: { account: AccountPayable; kind: AttachmentKind; onClose: () => void; onSaved: () => Promise<void>; onError: (message: string) => void }) {
  const { session } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const isProof = kind === 'paymentProof'
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (!session || !file) return
    setSaving(true); onError('')
    try {
      if (isProof) await api.replaceAccountPayablePaymentProof(session.token, account.id, file)
      else await api.replaceAccountPayableDocument(session.token, account.id, file)
      await onSaved()
    } catch (cause) { onError(cause instanceof Error ? cause.message : 'Falha ao substituir o arquivo.') }
    finally { setSaving(false) }
  }
  return <Modal title={isProof ? (account.hasPaymentProof ? 'Substituir comprovante' : 'Enviar comprovante') : 'Substituir documento'} subtitle={account.description} onClose={onClose}><form className="modal-form" onSubmit={submit}><div className="form-grid"><FileField label={isProof ? 'Novo comprovante' : 'Novo documento da conta'} onChange={setFile} /></div><ModalFormActions onCancel={onClose} submitting={saving} submitLabel={isProof ? 'Salvar comprovante' : 'Substituir documento'} submittingLabel="Enviando..." /></form></Modal>
}
