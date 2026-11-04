import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import './App.css'

const roleLabels = { provider: 'Постановщик', executor: 'Исполнитель' } as const

// Общий каркас для страниц после входа
export default function App() {
  const { profile, signOut } = useAuth()

  return (
    <>
      <nav className="nav">
        <NavLink to="/objects">Объекты</NavLink>
        {profile?.role === 'executor' && <NavLink to="/my-tasks">Мои задачи</NavLink>}
        <span className="nav-user muted">
          {profile ? `${profile.full_name ?? profile.email} · ${roleLabels[profile.role]}` : ''}
        </span>
        <button type="button" className="nav-exit" onClick={signOut}>
          Выйти
        </button>
      </nav>
      <Outlet />
    </>
  )
}
