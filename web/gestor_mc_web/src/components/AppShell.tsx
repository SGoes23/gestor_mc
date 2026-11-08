import {
  CalendarDays,
  ClipboardCheck,
  ChevronRight,
  Gauge,
  LogOut,
  Menu,
  ReceiptText,
  ShieldAlert,
  UsersRound,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navigation = [
  { to: '/', label: 'Visão geral', icon: Gauge, end: true },
  { to: '/membros', label: 'Membros', icon: UsersRound },
  { to: '/eventos', label: 'Eventos', icon: CalendarDays },
  { to: '/presencas', label: 'Presenças', icon: ClipboardCheck },
  { to: '/mensalidades', label: 'Mensalidades', icon: ReceiptText },
  { to: '/inadimplentes', label: 'Inadimplentes', icon: ShieldAlert },
]

export function AppShell() {
  const { session, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="app-shell">
      <aside className={`sidebar${menuOpen ? ' sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <span>L</span>
          </div>
          <div>
            <strong>Leopardos</strong>
            <span>Moto Clube</span>
          </div>
          <button className="icon-button mobile-only" onClick={() => setMenuOpen(false)} aria-label="Fechar menu">
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-kicker">Gestão do clube</div>
        <nav className="main-nav" aria-label="Navegação principal">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => (isActive ? 'nav-link nav-active' : 'nav-link')}
            >
              <Icon size={20} strokeWidth={1.8} />
              <span>{label}</span>
              <ChevronRight className="nav-chevron" size={16} />
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="avatar">{session?.email.slice(0, 1).toUpperCase()}</div>
            <div>
              <strong>{session?.email.split('@')[0]}</strong>
              <span>{session?.profile === 'ADMINISTRATIVO' ? 'Administrativo' : session?.profile === 'DIRETORIA' ? 'Diretoria' : 'Membro'}</span>
            </div>
          </div>
          <button className="logout-button" type="button" onClick={logout}>
            <LogOut size={18} />
            Encerrar sessão
          </button>
        </div>
      </aside>

      {menuOpen && <button className="sidebar-scrim" onClick={() => setMenuOpen(false)} aria-label="Fechar menu" />}

      <div className="content-shell">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Abrir menu">
            <Menu size={22} />
          </button>
          <div className="topbar-title">
            <span>Leopardos MC</span>
            <small>Painel administrativo</small>
          </div>
          <div className="topbar-role">{session?.profile === 'ADMINISTRATIVO' ? 'Acesso administrativo' : session?.profile === 'DIRETORIA' ? 'Acesso diretoria' : 'Acesso membro'}</div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
