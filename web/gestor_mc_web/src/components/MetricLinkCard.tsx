import { ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function MetricLinkCard({
  to,
  icon,
  title,
  value,
  subtitle,
  tone = 'default',
  compactValue = false,
}: {
  to: string
  icon: ReactNode
  title: string
  value: ReactNode
  subtitle: string
  tone?: 'default' | 'dark' | 'alert'
  compactValue?: boolean
}) {
  const toneClass = tone === 'default' ? '' : ` metric-${tone}`

  return (
    <Link className={`metric-card metric-card-link${toneClass}`} to={to} aria-label={`${title}: abrir página`}>
      <div className="metric-card-top">
        <div className="metric-icon">{icon}</div>
        <span className="metric-link-hint" aria-hidden="true"><ArrowUpRight size={15} /></span>
      </div>
      <span>{title}</span>
      <strong className={compactValue ? 'metric-placeholder' : undefined}>{value}</strong>
      <small>{subtitle}</small>
    </Link>
  )
}
