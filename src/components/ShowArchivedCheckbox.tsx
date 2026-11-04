import { Checkbox } from '@chakra-ui/react'
import { useShowArchived } from '../hooks/useShowArchived'

export function ShowArchivedCheckbox() {
  const [showArchived, setShowArchived] = useShowArchived()

  return (
    <Checkbox.Root
      size="sm"
      checked={showArchived}
      onCheckedChange={(e) => setShowArchived(e.checked === true)}
    >
      <Checkbox.HiddenInput />
      <Checkbox.Control />
      <Checkbox.Label>Показать архивированные</Checkbox.Label>
    </Checkbox.Root>
  )
}
