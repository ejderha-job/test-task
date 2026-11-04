import { Alert } from '@chakra-ui/react'

// Короткая ошибка действия (не загрузки страницы)
export function ErrorMessage({ message }: { message: string }) {
  return (
    <Alert.Root status="error" size="sm">
      <Alert.Indicator />
      <Alert.Title>{message}</Alert.Title>
    </Alert.Root>
  )
}
