import { Link, useParams } from 'react-router-dom'
import { fetchObjectWithTasks } from '../api'
import { LoadError, Loading } from '../components/Status'
import { useAsync } from '../hooks/useAsync'
import { formatDate, personName, statusLabels } from '../lib/tasks'

export default function ObjectPage() {
  const { objectId = '' } = useParams()
  const { data, error, loading, reload } = useAsync(
    () => fetchObjectWithTasks(objectId),
    [objectId],
  )

  if (loading)
    return (
      <main className="page">
        <Loading />
      </main>
    )
  if (error || !data?.object)
    return (
      <main className="page">
        <Link to="/objects">← Объекты</Link>
        {error ? <LoadError message={error} onRetry={reload} /> : <h1>Объект не найден</h1>}
      </main>
    )

  const { object, tasks } = data

  return (
    <main className="page">
      <Link to="/objects">← Объекты</Link>
      <h1>{object.name}</h1>
      <p className="muted">{object.address}</p>

      <h2>Задачи</h2>
      {tasks.length === 0 ? (
        <p className="muted">Задач нет</p>
      ) : (
        <ul className="list">
          {tasks.map((t) => (
            <li key={t.id}>
              <Link to={`/tasks/${t.id}`}>{t.title}</Link>
              <div className="muted">
                {statusLabels[t.status]} · {personName(t.assignee)} · до {formatDate(t.due_date)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
