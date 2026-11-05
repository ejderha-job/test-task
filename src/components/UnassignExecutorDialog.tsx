import { unassignTask } from '../api'
import { ConfirmDialog } from './ConfirmDialog'

// Кнопка «Убрать исполнителя» + подтверждение. Задача возвращается в статус «Новая».
export function UnassignExecutorDialog({
  taskId,
  executorName,
  onUnassigned,
}: {
  taskId: string
  executorName: string
  onUnassigned: () => void
}) {
  const handleConfirm = async () => {
    await unassignTask(taskId)
    onUnassigned()
  }

  return (
    <ConfirmDialog
      triggerLabel="Убрать исполнителя"
      title="Убрать исполнителя?"
      description={`${executorName} больше не будет исполнителем этой задачи и перестанет её видеть. Задача вернётся в статус «Новая», после чего можно назначить другого исполнителя.`}
      confirmLabel="Убрать"
      onConfirm={handleConfirm}
    />
  )
}
