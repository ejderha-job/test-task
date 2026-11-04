import { Input, Textarea } from '@chakra-ui/react'
import { createTask } from '../api'
import { FormDialog } from './FormDialog'
import type { FormFieldConfig } from './FormFields'

type FormValues = { title: string; description: string; dueDate: string }

const fields: FormFieldConfig<FormValues>[] = [
  {
    name: 'title',
    label: 'Название',
    required: true,
    render: ({ value, onChange }) => (
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    ),
  },
  {
    name: 'description',
    label: 'Описание',
    render: ({ value, onChange }) => (
      <Textarea rows={4} value={value} onChange={(e) => onChange(e.target.value)} />
    ),
  },
  {
    name: 'dueDate',
    label: 'Срок',
    render: ({ value, onChange }) => (
      <Input type="date" value={value} onChange={(e) => onChange(e.target.value)} />
    ),
  },
]

const emptyForm: FormValues = { title: '', description: '', dueDate: '' }

export function NewTaskDialog({ objectId, onCreated }: { objectId: string; onCreated: () => void }) {
  const handleSubmit = async (values: FormValues) => {
    await createTask({
      objectId,
      title: values.title,
      description: values.description,
      dueDate: values.dueDate || null,
    })
    onCreated()
  }

  return (
    <FormDialog
      triggerLabel="+ Создать задачу"
      title="Новая задача"
      submitLabel="Создать задачу"
      fields={fields}
      initialValues={emptyForm}
      ctx={undefined}
      onSubmit={handleSubmit}
    />
  )
}
