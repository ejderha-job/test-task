import { useState, type FormEvent } from 'react'
import { Box, Button, CloseButton, Dialog, Portal, Stack } from '@chakra-ui/react'
import { ErrorMessage } from './ErrorMessage'
import { FormFields, type FormFieldConfig } from './FormFields'

type FormDialogProps<V extends Record<string, string>, Ctx> = {
  triggerLabel: string
  title: string
  submitLabel: string
  fields: FormFieldConfig<V, Ctx>[]
  initialValues: V
  ctx: Ctx
  // Ошибка, из-за которой форму нельзя заполнить (например, не загрузился список для select)
  blockingError?: string | null
  // Бросает Error — текст показывается в окне
  onSubmit: (values: V) => Promise<void>
}

// Кнопка + попап с формой по массиву-шаблону полей. Закрывается после успешного onSubmit.
export function FormDialog<V extends Record<string, string>, Ctx = undefined>(
  props: FormDialogProps<V, Ctx>,
) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
      placement="center"
      lazyMount
      unmountOnExit
    >
      <Dialog.Trigger asChild>
        <Button size="sm" colorPalette="blue">
          {props.triggerLabel}
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            {/* Форма размонтируется при закрытии — при следующем открытии она снова пустая */}
            <DialogForm {...props} onDone={() => setOpen(false)} />
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}

function DialogForm<V extends Record<string, string>, Ctx>({
  title,
  submitLabel,
  fields,
  initialValues,
  ctx,
  blockingError,
  onSubmit,
  onDone,
}: FormDialogProps<V, Ctx> & { onDone: () => void }) {
  const [values, setValues] = useState<V>(initialValues)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setValue = (name: keyof V & string, value: string) =>
    setValues((v) => ({ ...v, [name]: value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(values)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSubmitting(false)
    }
  }

  const message = error ?? blockingError

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <Dialog.Header>
        <Dialog.Title>{title}</Dialog.Title>
      </Dialog.Header>
      <Dialog.Body>
        <Stack gap="5">
          <FormFields fields={fields} values={values} onChange={setValue} ctx={ctx} />
          {message && <ErrorMessage message={message} />}
        </Stack>
      </Dialog.Body>
      <Dialog.Footer>
        <Dialog.ActionTrigger asChild>
          <Button variant="ghost">Отмена</Button>
        </Dialog.ActionTrigger>
        <Button type="submit" colorPalette="blue" loading={submitting} disabled={!!blockingError}>
          {submitLabel}
        </Button>
      </Dialog.Footer>
    </Box>
  )
}
