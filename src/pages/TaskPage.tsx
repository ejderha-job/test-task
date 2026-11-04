import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { changeTaskStatus, fetchTask } from '../api'
import { useAuth } from '../auth/AuthContext'
import { LoadError, Loading } from '../components/Status'
import { useAsync } from '../hooks/useAsync'
import {
  availableActions,
  formatDate,
  formatDateTime,
  personName,
  statusLabels,
  type TaskStatus,
} from '../lib/tasks'

export default function TaskPage() {
  const { taskId = '' } = useParams()
  const { profile } = useAuth()
  const { data: task, error, loading, reload } = useAsync(() => fetchTask(taskId), [taskId])
  const [pending, setPending] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Первая загрузка; при перезапросе после действия показываем старые данные
  if (loading && !task)
    return (
      <main className="page">
        <Loading />
      </main>
    )
  if (error || !task)
    return (
      <main className="page">
        <Link to="/objects">← Объекты</Link>
        {error ? <LoadError message={error} onRetry={reload} /> : <h1>Задача не найдена</h1>}
      </main>
    )

  const applyAction = async (to: TaskStatus) => {
    setPending(true)
    setActionError(null)
    try {
      await changeTaskStatus(task.id, to)
      reload()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e))
    } finally {
      setPending(false)
    }
  }

  const actions = availableActions(task, profile)

  return (
    <main className="page">
      {task.object && <Link to={`/objects/${task.object.id}`}>← {task.object.name}</Link>}
      <h1>{task.title}</h1>

      <dl className="details">
        <dt>Статус</dt>
        <dd>{statusLabels[task.status]}</dd>
        <dt>Исполнитель</dt>
        <dd>{personName(task.assignee)}</dd>
        <dt>Срок</dt>
        <dd>{formatDate(task.due_date)}</dd>
        <dt>Описание</dt>
        <dd>{task.description || '—'}</dd>
      </dl>

      {actions.length > 0 && (
        <div className="actions">
          {actions.map((a) => (
            <button
              key={a.to}
              type="button"
              disabled={pending || loading}
              onClick={() => applyAction(a.to)}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
      {actionError && <p className="error">{actionError}</p>}

      <h2>История</h2>
      {task.history.length === 0 ? (
        <p className="muted">Пусто</p>
      ) : (
        <ul className="list">
          {task.history.map((h) => (
            <li key={h.id}>
              {h.text}
              <div className="muted">
                {formatDateTime(h.created_at)} · {personName(h.author)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
