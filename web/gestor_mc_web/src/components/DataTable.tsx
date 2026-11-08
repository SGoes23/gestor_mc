import type { ReactNode } from 'react'

export function DataTable({
  children,
  standalone = false,
}: {
  children: ReactNode
  standalone?: boolean
}) {
  const table = (
    <div className="table-responsive">
      <table>{children}</table>
    </div>
  )

  return standalone ? <section className="table-card">{table}</section> : table
}

export function MemberIdentity({
  fullName,
  nickname,
  tone = 'default',
  compact = false,
  quoteNickname = false,
}: {
  fullName: string
  nickname: string
  tone?: 'default' | 'alert'
  compact?: boolean
  quoteNickname?: boolean
}) {
  const initials = compact
    ? fullName.slice(0, 1)
    : (nickname || fullName).slice(0, 2)

  return (
    <div className="table-person">
      <div className={`${compact ? 'member-mini-avatar' : 'member-avatar'}${tone === 'alert' ? ' alert-avatar' : ''}`}>
        {initials.toUpperCase()}
      </div>
      <div>
        <strong>{fullName}</strong>
        <span>{quoteNickname ? `“${nickname}”` : nickname}</span>
      </div>
    </div>
  )
}
