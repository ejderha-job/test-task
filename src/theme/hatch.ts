import type { SystemStyleObject } from '@chakra-ui/react'

// Диагональная штриховка — так помечаются архивные задачи (вместо метки «В архиве»).
// Цвет — семантический токен, поэтому работает и в тёмной теме.
export const archivedHatch: SystemStyleObject = {
  backgroundImage:
    'repeating-linear-gradient(-45deg, var(--chakra-colors-border-emphasized) 0 1px, transparent 1px 8px)',
}
