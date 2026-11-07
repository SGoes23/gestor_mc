import { CalendarDays, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { EmptyState, ErrorState, InlineNotice, LoadingState, Modal, PageHeader } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { eventTypeLabel, formatDate } from '../lib/format'
import type { ClubEvent, EventPayload, EventType } from '../types'

const emptyEvent: EventPayload = {
  title: '',
  type: 'ROLE',
  eventDate: new Date().toISOString().slice(0, 10),
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
                {grouped.past.map((event) => <EventCard key={event.id} event={event} canEdit={isDiretoria} onEdit={() => setEditing(event)} onDelete={() => void remove(event)} />)}
              </div>
            </section>
          )}
        </>
      )}

      {editing !== undefined && <EventForm initial={editing} onClose={() => setEditing(undefined)} onSave={save} />}
    </div>
  )
}

function EventCard({ event, canEdit, onEdit, onDelete }: { event: ClubEvent; canEdit: boolean; onEdit: () => void; onDelete: () => void }) {
  return (
    <article className="event-card">
      <div className="event-card-top">
        <div className="event-date-large"><strong>{event.eventDate.slice(8, 10)}</strong><span>{new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(`${event.eventDate}T12:00:00`)).replace('.', '')}</span></div>
        <span className={`event-type type-${event.type.toLowerCase()}`}>{eventTypeLabel[event.type]}</span>
        {canEdit && <div className="row-actions"><button className="icon-button" onClick={onEdit} aria-label="Editar evento"><Pencil size={16} /></button><button className="icon-button danger" onClick={onDelete} aria-label="Excluir evento"><Trash2 size={16} /></button></div>}
      </div>
      <h3>{event.title}</h3>
      <p>{event.description}</p>
      <div className="event-meta"><span><CalendarDays size={16} /> {formatDate(event.eventDate)}</span><span><MapPin size={16} /> {event.place}</span></div>
    </article>
  )
}

function EventForm({ initial, onClose, onSave }: { initial: ClubEvent | null; onClose: () => void; onSave: (payload: EventPayload) => Promise<void> }) {
  const [form, setForm] = useState<EventPayload>(initial ? {
    title: initial.title, type: initial.type, eventDate: initial.eventDate.slice(0, 10), place: initial.place, description: initial.description,
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
          <label className="field field-span"><span>Local</span><input value={form.place} onChange={(e) => update('place', e.target.value)} required /></label>
          <label className="field field-span"><span>Descrição</span><textarea rows={4} value={form.description} onChange={(e) => update('description', e.target.value)} required /></label>
        </div>
        {error && <InlineNotice tone="error">{error}</InlineNotice>}
        <div className="modal-actions"><button className="button button-ghost" type="button" onClick={onClose}>Cancelar</button><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Salvando...' : initial ? 'Salvar alterações' : 'Cadastrar evento'}</button></div>
      </form>
    </Modal>
  )
}
