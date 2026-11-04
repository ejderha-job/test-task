import { Input } from '@chakra-ui/react'
import type { FormFieldConfig } from '../components/FormFields'

// Поля объекта — общие для создания и редактирования
export type ObjectFormValues = { name: string; address: string }

export const objectFields: FormFieldConfig<ObjectFormValues>[] = [
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
