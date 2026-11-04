import { useState } from 'react'
import { Alert, Button, Card, DataList, Heading, HStack, Stack, Text, Timeline } from '@chakra-ui/react'
import { useParams } from 'react-router-dom'
import { changeTaskStatus, fetchTask } from '../api'
import { useAuth } from '../auth/AuthContext'
import { BackLink } from '../components/BackLink'
import { LoadError, Loading } from '../components/Status'
import { TaskStatusBadge } from '../components/TaskStatusBadge'
import { useAsync } from '../hooks/useAsync'
import {
  availableActions,
  formatDate,
  formatDateTime,
  personName,
  type TaskStatus,
} from '../lib/tasks'

export default function TaskPage() {
  const { taskId = '' } = useParams()
  const { profile } = useAuth()
  const { data: task, error, loading, reload } = useAsync(() => fetchTask(taskId), [taskId])
  const [pendingStatus, setPendingStatus] = useState<TaskStatus | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Первая загрузка; при перезапросе после действия показываем старые данные
  if (loading && !task) return <Loading />
  if (error || !task)
    return (
      <Stack gap="4">
        <BackLink to="/objects">Объекты</BackLink>
        {error ? <LoadError message={error} onRetry={reload} /> : <Heading>Задача не найдена</Heading>}
      </Stack>
    )

  const applyAction = async (to: TaskStatus) => {
    setPendingStatus(to)
    setActionError(null)
    try {
      await changeTaskStatus(task.id, to)
      reload()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e))
    } finally {
      setPendingStatus(null)
    }
  }

  const actions = availableActions(task, profile)

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
            <DataList.Item>
              <DataList.ItemLabel>Исполнитель</DataList.ItemLabel>
              <DataList.ItemValue>{personName(task.assignee)}</DataList.ItemValue>
            </DataList.Item>
            <DataList.Item>
              <DataList.ItemLabel>Срок</DataList.ItemLabel>
              <DataList.ItemValue>{formatDate(task.due_date)}</DataList.ItemValue>
            </DataList.Item>
            <DataList.Item>
              <DataList.ItemLabel>Описание</DataList.ItemLabel>
              <DataList.ItemValue>{task.description || '—'}</DataList.ItemValue>
            </DataList.Item>
          </DataList.Root>

          {actions.length > 0 && (
            <HStack gap="3" wrap="wrap">
              {actions.map((a, i) => (
                <Button
                  key={a.to}
                  colorPalette="blue"
                  variant={i === 0 ? 'solid' : 'outline'}
                  loading={pendingStatus === a.to}
                  disabled={pendingStatus !== null || loading}
                  onClick={() => applyAction(a.to)}
                >
                  {a.label}
                </Button>
              ))}
            </HStack>
          )}

          {actionError && (
            <Alert.Root status="error" size="sm">
              <Alert.Indicator />
              <Alert.Title>{actionError}</Alert.Title>
            </Alert.Root>
          )}
        </Card.Body>
      </Card.Root>

      <Stack gap="4">
        <Heading size="lg">История</Heading>
        {task.history.length === 0 ? (
          <Text color="fg.muted">Пусто</Text>
        ) : (
          <Timeline.Root size="sm">
            {task.history.map((h) => (
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
        )}
      </Stack>
    </Stack>
  )
}
