import { Badge } from '@chakra-ui/react'
import { statusLabels, type TaskStatus } from '../lib/tasks'

const palette: Record<TaskStatus, string> = {
  new: 'gray',
  in_progress: 'blue',
  review: 'orange',
  accepted: 'green',
  rework: 'red',
}

// Архив — не статус: архивные задачи помечаются штриховкой карточки (archivedHatch), не меткой
export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge colorPalette={palette[status]}>{statusLabels[status]}</Badge>
}
