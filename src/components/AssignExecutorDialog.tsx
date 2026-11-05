import { assignTask, fetchExecutors } from '../api'
import { useAsync } from '../hooks/useAsync'
import { ExecutorSelect, type Executor } from './ExecutorSelect'
import { FormDialog } from './FormDialog'
import type { FormFieldConfig } from './FormFields'

type FormValues = { assigneeId: string }

const fields: FormFieldConfig<FormValues, Executor[]>[] = [
  {
    name: 'assigneeId',
    label: 'Исполнитель',
    required: true,
    helper: 'Чтобы сменить исполнителя, его нужно будет убрать — задача вернётся в статус «Новая»',
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

const emptyForm: FormValues = { assigneeId: '' }

// Кнопка «Назначить исполнителя» + попап с выбором (для задачи без исполнителя)
export function AssignExecutorDialog({
  taskId,
  onAssigned,
}: {
  taskId: string
  onAssigned: () => void
}) {
  const executors = useAsync(fetchExecutors, [])

  const handleSubmit = async (values: FormValues) => {
    await assignTask(taskId, values.assigneeId)
    onAssigned()
  }

  return (
    <FormDialog
      triggerLabel="Назначить исполнителя"
      title="Назначить исполнителя"
      submitLabel="Назначить"
      fields={fields}
      initialValues={emptyForm}
      ctx={executors.data ?? []}
      blockingError={executors.error && `Не удалось загрузить исполнителей: ${executors.error}`}
      onSubmit={handleSubmit}
    />
  )
}
