import { Heading, HStack, Stack, Text } from '@chakra-ui/react'
import { useParams } from 'react-router-dom'
import { fetchObjectWithTasks } from '../api'
import { useAuth } from '../auth/AuthContext'
import { BackLink } from '../components/BackLink'
import { ListItemCard } from '../components/ListItemCard'
import { NewTaskDialog } from '../components/NewTaskDialog'
import { PageLoadFailed } from '../components/PageLoadFailed'
import { Loading } from '../components/Status'
import { TaskStatusBadge } from '../components/TaskStatusBadge'
import { useAsync } from '../hooks/useAsync'
import { formatDate, personName, type TaskStatus } from '../lib/tasks'

type ObjectTask = {
  id: string
  title: string
  status: TaskStatus
  due_date: string | null
  assignee: { full_name: string | null; email: string } | null
}

export default function ObjectPage() {
  const { objectId = '' } = useParams()
  const { profile } = useAuth()
  const { data, error, loading, reload } = useAsync(
    () => fetchObjectWithTasks(objectId),
    [objectId],
  )

  // При обновлении после создания задачи показываем старые данные, а не спиннер на всю страницу
  if (loading && !data) return <Loading />
  if (error || !data?.object)
    return (
      <PageLoadFailed
        error={error}
        onRetry={reload}
        notFoundText="Объект не найден"
        backTo="/objects"
        backLabel="Объекты"
      />
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
        <HStack justify="space-between">
          <Heading size="lg">Задачи</Heading>
          {profile?.role === 'provider' && <NewTaskDialog objectId={object.id} onCreated={reload} />}
        </HStack>
        <ObjectTaskList tasks={tasks} />
      </Stack>
    </Stack>
  )
}

function ObjectTaskList({ tasks }: { tasks: ObjectTask[] }) {
  if (tasks.length === 0) return <Text color="fg.muted">Задач нет</Text>

  return tasks.map((t) => (
    <ListItemCard
      key={t.id}
      to={`/tasks/${t.id}`}
      title={t.title}
      meta={`${personName(t.assignee)} · до ${formatDate(t.due_date)}`}
      aside={<TaskStatusBadge status={t.status} />}
    />
  ))
}
