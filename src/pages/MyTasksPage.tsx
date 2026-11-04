import { Link } from 'react-router-dom'
import { fetchMyTasks } from '../api'
import { useAuth } from '../auth/AuthContext'
import { LoadError, Loading } from '../components/Status'
import { useAsync } from '../hooks/useAsync'
import { formatDate, statusLabels } from '../lib/tasks'

export default function MyTasksPage() {
  const { profile } = useAuth()
  const userId = profile?.id ?? ''
  const { data: tasks, error, loading, reload } = useAsync(() => fetchMyTasks(userId), [userId])

  return (
    <main className="page">
      <h1>Мои задачи</h1>
      {loading ? (
        <Loading />
      ) : error ? (
        <LoadError message={error} onRetry={reload} />
      ) : tasks?.length === 0 ? (
        <p className="muted">Открытых задач нет</p>
      ) : (
        <ul className="list">
          {tasks?.map((t) => (
            <li key={t.id}>
              <Link to={`/tasks/${t.id}`}>{t.title}</Link>
              <div className="muted">
                {t.object?.name} · {statusLabels[t.status]} · до {formatDate(t.due_date)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
