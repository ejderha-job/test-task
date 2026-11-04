import { Heading, HStack, Stack, Text } from '@chakra-ui/react'
import { fetchMyTasks } from '../api'
import { useAuth } from '../auth/AuthContext'
import { ListItemCard } from '../components/ListItemCard'
import { ShowArchivedCheckbox } from '../components/ShowArchivedCheckbox'
import { LoadError, Loading } from '../components/Status'
import { TaskStatusBadge } from '../components/TaskStatusBadge'
import { useAsync } from '../hooks/useAsync'
import { useShowArchived } from '../hooks/useShowArchived'
import { formatDate } from '../lib/tasks'

type MyTasksState = ReturnType<typeof useAsync<Awaited<ReturnType<typeof fetchMyTasks>>>>

export default function MyTasksPage() {
  const { profile } = useAuth()
  const userId = profile?.id ?? ''
  const [showArchived] = useShowArchived()
  const tasks = useAsync(() => fetchMyTasks(userId, showArchived), [userId, showArchived])

  return (
    <Stack gap="6">
      <HStack justify="space-between" gap="4" wrap="wrap">
        <Heading size="2xl">Мои задачи</Heading>
        <ShowArchivedCheckbox />
      </HStack>
      <MyTaskList state={tasks} />
    </Stack>
  )
}

function MyTaskList({ state }: { state: MyTasksState }) {
  const { data: tasks, error, loading, reload } = state

  if (loading && !tasks) return <Loading />
  if (error) return <LoadError message={error} onRetry={reload} />
  if (!tasks?.length) return <Text color="fg.muted">Открытых задач нет</Text>

  return (
    <Stack gap="3">
      {tasks.map((t) => (
        <ListItemCard
          key={t.id}
          to={`/tasks/${t.id}`}
          title={t.title}
          meta={`${t.object?.name ?? '—'} · до ${formatDate(t.due_date)}`}
          aside={<TaskStatusBadge status={t.status} />}
        />
      ))}
    </Stack>
  )
}
