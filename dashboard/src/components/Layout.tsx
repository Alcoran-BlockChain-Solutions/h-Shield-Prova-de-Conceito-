import { NavLink, Outlet } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { ConnectionStatus } from './ConnectionStatus'

export function Layout() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="layout">
      <header className="layout__header">
        <div className="layout__brand">
          <h1>HarvestShield</h1>
        </div>

        <nav className="layout__nav">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `layout__nav-link ${isActive ? 'layout__nav-link--active' : ''}`
            }
          >
            Realtime
          </NavLink>
          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              `layout__nav-link ${isActive ? 'layout__nav-link--active' : ''}`
            }
          >
            Analytics
          </NavLink>
        </nav>

        <div className="layout__actions">
          <ConnectionStatus />
          <button
            onClick={toggleTheme}
            className="layout__theme-toggle"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      <main className="layout__content">
        <Outlet />
      </main>
    </div>
  )
}
