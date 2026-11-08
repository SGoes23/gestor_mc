import { bloodTypeLabel } from '../lib/format'
import type { BloodType } from '../types'

export function BloodTypeIndicator({
  bloodType,
  size = 'table',
}: {
  bloodType: BloodType
  size?: 'table' | 'profile'
}) {
  const label = bloodTypeLabel[bloodType]
  const isPositive = bloodType.endsWith('_POSITIVE')
  const group = label.replace(/[+−-]/g, '')

  return (
    <span
      className={`blood-type-indicator blood-type-indicator-${size}`}
      aria-label={`Tipo sanguíneo ${label}`}
      title={`Tipo sanguíneo ${label}`}
    >
      {size === 'profile' && <small>Tipo sanguíneo</small>}
      <span className="blood-type-value">
        <strong>{group}</strong>
        <span
          className={isPositive ? 'blood-factor blood-factor-positive' : 'blood-factor blood-factor-negative'}
          aria-hidden="true"
        />
      </span>
    </span>
  )
}
