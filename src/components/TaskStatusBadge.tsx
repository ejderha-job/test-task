import { Badge } from '@chakra-ui/react'
import { statusLabels, type TaskStatus } from '../lib/tasks'

const palette: Record<TaskStatus, string> = {
  new: 'gray',
  in_progress: 'blue',
  review: 'orange',
  done: 'green',
  archived: 'purple',
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge colorPalette={palette[status]}>{statusLabels[status]}</Badge>
}
