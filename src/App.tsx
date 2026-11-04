import { Box, Button, Container, HStack, Link, Spacer, Text } from '@chakra-ui/react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'

const roleLabels = { provider: 'Постановщик', executor: 'Исполнитель' } as const

function NavItem({ to, children }: { to: string; children: string }) {
  return (
    <Link
      asChild
      color="fg.muted"
      fontWeight="medium"
      _hover={{ color: 'fg', textDecoration: 'none' }}
      _currentPage={{ color: 'blue.fg' }}
    >
      <NavLink to={to}>{children}</NavLink>
    </Link>
  )
}

// Общий каркас для страниц после входа
export default function App() {
  const { profile, signOut } = useAuth()

  return (
    <Box minH="100dvh" bg="bg">
      <Box as="header" borderBottomWidth="1px" bg="bg.panel">
        <Container maxW="4xl" py="3">
          <HStack gap="5" wrap="wrap">
            <NavItem to="/objects">Объекты</NavItem>
            {profile?.role === 'executor' && <NavItem to="/my-tasks">Мои задачи</NavItem>}
            <Spacer />
            {profile && (
              <Text textStyle="sm" color="fg.muted">
                {profile.full_name ?? profile.email} · {roleLabels[profile.role]}
              </Text>
            )}
            <Button size="sm" variant="outline" onClick={signOut}>
              Выйти
            </Button>
          </HStack>
        </Container>
      </Box>
      <Container as="main" maxW="4xl" py="8">
        <Outlet />
      </Container>
    </Box>
  )
}
