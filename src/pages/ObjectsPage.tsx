import { Badge, Heading, Stack, Text } from '@chakra-ui/react'
import { fetchObjects } from '../api'
import { ListItemCard } from '../components/ListItemCard'
import { LoadError, Loading } from '../components/Status'
import { useAsync } from '../hooks/useAsync'

export default function ObjectsPage() {
  const { data: objects, error, loading, reload } = useAsync(fetchObjects, [])

  return (
    <Stack gap="6">
      <Heading size="2xl">Объекты</Heading>
      {loading ? (
        <Loading />
      ) : error ? (
        <LoadError message={error} onRetry={reload} />
      ) : objects?.length === 0 ? (
        <Text color="fg.muted">Объектов нет</Text>
      ) : (
        <Stack gap="3">
          {objects?.map((obj) => (
            <ListItemCard
              key={obj.id}
              to={`/objects/${obj.id}`}
              title={obj.name}
              meta={obj.address}
              aside={<Badge variant="outline">задач: {obj.tasks[0]?.count ?? 0}</Badge>}
            />
          ))}
        </Stack>
      )}
    </Stack>
  )
}
