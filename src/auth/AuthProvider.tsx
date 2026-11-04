import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { AuthContext, type Profile } from './AuthContext'

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', userId)
    .single()
  if (error) {
    console.error('Не удалось загрузить профиль', error)
    return null
  }
  return data
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Срабатывает сразу с текущей сессией (INITIAL_SESSION), затем на вход/выход/обновление токена
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (!newSession) {
        setProfile(null)
        setLoading(false)
        return
      }
      // Запросы к Supabase внутри колбэка нельзя ждать — это блокирует клиент, поэтому откладываем
      setTimeout(async () => {
        setProfile(await fetchProfile(newSession.user.id))
        setLoading(false)
      }, 0)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) return { error: null }
    return {
      error: error.message === 'Invalid login credentials' ? 'Неверный email или пароль' : error.message,
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
