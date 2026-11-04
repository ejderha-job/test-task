import type { ReactNode } from 'react'
import { Card, HStack, LinkBox, LinkOverlay, Text } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'

// Кликабельная карточка в списке (вся карточка — ссылка)
export function ListItemCard({
  to,
  title,
  meta,
  aside,
}: {
  to: string
  title: string
  meta?: ReactNode
  aside?: ReactNode
}) {
  return (
    <LinkBox asChild>
      <Card.Root size="sm" variant="outline" _hover={{ borderColor: 'border.emphasized', bg: 'bg.subtle' }}>
        <Card.Body>
          <HStack justify="space-between" align="start" gap="4">
            <div>
              <LinkOverlay asChild>
                <RouterLink to={to}>
                  <Text fontWeight="medium">{title}</Text>
                </RouterLink>
              </LinkOverlay>
              {meta && (
                <Text textStyle="sm" color="fg.muted" mt="1">
                  {meta}
                </Text>
              )}
            </div>
            {aside}
          </HStack>
        </Card.Body>
      </Card.Root>
    </LinkBox>
  )
}
