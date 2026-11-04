import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  objects,
  statusActions,
  statusLabels,
  tasks,
  userName,
  type Task,
  type TaskStatus,
} from '../data/mock'

export default function TaskPage() {
  const { taskId } = useParams()
  const { profile } = useAuth()
  const initial = tasks.find((t) => t.id === taskId)
  // Локальная копия, пока действия не отправляются на сервер
  const [task, setTask] = useState<Task | undefined>(initial)

  if (!task) {
    return (
      <main className="page">
        <h1>Задача не найдена</h1>
        <Link to="/objects">← К списку объектов</Link>
      </main>
    )
  }

  const obj = objects.find((o) => o.id === task.objectId)

  const applyAction = (to: TaskStatus) => {
    // TODO: запрос к API
    setTask({
      ...task,
      status: to,
      history: [
        ...task.history,
        {
          date: new Date().toLocaleString('ru-RU'),
          author: profile?.full_name ?? profile?.email ?? '—',
          text: `Статус: ${statusLabels[to]}`,
        },
      ],
    })
  }

  return (
    <main className="page">
      {obj && <Link to={`/objects/${obj.id}`}>← {obj.name}</Link>}
      <h1>{task.title}</h1>

      <dl className="details">
        <dt>Статус</dt>
        <dd>{statusLabels[task.status]}</dd>
        <dt>Исполнитель</dt>
        <dd>{userName(task.assigneeId)}</dd>
        <dt>Срок</dt>
        <dd>{task.dueDate}</dd>
        <dt>Описание</dt>
        <dd>{task.description}</dd>
      </dl>

      {statusActions[task.status].length > 0 && (
        <div className="actions">
          {statusActions[task.status].map((a) => (
            <button key={a.to} type="button" onClick={() => applyAction(a.to)}>
              {a.label}
            </button>
          ))}
        </div>
      )}

      <h2>История</h2>
      <ul className="list">
        {[...task.history].reverse().map((h, i) => (
          <li key={i}>
            {h.text}
            <div className="muted">
              {h.date} · {h.author}
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
