import { useState, type FormEvent } from 'react'
import { Box, Button, Heading, HStack, Input, Stack } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { createObject } from '../api'
import { BackLink } from '../components/BackLink'
import { ErrorMessage } from '../components/ErrorMessage'
import { FormFields, type FormFieldConfig } from '../components/FormFields'

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

export default function NewObjectPage() {
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
      const objectId = await createObject(values)
      navigate(`/objects/${objectId}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSubmitting(false)
    }
  }

  return (
    <Stack gap="6" maxW="xl">
      <Stack gap="2">
        <BackLink to="/objects">Объекты</BackLink>
        <Heading size="2xl">Новый объект</Heading>
      </Stack>

      <Box as="form" onSubmit={handleSubmit}>
        <Stack gap="5">
          <FormFields fields={fields} values={values} onChange={setValue} ctx={undefined} />

          {error && <ErrorMessage message={error} />}

          <HStack gap="3">
            <Button type="submit" colorPalette="blue" loading={submitting}>
              Создать объект
            </Button>
            <Button variant="ghost" onClick={() => navigate('/objects')}>
              Отмена
            </Button>
          </HStack>
        </Stack>
      </Box>
    </Stack>
  )
}
