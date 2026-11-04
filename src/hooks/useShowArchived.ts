import { useSearchParams } from 'react-router-dom'

// Флажок «показать архивированные» в адресе (?archived=1) — переживает перезагрузку и «назад»
export function useShowArchived() {
  const [params, setParams] = useSearchParams()
  const showArchived = params.get('archived') === '1'

  const setShowArchived = (value: boolean) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set('archived', '1')
        else next.delete('archived')
        return next
      },
      { replace: true },
    )

  return [showArchived, setShowArchived] as const
}
