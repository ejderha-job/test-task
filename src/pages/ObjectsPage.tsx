import { Link } from 'react-router-dom'
import { objects, tasks } from '../data/mock'

export default function ObjectsPage() {
  return (
    <main className="page">
      <h1>Объекты</h1>
      <ul className="list">
        {objects.map((obj) => (
          <li key={obj.id}>
            <Link to={`/objects/${obj.id}`}>{obj.name}</Link>
            <div className="muted">
              {obj.address} · задач: {tasks.filter((t) => t.objectId === obj.id).length}
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
