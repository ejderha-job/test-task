// Временные данные, пока нет API.

export type TaskStatus = 'new' | 'in_progress' | 'review' | 'done'

export type User = { id: string; name: string; email: string }

export type SiteObject = { id: string; name: string; address: string }

export type TaskHistoryEntry = { date: string; author: string; text: string }

export type Task = {
  id: string
  objectId: string
  title: string
  description: string
  status: TaskStatus
  assigneeId: string
  dueDate: string
  history: TaskHistoryEntry[]
}

export const statusLabels: Record<TaskStatus, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  review: 'На проверке',
  done: 'Выполнена',
}

// Какие действия доступны в каждом статусе и в какой статус они переводят.
export const statusActions: Record<TaskStatus, { label: string; to: TaskStatus }[]> = {
  new: [{ label: 'Взять в работу', to: 'in_progress' }],
  in_progress: [{ label: 'Отправить на проверку', to: 'review' }],
  review: [
    { label: 'Принять', to: 'done' },
    { label: 'Вернуть в работу', to: 'in_progress' },
  ],
  done: [],
}

export const currentUser: User = { id: 'u1', name: 'Иван Петров', email: 'ivan@example.com' }

export const users: User[] = [
  currentUser,
  { id: 'u2', name: 'Анна Смирнова', email: 'anna@example.com' },
]

export const objects: SiteObject[] = [
  { id: 'o1', name: 'ЖК «Северный»', address: 'ул. Ленина, 10' },
  { id: 'o2', name: 'Офисный центр «Плаза»', address: 'пр. Мира, 25' },
]

export const tasks: Task[] = [
  {
    id: 't1',
    objectId: 'o1',
    title: 'Проверить электрощитовую',
    description: 'Осмотреть щитовую на 1 этаже, составить акт.',
    status: 'new',
    assigneeId: 'u1',
    dueDate: '2026-11-10',
    history: [{ date: '2026-11-01 09:00', author: 'Анна Смирнова', text: 'Задача создана' }],
  },
  {
    id: 't2',
    objectId: 'o1',
    title: 'Замена ламп в подъезде 2',
    description: 'Заменить перегоревшие лампы на 3–5 этажах.',
    status: 'in_progress',
    assigneeId: 'u2',
    dueDate: '2026-11-07',
    history: [
      { date: '2026-10-30 10:00', author: 'Иван Петров', text: 'Задача создана' },
      { date: '2026-10-31 12:30', author: 'Анна Смирнова', text: 'Статус: В работе' },
    ],
  },
  {
    id: 't3',
    objectId: 'o2',
    title: 'Ремонт кондиционера',
    description: 'Кондиционер в переговорной 304 не охлаждает.',
    status: 'review',
    assigneeId: 'u1',
    dueDate: '2026-11-05',
    history: [
      { date: '2026-10-28 08:15', author: 'Анна Смирнова', text: 'Задача создана' },
      { date: '2026-10-29 11:00', author: 'Иван Петров', text: 'Статус: В работе' },
      { date: '2026-11-03 17:40', author: 'Иван Петров', text: 'Статус: На проверке' },
    ],
  },
]

export const userName = (id: string) => users.find((u) => u.id === id)?.name ?? '—'
