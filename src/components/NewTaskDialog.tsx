import { Input, Textarea } from '@chakra-ui/react'
import { createTask, fetchExecutors } from '../api'
import { useAsync } from '../hooks/useAsync'
import { ExecutorSelect, type Executor } from './ExecutorSelect'
import { FormDialog } from './FormDialog'
import type { FormFieldConfig } from './FormFields'

type FormValues = { title: string; description: string; dueDate: string; assigneeId: string }

const fields: FormFieldConfig<FormValues, Executor[]>[] = [
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
  {
    name: 'assigneeId',
    label: 'Исполнитель',
    required: true,
    helper: 'После создания задачи исполнителя сменить нельзя',
    render: ({ value, onChange, ctx: executors }) => (
      <ExecutorSelect
        executors={executors}
        value={value}
        onChange={onChange}
        placeholder="Выберите исполнителя"
      />
    ),
  },
]

const emptyForm: FormValues = { title: '', description: '', dueDate: '', assigneeId: '' }

export function NewTaskDialog({ objectId, onCreated }: { objectId: string; onCreated: () => void }) {
  const executors = useAsync(fetchExecutors, [])

  const handleSubmit = async (values: FormValues) => {
    await createTask({
      objectId,
      title: values.title,
      description: values.description,
      dueDate: values.dueDate || null,
      assigneeId: values.assigneeId,
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
      ctx={executors.data ?? []}
      blockingError={executors.error && `Не удалось загрузить исполнителей: ${executors.error}`}
      onSubmit={handleSubmit}
    />
  )
}
