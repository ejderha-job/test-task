import { Alert, Button, Center, Spinner } from '@chakra-ui/react'

// Состояния загрузки / ошибки для страниц
export function Loading() {
  return (
    <Center py="10">
      <Spinner size="lg" color="blue.solid" />
    </Center>
  )
}

export function LoadError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Alert.Root status="error">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>Не удалось загрузить данные</Alert.Title>
        <Alert.Description>{message}</Alert.Description>
      </Alert.Content>
      {onRetry && (
        <Button size="sm" variant="outline" alignSelf="center" onClick={onRetry}>
          Повторить
        </Button>
      )}
    </Alert.Root>
  )
}
