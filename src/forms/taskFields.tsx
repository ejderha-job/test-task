import { Input, Textarea } from '@chakra-ui/react'
import type { FormFieldConfig } from '../components/FormFields'

// Поля задачи — общие для создания и редактирования. Исполнитель назначается отдельно.
export type TaskFormValues = { title: string; description: string; dueDate: string }

export const taskFields: FormFieldConfig<TaskFormValues>[] = [
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
