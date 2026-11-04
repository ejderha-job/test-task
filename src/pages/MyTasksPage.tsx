import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { objects, statusLabels, tasks, users } from '../data/mock'

export default function MyTasksPage() {
  const { profile } = useAuth()
  // Пока задачи в моках, связываем вошедшего пользователя с моковым по email
  const me = users.find((u) => u.email === profile?.email)
  const myTasks = me ? tasks.filter((t) => t.assigneeId === me.id) : []

  return (
    <main className="page">
      <h1>Мои задачи</h1>
      {myTasks.length === 0 ? (
        <p className="muted">Назначенных задач нет</p>
      ) : (
        <ul className="list">
          {myTasks.map((t) => (
            <li key={t.id}>
              <Link to={`/tasks/${t.id}`}>{t.title}</Link>
              <div className="muted">
                {objects.find((o) => o.id === t.objectId)?.name} · {statusLabels[t.status]} · до{' '}
                {t.dueDate}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
