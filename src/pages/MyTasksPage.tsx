import { Heading, Stack, Text } from '@chakra-ui/react'
import { fetchMyTasks } from '../api'
import { useAuth } from '../auth/AuthContext'
import { ListItemCard } from '../components/ListItemCard'
import { LoadError, Loading } from '../components/Status'
import { TaskStatusBadge } from '../components/TaskStatusBadge'
import { useAsync } from '../hooks/useAsync'
import { formatDate } from '../lib/tasks'

export default function MyTasksPage() {
  const { profile } = useAuth()
  const userId = profile?.id ?? ''
  const { data: tasks, error, loading, reload } = useAsync(() => fetchMyTasks(userId), [userId])

  return (
    <Stack gap="6">
      <Heading size="2xl">Мои задачи</Heading>
      {loading ? (
        <Loading />
      ) : error ? (
        <LoadError message={error} onRetry={reload} />
      ) : tasks?.length === 0 ? (
        <Text color="fg.muted">Открытых задач нет</Text>
      ) : (
        <Stack gap="3">
          {tasks?.map((t) => (
            <ListItemCard
              key={t.id}
              to={`/tasks/${t.id}`}
              title={t.title}
              meta={`${t.object?.name ?? '—'} · до ${formatDate(t.due_date)}`}
              aside={<TaskStatusBadge status={t.status} />}
            />
          ))}
        </Stack>
      )}
    </Stack>
  )
}
