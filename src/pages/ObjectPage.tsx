import { Badge, Heading, HStack, Stack, Text } from '@chakra-ui/react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchObjectWithTasks } from '../api'
import { useAuth } from '../auth/AuthContext'
import { ArchiveObjectDialog } from '../components/ArchiveObjectDialog'
import { BackLink } from '../components/BackLink'
import { EditObjectDialog } from '../components/EditObjectDialog'
import { ListItemCard } from '../components/ListItemCard'
import { NewTaskDialog } from '../components/NewTaskDialog'
import { PageLoadFailed } from '../components/PageLoadFailed'
import { ShowArchivedCheckbox } from '../components/ShowArchivedCheckbox'
import { Loading } from '../components/Status'
import { TaskStatusBadge } from '../components/TaskStatusBadge'
import { useAsync } from '../hooks/useAsync'
import { useShowArchived } from '../hooks/useShowArchived'
import { assigneeName, formatDate, type TaskStatus } from '../lib/tasks'

type ObjectTask = {
  id: string
  title: string
  status: TaskStatus
  archived_at: string | null
  due_date: string | null
  assignee: { full_name: string | null; email: string } | null
}

export default function ObjectPage() {
  const { objectId = '' } = useParams()
  const { profile } = useAuth()
  const [showArchived] = useShowArchived()
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
  const isArchived = object.archived_at !== null
  // Архивный объект только для просмотра
  const canEdit = profile?.role === 'provider' && !isArchived
  // Исполнитель видит архивированные задачи только с включённым флажком; постановщик — всегда
  const isExecutor = profile?.role === 'executor'
  const visibleTasks =
    isExecutor && !showArchived ? tasks.filter((t) => t.archived_at === null) : tasks

  return (
    <Stack gap="6">
      <Stack gap="2">
        <BackLink to="/objects">Объекты</BackLink>
        <HStack justify="space-between" align="start" gap="4" wrap="wrap">
          <HStack gap="3" wrap="wrap">
            <Heading size="2xl">{object.name}</Heading>
            {isArchived && <Badge colorPalette="gray">В архиве</Badge>}
          </HStack>
          {canEdit && <ObjectActions object={object} onSaved={reload} />}
        </HStack>
        <Text color="fg.muted">{object.address}</Text>
      </Stack>

      <Stack gap="3">
        <HStack justify="space-between">
          <Heading size="lg">Задачи</Heading>
          {canEdit && <NewTaskDialog objectId={object.id} onCreated={reload} />}
          {isExecutor && <ShowArchivedCheckbox />}
        </HStack>
        <ObjectTaskList tasks={visibleTasks} />
      </Stack>
    </Stack>
  )
}

function ObjectActions({
  object,
  onSaved,
}: {
  object: { id: string; name: string; address: string }
  onSaved: () => void
}) {
  const navigate = useNavigate()

  return (
    <HStack gap="2">
      <EditObjectDialog object={object} onSaved={onSaved} />
      <ArchiveObjectDialog object={object} onArchived={() => navigate('/objects', { replace: true })} />
    </HStack>
  )
}

function ObjectTaskList({ tasks }: { tasks: ObjectTask[] }) {
  if (tasks.length === 0) return <Text color="fg.muted">Задач нет</Text>

  return tasks.map((t) => (
    <ListItemCard
      key={t.id}
      to={`/tasks/${t.id}`}
      title={t.title}
      meta={`${assigneeName(t.assignee)} · до ${formatDate(t.due_date)}`}
      aside={<TaskStatusBadge status={t.status} />}
      archived={t.archived_at !== null}
    />
  ))
}
