import { Link } from 'react-router-dom'
import { fetchObjects } from '../api'
import { LoadError, Loading } from '../components/Status'
import { useAsync } from '../hooks/useAsync'

export default function ObjectsPage() {
  const { data: objects, error, loading, reload } = useAsync(fetchObjects, [])

  return (
    <main className="page">
      <h1>Объекты</h1>
      {loading ? (
        <Loading />
      ) : error ? (
        <LoadError message={error} onRetry={reload} />
      ) : objects?.length === 0 ? (
        <p className="muted">Объектов нет</p>
      ) : (
        <ul className="list">
          {objects?.map((obj) => (
            <li key={obj.id}>
              <Link to={`/objects/${obj.id}`}>{obj.name}</Link>
              <div className="muted">
                {obj.address} · задач: {obj.tasks[0]?.count ?? 0}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
