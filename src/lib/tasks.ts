import type { Database } from './database.types'
import type { Profile } from '../auth/AuthContext'

export type TaskStatus = Database['public']['Enums']['task_status']

export const statusLabels: Record<TaskStatus, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  review: 'На проверке',
  accepted: 'Принята',
  rework: 'На доработке',
}

// Архив — не статус, а признак tasks.archived_at: архивная задача заморожена целиком
type TaskState = { status: TaskStatus; archived_at: string | null }

type Transition = { label: string; to: TaskStatus; by: 'assignee' | 'provider' }

// Должно совпадать с проверкой в public.change_task_status (supabase/migrations) —
// здесь только для показа кнопок, решает всё равно база.
const transitions: Record<TaskStatus, Transition[]> = {
  new: [{ label: 'Взять в работу', to: 'in_progress', by: 'assignee' }],
  in_progress: [{ label: 'Отправить на проверку', to: 'review', by: 'assignee' }],
  // «Вернуть на доработку» (→ rework) — отдельная кнопка с обязательным комментарием (ReturnForReworkDialog)
  review: [{ label: 'Принять', to: 'accepted', by: 'provider' }],
  rework: [{ label: 'Взять в работу', to: 'in_progress', by: 'assignee' }],
  accepted: [],
}

const isActive = (task: TaskState) => task.archived_at === null

// Постановщик редактирует (update_task) и снимает исполнителя (unassign_task) у непринятых задач
// вне архива; архивировать (archive_task) можно любую задачу вне архива. Должно совпадать с базой.
const isProviderOfOpenTask = (task: TaskState, profile: Profile | null) =>
  profile?.role === 'provider' && isActive(task) && task.status !== 'accepted'

export const canArchiveTask = (task: TaskState, profile: Profile | null) =>
  profile?.role === 'provider' && isActive(task)
export const canAssignTask = canArchiveTask
export const canEditTask = isProviderOfOpenTask
export const canUnassignTask = isProviderOfOpenTask

// review → rework только через return_task_for_rework (с комментарием)
export const canReturnForRework = (task: TaskState, profile: Profile | null) =>
  profile?.role === 'provider' && isActive(task) && task.status === 'review'

export function availableActions(
  task: TaskState & { assignee_id: string | null },
  profile: Profile | null,
) {
  if (!profile || !isActive(task)) return []
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
