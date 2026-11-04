import { Link } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'

export function BackLink({ to, children }: { to: string; children: string }) {
  return (
    <Link asChild color="fg.muted" textStyle="sm">
      <RouterLink to={to}>← {children}</RouterLink>
    </Link>
  )
}
