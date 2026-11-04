import { changeTaskStatus } from '../api'
import { ConfirmDialog } from './ConfirmDialog'

// Кнопка «В архив» + подтверждение для отдельной задачи
export function ArchiveTaskDialog({
  task,
  onArchived,
}: {
  task: { id: string; title: string }
  onArchived: () => void
}) {
  const handleConfirm = async () => {
    await changeTaskStatus(task.id, 'archived')
    onArchived()
  }

  return (
    <ConfirmDialog
      triggerLabel="В архив"
      title="Архивировать задачу?"
      description={`Задача «${task.title}» получит статус «В архиве». Исполнитель продолжит её видеть, но работать с ней будет нельзя. Вернуть задачу из архива нельзя.`}
      confirmLabel="Архивировать"
      onConfirm={handleConfirm}
    />
  )
}
