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
            HARVEST<em>SHIELD</em>
          </a>
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
