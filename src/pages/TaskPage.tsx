import { useState } from 'react'
import { Button, Card, DataList, Heading, HStack, Stack, Text, Timeline } from '@chakra-ui/react'
import { useParams } from 'react-router-dom'
import { changeTaskStatus, fetchTask } from '../api'
import { useAuth } from '../auth/AuthContext'
import { AssignExecutorDialog } from '../components/AssignExecutorDialog'
import { BackLink } from '../components/BackLink'
import { ErrorMessage } from '../components/ErrorMessage'
import { PageLoadFailed } from '../components/PageLoadFailed'
import { Loading } from '../components/Status'
import { TaskStatusBadge } from '../components/TaskStatusBadge'
import { useAsync } from '../hooks/useAsync'
import {
  availableActions,
  formatDate,
  formatDateTime,
  personName,
  type TaskStatus,
} from '../lib/tasks'

type Task = NonNullable<Awaited<ReturnType<typeof fetchTask>>>

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e))

export default function TaskPage() {
  const { taskId = '' } = useParams()
  const { data: task, error, loading, reload } = useAsync(() => fetchTask(taskId), [taskId])

  // Первая загрузка; при перезапросе после действия показываем старые данные
  if (loading && !task) return <Loading />
  if (error || !task)
    return (
      <PageLoadFailed
        error={error}
        onRetry={reload}
        notFoundText="Задача не найдена"
        backTo="/objects"
        backLabel="Объекты"
      />
    )

  return <TaskView task={task} busy={loading} onChanged={reload} />
}

function TaskView({ task, busy, onChanged }: { task: Task; busy: boolean; onChanged: () => void }) {
  const details = [
    { label: 'Исполнитель', value: <TaskAssignee task={task} onChanged={onChanged} /> },
    { label: 'Срок', value: formatDate(task.due_date) },
    { label: 'Описание', value: task.description || '—' },
  ]

  return (
    <Stack gap="6">
      <Stack gap="2">
        {task.object && <BackLink to={`/objects/${task.object.id}`}>{task.object.name}</BackLink>}
        <HStack gap="3" wrap="wrap">
          <Heading size="2xl">{task.title}</Heading>
          <TaskStatusBadge status={task.status} />
        </HStack>
      </Stack>

      <Card.Root variant="outline">
        <Card.Body gap="5">
          <DataList.Root orientation="horizontal">
            {details.map((d) => (
              <DataList.Item key={d.label}>
                <DataList.ItemLabel>{d.label}</DataList.ItemLabel>
                <DataList.ItemValue>{d.value}</DataList.ItemValue>
              </DataList.Item>
            ))}
          </DataList.Root>
          <TaskActions task={task} busy={busy} onChanged={onChanged} />
        </Card.Body>
      </Card.Root>

      <Stack gap="4">
        <Heading size="lg">История</Heading>
        <TaskHistory history={task.history} />
      </Stack>
    </Stack>
  )
}

// Исполнитель назначается один раз: после назначения показываем только имя
function TaskAssignee({ task, onChanged }: { task: Task; onChanged: () => void }) {
  const { profile } = useAuth()

  if (task.assignee) return <>{personName(task.assignee)}</>
  if (profile?.role === 'provider')
    return <AssignExecutorDialog taskId={task.id} onAssigned={onChanged} />
  return <Text color="fg.muted">Не назначен</Text>
}

function TaskActions({ task, busy, onChanged }: { task: Task; busy: boolean; onChanged: () => void }) {
  const { profile } = useAuth()
  const [pendingStatus, setPendingStatus] = useState<TaskStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const actions = availableActions(task, profile)

  if (actions.length === 0) return null

  const applyAction = async (to: TaskStatus) => {
    setPendingStatus(to)
    setError(null)
    try {
      await changeTaskStatus(task.id, to)
      onChanged()
    } catch (e) {
      setError(errorText(e))
    } finally {
      setPendingStatus(null)
    }
  }

  return (
    <Stack gap="3">
      <HStack gap="3" wrap="wrap">
        {actions.map((a, i) => (
          <Button
            key={a.to}
            colorPalette="blue"
            variant={i === 0 ? 'solid' : 'outline'}
            loading={pendingStatus === a.to}
            disabled={pendingStatus !== null || busy}
            onClick={() => applyAction(a.to)}
          >
            {a.label}
          </Button>
        ))}
      </HStack>
      {error && <ErrorMessage message={error} />}
    </Stack>
  )
}

function TaskHistory({ history }: { history: Task['history'] }) {
  if (history.length === 0) return <Text color="fg.muted">Пусто</Text>

  return (
    <Timeline.Root size="sm">
      {history.map((h) => (
        <Timeline.Item key={h.id}>
          <Timeline.Connector>
            <Timeline.Separator />
            <Timeline.Indicator />
          </Timeline.Connector>
          <Timeline.Content>
            <Timeline.Title>{h.text}</Timeline.Title>
            <Timeline.Description>
              {formatDateTime(h.created_at)} · {personName(h.author)}
            </Timeline.Description>
          </Timeline.Content>
        </Timeline.Item>
      ))}
    </Timeline.Root>
  )
}
