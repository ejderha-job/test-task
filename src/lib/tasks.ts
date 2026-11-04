import type { Database } from './database.types'
import type { Profile } from '../auth/AuthContext'

export type TaskStatus = Database['public']['Enums']['task_status']

export const statusLabels: Record<TaskStatus, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  review: 'На проверке',
  done: 'Выполнена',
}

type Transition = { label: string; to: TaskStatus; by: 'assignee' | 'provider' }

// Должно совпадать с проверкой в public.change_task_status (supabase/migrations) —
// здесь только для показа кнопок, решает всё равно база.
const transitions: Record<TaskStatus, Transition[]> = {
  new: [{ label: 'Взять в работу', to: 'in_progress', by: 'assignee' }],
  in_progress: [{ label: 'Отправить на проверку', to: 'review', by: 'assignee' }],
  review: [
    { label: 'Принять', to: 'done', by: 'provider' },
    { label: 'Вернуть в работу', to: 'in_progress', by: 'provider' },
  ],
  done: [],
}

export function availableActions(
  task: { status: TaskStatus; assignee_id: string | null },
  profile: Profile | null,
) {
  if (!profile) return []
  return transitions[task.status].filter((t) =>
    t.by === 'provider'
      ? profile.role === 'provider'
      : profile.role === 'executor' && task.assignee_id === profile.id,
  )
}

export const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('ru-RU') : '—'

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })

export const personName = (p: { full_name: string | null; email: string } | null, fallback = '—') =>
  p ? (p.full_name ?? p.email) : fallback

export const assigneeName = (p: { full_name: string | null; email: string } | null) =>
  personName(p, 'Не назначен')
