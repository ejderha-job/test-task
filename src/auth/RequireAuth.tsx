import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, type UserRole } from './AuthContext'

// Пускает только вошедших пользователей (и, если указано, только с нужной ролью)
export function RequireAuth({ children, role }: { children: ReactNode; role?: UserRole }) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p className="page muted">Загрузка…</p>
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (role && profile?.role !== role) return <Navigate to="/" replace />

  return children
}
