import { Textarea } from '@chakra-ui/react'
import { returnTaskForRework } from '../api'
import { FormDialog } from './FormDialog'
import type { FormFieldConfig } from './FormFields'

type FormValues = { comment: string }

const fields: FormFieldConfig<FormValues>[] = [
  {
    name: 'comment',
    label: 'Что нужно доработать',
    required: true,
    helper: 'Комментарий увидит исполнитель',
    render: ({ value, onChange }) => (
      <Textarea rows={4} autoFocus value={value} onChange={(e) => onChange(e.target.value)} />
    ),
  },
]

const emptyForm: FormValues = { comment: '' }

// Кнопка «Вернуть на доработку» + попап с обязательным комментарием (review → rework)
export function ReturnForReworkDialog({
  taskId,
  onReturned,
}: {
  taskId: string
  onReturned: () => void
}) {
  const handleSubmit = async (values: FormValues) => {
    await returnTaskForRework(taskId, values.comment)
    onReturned()
  }

  return (
    <FormDialog
      triggerLabel="Вернуть на доработку"
      triggerVariant="outline"
      title="Вернуть на доработку"
      submitLabel="Вернуть"
      fields={fields}
      initialValues={emptyForm}
      ctx={undefined}
      onSubmit={handleSubmit}
    />
  )
}
