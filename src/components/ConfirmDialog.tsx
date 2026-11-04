import { useState } from 'react'
import { Button, CloseButton, Dialog, Portal, Text } from '@chakra-ui/react'
import { ErrorMessage } from './ErrorMessage'

type ConfirmDialogProps = {
  triggerLabel: string
  title: string
  description: string
  confirmLabel: string
  // Бросает Error — текст показывается в окне
  onConfirm: () => Promise<void>
}

// Кнопка + попап подтверждения опасного действия
export function ConfirmDialog(props: ConfirmDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
      placement="center"
      role="alertdialog"
      lazyMount
      unmountOnExit
    >
      <Dialog.Trigger asChild>
        <Button size="sm" variant="outline" colorPalette="red">
          {props.triggerLabel}
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <ConfirmContent {...props} onDone={() => setOpen(false)} />
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}

function ConfirmContent({
  title,
  description,
  confirmLabel,
  onConfirm,
  onDone,
}: ConfirmDialogProps & { onDone: () => void }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setPending(true)
    setError(null)
    try {
      await onConfirm()
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setPending(false)
    }
  }

  return (
    <>
      <Dialog.Header>
        <Dialog.Title>{title}</Dialog.Title>
      </Dialog.Header>
      <Dialog.Body display="flex" flexDirection="column" gap="4">
        <Text>{description}</Text>
        {error && <ErrorMessage message={error} />}
      </Dialog.Body>
      <Dialog.Footer>
        <Dialog.ActionTrigger asChild>
          <Button variant="ghost">Отмена</Button>
        </Dialog.ActionTrigger>
        <Button colorPalette="red" loading={pending} onClick={handleConfirm}>
          {confirmLabel}
        </Button>
      </Dialog.Footer>
    </>
  )
}
