import { Heading, Stack, Text } from '@chakra-ui/react'
import { useParams } from 'react-router-dom'
import { fetchObjectWithTasks } from '../api'
import { BackLink } from '../components/BackLink'
import { ListItemCard } from '../components/ListItemCard'
import { LoadError, Loading } from '../components/Status'
import { TaskStatusBadge } from '../components/TaskStatusBadge'
import { useAsync } from '../hooks/useAsync'
import { formatDate, personName } from '../lib/tasks'

export default function ObjectPage() {
  const { objectId = '' } = useParams()
  const { data, error, loading, reload } = useAsync(
    () => fetchObjectWithTasks(objectId),
    [objectId],
  )

  if (loading) return <Loading />
  if (error || !data?.object)
    return (
      <Stack gap="4">
        <BackLink to="/objects">Объекты</BackLink>
        {error ? <LoadError message={error} onRetry={reload} /> : <Heading>Объект не найден</Heading>}
      </Stack>
    )

  const { object, tasks } = data

  return (
    <Stack gap="6">
      <Stack gap="2">
        <BackLink to="/objects">Объекты</BackLink>
        <Heading size="2xl">{object.name}</Heading>
        <Text color="fg.muted">{object.address}</Text>
      </Stack>

      <Stack gap="3">
        <Heading size="lg">Задачи</Heading>
        {tasks.length === 0 ? (
          <Text color="fg.muted">Задач нет</Text>
        ) : (
          tasks.map((t) => (
            <ListItemCard
              key={t.id}
              to={`/tasks/${t.id}`}
              title={t.title}
              meta={`${personName(t.assignee)} · до ${formatDate(t.due_date)}`}
              aside={<TaskStatusBadge status={t.status} />}
            />
          ))
        )}
      </Stack>
    </Stack>
  )
}
