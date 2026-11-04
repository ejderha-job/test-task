import { createObject } from '../api'
import { objectFields, type ObjectFormValues } from '../forms/objectFields'
import { FormDialog } from './FormDialog'

const emptyForm: ObjectFormValues = { name: '', address: '' }

export function NewObjectDialog({ onCreated }: { onCreated: () => void }) {
  const handleSubmit = async (values: ObjectFormValues) => {
    await createObject(values)
    onCreated()
  }

  return (
    <FormDialog
      triggerLabel="+ Создать объект"
      title="Новый объект"
      submitLabel="Создать объект"
      fields={objectFields}
      initialValues={emptyForm}
      ctx={undefined}
      onSubmit={handleSubmit}
    />
  )
}
