import { updateTask } from '../api'
import { taskFields, type TaskFormValues } from '../forms/taskFields'
import { FormDialog } from './FormDialog'

// Кнопка «Редактировать» + попап с текущими названием, описанием и сроком задачи
export function EditTaskDialog({
  task,
  onSaved,
}: {
  task: { id: string; title: string; description: string; due_date: string | null }
  onSaved: () => void
}) {
  const handleSubmit = async (values: TaskFormValues) => {
    await updateTask(task.id, {
      title: values.title,
      description: values.description,
      dueDate: values.dueDate || null,
    })
    onSaved()
  }

  return (
    <FormDialog
      triggerLabel="Редактировать"
      triggerVariant="outline"
      title="Редактировать задачу"
      submitLabel="Сохранить"
      fields={taskFields}
      initialValues={{
        title: task.title,
        description: task.description,
        dueDate: task.due_date ?? '',
      }}
      ctx={undefined}
      onSubmit={handleSubmit}
    />
  )
}
