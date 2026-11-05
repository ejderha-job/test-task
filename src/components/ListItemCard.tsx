import type { ReactNode } from 'react'
import { Card, HStack, LinkBox, LinkOverlay, Text } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { archivedHatch } from '../theme/hatch'

// Кликабельная карточка в списке (вся карточка — ссылка)
export function ListItemCard({
  to,
  title,
  meta,
  aside,
  archived = false,
}: {
  to: string
  title: string
  meta?: ReactNode
  aside?: ReactNode
  // Архивная запись — карточка со штриховкой
  archived?: boolean
}) {
  return (
    <LinkBox asChild>
      <Card.Root
        size="sm"
        variant="outline"
        css={archived ? archivedHatch : undefined}
        _hover={{ borderColor: 'border.emphasized', bgColor: 'bg.subtle' }}
      >
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
