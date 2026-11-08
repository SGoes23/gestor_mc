import type { ReactNode } from 'react'

export function MonthField({
  value,
  onChange,
  label = 'Mês de referência',
}: {
  value: string
  onChange: (value: string) => void
  label?: string
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="month" value={value} onChange={(event) => onChange(event.target.value)} required />
    </label>
  )
}

export function ModalFormActions({
  onCancel,
  submitting,
  submitLabel,
  submittingLabel = 'Salvando...',
  children,
}: {
  onCancel: () => void
  submitting: boolean
  submitLabel: string
  submittingLabel?: string
  children?: ReactNode
}) {
  return (
    <div className="modal-actions">
      {children}
      <button className="button button-ghost" type="button" onClick={onCancel}>Cancelar</button>
      <button className="button button-primary" type="submit" disabled={submitting}>
        {submitting ? submittingLabel : submitLabel}
      </button>
    </div>
  )
}
