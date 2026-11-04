import { createTask } from '../api'
import { taskFields, type TaskFormValues } from '../forms/taskFields'
import { FormDialog } from './FormDialog'

const emptyForm: TaskFormValues = { title: '', description: '', dueDate: '' }

export function NewTaskDialog({ objectId, onCreated }: { objectId: string; onCreated: () => void }) {
  const handleSubmit = async (values: TaskFormValues) => {
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
      fields={taskFields}
      initialValues={emptyForm}
      ctx={undefined}
      onSubmit={handleSubmit}
    />
  )
}
