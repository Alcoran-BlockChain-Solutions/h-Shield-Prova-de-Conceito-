import { NavLink, Outlet } from 'react-router-dom'
import { ConnectionStatus } from './ConnectionStatus'

const TABS = [
  { to: '/',            label: 'Visão Geral',  end: true },
  { to: '/analytics',  label: 'Analytics' },
  { to: '/devices',    label: 'Dispositivos' },
  { to: '/blockchain', label: 'Blockchain' },
]

export function Layout() {
  return (
    <div className="layout">
      <header className="topbar">
        <div className="topbar__main">
          <a href="/" className="topbar__brand">
            <div className="topbar__brand-mark">
              <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 1L1 4.5v7L8 15l7-3.5v-7L8 1zm0 1.5l5.5 2.75L8 8 2.5 5.25 8 2.5zM2 6.35l5.5 2.75v5.5L2 11.85V6.35zm7 8.25v-5.5l5.5-2.75v5.5L9 14.6z"/>
              </svg>
            </div>
            <span className="topbar__brand-name">
              Harvest<span>Shield</span>
            </span>
          </a>

          <div className="topbar__divider" />
          <span className="topbar__product">Monitoring Console</span>

          <div className="topbar__spacer" />

          <div className="topbar__right">
            <ConnectionStatus />
            <span className="topbar__farm">Fazenda Norte</span>
          </div>
        </div>

        <nav className="topbar__tabs">
          {TABS.map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `topbar__tab${isActive ? ' topbar__tab--active' : ''}`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="layout__content">
        <Outlet />
      </main>
    </div>
  )
}
