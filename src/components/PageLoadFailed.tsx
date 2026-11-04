import { Heading, Stack } from '@chakra-ui/react'
import { BackLink } from './BackLink'
import { LoadError } from './Status'

// Страница не загрузилась: ошибка запроса или запись не найдена
export function PageLoadFailed({
  error,
  onRetry,
  notFoundText,
  backTo,
  backLabel,
}: {
  error: string | null
  onRetry: () => void
  notFoundText: string
  backTo: string
  backLabel: string
}) {
  return (
    <Stack gap="4">
      <BackLink to={backTo}>{backLabel}</BackLink>
      <PageLoadFailedMessage error={error} onRetry={onRetry} notFoundText={notFoundText} />
    </Stack>
  )
}

function PageLoadFailedMessage({
  error,
  onRetry,
  notFoundText,
}: {
  error: string | null
  onRetry: () => void
  notFoundText: string
}) {
  if (error) return <LoadError message={error} onRetry={onRetry} />
  return <Heading>{notFoundText}</Heading>
}
