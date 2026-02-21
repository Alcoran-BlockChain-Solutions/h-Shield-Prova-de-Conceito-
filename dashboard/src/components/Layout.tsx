import { NavLink, Outlet } from 'react-router-dom'
import { ConnectionStatus } from './ConnectionStatus'

const TABS = [
  { to: '/',            label: 'Visão Geral', icon: '🌿', end: true },
  { to: '/analytics',  label: 'Analytics',   icon: '📊' },
  { to: '/devices',    label: 'Dispositivos', icon: '🛰️' },
  { to: '/blockchain', label: 'Blockchain',   icon: '⛓️' },
]

export function Layout() {
  return (
    <div className="layout">
      <header className="topbar">
        <div className="topbar__main">
          <div className="topbar__brand">
            <div className="topbar__logo">🌱</div>
            <span className="topbar__name">
              Harvest<span>Shield</span>
            </span>
          </div>
          <div className="topbar__spacer" />
          <div className="topbar__right">
            <ConnectionStatus />
            <div className="topbar__farm">
              <span>📍</span>
              Fazenda Norte
            </div>
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
              <span className="topbar__tab-icon">{tab.icon}</span>
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
