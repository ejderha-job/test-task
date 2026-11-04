import { useState, type FormEvent } from 'react'
import { Alert, Box, Button, Card, Center, Field, Input, Stack } from '@chakra-ui/react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function LoginPage() {
  const { session, loading, signIn } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Уже вошли — возвращаем туда, откуда пришли
  if (!loading && session) {
    const from = (location.state as { from?: string } | null)?.from ?? '/objects'
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) setError(error)
    // при успехе компонент перерисуется с session и сделает редирект выше
  }

  return (
    <Center minH="100dvh" bg="bg.subtle" px="4">
      <Card.Root w="full" maxW="sm">
        <Card.Header>
          <Card.Title textStyle="2xl">Вход</Card.Title>
        </Card.Header>
        <Card.Body>
          <Box as="form" onSubmit={handleSubmit}>
            <Stack gap="4">
              <Field.Root required>
                <Field.Label>Email</Field.Label>
                <Input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field.Root>
              <Field.Root required>
                <Field.Label>Пароль</Field.Label>
                <Input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field.Root>
              {error && (
                <Alert.Root status="error" size="sm">
                  <Alert.Indicator />
                  <Alert.Title>{error}</Alert.Title>
                </Alert.Root>
              )}
              <Button type="submit" colorPalette="blue" loading={submitting} loadingText="Вход…">
                Войти
              </Button>
            </Stack>
          </Box>
        </Card.Body>
      </Card.Root>
    </Center>
  )
}
