import { Input } from '@chakra-ui/react'
import { createObject } from '../api'
import { FormDialog } from './FormDialog'
import type { FormFieldConfig } from './FormFields'

type FormValues = { name: string; address: string }

const fields: FormFieldConfig<FormValues>[] = [
  {
    name: 'name',
    label: 'Название',
    required: true,
    render: ({ value, onChange }) => (
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    ),
  },
  {
    name: 'address',
    label: 'Адрес',
    render: ({ value, onChange }) => (
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    ),
  },
]

const emptyForm: FormValues = { name: '', address: '' }

export function NewObjectDialog({ onCreated }: { onCreated: () => void }) {
  const handleSubmit = async (values: FormValues) => {
    await createObject(values)
    onCreated()
  }

  return (
    <FormDialog
      triggerLabel="+ Создать объект"
      title="Новый объект"
      submitLabel="Создать объект"
      fields={fields}
      initialValues={emptyForm}
      ctx={undefined}
      onSubmit={handleSubmit}
    />
  )
}
