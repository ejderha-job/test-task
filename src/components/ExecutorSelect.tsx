import { NativeSelect } from '@chakra-ui/react'
import { personName } from '../lib/tasks'

export type Executor = { id: string; full_name: string | null; email: string }

// Выбор исполнителя. Пустой пункт — подсказка (placeholder), выбрать его нельзя.
export function ExecutorSelect({
  executors,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  executors: Executor[]
  value: string
  onChange: (id: string) => void
  placeholder: string
  disabled?: boolean
}) {
  return (
    <NativeSelect.Root disabled={disabled}>
      <NativeSelect.Field value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="" disabled>
          {placeholder}
        </option>
        {executors.map((ex) => (
          <option key={ex.id} value={ex.id}>
            {personName(ex)}
          </option>
        ))}
      </NativeSelect.Field>
      <NativeSelect.Indicator />
    </NativeSelect.Root>
  )
}
