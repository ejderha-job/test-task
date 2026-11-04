import { useState, type FormEvent } from 'react'
import { Box, Button, Heading, HStack, Input, Stack, Text, Textarea } from '@chakra-ui/react'
import { useNavigate, useParams } from 'react-router-dom'
import { createTask, fetchExecutors, fetchObjectWithTasks } from '../api'
import { BackLink } from '../components/BackLink'
import { ErrorMessage } from '../components/ErrorMessage'
import { ExecutorSelect, type Executor } from '../components/ExecutorSelect'
import { FormFields, type FormFieldConfig } from '../components/FormFields'
import { PageLoadFailed } from '../components/PageLoadFailed'
import { Loading } from '../components/Status'
import { useAsync } from '../hooks/useAsync'

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

async function fetchNewTaskData(objectId: string) {
  const [{ object }, executors] = await Promise.all([
    fetchObjectWithTasks(objectId),
    fetchExecutors(),
  ])
  return { object, executors }
}

export default function NewTaskPage() {
  const { objectId = '' } = useParams()
  const { data, error, loading, reload } = useAsync(() => fetchNewTaskData(objectId), [objectId])

  if (loading) return <Loading />
  if (error || !data?.object)
    return (
      <PageLoadFailed
        error={error}
        onRetry={reload}
        notFoundText="Объект не найден"
        backTo="/objects"
        backLabel="Объекты"
      />
    )

  return <NewTaskForm object={data.object} executors={data.executors} />
}

function NewTaskForm({
  object,
  executors,
}: {
  object: { id: string; name: string }
  executors: Executor[]
}) {
  const navigate = useNavigate()
  const [values, setValues] = useState<FormValues>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setValue = (name: keyof FormValues, value: string) =>
    setValues((v) => ({ ...v, [name]: value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const taskId = await createTask({
        objectId: object.id,
        title: values.title,
        description: values.description,
        dueDate: values.dueDate || null,
        assigneeId: values.assigneeId,
      })
      navigate(`/tasks/${taskId}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSubmitting(false)
    }
  }

  return (
    <Stack gap="6" maxW="xl">
      <Stack gap="2">
        <BackLink to={`/objects/${object.id}`}>{object.name}</BackLink>
        <Heading size="2xl">Новая задача</Heading>
        <Text color="fg.muted">{object.name}</Text>
      </Stack>

      <Box as="form" onSubmit={handleSubmit}>
        <Stack gap="5">
          <FormFields fields={fields} values={values} onChange={setValue} ctx={executors} />

          {error && <ErrorMessage message={error} />}

          <HStack gap="3">
            <Button type="submit" colorPalette="blue" loading={submitting}>
              Создать задачу
            </Button>
            <Button variant="ghost" onClick={() => navigate(`/objects/${object.id}`)}>
              Отмена
            </Button>
          </HStack>
        </Stack>
      </Box>
    </Stack>
  )
}
