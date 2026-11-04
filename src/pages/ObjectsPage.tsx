import { Badge, Heading, HStack, Stack, Text } from '@chakra-ui/react'
import { fetchObjects } from '../api'
import { useAuth } from '../auth/AuthContext'
import { ListItemCard } from '../components/ListItemCard'
import { NewObjectDialog } from '../components/NewObjectDialog'
import { LoadError, Loading } from '../components/Status'
import { useAsync } from '../hooks/useAsync'

type ObjectsState = ReturnType<typeof useAsync<Awaited<ReturnType<typeof fetchObjects>>>>

export default function ObjectsPage() {
  const { profile } = useAuth()
  const objects = useAsync(fetchObjects, [])

  return (
    <Stack gap="6">
      <HStack justify="space-between">
        <Heading size="2xl">Объекты</Heading>
        {profile?.role === 'provider' && <NewObjectDialog onCreated={objects.reload} />}
      </HStack>
      <ObjectList state={objects} />
    </Stack>
  )
}

function ObjectList({ state }: { state: ObjectsState }) {
  const { data: objects, error, loading, reload } = state

  if (loading && !objects) return <Loading />
  if (error) return <LoadError message={error} onRetry={reload} />
  if (!objects?.length) return <Text color="fg.muted">Объектов нет</Text>

  return (
    <Stack gap="3">
      {objects.map((obj) => (
        <ListItemCard
          key={obj.id}
          to={`/objects/${obj.id}`}
          title={obj.name}
          meta={obj.address}
          aside={<Badge variant="outline">задач: {obj.tasks[0]?.count ?? 0}</Badge>}
        />
      ))}
    </Stack>
  )
}
