import { updateObject } from '../api'
import { objectFields, type ObjectFormValues } from '../forms/objectFields'
import { FormDialog } from './FormDialog'

// Кнопка «Редактировать» + попап с текущими названием и адресом объекта
export function EditObjectDialog({
  object,
  onSaved,
}: {
  object: { id: string; name: string; address: string }
  onSaved: () => void
}) {
  const handleSubmit = async (values: ObjectFormValues) => {
    await updateObject(object.id, values)
    onSaved()
  }

  return (
    <FormDialog
      triggerLabel="Редактировать"
      triggerVariant="outline"
      title="Редактировать объект"
      submitLabel="Сохранить"
      fields={objectFields}
      initialValues={{ name: object.name, address: object.address }}
      ctx={undefined}
      onSubmit={handleSubmit}
    />
  )
}
