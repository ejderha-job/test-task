import { archiveObject } from '../api'
import { ConfirmDialog } from './ConfirmDialog'

// Кнопка «В архив» + подтверждение. Мягкое удаление: данные остаются в базе.
export function ArchiveObjectDialog({
  object,
  onArchived,
}: {
  object: { id: string; name: string }
  onArchived: () => void
}) {
  const handleConfirm = async () => {
    await archiveObject(object.id)
    onArchived()
  }

  return (
    <ConfirmDialog
      triggerLabel="В архив"
      title="Архивировать объект?"
      description={`Объект «${object.name}» пропадёт из списка объектов. Его незавершённые задачи перейдут в статус «В архиве» — исполнители продолжат их видеть, но работать с ними будет нельзя. Данные не удаляются.`}
      confirmLabel="Архивировать"
      onConfirm={handleConfirm}
    />
  )
}
