import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export type UserRole = 'provider' | 'executor'

export type Profile = {
  id: string
  email: string
  full_name: string | null
  role: UserRole
}

export type AuthState = {
  session: Session | null
  profile: Profile | null
  // true, пока не известно, вошёл ли пользователь
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth должен использоваться внутри AuthProvider')
  return ctx
}
