import { Link, useParams } from 'react-router-dom'
import { objects, statusLabels, tasks, userName } from '../data/mock'

export default function ObjectPage() {
  const { objectId } = useParams()
  const obj = objects.find((o) => o.id === objectId)

  if (!obj) {
    return (
      <main className="page">
        <h1>Объект не найден</h1>
        <Link to="/objects">← К списку объектов</Link>
      </main>
    )
  }

  const objectTasks = tasks.filter((t) => t.objectId === obj.id)

  return (
    <main className="page">
      <Link to="/objects">← Объекты</Link>
      <h1>{obj.name}</h1>
      <p className="muted">{obj.address}</p>

      <h2>Задачи</h2>
      {objectTasks.length === 0 ? (
        <p className="muted">Задач нет</p>
      ) : (
        <ul className="list">
          {objectTasks.map((t) => (
            <li key={t.id}>
              <Link to={`/tasks/${t.id}`}>{t.title}</Link>
              <div className="muted">
                {statusLabels[t.status]} · {userName(t.assigneeId)} · до {t.dueDate}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
