import { CalendarDays, Check, Clock, MapPin, Pencil, Plus, Share2, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState, ErrorState, InlineNotice, LoadingState, Modal, PageHeader } from '../components/ui'
import { ModalFormActions } from '../components/FormControls'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { currentDate, eventTypeLabel, formatDate } from '../lib/format'
import type { ClubEvent, EventPayload, EventStatus, EventType } from '../types'

const emptyEvent: EventPayload = {
  title: '',
  type: 'ROLE',
  eventDate: currentDate(),
  eventTime: null,
  place: '',
  description: '',
}

export function EventsPage() {
  const { session, isDiretoria } = useAuth()
  const [events, setEvents] = useState<ClubEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState<ClubEvent | null | undefined>(undefined)
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null)

  const load = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError('')
    try {
      setEvents((await api.listEvents(session.token)).sort((a, b) => a.eventDate.localeCompare(b.eventDate)))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao carregar eventos.')
    } finally { setLoading(false) }
  }, [session])

  useEffect(() => { void load() }, [load])

  const grouped = useMemo(() => ({
    upcoming: events.filter((event) => new Date(`${event.eventDate}T23:59:59`).getTime() >= Date.now()),
    past: events.filter((event) => new Date(`${event.eventDate}T23:59:59`).getTime() < Date.now()).reverse(),
  }), [events])

  const save = async (payload: EventPayload) => {
    if (!session) return
    if (editing) {
      await api.updateEvent(session.token, editing.id, payload)
      setNotice('Evento atualizado com sucesso.')
    } else {
      await api.createEvent(session.token, payload)
      setNotice('Evento cadastrado com sucesso.')
    }
    setEditing(undefined)
    await load()
  }

  const remove = async (event: ClubEvent) => {
    if (!session || !window.confirm(`Excluir o evento “${event.title}”?`)) return
    try {
      await api.deleteEvent(session.token, event.id)
      setNotice('Evento excluído com sucesso.')
      await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao excluir evento.') }
  }

  const updateStatus = async (event: ClubEvent, status: EventStatus) => {
    if (!session || event.status === status) return
    setUpdatingStatusId(event.id)
    setError('')
    try {
      const updated = await api.updateEventStatus(session.token, event.id, status)
      setEvents((current) => current.map((item) => item.id === updated.id ? updated : item))
      setNotice(status === 'CONCLUIDO' ? 'Evento marcado como concluído.' : 'Evento marcado como cancelado.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao atualizar o status do evento.')
    } finally {
      setUpdatingStatusId(null)
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Agenda do clube"
        title="Eventos"
        description="Organize passeios, encontros e reuniões em um calendário compartilhado."
        actions={isDiretoria && <button className="button button-primary" onClick={() => setEditing(null)}><Plus size={18} /> Novo evento</button>}
      />
      {notice && <InlineNotice>{notice}</InlineNotice>}
      {loading && <LoadingState label="Carregando calendário..." />}
      {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
      {!loading && !error && events.length === 0 && <EmptyState title="Agenda livre" description="Nenhum evento foi cadastrado ainda." />}

      {!loading && !error && events.length > 0 && (
        <>
          <section className="section-block">
            <div className="section-title"><div><span className="eyebrow">Na estrada</span><h2>Próximos eventos</h2></div><span>{grouped.upcoming.length} programados</span></div>
            <div className="events-grid">
              {grouped.upcoming.length === 0 && <p className="muted">Nenhum compromisso futuro.</p>}
              {grouped.upcoming.map((event) => <EventCard key={event.id} event={event} canEdit={isDiretoria} onEdit={() => setEditing(event)} onDelete={() => void remove(event)} />)}
            </div>
          </section>

          {grouped.past.length > 0 && (
            <section className="section-block past-events">
              <div className="section-title"><div><span className="eyebrow">Memória</span><h2>Eventos realizados</h2></div><span>{grouped.past.length} registros</span></div>
              <div className="events-grid">
                {grouped.past.map((event) => <EventCard key={event.id} event={event} canEdit={isDiretoria} canSetStatus={isDiretoria} updatingStatus={updatingStatusId === event.id} onStatusChange={(status) => void updateStatus(event, status)} onEdit={() => setEditing(event)} onDelete={() => void remove(event)} />)}
              </div>
            </section>
          )}
        </>
      )}

      {editing !== undefined && <EventForm initial={editing} onClose={() => setEditing(undefined)} onSave={save} />}
    </div>
  )
}

function EventCard({ event, canEdit, canSetStatus = false, updatingStatus = false, onStatusChange, onEdit, onDelete }: { event: ClubEvent; canEdit: boolean; canSetStatus?: boolean; updatingStatus?: boolean; onStatusChange?: (status: EventStatus) => void; onEdit: () => void; onDelete: () => void }) {
  const navigate = useNavigate()
  const openDetails = () => navigate(`/eventos/${event.id}`)
  const status = event.status ?? 'AGENDADO'

  const share = async () => {
    const eventUrl = new URL(`/eventos/${event.id}`, window.location.origin).toString()
    const statusLabel: Record<EventStatus, string> = {
      AGENDADO: 'Agendado',
      CONCLUIDO: 'Concluído',
      CANCELADO: 'Cancelado',
    }
    const text = [
      `Evento: ${event.title}`,
      `Tipo: ${eventTypeLabel[event.type]}`,
      `Data: ${formatDate(event.eventDate)}`,
      `Horário: ${event.eventTime ? event.eventTime.slice(0, 5) : 'Não informado'}`,
      `Local: ${event.place}`,
      `Status: ${statusLabel[status]}`,
      `Descrição: ${event.description}`,
    ].join('\n')

    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, text, url: eventUrl })
        return
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === 'AbortError') return
      }
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\nLink: ${eventUrl}`)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <article
      className={`event-card event-card-clickable event-card-${status.toLowerCase()}`}
      role="link"
      tabIndex={0}
      aria-label={`Abrir detalhes e presença do evento ${event.title}`}
      onClick={openDetails}
      onKeyDown={(keyboardEvent) => {
        if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
          keyboardEvent.preventDefault()
          openDetails()
        }
      }}
    >
      {status === 'CONCLUIDO' && <div className="event-completed-banner">Concluído</div>}
      {status === 'CANCELADO' && <div className="event-cancelled-ribbon">Cancelado</div>}
      <div className="event-card-top">
        <div className="event-date-large"><strong>{event.eventDate.slice(8, 10)}</strong><span>{new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(`${event.eventDate}T12:00:00`)).replace('.', '')}</span></div>
        <span className={`event-type type-${event.type.toLowerCase()}`}>{eventTypeLabel[event.type]}</span>
        <div className="row-actions">
          <button className="event-share-button" onClick={(clickEvent) => { clickEvent.stopPropagation(); void share() }} aria-label={`Compartilhar evento ${event.title}`} title="Compartilhar"><Share2 size={14} /></button>
          {canSetStatus && <>
            <button className={`event-status-button complete${status === 'CONCLUIDO' ? ' active' : ''}`} disabled={updatingStatus} onClick={(clickEvent) => { clickEvent.stopPropagation(); onStatusChange?.('CONCLUIDO') }} aria-label="Marcar evento como concluído" title="Concluído"><Check size={14} /></button>
            <button className={`event-status-button cancel${status === 'CANCELADO' ? ' active' : ''}`} disabled={updatingStatus} onClick={(clickEvent) => { clickEvent.stopPropagation(); onStatusChange?.('CANCELADO') }} aria-label="Marcar evento como cancelado" title="Cancelado"><X size={14} /></button>
          </>}
          {canEdit && <><button className="icon-button" onClick={(clickEvent) => { clickEvent.stopPropagation(); onEdit() }} aria-label="Editar evento"><Pencil size={16} /></button><button className="icon-button danger" onClick={(clickEvent) => { clickEvent.stopPropagation(); onDelete() }} aria-label="Excluir evento"><Trash2 size={16} /></button></>}
        </div>
      </div>
      <h3>{event.title}</h3>
      <p>{event.description}</p>
      <div className="event-meta"><span><CalendarDays size={16} /> {formatDate(event.eventDate)}</span>{event.eventTime && <span><Clock size={16} /> {event.eventTime.slice(0, 5)}</span>}<span><MapPin size={16} /> {event.place}</span></div>
    </article>
  )
}

function EventForm({ initial, onClose, onSave }: { initial: ClubEvent | null; onClose: () => void; onSave: (payload: EventPayload) => Promise<void> }) {
  const [form, setForm] = useState<EventPayload>(initial ? {
    title: initial.title, type: initial.type, eventDate: initial.eventDate.slice(0, 10), eventTime: initial.eventTime, place: initial.place, description: initial.description,
  } : emptyEvent)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const update = <K extends keyof EventPayload>(key: K, value: EventPayload[K]) => setForm((current) => ({ ...current, [key]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError('')
    try { await onSave(form) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao salvar evento.') } finally { setSaving(false) }
  }

  return (
    <Modal title={initial ? 'Editar evento' : 'Novo evento'} subtitle="Compartilhe o próximo compromisso com todo o clube." onClose={onClose} wide>
      <form className="modal-form" onSubmit={submit}>
        <div className="form-grid two-columns">
          <label className="field field-span"><span>Título</span><input value={form.title} onChange={(e) => update('title', e.target.value)} required /></label>
          <label className="field"><span>Tipo</span><select value={form.type} onChange={(e) => update('type', e.target.value as EventType)}><option value="ROLE">Passeio</option><option value="EVENTO">Evento</option><option value="REUNIAO">Reunião</option></select></label>
          <label className="field"><span>Data</span><input type="date" value={form.eventDate} onChange={(e) => update('eventDate', e.target.value)} required /></label>
          <label className="field"><span>Horário</span><input type="time" value={form.eventTime ?? ''} onChange={(e) => update('eventTime', e.target.value || null)} /></label>
          <label className="field field-span"><span>Local</span><input value={form.place} onChange={(e) => update('place', e.target.value)} required /></label>
          <label className="field field-span"><span>Descrição</span><textarea rows={4} value={form.description} onChange={(e) => update('description', e.target.value)} required /></label>
        </div>
        {error && <InlineNotice tone="error">{error}</InlineNotice>}
        <ModalFormActions
          onCancel={onClose}
          submitting={saving}
          submitLabel={initial ? 'Salvar alterações' : 'Cadastrar evento'}
        />
      </form>
    </Modal>
  )
}
